import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { errorHandler } from './shared/middleware/error-handler.middleware';
import {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  adminLimiter
} from './shared/middleware/rate-limiter.middleware';
import { logger, logHttpRequest } from './shared/utils/logger.util';
import constantsRoutes from './domains/constants/constants.routes';
import roleRoutes from './domains/role/role.routes';
import tierRoutes from './domains/tier/tier.routes';
import authRoutes from './domains/auth/auth.routes';
import userRoutes from './domains/user/user.routes';
import adminRoutes from './domains/admin/admin.routes';
import passwordResetRoutes from './domains/password-reset/password-reset.routes';
import boardRoutes from './domains/board/board.routes';
import transactionRoutes from './domains/transaction/transaction.routes';
import announcementRoutes from './domains/announcement/announcement.routes';
import electionRoutes from './domains/election/election.routes';
import voteRoutes from './domains/vote/vote.routes';
import storageRoutes from './domains/storage/storage.routes';
import blogRoutes from './domains/blog/blog.routes';
import * as admin from 'firebase-admin';

/**
 * Express Application Setup
 *
 * Configures Express app with middleware, routes, and Swagger documentation
 */
export function createApp(): Application {
  const app: Application = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, res, next) => {
    const startTime = Date.now();

    // Log after response is sent
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      logHttpRequest(req, res, responseTime);
    });

    next();
  });

  // CORS (allow all origins for development)
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // General API rate limiting
  app.use('/api/', generalLimiter);

  // Swagger Configuration
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Tenmiye Community Management API',
        version: '1.0.0',
        description: `
# Tenmiye API Documentation

**Community Management System for El Gheddiya, Teganet, Mauritania**

## Overview

This API provides endpoints for managing community operations including:
- System configuration (Constants)
- User management with phone authentication
- Role-based permissions (Role & Tier)
- Admin management with Google OAuth
- Board management with hierarchical structure
- Financial transactions (IMMUTABLE)
- Elections and voting system (State machine)
- Announcements with expiry
- Password reset
- File storage and management
- Blog content management

## Architecture

- **Pattern**: Domain-Driven Design (DDD) with three-tier architecture
- **Layers**: Controller → Service → Repository → Firestore
- **Authentication**: Dual strategy (Phone+bcrypt for users, Google OAuth for admins)
- **Immutable Domains**: Transaction, Vote (no UPDATE/DELETE)
- **Storage**: Firebase Storage with signed URLs for direct client upload

## Error Responses

All endpoints return errors in the following format:

\`\`\`json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
\`\`\`

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **204**: No Content (successful deletion)
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/missing credentials)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **405**: Method Not Allowed (immutable resource)
- **409**: Conflict (duplicate, invalid state transition)
- **500**: Internal Server Error

## Authentication

Most endpoints require authentication:
- **Main app users**: JWT token (7-day expiry) from phone+password login
- **Admins**: JWT token from Google OAuth login

Include token in Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Pagination

List endpoints support pagination:
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 20, max: 100)

## Caching

Some endpoints are cached to reduce Firestore reads:
- **Constants**: 5-minute in-memory cache
- **Roles**: 10-minute cache (planned)
- **Tiers**: 10-minute cache (planned)

## File Upload Flow

1. **Request upload URL**: POST /api/storage/upload-url
   - Validates file type, size, category
   - Returns signed URL and fileId
2. **Upload to signed URL**: PUT to returned uploadUrl
   - Direct client-to-Firebase upload
   - No backend involvement
3. **Confirm upload**: POST /api/storage/confirm
   - Validates file exists in storage
   - Generates download URL
   - Updates status to 'validated'
        `,
        contact: {
          name: 'Tenmiye Development Team',
          email: 'dev@tenmiye.com'
        },
        license: {
          name: 'Proprietary',
          url: 'https://tenmiye.com/license'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        },
        {
          url: 'https://api.tenmiye.com',
          description: 'Production server'
        }
      ],
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: false
              },
              error: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Validation error'
                  },
                  statusCode: {
                    type: 'number',
                    example: 400
                  }
                }
              }
            }
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              phone: { type: 'string', example: '+22212345678' },
              name: { type: 'string', example: 'Ahmed Mohamed' },
              role: { type: 'string', example: 'member' },
              tier: { type: 'string', example: 'bronze' },
              status: { type: 'string', enum: ['pending', 'active', 'inactive', 'banned', 'rejected'] },
              approvedAt: { type: 'string', format: 'date-time' },
              approvedBy: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              lastLoginAt: { type: 'string', format: 'date-time' }
            }
          },
          Tier: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique tier ID',
                example: 'bronze'
              },
              name: {
                type: 'string',
                description: 'Display name',
                example: 'Bronze'
              },
              level: {
                type: 'number',
                description: 'Hierarchy level (1-5)',
                example: 1
              },
              features: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Features granted by this tier',
                example: ['view_announcements', 'vote_in_elections']
              },
              description: {
                type: 'string',
                description: 'Tier description'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time'
              }
            }
          },
          Role: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique role ID',
                example: 'member'
              },
              name: {
                type: 'string',
                description: 'Display name',
                example: 'Member'
              },
              permissions: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of permission strings',
                example: ['vote', 'view_announcements']
              },
              description: {
                type: 'string',
                description: 'Role description'
              },
              level: {
                type: 'number',
                description: 'Hierarchy level (1-5)',
                example: 1
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time'
              }
            }
          },
          Constants: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Document ID (always "settings")'
              },
              votingDurationDays: {
                type: 'number',
                description: 'Default voting duration in days'
              },
              minCandidates: {
                type: 'number',
                description: 'Minimum candidates required for election'
              },
              maxCandidates: {
                type: 'number',
                description: 'Maximum candidates allowed in election'
              },
              maxBoardDepth: {
                type: 'number',
                description: 'Maximum hierarchy depth for boards'
              },
              maxBoardMembers: {
                type: 'number',
                description: 'Maximum members per board'
              },
              minContribution: {
                type: 'number',
                description: 'Minimum contribution amount (MRU)'
              },
              maxContribution: {
                type: 'number',
                description: 'Maximum contribution amount (MRU)'
              },
              minExpense: {
                type: 'number',
                description: 'Minimum expense amount (MRU)'
              },
              maxExpense: {
                type: 'number',
                description: 'Maximum expense amount (MRU)'
              },
              passwordResetExpiryMinutes: {
                type: 'number',
                description: 'Password reset token expiry time'
              },
              jwtExpiryDays: {
                type: 'number',
                description: 'JWT token expiry time'
              },
              paginationDefaultLimit: {
                type: 'number',
                description: 'Default pagination limit'
              },
              paginationMaxLimit: {
                type: 'number',
                description: 'Maximum pagination limit'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp'
              },
              updatedBy: {
                type: 'string',
                description: 'User who last updated'
              }
            }
          },
          StorageFile: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique file ID',
                example: 'abc123def456'
              },
              originalName: {
                type: 'string',
                description: 'Original filename',
                example: 'profile-picture.jpg'
              },
              storagePath: {
                type: 'string',
                description: 'Path in Firebase Storage',
                example: 'users/user-123/profile-abc123.jpg'
              },
              downloadUrl: {
                type: 'string',
                description: 'Signed download URL (long-lived)',
                example: 'https://storage.googleapis.com/...'
              },
              mimeType: {
                type: 'string',
                description: 'File MIME type',
                example: 'image/jpeg'
              },
              sizeBytes: {
                type: 'number',
                description: 'File size in bytes',
                example: 2048000
              },
              category: {
                type: 'string',
                enum: ['user-profile', 'election-image', 'blog-feature', 'blog-attachment', 'board-logo', 'community-asset'],
                description: 'File category',
                example: 'user-profile'
              },
              ownerRef: {
                type: 'string',
                description: 'Reference ID to owning entity',
                example: 'user-123'
              },
              ownerType: {
                type: 'string',
                enum: ['user', 'election', 'blog', 'board', 'system'],
                description: 'Type of owning entity',
                example: 'user'
              },
              uploadedBy: {
                type: 'string',
                description: 'User ID who uploaded the file',
                example: 'user-123'
              },
              uploadedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Upload timestamp'
              },
              status: {
                type: 'string',
                enum: ['pending', 'validated', 'rejected'],
                description: 'File validation status',
                example: 'validated'
              },
              validationErrors: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Validation errors if status is rejected'
              },
              thumbnailPath: {
                type: 'string',
                description: 'Path to thumbnail (if image)',
                example: 'users/user-123/profile-abc123-thumb.jpg'
              },
              thumbnailUrl: {
                type: 'string',
                description: 'Signed thumbnail URL',
                example: 'https://storage.googleapis.com/...'
              },
              dimensions: {
                type: 'object',
                properties: {
                  width: { type: 'number', example: 1920 },
                  height: { type: 'number', example: 1080 }
                },
                description: 'Image dimensions (if image)'
              },
              referenceCount: {
                type: 'number',
                description: 'Number of entities referencing this file',
                example: 1
              },
              deleted: {
                type: 'boolean',
                description: 'Soft delete flag',
                example: false
              },
              deletedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Deletion timestamp'
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp'
              }
            }
          }
        },
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token from login endpoint'
          }
        }
      },
      tags: [
        {
          name: 'Constants',
          description: 'System configuration constants'
        },
        {
          name: 'Auth',
          description: 'Authentication endpoints (User login, Admin login, Token refresh)'
        },
        {
          name: 'User',
          description: 'User management and registration'
        },
        {
          name: 'Role',
          description: 'Role and permission management'
        },
        {
          name: 'Tier',
          description: 'Membership tier management'
        },
        {
          name: 'Admin',
          description: 'Admin management (Google OAuth)'
        },
        {
          name: 'Password Reset',
          description: 'Password recovery'
        },
        {
          name: 'Board',
          description: 'Board management with hierarchy'
        },
        {
          name: 'Transaction',
          description: 'Financial transactions (IMMUTABLE)'
        },
        {
          name: 'Announcement',
          description: 'Community announcements'
        },
        {
          name: 'Election',
          description: 'Election lifecycle management'
        },
        {
          name: 'Vote',
          description: 'Voting operations (IMMUTABLE)'
        },
        {
          name: 'Storage',
          description: 'File storage and management with Firebase Storage'
        },
        {
          name: 'Blog',
          description: 'Blog content management with SEO and scheduling'
        }
      ]
    },
    apis: ['./src/domains/**/*.ts'] // Path to API docs
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Tenmiye API Docs'
  }));

  // API Routes with specific rate limiters
  app.use('/api/constants', constantsRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/tiers', tierRoutes);

  // Auth endpoints with strict rate limiting (MUST be before user routes)
  app.use('/api/auth', authLimiter, authRoutes);

  // User registration with strict rate limiting
  app.use('/api/users/register', authLimiter);
  app.use('/api/users', userRoutes);

  // Admin endpoints with moderate rate limiting
  app.use('/api/admins', adminLimiter, adminRoutes);

  // Password reset with strict rate limiting
  app.use('/api/password-reset', passwordResetLimiter, passwordResetRoutes);

  // Storage endpoints with upload rate limiting
  app.use('/api/storage/upload', uploadLimiter);
  app.use('/api/storage/upload-url', uploadLimiter);
  app.use('/api/storage', storageRoutes);

  // Other routes
  app.use('/api/boards', boardRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/elections', electionRoutes);
  app.use('/api/votes', voteRoutes);
  app.use('/api/blogs', blogRoutes);

  // Enhanced health check
  app.get('/health', async (_req, res) => {
    try {
      const startTime = Date.now();

      // Check Firestore connection
      const db = admin.firestore();
      await db.collection('_health').doc('check').get();
      const firestoreLatency = Date.now() - startTime;

      // Check Firebase Storage
      const storageStartTime = Date.now();
      const bucket = admin.storage().bucket();
      await bucket.exists();
      const storageLatency = Date.now() - storageStartTime;

      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        services: {
          firestore: {
            status: 'ok',
            latency: `${firestoreLatency}ms`
          },
          storage: {
            status: 'ok',
            latency: `${storageLatency}ms`
          }
        },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        }
      });
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
      res.status(503).json({
        success: false,
        message: 'Service unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Root redirect to docs
  app.get('/', (_req, res) => {
    res.redirect('/api-docs');
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        statusCode: 404
      }
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
