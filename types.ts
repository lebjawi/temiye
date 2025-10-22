/**
 * Tenmiye Community Management System - Type Definitions
 * SHARED between Frontend (Angular) and Backend (Express)
 *
 * Built for the youth community of El Gheddiya, Teganet, Mauritania
 *
 * DESIGN PHILOSOPHY (Designing Data-Intensive Applications):
 * This system implements patterns from Martin Kleppmann's book:
 * - Strong consistency for financial transactions (Chapter 7)
 * - Eventual consistency for social features (Chapter 5)
 * - Event sourcing for audit trails (Chapter 11)
 * - Offline-first with conflict resolution (Chapter 5)
 * - Denormalization for read performance (Chapter 2)
 * - Idempotency for reliability (Chapter 8)
 *
 * COMMUNITY STRUCTURE:
 * - Board of Honor (5 leaders) - overall community management
 * - Specialized boards for each initiative (pharmacy board, law-setting board, etc.)
 * - Democratic voting system for role assignments and major decisions
 * - Transparent financial tracking for monthly contributions and project funding
 *
 * SINGLE-APP DUAL-LAYOUT ARCHITECTURE:
 * One Angular application with two distinct layouts and routing:
 *
 * 1. Main Layout (/)
 *    - Community members
 *    - Phone number + password authentication (self-service signup)
 *    - Backend validates credentials, Firestore Security Rules enforce access
 *
 * 2. Admin Layout (/admin)
 *    - Leadership board members
 *    - Firebase Google Authentication (email-based login)
 *    - Admin approval workflow before first access
 *
 * SECURITY MODEL (Pages 328-333):
 * - Passwords NEVER stored in Firestore
 * - Passwords NEVER sent to frontend
 * - Backend maintains separate secure password store
 * - JWT tokens for stateless authentication
 * - Firestore Security Rules as second layer of defense
 *
 * Copyright (c) 2025 Lebjawi Tech LLC - Built with love for our community
 */

// Import Firebase types
import { Timestamp, DocumentReference } from 'firebase/firestore';

/**
 * USER - Community member account
 * Note: NO password fields here - passwords stored separately in backend
 * Pattern: Separation of authentication from user data (Page 330)
 */
export interface User {
  id: string;
  phone: string; // Unique identifier, format: +222XXXXXXXX for Mauritania
  nameAr: string; // Arabic name (required - primary language)
  nameFr?: string; // French name (optional)
  displayName?: string; // User can set display name
  email?: string;
  roleId?: string; // Reference to roles collection
  tierId?: string; // Reference to tiers collection
  status: 'active' | 'pending' | 'banned' | 'inactive';
  
  // Multi-device support for offline sync (Page 167)
  devices: Array<{
    deviceId: string;
    lastSeenAt: Timestamp;
    deviceName?: string;
  }>;
  
  // Password management (no actual password stored here)
  passwordUpdatedAt?: Timestamp; // Track when user last changed password
  mustChangePassword: boolean; // Force password change on first login
  
  // Audit fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  
  // Optimistic concurrency control (Page 242)
  version: number;
}

/**
 * USER_AUTH - Secure password storage (Backend only, never exposed to Firestore)
 * Pattern: Defense in depth - separate auth from user data (Page 330)
 * Storage: Encrypted database or secure backend collection with no client access
 */
export interface UserAuth {
  phone: string; // Primary key
  hashedPassword: string; // bcrypt hash with high cost factor (12+)
  salt: string; // Individual salt per user
  passwordHistory: string[]; // Last 5 password hashes (prevent reuse)
  
  // Account security
  failedAttempts: number;
  lockedUntil?: Timestamp;
  lastPasswordChange: Timestamp;
  
  // For password reset
  resetToken?: string;
  resetTokenExpiry?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * ROLE - Defines permissions and responsibilities
 */
export interface Role {
  id: string;
  nameAr: string; // e.g., عضو مجلس الإدارة، أمين الصندوق
  nameFr?: string; // e.g., Board Member, Treasurer
  
