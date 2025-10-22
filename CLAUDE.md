# Tenmiye Backend - Development Guide

## Project Overview

**Purpose:** Backend API for Tenmiye Community Management System (El Gheddiya, Teganet, Mauritania)  
**Scale:** 1000 users initially, scalable to 10,000+  
**Stack:** Node.js 20+ | TypeScript 5+ | Express.js | Firestore | Firebase Admin SDK  
**Architecture:** Layered Service-Oriented Monolith (Routes → Controllers → Services → Repositories)

---

## Technology Stack

### Core Dependencies
- **Runtime:** Node.js 24 LTS
- **Language:** TypeScript 5.x
- **Framework:** Express.js 4.x
- **Database:** Firebase Firestore
- **Authentication:** JWT + bcrypt + Firebase Auth (admins only)
- **File Storage:** Firebase Cloud Storage

### Development Tools
- **Linting:** ESLint 8+ with TypeScript support
- **Formatting:** Prettier 3+
- **API Documentation:** Swagger/OpenAPI 3.0
- **Logging:** Winston 3+ (custom format - see below)
- **Testing:** Jest + Supertest
- **Process Manager:** PM2 (production)

---

## Firebase Services Used (MINIMAL STACK)

```
✅ Firestore Database      - Main database ($2/mo at 1K users)
✅ Cloud Storage           - File uploads ($6/mo at 1K users)
✅ Firebase Auth           - Admin Google sign-in ONLY (FREE)
✅ Service Account         - Backend access (FREE)
❌ NO Cloud Functions
❌ NO Cloud Run
❌ NO event listeners
Total: ~$8/month Firebase + hosting
```

---

## Project Structure

```
tenmiye-backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── firebase.ts      # Firebase Admin SDK init
│   │   ├── database.ts      # Firestore connection
│   │   ├── logger.ts        # Winston logger config ⭐
│   │   └── swagger.ts       # Swagger/OpenAPI setup ⭐
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # All interfaces (User, Admin, Transaction, etc.)
│   │
│   ├── repositories/        # Data access layer (Firestore CRUD)
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   ├── admin.repository.ts
│   │   ├── transaction.repository.ts
│   │   └── ...
│   │
│   ├── services/            # Business logic layer (FAT LAYER)
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── admin.service.ts
│   │   ├── transaction.service.ts
│   │   └── ...
│   │
│   ├── controllers/         # Request/response handlers (THIN)
│   │   ├── auth.controller.ts
│   │   ├── admin-auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── transaction.controller.ts
│   │   └── ...
│   │
│   ├── middleware/          # Express middleware
│   │   ├── authenticate.ts  # JWT verification
│   │   ├── authorize.ts     # Permission checks
│   │   ├── validate.ts      # Request validation
│   │   ├── error-handler.ts # Global error handling
│   │   ├── logger.ts        # Request logging middleware
│   │   └── rate-limit.ts    # Rate limiting
│   │
│   ├── routes/              # Route definitions
│   │   ├── index.ts         # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── admin-auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── transaction.routes.ts
│   │   └── ...
│   │
│   ├── validators/          # Input validation schemas
│   │   ├── auth.validator.ts
│   │   ├── user.validator.ts
│   │   ├── transaction.validator.ts
│   │   └── ...
│   │
│   ├── utils/               # Utility functions
│   │   ├── jwt.utils.ts
│   │   ├── crypto.utils.ts
│   │   ├── logger.utils.ts  # Logger helper functions
│   │   └── ...
│   │
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── logs/                    # Log files (gitignored)
│   ├── combined.log
│   ├── error.log
│   └── debug.log
│
├── docs/                    # Documentation
│   └── swagger.yaml         # OpenAPI specification
│
├── .eslintrc.js             # ESLint configuration ⭐
├── .prettierrc              # Prettier configuration ⭐
├── .eslintignore
├── .prettierignore
├── tsconfig.json            # TypeScript configuration
├── jest.config.js           # Jest configuration
├── nodemon.json             # Nodemon configuration
├── .env.example             # Environment variables template
├── .env                     # Environment variables (gitignored)
├── .gitignore
├── package.json             # Dependencies & scripts ⭐
└── README.md
```

