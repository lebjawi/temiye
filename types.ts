/**
 * Tenmiye Community Management System - Type Definitions
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

import { DocumentReference, Timestamp } from 'firebase/firestore';

export interface User { // Login information will be phone number and password, we will hash the password and store only the hash, when user logs in we will hash the password they provide and compare to the stored hash
  id: string;
  phone: string; // Unique identifier for the user, used for login (format: +222XXXXXXXX for Mauritania)
  nameAr: string; // Arabic name (required - primary language)
  nameFr?: string; // French name (optional)
  displayName?: string; // Optional User can set a display name, else we can show nameAr or nameFr
  email?: string;
  roleId?: string; // Reference to roles collection - optional until assigned by admin
  tierId?: string; // Reference to tiers collection - optional until assigned by admin
  status: 'active' | 'inactive' | 'pending' | 'banned' | 'deleted' | 'archived' | 'suspended';
  updatedPassword: boolean; // false until user updates password for first time
  hashedPassword?: string; // Hash of the user's password to check if for login
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Role { // As the community members can be responsible for different things as simple as collecting money, making announcements, managing elections etc, we will have roles to define what each user can do, as well for otheres to know who is responsible for what
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

export interface Tier { // Each member will have a tier to determine his monthly contribution amount
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

export interface Board { // The community will have a board for each section, like finance, events, communications and management, this will be created by the admin, and he will need to assign roles to the board, and each user assigned to the board will have the permissions associated with the role
  id: string;
  nameAr: string; // Arabic name (required) - e.g., مجلس الشرف، مجلس الصيدلية، مجلس التعليم
  nameFr?: string; // French name (optional) - e.g., Education, Management and Communications
  descriptionAr: string; // Arabic description (required)
  descriptionFr?: string; // French description (optional)
  parentBoardId?: string; // For hierarchy: honor board → other boards
  maxMembers?: number; // Honor board = 5 members, others flexible
  roles: string[]; // role IDs associated with this board, which will determine the position for each user in this board, this will make it easier to manage permissions, as anyone we want to add to the board, we just need to create the role, assign the role to the board, and assign the role to the user, and the user will automatically have the permissions associated with that role
  spendings: string[]; // transaction IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface Announcement { // Announcements published, this will be created by users with the right permissions, and will need to be approved by an admin before being published
  id: string;
  authorRef: DocumentReference;
  titleAr: string; // Arabic title (required)
  titleFr?: string; // French title (optional)
  contentAr: string; // Main Arabic content (required), can be plain text or markdown or HTML, but I prefer HTML for better formatting
  contentFr?: string; // French content (optional)
  attachments: string[]; // URLs of any attachments (images, documents)
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived'; // Draft until submitted for review, then pending until approved, then published, if rejected, it goes back to draft
  approvedByRef?: DocumentReference; // Reference to the user who approved the announcement
  publishedAt?: Timestamp;
  slug: string; // URL-friendly version of the title
  shareLink: string; // Link to share the announcement
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Transaction { // Transactions for contributions, donations, and spendings, this will be created by the admin and he will need to assign a receiver, which can be anyone from the management or finance board, just planing for transparency, and upload a receipt for record keeping
  id: string;
  type: 'contribution' | 'donation' | 'spending';
  userRef?: DocumentReference; // Reference to the user who made the contribution or donation, if made by a member
  boardId?: string; // Reference to the board that made the spending, if it was a board expense
  receivedBy: DocumentReference; // Reference to the user who received the money
  amount: number;
  month?: string; // Month for which the contribution is made, in YYYY-MM
  method: 'cash' | 'bank' | 'mobile' | 'other';
  memo?: string; // Short description of the transaction
  receiptUrl?: string; // URL of the receipt image or document, as we want to keep screenshots of mobile payments or bank transfers for record keeping
  createdAt: Timestamp;
  createdByRef?: DocumentReference;
}

export interface Election { // Elections for board members, this will be created by the admin, and he will need to assign a start and end date, and the status will be upcoming until the start date, then active until the end date, then closed
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

export interface Vote { // Votes cast by members in an election, each member can only vote once per election, we will enforce this in the app logic
  id: string;
  electionRef: DocumentReference;
  voterRef: DocumentReference;
  candidateRef: DocumentReference; // Fixed typo: was "usereRef"
  castAt: Timestamp;
}

// REMOVED: PasswordBackUp interface for security reasons
// Instead, implement phone-based password recovery via SMS/WhatsApp
export interface PasswordReset { // For secure password recovery via phone verification
  id: string;
  userRef: DocumentReference;
  phone: string; // Phone number for verification
  resetCode: string; // Temporary 6-digit code sent via SMS/WhatsApp
  expiresAt: Timestamp; // Code expires after 10 minutes
  isUsed: boolean;
  createdAt: Timestamp;
}

export interface Constants {
  id: string;
  passwordSalt: string; // Salt used for hashing passwords
  defaultPasswordHash: string; // Hash of the default password for new users
  smsApiKey?: string; // For sending password reset codes via SMS/WhatsApp
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy?: DocumentReference;
}

export interface Admin {
  id: string; // This would be the Firebase Auth UID from their Google login
  email: string; // The admin's Google email, for easy identification
  displayName: string; // Their name from the Google account
  adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager'; // The "type" you asked for
  permissions: string[]; // A list of specific permissions derived from their type
  isActive: boolean; // To easily enable or disable an admin's access
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}