  // Granular permissions (Page 331)
  permissions: {
    users: {
      read: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      approve: boolean;
      ban: boolean;
    };
    transactions: {
      read: boolean;
      create: boolean;
      approve: boolean;
      viewAll: boolean; // Can see all users' transactions
    };
    announcements: {
      read: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      publish: boolean;
    };
    elections: {
      read: boolean;
      create: boolean;
      manage: boolean;
      viewResults: boolean;
    };
    boards: {
      read: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      assignMembers: boolean;
    };
    reports: {
      financial: boolean;
      analytics: boolean;
      audit: boolean;
    };
  };
  
  descriptionAr: string;
  descriptionFr?: string;
  
  // Priority level for conflict resolution
  priority: number; // Higher = more authority
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  version: number;
}

/**
 * TIER - Membership levels with monthly contribution amounts
 */
export interface Tier {
  id: string;
  nameAr: string; // e.g., ذهبي، فضي، برونزي
  nameFr?: string; // e.g., Gold, Silver, Bronze
  amountMonthly: number; // In Mauritanian Ouguiya (MRU)
  descriptionAr: string;
  descriptionFr?: string;
  
  // Benefits associated with tier
  benefits: string[]; // List of benefit keys or descriptions
  
  // Display order
  displayOrder: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  version: number;
}

/**
 * BOARD - Organizational units for community sections
 */
export interface Board {
  id: string;
  nameAr: string; // e.g., مجلس الشرف، مجلس الصيدلية
  nameFr?: string; // e.g., Honor Board, Pharmacy Board
  descriptionAr: string;
  descriptionFr?: string;
  
  // Hierarchy
  parentBoardId?: string; // Honor board → other boards
  childBoardIds: string[]; // For quick access to sub-boards
  
  // Membership
  maxMembers?: number; // Honor board = 5, others flexible
  currentMemberCount: number; // Denormalized for quick checks
  
  // Members with denormalized info (avoid extra reads, Page 35)
  members: Array<{
    userId: string;
    nameAr: string;
    roleId: string;
    roleNameAr: string;
    joinedAt: Timestamp;
  }>;
  
  // Financial tracking
  treasuryAccountId?: string; // Reference to Account
  totalSpent: number; // Denormalized total
  
  status: 'active' | 'inactive' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

/**
 * ACCOUNT - Financial account for double-entry bookkeeping (Page 228)
 * Pattern: Each entity (user, board, project) has an account
 */
export interface Account {
  id: string;
  type: 'user_contributions' | 'board_treasury' | 'project_fund' | 'general_fund';
  
  // Owner reference
  ownerRef?: DocumentReference; // User or Board
  ownerType?: 'user' | 'board' | 'project';
  ownerId?: string; // Denormalized for queries
  ownerNameAr?: string; // Denormalized for display
  
  // Balance tracking
  balance: number; // Current balance in MRU
  currency: 'MRU'; // Mauritanian Ouguiya
  
  // Optimistic concurrency control (Page 242)
  version: number; // Increment on each transaction
  lastTransactionId?: string;
  lastTransactionAt?: Timestamp;
  
  // Account status
  isActive: boolean;
  frozenReason?: string; // If account is frozen
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * TRANSACTION - Financial tracking with ACID guarantees (Pages 221-230)
 * Pattern: Double-entry bookkeeping with idempotency
 */
export interface Transaction {
  id: string;
  
  // Idempotency key to prevent duplicates (Page 358)
  idempotencyKey: string; // Client-generated UUID for retry safety
  
  type: 'contribution' | 'donation' | 'spending' | 'transfer';
  
  // Double-entry bookkeeping (Page 228)
  // Every transaction has debits and credits that must balance
  debits: Array<{
    accountId: string;
    accountType: string;
    ownerNameAr?: string; // Denormalized for display
    amount: number;
  }>;
  credits: Array<{
    accountId: string;
    accountType: string;
    ownerNameAr?: string; // Denormalized for display
    amount: number;
  }>;
  
  // Total amount (must equal sum of debits and credits)
  amount: number;
  currency: 'MRU';
  
  // Context
  month?: string; // For contributions, format: YYYY-MM
  category?: string; // spending category (pharmacy, education, etc.)
  memo?: string; // Description
  
  // Receipt tracking
  receiptUrl?: string;
  receiptHash?: string; // SHA-256 hash to verify integrity
  
  // Payment method
  method: 'cash' | 'bank_transfer' | 'mobile_money' | 'other';
  methodDetails?: string; // e.g., "Masrvi mobile money"
  