---

## Development Setup

### Required Environment Variables

```env
# Node Environment
NODE_ENV=development
PORT=3000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY_HOURS=24

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:4200,https://tenmiye.mr

# Logging
LOG_LEVEL=debug
LOG_FILE_ENABLED=true
LOG_CONSOLE_ENABLED=true
```

---

## Code Quality & Formatting

### ESLint Configuration (.eslintrc.js)

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  rules: {
    // Code Quality
    'no-console': 'warn', // Use logger instead
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    
    // Best Practices
    'require-await': 'off',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/await-thenable': 'error',
    'no-return-await': 'off',
    '@typescript-eslint/return-await': 'error',
    
    // Formatting (handled by Prettier)
    'prettier/prettier': 'error',
  },
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
```

### Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false
}
```

### package.json Scripts

```json
{
  "name": "tenmiye-backend",
  "version": "1.0.0",
  "description": "Backend API for Tenmiye Community Management System",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "start:prod": "NODE_ENV=production pm2 start dist/server.js --name tenmiye-backend",
    
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "format-fix": "npm run lint:fix && npm run format",
    
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "jest --testPathPattern=tests/e2e",
    
    "swagger:generate": "ts-node src/config/swagger.ts",
    "docs": "npm run swagger:generate && open http://localhost:3000/api-docs",
    
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm run lint && npm run format:check",
    "prepare": "husky install"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "dotenv": "^16.3.1",
    "@google-cloud/firestore": "^7.1.0",
    "firebase-admin": "^12.0.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/swagger-ui-express": "^4.1.6",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/jest": "^29.5.11",
    "@types/supertest": "^6.0.2",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.2",
    "prettier": "^3.1.1",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  },
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## Winston Logger Configuration

### Custom Log Format (CRITICAL REQUIREMENT)

```typescript
// src/config/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

/**
 * CUSTOM LOG FORMAT:
 * Line 1: [TIMESTAMP] [LEVEL] [REQUEST_ID]
 * Line 2: MESSAGE
 * Line 3: File: RELATIVE_PATH
 * Line 4: Additional metadata (if any)
 */

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, filePath, ...meta } = info;

    // Line 1: Timestamp, Level, Request ID
    let log = `[${timestamp}] [${level}]`;
    if (requestId) {
      log += ` [${requestId}]`;
    }

    // Line 2: Message
    log += `\n${message}`;

    // Line 3: File path (relative)
    if (filePath) {
      log += `\nFile: ${filePath}`;
    }

    // Line 4: Additional metadata
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Format for file output (JSON for easy parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Transport: Console (development)
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.LOG_LEVEL || 'debug',
});

// Transport: Daily rotate file for all logs
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: 'debug',
});

// Transport: Daily rotate file for errors only
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'error',
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'tenmiye-backend' },
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE_ENABLED === 'true') {
  logger.add(consoleTransport);
}

export default logger;
```

### Logger Utility Functions

```typescript
// src/utils/logger.utils.ts
import logger from '../config/logger';
import path from 'path';

/**
 * Get relative file path from absolute path
 * Converts: /home/user/project/src/services/user.service.ts
 * To: src/services/user.service.ts
 */
export function getRelativeFilePath(absolutePath: string): string {
  const projectRoot = path.resolve(__dirname, '../../');
  return path.relative(projectRoot, absolutePath);
}

/**
 * Create logger with automatic file path detection
 * Usage in any file:
 * const log = createLogger(__filename);
 * log.info('User logged in', { userId: '123' });
 */
