/**
 * Tenmiye Community Management System - Type Definitions
 *
 * FIREBASE/GCP MINIMAL STACK:
 * ✅ Firestore - Database
 * ✅ Cloud Storage - Files
 * ✅ Firebase Auth - Admin Google sign-in ONLY
 * ✅ Service Account - Backend access
 * ❌ NO Cloud Functions
 * ❌ NO Cloud Run
 *
 * Cost: ~$8/month for 1000 users
 */

import { Timestamp, DocumentReference } from '@google-cloud/firestore';

export interface User {
  id: string;
  phone: string;
  nameAr: string;
  nameFr?: string;
  displayName?: string;
  email?: string;
  roleId?: string;
  tierId?: string;
  status: 'active' | 'pending' | 'banned' | 'inactive';
  devices: Array<{ deviceId: string; lastSeenAt: Timestamp; deviceName?: string }>;
  passwordUpdatedAt?: Timestamp;
  mustChangePassword: boolean;
  // Visual enhancements
  photoUrl?: string; // Profile photo (Firebase Storage URL)
  coverPhotoUrl?: string; // Profile banner/cover image
  bioAr?: string; // Bio in Arabic
  bioFr?: string; // Bio in French
  location?: string; // User location (city, region)
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    whatsapp?: string;
    website?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  version: number;
}

