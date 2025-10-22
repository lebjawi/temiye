export interface Role {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  isPredefined: boolean;
  createdAt: Date;
  updatedAt: Date;
}