  // Workflow status (Page 360: Saga pattern)
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  failureReason?: string;
  
  // Audit trail
  createdByRef: DocumentReference;
  createdById: string; // Denormalized
  createdByNameAr: string; // Denormalized
  
  approvedByRef?: DocumentReference;
  approvedById?: string;
  approvedByNameAr?: string;
  
  receivedByRef?: DocumentReference; // Who collected the money
  receivedById?: string;
  receivedByNameAr?: string;
  
  // Timestamps
  createdAt: Timestamp;
  completedAt?: Timestamp;
  reversedAt?: Timestamp;
  reversedByRef?: DocumentReference;
  
  // Related transactions (if this reverses another)
  reversesTransactionId?: string;
  reversedByTransactionId?: string;
  
  updatedAt: Timestamp;
  version: number;
}

/**
 * ANNOUNCEMENT - Community-wide communications
 * Pattern: Denormalization for read performance (Page 35)
 */
export interface Announcement {
  id: string;
  
  // Denormalized author info (avoid extra reads)
  author: {
    id: string;
    nameAr: string;
    roleNameAr?: string;
  };
  authorRef: DocumentReference; // Keep reference for updates
  
  titleAr: string;
  titleFr?: string;
  contentAr: string; // Markdown or HTML
  contentFr?: string;
  
  // Rich content
  attachments: Array<{
    url: string;
    type: 'image' | 'document' | 'video';
    name: string;
    size?: number;
  }>;
  
  // Publishing workflow
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  
  // Denormalized approval info
  approvedBy?: {
    id: string;
    nameAr: string;
  };
  approvedByRef?: DocumentReference;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  
  // Publishing
  publishedAt?: Timestamp;
  expiresAt?: Timestamp; // For time-sensitive announcements
  
  // Engagement metrics (denormalized, Page 91)
  viewCount: number;
  shareCount: number;
  
  // SEO and sharing
  slug: string; // URL-friendly
  shareLink: string;
  summary?: string; // First 160 chars for sharing
  
  // Offline sync (Page 175)
  version: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * ELECTION - Voting events for board member selection
 * Pattern: Strong consistency for vote counting (Pages 251-260)
 */
export interface Election {
  id: string;
  titleAr: string;
  titleFr?: string;
  descriptionAr: string;
  descriptionFr?: string;
  
  // Election type
  type: 'board_member' | 'board_leader' | 'policy_vote' | 'budget_approval';
  
  // Target board if applicable
  boardRef?: DocumentReference;
  boardId?: string;
  boardNameAr?: string;
  
  // Candidates (denormalized for display)
  candidates: Array<{
    userId: string;
    nameAr: string;
    nameFr?: string;
    bio?: string;
    photoUrl?: string;
  }>;
  
  // Timing
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'upcoming' | 'active' | 'closed' | 'cancelled';
  
  // Voting progress (denormalized, Page 86)
  totalEligibleVoters: number;
  voteCount: number; // Updated on each vote
  
  // Results (computed after election closes)
  resultsRef?: DocumentReference; // Points to ElectionResults
  resultsComputedAt?: Timestamp;
  winnerUserId?: string;
  winnerNameAr?: string;
  
  // Configuration
  allowMultipleVotes: boolean; // For ranked-choice voting
  isPublic: boolean; // Are votes public or secret?
  requiresQuorum: boolean;
  quorumPercentage?: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdByRef: DocumentReference;
  version: number;
}

/**
 * VOTE - Individual vote record
 * Pattern: Write-once semantics with idempotency (Page 244)
 * CONSTRAINT: Deterministic ID prevents duplicate votes
 */
export interface Vote {
  // Deterministic ID: `${electionId}_${voterId}`
  // This ensures idempotency - duplicate votes will overwrite (Page 358)
  id: string;
  
  electionRef: DocumentReference;
  electionId: string; // Denormalized for queries
  
  voterRef: DocumentReference;
  voterId: string; // Denormalized
  
  // One-time vote token (Page 244: Prevent race conditions)
  voteToken: string; // Generated when user starts voting
  tokenExpiresAt: Timestamp; // 5-minute window to complete vote
  
  candidateRef: DocumentReference;
  candidateId: string; // Denormalized
  
  // For ranked-choice voting
  ranking?: number;
  
