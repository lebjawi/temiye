/**
 * Enhanced Type Definitions
 *
 * New collections and enhancements for existing types
 */

import { Timestamp, DocumentReference } from '@google-cloud/firestore';

/**
 * Constants Collection
 * Global application settings and configuration
 * Single document with ID 'global'
 */
export interface Constants {
  id: 'global';
  app: {
    name: string;
    version: string;
    minSupportedVersion: string;
  };
  community: {
    name: string;
    description: string;
    logo: string; // URL
    contact: {
      email: string;
      phone: string;
      address?: string;
    };
  };
  defaults: {
    userPhotoUrl: string; // Default avatar URL
    tierId: string; // Default membership tier
    language: 'ar' | 'fr';
  };
  categories: {
    announcements: string[]; // ['community', 'events', 'urgent']
    blogPosts: string[]; // ['community_story', 'guide', 'news']
    transactions: string[]; // ['monthly', 'special', 'donation']
  };
  uploads: {
    maxFileSizeMB: number;
    allowedFormats: {
      images: string[]; // ['.jpg', '.png', '.webp']
      documents: string[]; // ['.pdf', '.docx']
      videos: string[]; // ['.mp4', '.mov']
    };
  };
  limits: {
    itemsPerPage: number;
    maxLengths: {
      bioAr: number;
      bioFr: number;
      announcementContent: number;
      blogPostContent: number;
    };
  };
  features: {
    blogPostsEnabled: boolean;
    commentsEnabled: boolean;
    electionsEnabled: boolean;
    boardsEnabled: boolean;
  };
  policies: {
    termsUrl: string;
    privacyUrl: string;
  };
  maintenance: {
    isActive: boolean;
    message?: string;
  };
  version: number;
  updatedAt: Timestamp;
  updatedBy: string; // Admin ID
  createdAt: Timestamp;
}

/**
 * BlogPost Collection
 * Community blog posts and standalone pages
 */
export interface BlogPost {
  id: string;
  titleAr: string;
  titleFr?: string;
  contentAr: string; // Rich text (HTML or Markdown)
  contentFr?: string; // Rich text
  excerpt: string; // Summary for listings
  slug: string; // SEO-friendly URL
  featuredImageUrl?: string; // Main image
  galleryImages: string[]; // Additional images
  category: 'community_story' | 'guide' | 'news' | 'standalone_page';
  tags: string[]; // ['تعليم', 'education', 'community']
  status: 'draft' | 'published';
  author: {
    id: string;
    nameAr: string;
    photoUrl?: string;
  };
  authorRef: DocumentReference;
  readTimeMinutes?: number; // Estimated reading time
  isFeatured: boolean; // Show on homepage
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

/**
 * StorageMetadata Collection
 * Tracks all file uploads and storage operations
 */
export interface StorageMetadata {
  id: string; // File ID or hash
  fileName: string; // Original file name
  storagePath: string; // Path in Firebase Storage
  publicUrl: string; // Public access URL
  fileType: string; // MIME type
  fileSize: number; // Size in bytes
  fileHash: string; // SHA-256 hash for integrity
  uploadedBy: {
    id: string;
    type: 'user' | 'admin';
    nameAr: string;
  };
  uploadedByRef: DocumentReference;
  relatedTo?: {
    collection: string; // 'users', 'announcements', 'blogPosts', etc.
    documentId: string;
    field: string; // 'photoUrl', 'featuredImageUrl', etc.
  };
  purpose:
    | 'user_photo'
    | 'user_cover'
    | 'admin_photo'
    | 'board_logo'
    | 'board_cover'
    | 'announcement_featured'
    | 'announcement_attachment'
    | 'blog_featured'
    | 'blog_gallery'
    | 'transaction_receipt'
    | 'tier_badge'
    | 'other';
  status: 'active' | 'deleted' | 'replaced';
  deletedAt?: Timestamp;
  deletedBy?: string;
  replacedBy?: string; // ID of file that replaced this one
  uploadedAt: Timestamp;
  lastAccessedAt?: Timestamp;
  accessCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

/**
 * Comment Collection (for BlogPosts and Announcements)
 * Future enhancement
 */
export interface Comment {
  id: string;
  parentRef: DocumentReference; // BlogPost or Announcement
  parentId: string;
  parentType: 'blog_post' | 'announcement';
  author: {
    id: string;
    nameAr: string;
    photoUrl?: string;
  };
  authorRef: DocumentReference;
  contentAr: string;
  contentFr?: string;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  likeCount: number;
  replyCount: number;
  parentCommentId?: string; // For nested replies
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

// Re-export for convenience
export { Timestamp, DocumentReference } from '@google-cloud/firestore';
