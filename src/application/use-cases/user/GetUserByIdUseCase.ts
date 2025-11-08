import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { User } from '../../../domain/entities/User';
import { Result } from '../../../shared/types/common';

/**
 * Use case for retrieving a user by their ID
 */
export class GetUserByIdUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case to get a user by ID
   */
  async execute(userId: UserId): Promise<Result<User | null, Error>> {
    return await this.userRepository.findById(userId);
  }
}