export interface CreateUserDTO {
  name: string;
  email: string;
}

export interface UserResponseDTO {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}
