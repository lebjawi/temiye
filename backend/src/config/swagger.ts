/**
 * Swagger/OpenAPI Configuration
 *
 * Interactive API documentation using Swagger UI
 * Auto-generates documentation from JSDoc comments in routes and controllers
 *
 * Access at: http://localhost:8080/api-docs
 * JSON spec: http://localhost:8080/api-docs.json
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/**
 * Swagger/OpenAPI Specification Options
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tenmiye Community Management API',
      version: '1.0.0',
      description:
        'Backend API for Tenmiye Community Management System - El Gheddiya, Teganet, Mauritania\n\n' +
        '## Features\n' +
        '- User authentication (phone + password)\n' +
        '- Admin authentication (Google OAuth)\n' +
        '- Financial transactions with double-entry bookkeeping\n' +
        '- Elections and voting system\n' +
        '- Community announcements\n' +
        '- Board management\n\n' +
        '## Authentication\n' +
        'Most endpoints require authentication. Include the JWT token in the Authorization header:\n' +
        '```\nAuthorization: Bearer YOUR_JWT_TOKEN\n```',
      contact: {
        name: 'Lebjawi Tech LLC',
        email: 'support@tenmiye.mr',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://api.tenmiye.mr',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from login or Google authentication',
        },
      },
      schemas: {
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_abc123' },
            phone: { type: 'string', example: '+222123456789' },
            nameAr: { type: 'string', example: 'أحمد محمد' },
            nameFr: { type: 'string', example: 'Ahmed Mohamed' },
            displayName: { type: 'string', example: 'Ahmed' },
            email: { type: 'string', example: 'ahmed@example.com' },
            status: {
              type: 'string',
              enum: ['active', 'pending', 'banned', 'inactive'],
              example: 'active',
            },
            roleId: { type: 'string', example: 'role_member' },
            tierId: { type: 'string', example: 'tier_basic' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLoginAt: { type: 'string', format: 'date-time' },
          },
        },

        // Admin Schema
        Admin: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'firebase_uid_123' },
            email: { type: 'string', example: 'admin@tenmiye.mr' },
            displayName: { type: 'string', example: 'Admin User' },
            photoUrl: { type: 'string', example: 'https://example.com/photo.jpg' },
            adminType: {
              type: 'string',
              enum: ['superadmin', 'finance_admin', 'content_admin', 'community_manager'],
              example: 'superadmin',
            },
            approvalStatus: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              example: 'approved',
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            lastLoginAt: { type: 'string', format: 'date-time' },
          },
        },

        // Transaction Schema
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'txn_abc123' },
            type: {
              type: 'string',
              enum: ['contribution', 'donation', 'spending', 'transfer'],
              example: 'contribution',
            },
            amount: { type: 'number', example: 1000 },
            currency: { type: 'string', example: 'MRU' },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'reversed'],
              example: 'completed',
            },
            method: {
              type: 'string',
              enum: ['cash', 'bank_transfer', 'mobile_money', 'other'],
              example: 'cash',
            },
            memo: { type: 'string', example: 'Monthly contribution' },
            receiptUrl: { type: 'string', example: 'https://storage.googleapis.com/...' },
            createdAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Election Schema
        Election: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'election_abc123' },
            titleAr: { type: 'string', example: 'انتخاب رئيس المجلس' },
            titleFr: { type: 'string', example: 'Election du président du conseil' },
            type: {
              type: 'string',
              enum: ['board_member', 'board_leader', 'policy_vote', 'budget_approval'],
              example: 'board_leader',
            },
            status: {
              type: 'string',
              enum: ['upcoming', 'active', 'closed', 'cancelled'],
              example: 'active',
            },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            totalEligibleVoters: { type: 'number', example: 150 },
            voteCount: { type: 'number', example: 87 },
          },
        },

        // Announcement Schema
        Announcement: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'announcement_abc123' },
            titleAr: { type: 'string', example: 'إعلان هام' },
            titleFr: { type: 'string', example: 'Annonce importante' },
            contentAr: { type: 'string', example: 'محتوى الإعلان...' },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'published', 'rejected', 'archived'],
              example: 'published',
            },
            publishedAt: { type: 'string', format: 'date-time' },
            viewCount: { type: 'number', example: 250 },
          },
        },

        // Error Response Schema
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message describing what went wrong' },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                  description: 'Error code for programmatic handling',
                },
                message: { type: 'string', example: 'Detailed error message' },
                details: {
                  type: 'object',
                  description: 'Additional error details (validation errors, etc.)',
                },
              },
            },
            timestamp: { type: 'number', example: 1737557445123 },
          },
        },

        // Success Response Schema
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)',
            },
            timestamp: { type: 'number', example: 1737557445123 },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'System health and status endpoints',
      },
      {
        name: 'Admin Authentication',
        description: 'Admin Google OAuth authentication',
      },
      {
        name: 'User Authentication',
        description: 'User phone + password authentication',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Transactions',
        description: 'Financial transaction management',
      },
      {
        name: 'Elections',
        description: 'Election and voting system',
      },
      {
        name: 'Announcements',
        description: 'Community announcements',
      },
      {
        name: 'Boards',
        description: 'Board management',
      },
      {
        name: 'Roles',
        description: 'Role management',
      },
      {
        name: 'Tiers',
        description: 'Membership tier management',
      },
    ],
    security: [{ BearerAuth: [] }],
  },
  // Path to files containing OpenAPI annotations
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

/**
 * Generate Swagger specification
 */
const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI middleware
 *
 * @param app - Express application instance
 *
 * @example
 * import { setupSwagger } from '@config/swagger';
 * setupSwagger(app);
 */
export function setupSwagger(app: Express): void {
  // Swagger UI endpoint
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Tenmiye API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true, // Keep authorization token across page refreshes
        displayRequestDuration: true, // Show request duration
        filter: true, // Enable search/filter
        showExtensions: true,
        showCommonExtensions: true,
      },
    })
  );

  // Swagger JSON specification endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Log Swagger UI URL
  const port = process.env.PORT || 8080;
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/api-docs`);
  console.log(`📄 OpenAPI JSON spec available at: http://localhost:${port}/api-docs.json`);
}

/**
 * Export Swagger specification for advanced use cases
 */
export { swaggerSpec };
