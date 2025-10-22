export interface User {
  id: string;
  phone: string;
  name: string;
  profilePictureRef?: string;
  roleRef: string;
  tierRef: string;
  status: 'pending' | 'active' | 'inactive' | 'banned';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  phone: string;
  name: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  profilePictureRef?: string;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
