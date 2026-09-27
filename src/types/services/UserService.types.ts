import { UserResponseDTO } from '../dto/UserDTO.types.js';

export interface CreateUserParams {
  name: string;
  email: string;
}

export interface CreateUserResult {
  user: UserResponseDTO;
}

export interface GetUserParams {
  id: number;
}

export interface GetUserResult {
  user: UserResponseDTO;
}
