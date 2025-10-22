export interface Admin {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateAdminDto {
  firebaseUid: string;
  email: string;
}