export function createLogger(filename: string) {
  const filePath = getRelativeFilePath(filename);

  return {
    debug: (message: string, meta?: Record<string, any>) => {
      logger.debug(message, { ...meta, filePath });
    },
    info: (message: string, meta?: Record<string, any>) => {
      logger.info(message, { ...meta, filePath });
    },
    warn: (message: string, meta?: Record<string, any>) => {
      logger.warn(message, { ...meta, filePath });
    },
    error: (message: string, error?: Error, meta?: Record<string, any>) => {
      logger.error(message, {
        ...meta,
        filePath,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : undefined,
      });
    },
  };
}

/**
 * Express middleware for request logging
 */
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Attach request ID to request object
  req.requestId = requestId;

  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    filePath: 'src/middleware/logger.ts',
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      filePath: 'src/middleware/logger.ts',
    });
  });

  next();
}
```

### Usage Examples

```typescript
// src/services/user.service.ts
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

export class UserService {
  async createUser(data: CreateUserInput): Promise<User> {
    log.info('Creating new user', { phone: data.phone });

    try {
      // Check if user exists
      const existing = await this.userRepo.findByPhone(data.phone);
      if (existing) {
        log.warn('User already exists', { phone: data.phone });
        throw new Error('User already exists');
      }

      // Create user
      const user = await this.userRepo.create(data);
      log.info('User created successfully', { userId: user.id });

      return user;
    } catch (error) {
      log.error('Failed to create user', error as Error, { phone: data.phone });
      throw error;
    }
  }
}
```

**Log Output Example:**
```
[2025-01-22 14:30:45.123] [info] [req_1737557445123_abc123]
Creating new user
File: src/services/user.service.ts
{ "phone": "+222123456789" }

[2025-01-22 14:30:45.456] [info] [req_1737557445123_abc123]
User created successfully
File: src/services/user.service.ts
{ "userId": "user_xyz789" }
```

---

## Swagger/OpenAPI Documentation

### Swagger Configuration

```typescript
// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tenmiye Community Management API',
      version: '1.0.0',
      description: 'Backend API for Tenmiye Community Management System - El Gheddiya, Teganet, Mauritania',
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
        url: 'http://localhost:3000',
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
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_123' },
            phone: { type: 'string', example: '+222123456789' },
            nameAr: { type: 'string', example: 'أحمد محمد' },
            nameFr: { type: 'string', example: 'Ahmed Mohamed' },
            status: { 
              type: 'string', 
              enum: ['active', 'pending', 'banned', 'inactive'],
              example: 'active',
            },
          },
        },
        Admin: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'admin_123' },
            email: { type: 'string', example: 'admin@tenmiye.mr' },
            displayName: { type: 'string', example: 'Ahmed Admin' },
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
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: {
              type: 'string',
              enum: ['contribution', 'donation', 'spending', 'transfer'],
            },
            amount: { type: 'number', example: 1000 },
            currency: { type: 'string', example: 'MRU' },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'reversed'],
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
            timestamp: { type: 'number', example: 1737557445123 },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Tenmiye API Docs',
  }));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at: http://localhost:3000/api-docs');
}
```

### Swagger Documentation Examples

```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - nameAr
 *               - password
 *               - deviceId
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+222123456789"
 *               nameAr:
 *                 type: string
 *                 example: "أحمد محمد"
 *               nameFr:
 *                 type: string
 *                 example: "Ahmed Mohamed"
 *               email:
 *                 type: string
 *                 example: "ahmed@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *               deviceId:
 *                 type: string
 *                 example: "device_abc123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+222123456789"
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

export default router;
```

---

## Development Workflow

### Daily Development Commands

```bash
# Start development server with hot reload
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Fix both linting and formatting
npm run format-fix

# Type check without building
npm run typecheck

# Run all validations (type check + lint + format check)
npm run validate

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start
```

### Pre-commit Hook (Husky + Lint-Staged)

```bash
# Install Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

**What happens on commit:**
1. ESLint automatically fixes issues
2. Prettier formats code
3. If there are unfixable errors, commit is blocked

---

## Architecture Patterns

### Layered Architecture

