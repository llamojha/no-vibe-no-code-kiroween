import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeductCreditUseCase } from "../DeductCreditUseCase";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ICreditTransactionRepository } from "../../../domain/repositories/ICreditTransactionRepository";
import { CreditPolicy } from "../../../domain/services/CreditPolicy";
import { ICache } from "../../../infrastructure/cache/ICache";
import { success } from "../../../shared/types/common";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";
import { AnalysisType } from "../../../domain/value-objects/AnalysisType";
import { DeductCreditCommand } from "../../types/commands/CreditCommands";
import { InsufficientCreditsError } from "../../../shared/types/errors";

describe("DeductCreditUseCase", () => {
  const createUser = (credits: number) =>
    User.create({
      email: Email.create("tester@example.com"),
      credits,
    });

  const createMocks = () => {
    const findByIdMock = vi.fn();
    const updateCreditsMock = vi.fn();
    const userRepository = {
      findById: findByIdMock,
      updateCredits: updateCreditsMock,
    } as unknown as IUserRepository;

    const recordTransactionMock = vi.fn();
    const transactionRepository = {
      recordTransaction: recordTransactionMock,
    } as unknown as ICreditTransactionRepository;

    const cacheDeleteMock = vi.fn().mockResolvedValue(undefined);
    const cache: ICache = {
      delete: cacheDeleteMock,
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    const creditPolicy = new CreditPolicy();

    const useCase = new DeductCreditUseCase(
      userRepository,
      transactionRepository,
      creditPolicy,
      cache
    );

    return {
      userRepository,
      transactionRepository,
      cache,
      useCase,
      findByIdMock,
      updateCreditsMock,
      recordTransactionMock,
      cacheDeleteMock,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deducts credits, records transaction, and invalidates caches", async () => {
    const {
      useCase,
      findByIdMock,
      updateCreditsMock,
      recordTransactionMock,
      cacheDeleteMock,
    } =
      createMocks();
    const user = createUser(3);
    findByIdMock.mockResolvedValue(success(user));
    updateCreditsMock.mockResolvedValue(success(undefined));
    recordTransactionMock.mockResolvedValue(success(undefined));

    const command: DeductCreditCommand = {
      userId: user.id,
      analysisType: AnalysisType.STARTUP_IDEA,
      analysisId: "analysis-123",
    };

    const result = await useCase.execute(command);

    expect(result.success).toBe(true);
    expect(updateCreditsMock).toHaveBeenCalledWith(user.id, 2);
    expect(recordTransactionMock).toHaveBeenCalledTimes(1);
    expect(cacheDeleteMock).toHaveBeenCalledWith(`credits:${user.id.value}`);
    expect(cacheDeleteMock).toHaveBeenCalledWith(
      `credit_balance:${user.id.value}`
    );
  });

  it("fails when user has insufficient credits", async () => {
    const {
      useCase,
      findByIdMock,
      updateCreditsMock,
      recordTransactionMock,
      cacheDeleteMock,
    } =
      createMocks();
    const user = createUser(0);
    findByIdMock.mockResolvedValue(success(user));

    const command: DeductCreditCommand = {
      userId: user.id,
      analysisType: AnalysisType.STARTUP_IDEA,
      analysisId: "analysis-123",
    };

    const result = await useCase.execute(command);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(InsufficientCreditsError);
    expect(updateCreditsMock).not.toHaveBeenCalled();
    expect(recordTransactionMock).not.toHaveBeenCalled();
    expect(cacheDeleteMock).not.toHaveBeenCalled();
  });
});
