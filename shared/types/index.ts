/**
 * Tenmiye Community Management System - Type Definitions
 * SHARED between Frontend (Angular) and Backend (Express)
 *
 * Built for the youth community of El Gheddiya, Teganet, Mauritania
 *
 * DESIGN PHILOSOPHY:
 * This system is designed with deep respect for our community's values and practical realities:
 * - WhatsApp-familiar interface for tech-diverse youth (Arabic interface)
 * - Board-based governance reflecting our traditional decision-making structure
 * - Minimal maintenance requirements for long-term sustainability
 * - Simplicity over complexity to ensure accessibility for all community members
 * - Support for community initiatives (pharmacy, education, development projects)
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
 *    - Limited UI pages based on user permissions
 *    - Cost-optimized: Direct Firestore reads/writes with Security Rules
 *    - Pages: Login, Dashboard, Profile, Transactions, Announcements, Elections, Voting
 *
 * 2. Admin Layout (/admin)
 *    - Leadership board members
 *    - Firebase Google Authentication (email-based login)
 *    - Admin approval workflow before first access
 *    - Full management pages and capabilities
 *    - Higher security with Firebase Auth
 *    - Pages: Admin Login, Admin Dashboard, User Management, Approvals, Analytics, Settings
 *
 * COST OPTIMIZATION:
 * - Main layout: No Firebase Auth service costs (uses custom phone+password + Firestore rules)
 * - Admin layout: Firebase Auth (free tier includes admin features)
 * - Single Firestore instance shared between both layouts
 * - Single Express backend API handles both authentication methods
 *
 * TECHNICAL APPROACH:
 * - Mobile-first for community members, admin panel for board members
 * - Reliable offline capability for desert connectivity conditions
 * - Arabic language support as primary interface
 * - Built for immediate community scale (El Gheddiya focused)
 *
 * This is more than an app - it's a digital tool to strengthen our community bonds,
 * preserve our democratic values, and support our collective growth in rural Mauritania.
 *
 * Copyright (c) 2025 Lebjawi Tech LLC - Built with love for our community
 */

// Import Firebase types
// For frontend (Angular): uses 'firebase/firestore'
// For backend (Node.js): will need to use conditional imports or declarations
import { Timestamp , DocumentReference } from 'firebase/firestore';

/**
 * USER - Community member account
 * MAIN APP: Phone + password authentication (self-service)
 */
