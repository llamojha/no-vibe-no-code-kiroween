import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User, CreateUserProps } from '../../../domain/entities/User';
import { Result } from '../../../shared/types/common';

/**
 * Use case for creating a new user
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case to create a new user
   */
  async execute(props: CreateUserProps): Promise<Result<User, Error>> {
    try {
      // Check if email is already taken
      const emailTakenResult = await this.userRepository.isEmailTaken(props.email);
      if (!emailTakenResult.success) {
        return emailTakenResult;
      }

      if (emailTakenResult.data) {
        return { success: false, error: new Error('Email is already taken') };
      }

      // Create the user entity
      const user = User.create(props);

      // Save the user
      return await this.userRepository.save(user);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err : new Error('Failed to create user') };
    }
  }
}