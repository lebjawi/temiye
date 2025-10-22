export interface Tier {
  id: string;
  name: string;
  color: string;
  benefits: string[];
  isPredefined: boolean;
  createdAt: Date;
  updatedAt: Date;
}