export interface User {
  id: string;
  phone: string; // Unique identifier for the user, used for login (format: +222XXXXXXXX for Mauritania)
  nameAr: string; // Arabic name (required - primary language)
  nameFr?: string; // French name (optional)
  displayName?: string; // Optional User can set a display name, else we can show nameAr or nameFr
  email?: string;
  roleId?: string; // Reference to roles collection - optional until assigned by admin
  tierId?: string; // Reference to tiers collection - optional until assigned by admin
  status: 'active' | 'pending' | 'banned' | 'inactive'; // active: fully active, pending: awaiting approval, banned: removed from community, inactive: archived/soft-deleted
  updatedPassword: boolean; // false until user updates password for first time
  hashedPassword?: string; // Hash of the user's password to check if for login (bcrypt hash)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * ROLE - Defines permissions and responsibilities
 */
export interface Role {
  id: string;
  nameAr: string; // Arabic name (required) - e.g., عضو مجلس الإدارة، أمين الصندوق
  nameFr?: string; // French name (optional) - e.g., Admin, Member, Guest
  scopes: string[]; // each role will have list or responsibilities
  descriptionAr: string; // Arabic description of the role, like what this role can do
  descriptionFr?: string; // French description (optional)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

/**
 * TIER - Membership levels with monthly contribution amounts
 */
export interface Tier {
  id: string;
  nameAr: string; // Arabic name (required) - e.g., ذهبي، فضي، برونزي
  nameFr?: string; // French name (optional) - e.g., Gold, Silver, Bronze
  amountMonthly: number;
  descriptionAr: string; // Arabic description of the tier, like your contributions will be used for XYZ
  descriptionFr?: string; // French description (optional)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

/**
 * BOARD - Organizational units for community sections
 */
export interface Board {
  id: string;
  nameAr: string; // Arabic name (required) - e.g., مجلس الشرف، مجلس الصيدلية، مجلس التعليم
  nameFr?: string; // French name (optional) - e.g., Education, Management and Communications
  descriptionAr: string; // Arabic description (required)
  descriptionFr?: string; // French description (optional)
  parentBoardId?: string; // For hierarchy: honor board → other boards
  maxMembers?: number; // Honor board = 5 members, others flexible
  roles: string[]; // role IDs associated with this board
  spendings: string[]; // transaction IDs
  status: 'active' | 'inactive' | 'archived'; // active: operational, inactive: temporarily disabled, archived: permanently closed
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * ANNOUNCEMENT - Community-wide communications
 */
export interface Announcement {
  id: string;
  authorRef: DocumentReference;
  titleAr: string; // Arabic title (required)
  titleFr?: string; // French title (optional)
  contentAr: string; // Main Arabic content (required), can be plain text or markdown or HTML
  contentFr?: string; // French content (optional)
  attachments: string[]; // URLs of any attachments (images, documents)
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  approvedByRef?: DocumentReference;
  publishedAt?: Timestamp;
  slug: string; // URL-friendly version of the title
  shareLink: string; // Link to share the announcement
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * TRANSACTION - Financial tracking (contributions, donations, spendings)
 */
export interface Transaction {
  id: string;
  type: 'contribution' | 'donation' | 'spending';
  userRef?: DocumentReference; // Reference to the user who made the contribution or donation, if made by a member
  boardRef?: DocumentReference; // Reference to the board that made the spending, if it was a board expense
  receivedBy: DocumentReference; // Reference to the user who received the money
  amount: number;
  month?: string; // Month for which the contribution is made, in YYYY-MM
  method: 'cash' | 'bank' | 'mobile' | 'other';
  memo?: string; // Short description of the transaction
  receiptUrl?: string; // URL of the receipt image or document
  createdAt: Timestamp;
  updatedAt?: Timestamp; // Standard audit timestamp
  createdByRef?: DocumentReference;
}

/**
 * ELECTION - Voting events for board member selection
 */
export interface Election {
  id: string;
  titleAr: string; // Arabic title (required)
  titleFr?: string; // French title (optional)
  descriptionAr: string; // Arabic description (required)
  descriptionFr?: string; // French description (optional)
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'upcoming' | 'active' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * VOTE - Individual vote record in an election
 * CONSTRAINT: Each member can only vote once per election
 * IMPLEMENTATION: Create a unique compound index on (electionRef, voterRef) in Firestore
 */
export interface Vote {
  id: string;
  electionRef: DocumentReference;
  voterRef: DocumentReference;
  candidateRef: DocumentReference;
  castAt: Timestamp;
  createdAt: Timestamp; // Standard audit timestamp
  updatedAt?: Timestamp; // In case vote needs to be modified (audit trail)
}

/**
 * PASSWORD_RESET - Secure password recovery via phone verification
 * REMOVED: PasswordBackUp interface for security reasons
 */
export interface PasswordReset {
  id: string;
  userRef: DocumentReference;
  phone: string; // Phone number for verification
  resetCode: string; // Temporary 6-digit code sent via SMS/WhatsApp
  expiresAt: Timestamp; // Code expires after 10 minutes
  isUsed: boolean;
  createdAt: Timestamp;
}

/**
 * CONSTANTS - System configuration and security settings
 */
export interface Constants {
  id: string;
  passwordSalt: string; // Salt used for hashing passwords
  defaultPasswordHash: string; // Hash of the default password for new users
  smsApiKey?: string; // For sending password reset codes via SMS/WhatsApp
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy?: DocumentReference;
}

/**
 * ADMIN - Leadership board member with Firebase Google Authentication
 * ADMIN DASHBOARD: Firebase Google Authentication (email-based login)
 */
export interface Admin {
  id: string; // Firebase Auth UID from their Google login
  email: string; // The admin's Google email, for easy identification
  displayName: string; // Their name from the Google account
  adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager';
  permissions: string[]; // A list of specific permissions derived from their type
  approvalStatus: 'pending' | 'approved' | 'rejected'; // Admin approval workflow: pending until board of honor approves
  requestedAt: Timestamp; // When the admin first signed up
  approvedAt?: Timestamp; // When a superadmin approved this admin
  approvedBy?: DocumentReference; // Reference to the superadmin who approved
  isActive: boolean; // To easily enable or disable an admin's access
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  updatedAt: Timestamp;
}

/**
 * API RESPONSE - Standard API response format for all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  count?: number;
}

/**
 * AUTH PAYLOAD - Login/Register response with token
 */
export interface AuthPayload {
  token: string;
  user: Partial<User> | Partial<Admin>;
}