  // Audit trail (if votes are not secret)
  castAt: Timestamp;
  ipAddress?: string; // Optional, for fraud detection
  deviceFingerprint?: string;
  
  // Write-once guarantee (Page 244)
  sealed: boolean; // Once true, vote cannot be modified
  
  createdAt: Timestamp;
  
  // NO updatedAt - votes are immutable once sealed
}

/**
 * ELECTION_RESULTS - Computed election results
 * Pattern: Separate read model for results (Page 402: CQRS)
 */
export interface ElectionResults {
  id: string; // Same as election ID
  electionRef: DocumentReference;
  
  // Results per candidate
  candidateVotes: Array<{
    candidateId: string;
    candidateNameAr: string;
    voteCount: number;
    percentage: number;
  }>;
  
  // Summary
  totalVotes: number;
  invalidVotes: number;
  
  // Winner determination
  winnerId?: string;
  winnerNameAr?: string;
  winnerVoteCount?: number;
  
  // Quorum check
  quorumMet: boolean;
  requiredQuorum?: number;
  
  // Computation metadata
  computedAt: Timestamp;
  computedBy: 'system' | 'manual_recount';
  version: number; // For recounts
  
  createdAt: Timestamp;
}

/**
 * PASSWORD_RESET - Secure password recovery via phone verification
 * Pattern: Time-limited tokens with single use (Page 330)
 */
export interface PasswordReset {
  id: string;
  userRef: DocumentReference;
  userId: string;
  phone: string;
  
  // 6-digit verification code
  resetCode: string; // Hashed in storage
  
  // Security
  expiresAt: Timestamp; // 10 minutes
  attemptsRemaining: number; // Max 3 attempts
  isUsed: boolean;
  usedAt?: Timestamp;
  
  // Delivery tracking
  sentVia: 'sms' | 'whatsapp' | 'both';
  sentAt: Timestamp;
  
  createdAt: Timestamp;
}

/**
 * ADMIN - Leadership board member with Firebase Google Authentication
 */
export interface Admin {
  id: string; // Firebase Auth UID
  email: string; // Google email
  displayName: string;
  photoUrl?: string;
  
  // Role-based access control (Page 331)
  adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager';
  
  // Granular permissions derived from type
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
  };
  
  // Approval workflow
  approvalStatus: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
  approvedAt?: Timestamp;
  approvedByRef?: DocumentReference;
  approvedByEmail?: string; // Denormalized
  rejectionReason?: string;
  
  // Status
  isActive: boolean;
  suspendedAt?: Timestamp;
  suspendedReason?: string;
  
  // Activity tracking
  lastLoginAt?: Timestamp;
  loginCount: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

/**
 * ADMIN_ACTION - Audit trail for admin operations
 * Pattern: Event sourcing for governance (Page 461)
 */
export interface AdminAction {
  id: string;
  adminRef: DocumentReference;
  adminEmail: string; // Denormalized
  
  // Action details
  action: 
    | 'approve_user' 
    | 'ban_user' 
    | 'unban_user'
    | 'approve_announcement' 
    | 'reject_announcement'
    | 'create_board' 
    | 'delete_board'
    | 'assign_role'
    | 'remove_role'
    | 'approve_transaction'
    | 'reverse_transaction'
    | 'create_election'
    | 'close_election'
    | 'approve_admin'
    | 'suspend_admin';
  
  targetRef: DocumentReference; // What was acted upon
  targetType: 'user' | 'admin' | 'announcement' | 'transaction' | 'board' | 'election';
  targetId: string; // Denormalized
  
  // Action details
  details: Record<string, any>;
  reason?: string;
  
  // Audit metadata
  performedAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  
  // For undo operations
  reversible: boolean;
  reversedAt?: Timestamp;
  reversedByRef?: DocumentReference;
  
  createdAt: Timestamp;
}

/**
 * COMMUNITY_EVENT - Event sourcing for important decisions
 * Pattern: Immutable event log (Page 457-462)
 * Purpose: Complete audit trail + ability to rebuild state
 */
export interface CommunityEvent {
  id: string;
  