export interface UserAuth {
  phone: string;
  hashedPassword: string;
  salt: string;
  passwordHistory: string[];
  failedAttempts: number;
  lockedUntil?: Timestamp;
  lastPasswordChange: Timestamp;
  resetToken?: string;
  resetTokenExpiry?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Admin {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  phone?: string; // Admin phone number
  photoUrl?: string; // Profile photo
  coverPhotoUrl?: string; // Profile banner
  bioAr?: string; // Bio in Arabic
  bioFr?: string; // Bio in French
  adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager';
  permissions: {
    manageAdmins: boolean;
    manageUsers: boolean;
    manageRoles: boolean;
    manageTiers: boolean;
    manageBoards: boolean;
    approveTransactions: boolean;
    viewAllFinancials: boolean;
    manageElections: boolean;
    publishAnnouncements: boolean;
    viewAuditLogs: boolean;
    manageSystemSettings: boolean;
    manageBlogPosts: boolean; // NEW
    manageComments: boolean; // NEW
  };
  approvalStatus: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectionReason?: string;
  isActive: boolean;
  suspendedAt?: Timestamp;
  suspendedReason?: string;
  lastLoginAt?: Timestamp;
  loginCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

export interface Role {
  id: string;
  nameAr: string;
  nameFr?: string;
  permissions: {
    users: {
      read: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      approve: boolean;
      ban: boolean;
    };
    transactions: { read: boolean; create: boolean; approve: boolean; viewAll: boolean };
    announcements: {
      read: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      publish: boolean;
    };
    elections: { read: boolean; create: boolean; manage: boolean; viewResults: boolean };
    boards: {
      read: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      assignMembers: boolean;
    };
    reports: { financial: boolean; analytics: boolean; audit: boolean };
  };
  descriptionAr: string;
  descriptionFr?: string;
  priority: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  version: number;
}

export interface Tier {
  id: string;
  nameAr: string;
  nameFr?: string;
  amountMonthly: number;
  descriptionAr: string;
  descriptionFr?: string;
  benefits: string[];
  displayOrder: number;
  // Visual enhancements
  color?: string; // Hex color for UI badges (e.g., '#FFD700')
  icon?: string; // Icon name or emoji
  badge?: string; // Badge image URL from Firebase Storage
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  version: number;
}

export interface Board {
  id: string;
  nameAr: string;
  nameFr?: string;
  descriptionAr: string;
  descriptionFr?: string;
  parentBoardId?: string;
  childBoardIds: string[];
  maxMembers?: number;
  currentMemberCount: number;
  members: Array<{
    userId: string;
    nameAr: string;
    roleId: string;
    roleNameAr: string;
    joinedAt: Timestamp;
    photoUrl?: string; // Member photo
  }>;
  treasuryAccountId?: string;
  totalSpent: number;
  status: 'active' | 'inactive' | 'archived';
  // Visual enhancements
  logoUrl?: string; // Board logo
  coverImageUrl?: string; // Board banner image
  color?: string; // Hex color for UI
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

export interface Account {
  id: string;
  type: 'user_contributions' | 'board_treasury' | 'project_fund' | 'general_fund';
  ownerRef?: DocumentReference;
  ownerType?: 'user' | 'board' | 'project';
  ownerId?: string;
  ownerNameAr?: string;
  balance: number;
  currency: 'MRU';
  version: number;
  lastTransactionId?: string;
  lastTransactionAt?: Timestamp;
  isActive: boolean;
  frozenReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Transaction {
  id: string;
  idempotencyKey: string;
  type: 'contribution' | 'donation' | 'spending' | 'transfer';
  debits: Array<{
    accountId: string;
    accountType: string;
    ownerNameAr?: string;
    amount: number;
  }>;
  credits: Array<{
    accountId: string;
    accountType: string;
    ownerNameAr?: string;
    amount: number;
  }>;
  amount: number;
  currency: 'MRU';
  month?: string;
  category?: string;
  memo?: string;
  receiptUrl?: string;
  receiptHash?: string;
  method: 'cash' | 'bank_transfer' | 'mobile_money' | 'other';
  methodDetails?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  failureReason?: string;
  createdByRef: DocumentReference;
  createdById: string;
  createdByNameAr: string;
  approvedByRef?: DocumentReference;
  approvedById?: string;
  approvedByNameAr?: string;
  receivedByRef?: DocumentReference;
  receivedById?: string;
  receivedByNameAr?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  reversedAt?: Timestamp;
  reversedByRef?: DocumentReference;
  reversesTransactionId?: string;
  reversedByTransactionId?: string;
  updatedAt: Timestamp;
  version: number;
}

export interface Announcement {
  id: string;
  author: { id: string; nameAr: string; roleNameAr?: string; photoUrl?: string };
  authorRef: DocumentReference;
  titleAr: string;
  titleFr?: string;
  contentAr: string;
  contentFr?: string;
  featuredImageUrl?: string; // Main announcement image
  attachments: Array<{
    url: string;
    type: 'image' | 'document' | 'video';
    name: string;
    size?: number;
    thumbnailUrl?: string; // For videos
  }>;
  category?: string; // 'community', 'events', 'urgent'
  tags: string[]; // Searchable tags
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  approvedBy?: { id: string; nameAr: string };
  approvedByRef?: DocumentReference;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  publishedAt?: Timestamp;
  expiresAt?: Timestamp;
  viewCount: number;
  shareCount: number;
  likeCount: number; // NEW
  commentCount: number; // NEW
  slug: string;
  shareLink: string;
  summary?: string;
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Election {
  id: string;
  titleAr: string;
  titleFr?: string;
  descriptionAr: string;
  descriptionFr?: string;
  type: 'board_member' | 'board_leader' | 'policy_vote' | 'budget_approval';
  boardRef?: DocumentReference;
  boardId?: string;
  boardNameAr?: string;
  bannerImageUrl?: string; // Election banner image
  candidates: Array<{
    userId: string;
    nameAr: string;
    nameFr?: string;
    bio?: string;
    photoUrl?: string;
    platform?: string; // Campaign message/platform
  }>;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'upcoming' | 'active' | 'closed' | 'cancelled';
  totalEligibleVoters: number;
  voteCount: number;
  resultsRef?: DocumentReference;
  resultsComputedAt?: Timestamp;
  winnerUserId?: string;
  winnerNameAr?: string;
  allowMultipleVotes: boolean;
  isPublic: boolean;
  requiresQuorum: boolean;
  quorumPercentage?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdByRef: DocumentReference;
  version: number;
}

export interface Vote {
  id: string; // ${electionId}_${voterId}
  electionRef: DocumentReference;
  electionId: string;
  voterRef: DocumentReference;
  voterId: string;
  voteToken: string;
  tokenExpiresAt: Timestamp;
  candidateRef: DocumentReference;
  candidateId: string;
  ranking?: number;
  castAt: Timestamp;
  ipAddress?: string;
  deviceFingerprint?: string;
  sealed: boolean;
  createdAt: Timestamp;
}

export interface ElectionResults {
  id: string;
  electionRef: DocumentReference;
  candidateVotes: Array<{
    candidateId: string;
    candidateNameAr: string;
    voteCount: number;
    percentage: number;
  }>;
  totalVotes: number;
  invalidVotes: number;
  winnerId?: string;
  winnerNameAr?: string;
  winnerVoteCount?: number;
  quorumMet: boolean;
  requiredQuorum?: number;
  computedAt: Timestamp;
  computedBy: 'system' | 'manual_recount';
  version: number;
  createdAt: Timestamp;
}

export interface PasswordReset {
  id: string;
  userRef: DocumentReference;
  userId: string;
  phone: string;
  resetCode: string;
  expiresAt: Timestamp;
  attemptsRemaining: number;
  isUsed: boolean;
  usedAt?: Timestamp;
  sentVia: 'sms' | 'whatsapp' | 'both';
  sentAt: Timestamp;
  createdAt: Timestamp;
}

export interface AdminAction {
  id: string;
  adminRef: DocumentReference;
  adminEmail: string;
  action: string;
  targetRef: DocumentReference;
  targetType: 'user' | 'admin' | 'announcement' | 'transaction' | 'board' | 'election';
  targetId: string;
  details: Record<string, unknown>;
  reason?: string;
  performedAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  reversible: boolean;
  reversedAt?: Timestamp;
  reversedByRef?: DocumentReference;
  createdAt: Timestamp;
}

export interface CommunityEvent {
  id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: 'user' | 'board' | 'transaction' | 'announcement' | 'election' | 'admin' | 'system';
  payload: Record<string, unknown>;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  actorRef: DocumentReference;
  actorId: string;
  actorNameAr?: string;
  actorType: 'user' | 'admin' | 'system';
  causedBy?: { eventId: string; eventType: string };
  occurredAt: Timestamp;
  sequenceNumber: number;
  version: number;
  createdAt: Timestamp;
}

export interface SystemMetrics {
  id: string;
  date: Timestamp;
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  pendingApprovals: number;
  bannedUsers: number;
  totalContributions: number;
  contributionAmount: number;
  totalSpendings: number;
  spendingAmount: number;
  treasuryBalance: number;
  totalAnnouncements: number;
  publishedAnnouncements: number;
  pendingAnnouncements: number;
  activeElections: number;
  completedElections: number;
  totalVotesCast: number;
  voterParticipationRate: number;
  totalBoards: number;
  activeBoards: number;
  averageBoardSize: number;
  totalAdmins: number;
  activeAdmins: number;
  pendingAdminApprovals: number;
  topContributors: Array<{ userId: string; nameAr: string; amount: number }>;
  mostActiveBoards: Array<{ boardId: string; nameAr: string; activityCount: number }>;
  computedAt: Timestamp;
  computationDuration: number;
  createdAt: Timestamp;
}

export interface SyncMetadata {
  id: string;
  userId: string;
  deviceId: string;
  lastSyncAt: Timestamp;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  pendingWrites: number;
  pendingWriteIds: string[];
  conflictingDocs: Array<{
    docId: string;
    collection: string;
    conflictType: 'update' | 'delete';
    detectedAt: Timestamp;
  }>;
  lastError?: string;
  errorCount: number;
  lastConnectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  updatedAt: Timestamp;
}

export interface SystemConfig {
  id: string;
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChar: boolean;
    passwordRequireNumber: boolean;
    maxLoginAttempts: number;
    accountLockoutMinutes: number;
    sessionTimeoutMinutes: number;
    jwtExpiryHours: number;
  };
  financial: {
    currency: 'MRU';
    defaultTierId?: string;
    contributionDueDay: number;
    latePaymentGraceDays: number;
  };
  elections: {
    defaultDurationDays: number;
    quorumPercentage: number;
    allowProxyVoting: boolean;
  };
  communications: {
    smsProvider: 'twilio' | 'africa_talking' | 'masrvi';
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
  };
  features: {
    offlineMode: boolean;
    multiLanguage: boolean;
    advancedAnalytics: boolean;
    exportData: boolean;
  };
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  version: number;
  updatedAt: Timestamp;
  updatedByRef: DocumentReference;
  updatedByEmail?: string;
  createdAt: Timestamp;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: { count?: number; page?: number; pageSize?: number; total?: number };
  timestamp: number;
}

export interface AuthPayload {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: Partial<User> | Partial<Admin>;
  userType: 'user' | 'admin';
}

export interface JwtPayload {
  sub: string;
  phone?: string;
  email?: string;
  type: 'user' | 'admin';
  roleId?: string;
  permissions?: Record<string, boolean>;
  iat: number;
  exp: number;
  deviceId?: string;
}

export interface CreateUserInput {
  phone: string;
  nameAr: string;
  nameFr?: string;
  email?: string;
  password: string;
  deviceId: string;
  deviceName?: string;
}

export interface AdminGoogleAuthInput {
  idToken: string;
}

export interface ApproveAdminInput {
  adminId: string;
  adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager';
}

// Re-export Firestore types for convenience
export { Timestamp, DocumentReference } from '@google-cloud/firestore';

// Re-export enhancement types
export type { Constants, BlogPost, StorageMetadata, Comment } from './enhancements';