```
┌─────────────────────────────────────────┐
│  1. ROUTES (URL Mapping)                │
│     Define: POST /api/admin/auth/google │
├─────────────────────────────────────────┤
│  2. CONTROLLERS (Request/Response)      │
│     THIN: Parse request, call service,  │
│     format response                     │
├─────────────────────────────────────────┤
│  3. SERVICES (Business Logic)           │
│     FAT: All business rules here        │
│     Coordinate repositories             │
├─────────────────────────────────────────┤
│  4. REPOSITORIES (Data Access)          │
│     THIN: Abstract Firestore CRUD       │
│     Handle versioning                   │
├─────────────────────────────────────────┤
│  5. FIRESTORE (Database)                │
└─────────────────────────────────────────┘
```

### Repository Pattern

```typescript
// Base repository with common CRUD
export abstract class BaseRepository<T> {
  protected collection: CollectionReference;
  
  constructor(
    protected db: Firestore,
    protected collectionName: string
  ) {
    this.collection = db.collection(collectionName);
  }

  async findById(id: string): Promise<T | null> {
    const log = createLogger(__filename);
    log.debug('Finding document by ID', { collection: this.collectionName, id });
    
    const doc = await this.collection.doc(id).get();
    
    if (!doc.exists) {
      log.debug('Document not found', { id });
      return null;
    }
    
    return { id: doc.id, ...doc.data() } as T;
  }

  // ... other CRUD methods
}
```

### Service Layer

```typescript
// Services contain business logic
export class UserService {
  private log = createLogger(__filename);

  constructor(
    private userRepo: UserRepository,
    private userAuthRepo: UserAuthRepository,
    private eventService: EventService
  ) {}

  async createUser(input: CreateUserInput): Promise<User> {
    this.log.info('Creating new user', { phone: input.phone });

    // Business validation
    const existing = await this.userRepo.findByPhone(input.phone);
    if (existing) {
      this.log.warn('User already exists', { phone: input.phone });
      throw new Error('Phone number already registered');
    }

    // Hash password (security)
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // Create user (transaction for atomicity)
    const user = await this.userRepo.create({
      phone: input.phone,
      nameAr: input.nameAr,
      status: 'pending',
      // ...
    });

    // Store password separately (NOT in Firestore)
    await this.userAuthRepo.create({
      phone: input.phone,
      hashedPassword,
      // ...
    });

    // Event sourcing (audit trail)
    await this.eventService.recordEvent({
      eventType: 'user_joined',
      aggregateId: user.id,
      payload: { phone: user.phone },
    });

    this.log.info('User created successfully', { userId: user.id });
    return user;
  }
}
```

---

## Authentication Flow

### User Authentication (Phone + Password)

```typescript
// NO Firebase Auth - backend handles everything
POST /api/auth/login
{
  "phone": "+222123456789",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800,
    "user": { ... }
  }
}
```

### Admin Authentication (Google OAuth)

```typescript
// Frontend: Firebase Auth handles Google OAuth
// Backend: Verifies token, returns JWT

POST /api/admin/auth/google
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "admin": {
      "id": "firebase_uid",
      "email": "admin@tenmiye.mr",
      "approvalStatus": "approved"
    }
  }
}

// If new admin (not approved yet):
{
  "success": false,
  "message": "Admin pending approval"
}
```

---

## Error Handling

### Global Error Handler

```typescript
// src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId;

  // Log error with full context
  log.error('Request failed', error, {
    requestId,
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
      timestamp: Date.now(),
    });
    return;
  }

  if (error.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
      timestamp: Date.now(),
    });
    return;
  }

  // Default 500 error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : error.message,
    },
    timestamp: Date.now(),
  });
}
```

---

## Testing Strategy

### Unit Tests (70% of tests)