  // Event classification
  eventType: 
    | 'user_joined' 
    | 'user_approved'
    | 'user_banned' 
    | 'user_role_changed'
    | 'board_created'
    | 'board_member_added'
    | 'board_member_removed'
    | 'transaction_created'
    | 'transaction_completed'
    | 'transaction_reversed'
    | 'announcement_published'
    | 'election_started' 
    | 'election_ended'
    | 'vote_cast'
    | 'admin_approved'
    | 'system_config_changed';
  
  // Aggregate (the entity being changed)
  aggregateId: string;
  aggregateType: 'user' | 'board' | 'transaction' | 'announcement' | 'election' | 'admin' | 'system';
  
  // Event payload (the actual change)
  payload: Record<string, any>;
  
  // Before and after state (for audit)
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  
  // Actor (who caused this event)
  actorRef: DocumentReference;
  actorId: string;
  actorNameAr?: string; // Denormalized
  actorType: 'user' | 'admin' | 'system';
  
  // Causation (what triggered this)
  causedBy?: {
    eventId: string;
    eventType: string;
  };
  
  // Timing and ordering (Page 460)
  occurredAt: Timestamp;
  sequenceNumber: number; // Monotonically increasing global counter
  
  // For event replay and state rebuilding
  version: number; // Schema version for event payload
  
  createdAt: Timestamp; // When event was recorded
}

/**
 * SYSTEM_METRICS - Daily analytics and reporting
 * Pattern: Pre-computed aggregates (Page 97: Analytics)
 */
export interface SystemMetrics {
  id: string; // Format: YYYY-MM-DD
  date: Timestamp;
  
  // User metrics
  totalUsers: number;
  activeUsers: number; // Logged in within last 30 days
  newSignups: number;
  pendingApprovals: number;
  bannedUsers: number;
  
  // Financial metrics
  totalContributions: number;
  contributionAmount: number;
  totalSpendings: number;
  spendingAmount: number;
  treasuryBalance: number;
  
  // Content metrics
  totalAnnouncements: number;
  publishedAnnouncements: number;
  pendingAnnouncements: number;
  
  // Election metrics
  activeElections: number;
  completedElections: number;
  totalVotesCast: number;
  voterParticipationRate: number;
  
  // Board metrics
  totalBoards: number;
  activeBoards: number;
  averageBoardSize: number;
  
  // Top contributors (for recognition)
  topContributors: Array<{
    userId: string;
    nameAr: string;
    amount: number;
  }>;
  
  // Most active boards
  mostActiveBoards: Array<{
    boardId: string;
    nameAr: string;
    activityCount: number;
  }>;
  
  // Computation metadata
  computedAt: Timestamp;
  computationDuration: number; // milliseconds
  
  createdAt: Timestamp;
}

/**
 * SYNC_METADATA - For offline-first architecture (Page 167)
 * Pattern: Track sync state per device
 */
export interface SyncMetadata {
  id: string; // Device ID or user ID
  userId: string;
  deviceId: string;
  
  // Sync status
  lastSyncAt: Timestamp;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  
  // Pending operations
  pendingWrites: number;
  pendingWriteIds: string[]; // Document IDs with pending writes
  
  // Conflict tracking (Page 184: Conflict resolution)
  conflictingDocs: Array<{
    docId: string;
    collection: string;
    conflictType: 'update' | 'delete';
    detectedAt: Timestamp;
  }>;
  
  // Error tracking
  lastError?: string;
  errorCount: number;
  
  // Network quality indicator
  lastConnectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  updatedAt: Timestamp;
}

/**
 * SYSTEM_CONFIG - Global system settings
 * Pattern: Versioned configuration (Page 344: Distributed config)
 */
export interface SystemConfig {
  id: string; // Always 'global'
  
  // Security settings
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChar: boolean;
    passwordRequireNumber: boolean;
    maxLoginAttempts: number;
    accountLockoutMinutes: number;
    sessionTimeoutMinutes: number;
    jwtExpiryHours: number;
  };
  
  // Financial settings
  financial: {
    currency: 'MRU';
    defaultTierId?: string;
    contributionDueDay: number; // Day of month (1-28)
    latePaymentGraceDays: number;
  };
  
  // Election settings
  elections: {
    defaultDurationDays: number;
    quorumPercentage: number;
    allowProxyVoting: boolean;
  };
  
  // Communication settings
  communications: {
    smsProvider: 'twilio' | 'africa_talking' | 'masrvi';
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
  };
  
