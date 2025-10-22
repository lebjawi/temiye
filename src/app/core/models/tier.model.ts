export interface Tier {
  id: string;
  name: string;
  level: number;
  features: string[];
  description?: string;
  isPredefined: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTierDto {
  id: string;
  name: string;
  level: number;
  features: string[];
  description?: string;
}

export interface UpdateTierDto {
  name?: string;
  features?: string[];
  description?: string;
}
