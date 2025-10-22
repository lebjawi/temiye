export interface Role {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  description?: string;
  isPredefined: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleDto {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: string[];
  description?: string;
}