```typescript
// tests/unit/services/user.service.test.ts
import { UserService } from '../../../src/services/user.service';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepo = {
      findByPhone: jest.fn(),
      create: jest.fn(),
    } as any;

    userService = new UserService(mockUserRepo, ...);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockUserRepo.findByPhone.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({ id: '123', ... });

      const result = await userService.createUser({
        phone: '+222123456789',
        nameAr: 'أحمد',
        password: 'SecurePass123!',
      });

      expect(result.id).toBe('123');
      expect(mockUserRepo.create).toHaveBeenCalled();
    });

    it('should reject duplicate phone', async () => {
      mockUserRepo.findByPhone.mockResolvedValue({ id: '123' } as any);

      await expect(
        userService.createUser({ phone: '+222123456789', ... })
      ).rejects.toThrow('Phone number already registered');
    });
  });
});
```

### Integration Tests (20% of tests)

```typescript
// tests/integration/auth.integration.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('POST /api/auth/register', () => {
  it('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        phone: '+222123456789',
        nameAr: 'أحمد محمد',
        password: 'SecurePass123!',
        deviceId: 'device_123',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

---

## Coding Standards

### File Naming
```
kebab-case for files:
- admin-auth.controller.ts
- transaction.service.ts
- user.repository.ts
```

### Class/Interface Naming
```typescript
PascalCase for classes and interfaces:
- class AdminAuthController {}
- interface User {}
- type CreateUserInput = { ... }
```

### Function Naming
```typescript
camelCase for functions:
- async loginWithGoogle() {}
- function createLogger() {}
```

### Constants
```typescript
UPPER_SNAKE_CASE for constants:
- const MAX_LOGIN_ATTEMPTS = 5;
- const JWT_EXPIRY_HOURS = 24;
```

### Logging Standards

```typescript
// ALWAYS create logger at top of file
const log = createLogger(__filename);

// Log entry points (service methods)
log.info('Starting operation', { contextData });

// Log important state changes
log.info('State changed', { before, after });

// Log warnings for recoverable issues
log.warn('Potential issue detected', { details });

// Log errors with full context
try {
  // operation
} catch (error) {
  log.error('Operation failed', error as Error, { contextData });
  throw error;
}

// NEVER use console.log - ESLint will catch it
```

---

## Deployment Checklist

### Before Deployment

- [ ] Run `npm run validate` (type check + lint + format)
- [ ] Run `npm test` (all tests pass)
- [ ] Run `npm run build` (build succeeds)
- [ ] Update environment variables on server
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Test API with Swagger docs
- [ ] Check logs are working properly
- [ ] Verify error handling
- [ ] Test authentication flows

### Production Environment

```bash
# Build
npm run build

# Set NODE_ENV
export NODE_ENV=production

# Start with PM2
npm run start:prod

# View logs
pm2 logs tenmiye-backend

# Monitor
pm2 monit
```

---

## Key Principles

1. **Logging**: Every service method MUST log entry/exit with context
2. **Error Handling**: Always catch errors, log them, and throw appropriate HTTP errors
3. **Code Quality**: Run `npm run format-fix` before every commit
4. **Documentation**: Update Swagger docs when adding/changing endpoints
5. **Testing**: Write tests for business logic (services)
6. **Security**: Never log sensitive data (passwords, tokens)
7. **Performance**: Use Firestore batch operations when possible
8. **Consistency**: Follow the established patterns (Repository → Service → Controller)

---

## Common Commands Reference

```bash
# Development
npm run dev                 # Start dev server
npm run format-fix          # Fix all linting and formatting
npm run validate            # Check types, lint, format

# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:unit           # Unit tests only

# Documentation
npm run docs                # Open Swagger docs

# Production
npm run build               # Build TypeScript
npm start                   # Start production server
npm run start:prod          # Start with PM2
```

---

## Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Winston Docs**: https://github.com/winstonjs/winston
- **Swagger Docs**: https://swagger.io/docs/
- **ESLint Docs**: https://eslint.org/docs/
- **Prettier Docs**: https://prettier.io/docs/

---

**Remember:** 
- Keep controllers THIN (just request/response)
- Keep services FAT (all business logic here)
- Keep repositories THIN (just database operations)
- ALWAYS use logger (never console.log)
- ALWAYS document endpoints with Swagger
- ALWAYS run `npm run format-fix` before committing