  // Feature flags (for gradual rollout)
  features: {
    offlineMode: boolean;
    multiLanguage: boolean;
    advancedAnalytics: boolean;
    exportData: boolean;
  };
  
  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  
  // Version control
  version: number;
  updatedAt: Timestamp;
  updatedByRef: DocumentReference;
  updatedByEmail?: string;
  
  createdAt: Timestamp;
}

/**
 * API RESPONSE - Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
    total?: number;
  };
  timestamp: number; // Unix timestamp
}

/**
 * AUTH PAYLOAD - Login/Register response with token
 */
export interface AuthPayload {
  token: string; // JWT token
  refreshToken?: string;
  expiresIn: number; // seconds
  user: Partial<User> | Partial<Admin>;
  userType: 'user' | 'admin';
}

/**
 * JWT PAYLOAD - Token claims
 */
export interface JwtPayload {
  sub: string; // User ID
  phone?: string; // For user auth
  email?: string; // For admin auth
  type: 'user' | 'admin';
  roleId?: string;
  permissions?: string[];
  iat: number; // Issued at
  exp: number; // Expires at
  deviceId?: string; // For device-specific tokens
}

/**
 * PAGINATION - Standard pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * FILTER PARAMS - Standard filtering
 */
export interface FilterParams {
  startDate?: Timestamp;
  endDate?: Timestamp;
  status?: string;
  type?: string;
  search?: string;
}

/**
 * AUDIT LOG ENTRY - Generic audit trail
 */
export interface AuditLogEntry {
  id: string;
  userId?: string;
  adminId?: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
  success: boolean;
  errorMessage?: string;
}

/**
 * NOTIFICATION - User notifications (future feature)
 */
export interface Notification {
  id: string;
  recipientRef: DocumentReference;
  recipientId: string;
  type: 'announcement' | 'election' | 'transaction' | 'system';
  titleAr: string;
  contentAr: string;
  link?: string; // Deep link to relevant page
  read: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
}

// ==================== INPUT/OUTPUT TYPES ====================

/**
 * CREATE/UPDATE INPUT TYPES
 * These are used for API requests
 */

export interface CreateUserInput {
  phone: string;
  nameAr: string;
  nameFr?: string;
  email?: string;
  password: string;
  deviceId: string;
  deviceName?: string;
}

export interface UpdateUserInput {
  nameAr?: string;
  nameFr?: string;
  displayName?: string;
  email?: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface CreateTransactionInput {
  type: 'contribution' | 'donation' | 'spending';
  amount: number;
  month?: string;
  category?: string;
  memo?: string;
  method: string;
  receiptFile?: File; // For frontend
  receiptBase64?: string; // For backend
  idempotencyKey: string;
}

export interface CreateAnnouncementInput {
  titleAr: string;
  titleFr?: string;
  contentAr: string;
  contentFr?: string;
  attachments?: File[];
  publishImmediately?: boolean;
}

export interface CreateElectionInput {
  titleAr: string;
  titleFr?: string;
  descriptionAr: string;
  descriptionFr?: string;
  type: string;
  boardId?: string;
  candidateIds: string[];
  startDate: Date;
  endDate: Date;
  requiresQuorum: boolean;
  quorumPercentage?: number;
}

export interface CastVoteInput {
  electionId: string;
  candidateId: string;
  voteToken: string;
}

export interface CreateBoardInput {
  nameAr: string;
  nameFr?: string;
  descriptionAr: string;
  descriptionFr?: string;
  parentBoardId?: string;
  maxMembers?: number;
}

/**
 * QUERY RESULT TYPES
 */

export interface TransactionSummary {
  totalContributions: number;
  totalDonations: number;
  totalSpendings: number;
  netBalance: number;
  period: string;
}

export interface UserContributionReport {
  userId: string;
  nameAr: string;
  tierId?: string;
  tierNameAr?: string;
  expectedMonthly: number;
  paidThisMonth: number;
  paidThisYear: number;
  missedMonths: string[];
  status: 'current' | 'behind' | 'exempt';
}

export interface BoardFinancialReport {
  boardId: string;
  boardNameAr: string;
  treasuryBalance: number;
  totalReceived: number;
  totalSpent: number;
  recentTransactions: Transaction[];
}