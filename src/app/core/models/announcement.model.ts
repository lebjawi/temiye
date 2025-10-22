export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  isPinned: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  isPinned?: boolean;
  expiresAt?: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  isPinned?: boolean;
  expiresAt?: string | null;
}
