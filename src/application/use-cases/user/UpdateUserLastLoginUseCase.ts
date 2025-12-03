import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { Result } from '../../../shared/types/common';

/**
 * Use case for updating a user's last login timestamp
 */
export class UpdateUserLastLoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case to update user's last login
   */
  async execute(userId: UserId, loginTime?: Date): Promise<Result<void, Error>> {
    const timestamp = loginTime || new Date();
    return await this.userRepository.updateLastLogin(userId, timestamp);
  }
}