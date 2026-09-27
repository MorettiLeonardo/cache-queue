import { UserRepository } from '../repository/UserRepository.js';
import { ValidationError, NotFoundError } from '../errors/DomainError.js';
import type {
  CreateUserParams,
  CreateUserResult,
  GetUserParams,
  GetUserResult
} from '../../types/services/UserService.types.js';

export class UserService {
  private repository: UserRepository;

  constructor(repository: UserRepository = new UserRepository()) {
    this.repository = repository;
  }

  public async createUser(params: CreateUserParams): Promise<CreateUserResult> {
    const { name, email } = params;

    if (!name || name.trim().length === 0) {
      throw new ValidationError('User name is required');
    }

    if (!email || !email.includes('@')) {
      throw new ValidationError('A valid user email is required');
    }

    const existing = await this.repository.findByEmail(email.trim().toLowerCase());
    if (existing) {
      return {
        user: existing
      };
    }

    const user = await this.repository.create(name.trim(), email.trim().toLowerCase());
    return {
      user
    };
  }

  public async getUserById(params: GetUserParams): Promise<GetUserResult> {
    if (!params.id || isNaN(params.id)) {
      throw new ValidationError('A valid user id is required');
    }

    const user = await this.repository.findById(params.id);
    if (!user) {
      throw new NotFoundError(`User with id ${params.id} was not found`);
    }

    return {
      user
    };
  }
}
