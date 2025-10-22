# Tenmiye Backend Implementation Plan

**Project**: Tenmiye Community Management System Backend
**Status**: 🚧 In Progress
**Started**: 2025-01-21
**Last Updated**: 2025-01-21

---

## 📊 Overall Progress

- [ ] Phase 1: Project Setup & Configuration (0/9)
- [ ] Phase 2: Core Configuration Files (0/4)
- [ ] Phase 3: Utilities & Middleware (0/10)
- [ ] Phase 4: Base Repository Pattern (0/2)
- [ ] Phase 5: Admin Authentication (0/5)
- [ ] Phase 6: User Authentication (0/7)
- [ ] Phase 7: Core Features (0/6)
- [ ] Phase 8: Express App Setup (0/3)
- [ ] Phase 9: Postman Collection (0/3)

**Total Progress**: 0/49 tasks completed (0%)

---

## ⚙️ Configuration Decisions

### Confirmed Settings:
- ✅ **JWT Secret**: Auto-generated strong random secret (64 chars)
- ✅ **Port**: 8080
- ✅ **CORS Origins**: `http://localhost:4200` (documented for updates)
- ✅ **Bcrypt Rounds**: 12
- ✅ **Rate Limiting**: 100 requests per 15 minutes (900000ms window)

### Firebase Configuration (from .env):
- ✅ **Project ID**: `tenmiye-gdy`
- ✅ **Storage Bucket**: `tenmiye-gdy.firebasestorage.app`
- ✅ **Service Account Email**: `firebase-adminsdk-fbsvc@tenmiye-gdy.iam.gserviceaccount.com`
- ✅ **Private Key**: Available in .env

---

## 📋 Phase 1: Project Setup & Configuration

**Status**: ⏳ Pending User Validation
**Progress**: 0/9 tasks

### Tasks:
- [ ] 1.1 Create `backend/` folder structure
- [ ] 1.2 Initialize `package.json` with all dependencies
- [ ] 1.3 Configure TypeScript (`tsconfig.json`)
- [ ] 1.4 Set up ESLint (`.eslintrc.js`)
- [ ] 1.5 Set up Prettier (`.prettierrc`)
- [ ] 1.6 Configure Nodemon (`nodemon.json`)
- [ ] 1.7 Configure Jest (`jest.config.js`)
- [ ] 1.8 Create `.env.example` template
- [ ] 1.9 Set up `.gitignore`

### Deliverables:
```
backend/
├── src/
│   ├── config/
│   ├── types/
│   ├── repositories/
│   ├── services/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── validators/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── logs/
├── postman/
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── nodemon.json
├── jest.config.js
├── .env.example
└── .gitignore
```

---

## 📋 Phase 2: Core Configuration Files

**Status**: ⏳ Not Started
**Progress**: 0/4 tasks

### Tasks:
- [ ] 2.1 **Firebase Admin SDK** (`src/config/firebase.ts`)
  - Initialize Firebase Admin
  - Export Firestore, Auth, Storage
  - File upload helper functions

- [ ] 2.2 **Winston Logger** (`src/config/logger.ts`)
  - Custom 4-line format
  - Console transport (development)
  - Daily rotate file transport
  - Error-only log file

- [ ] 2.3 **Database Connection** (`src/config/database.ts`)
  - Firestore connection
  - Health check function

- [ ] 2.4 **Swagger/OpenAPI** (`src/config/swagger.ts`)
  - Swagger UI setup
  - API documentation structure
  - Schema definitions

### Key Features:
- Winston log format:
  ```
  [TIMESTAMP] [LEVEL] [REQUEST_ID]
  MESSAGE
  File: RELATIVE_PATH
  { metadata }
  ```

---

## 📋 Phase 3: Utilities & Middleware

**Status**: ⏳ Not Started
**Progress**: 0/10 tasks

### Tasks:
- [ ] 3.1 **Logger Utilities** (`src/utils/logger.utils.ts`)
  - `createLogger()` function
  - `getRelativeFilePath()` helper
  - Request logger middleware

- [ ] 3.2 **JWT Utilities** (`src/utils/jwt.utils.ts`)
  - Token generation
  - Token verification
  - Token refresh logic

- [ ] 3.3 **Crypto Utilities** (`src/utils/crypto.utils.ts`)
  - Password hashing (bcrypt)
  - Password verification
  - Random token generation

- [ ] 3.4 **Storage Utilities** (`src/utils/storage.utils.ts`)
  - File upload to Cloud Storage
  - File deletion
  - URL generation

- [ ] 3.5 **Authentication Middleware** (`src/middleware/authenticate.ts`)
  - JWT verification
  - User/Admin extraction
  - Token refresh handling

- [ ] 3.6 **Authorization Middleware** (`src/middleware/authorize.ts`)
  - Permission checking
  - Role-based access control
  - Admin type validation

- [ ] 3.7 **Error Handler** (`src/middleware/error-handler.ts`)
  - Global error handler
  - Error response formatting
  - Error logging

- [ ] 3.8 **Request Logger** (`src/middleware/logger.ts`)
  - Request logging
  - Response logging
  - Request ID generation

- [ ] 3.9 **Rate Limiter** (`src/middleware/rate-limit.ts`)
  - Rate limiting (100 req/15min)
  - Configurable windows
  - IP-based limiting

- [ ] 3.10 **Validation Middleware** (`src/middleware/validate.ts`)
  - Express-validator integration
  - Validation error formatting

---

## 📋 Phase 4: Base Repository Pattern

**Status**: ⏳ Not Started
**Progress**: 0/2 tasks

### Tasks:
- [ ] 4.1 **Base Repository** (`src/repositories/base.repository.ts`)
  - Generic CRUD operations
  - Optimistic concurrency control
  - Version management
  - Batch operations

- [ ] 4.2 **Type Definitions** (`src/types/index.ts`)
  - Copy from root `types.ts`
  - Add any additional backend-specific types

### Key Features:
- `findById(id: string)`
- `findMany(query, limit, offset)`
- `create(data)`
- `update(id, data, version)`
- `delete(id)`
- `batchCreate(items[])`
- `batchUpdate(items[])`

---

## 📋 Phase 5: Admin Authentication (First Feature)

**Status**: ⏳ Not Started
**Progress**: 0/5 tasks

### Tasks:
- [ ] 5.1 **Admin Repository** (`src/repositories/admin.repository.ts`)
  - Extends BaseRepository
  - `findByEmail(email)`
  - `findPendingAdmins()`
  - `findByAdminType(type)`

- [ ] 5.2 **Admin Service** (`src/services/admin.service.ts`)
  - `getOrCreateAdmin(googleData)` - Create pending admin
  - `approveAdmin(adminId, adminType, approvedBy)`
  - `suspendAdmin(adminId, reason)`
  - `listPendingAdmins()`
  - `updatePermissions(adminId, permissions)`

- [ ] 5.3 **Admin Auth Controller** (`src/controllers/admin-auth.controller.ts`)
  - `loginWithGoogle(req, res)` - POST /api/admin/auth/google
  - `getCurrentAdmin(req, res)` - GET /api/admin/auth/me
  - `logout(req, res)` - POST /api/admin/auth/logout

- [ ] 5.4 **Admin Auth Routes** (`src/routes/admin-auth.routes.ts`)
  - POST /api/admin/auth/google
  - GET /api/admin/auth/me
  - POST /api/admin/auth/logout
  - GET /api/admin/pending (super admin only)
  - POST /api/admin/:id/approve (super admin only)
  - POST /api/admin/:id/suspend (super admin only)

- [ ] 5.5 **Admin Validators** (`src/validators/admin.validator.ts`)
  - Google token validation
  - Admin approval validation
  - Permission validation

### Swagger Documentation:
- ✅ Full OpenAPI annotations
- ✅ Request/response examples
- ✅ Authentication requirements

---

## 📋 Phase 6: User Authentication

**Status**: ⏳ Not Started
**Progress**: 0/7 tasks

### Tasks:
- [ ] 6.1 **User Repository** (`src/repositories/user.repository.ts`)
  - `findByPhone(phone)`
  - `findByEmail(email)`
  - `updateStatus(userId, status)`
  - `addDevice(userId, device)`

- [ ] 6.2 **User Auth Repository** (`src/repositories/user-auth.repository.ts`)
  - **CRITICAL**: Password storage SEPARATE from Firestore
  - `createAuth(phone, hashedPassword, salt)`
  - `findAuthByPhone(phone)`
  - `updatePassword(phone, hashedPassword)`
  - `incrementFailedAttempts(phone)`
  - `resetFailedAttempts(phone)`
  - `lockAccount(phone, until)`

- [ ] 6.3 **User Service** (`src/services/user.service.ts`)
  - `createUser(data)` - User registration
  - `updateUser(userId, data)`
  - `getUserById(userId)`
  - `approveUser(userId)` - Admin approval
  - `banUser(userId, reason)`

- [ ] 6.4 **Auth Service** (`src/services/auth.service.ts`)
  - `register(phone, password, name, deviceId)`
  - `login(phone, password, deviceId)`
  - `logout(userId, deviceId)`
  - `refreshToken(token)`
  - `changePassword(userId, oldPassword, newPassword)`
  - `resetPassword(phone, code, newPassword)`

- [ ] 6.5 **Auth Controller** (`src/controllers/auth.controller.ts`)
  - `register(req, res)` - POST /api/auth/register
  - `login(req, res)` - POST /api/auth/login
  - `logout(req, res)` - POST /api/auth/logout
  - `getCurrentUser(req, res)` - GET /api/auth/me
  - `changePassword(req, res)` - POST /api/auth/change-password

- [ ] 6.6 **Auth Routes** (`src/routes/auth.routes.ts`)
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me
  - POST /api/auth/change-password
  - POST /api/auth/forgot-password
  - POST /api/auth/reset-password

- [ ] 6.7 **Auth Validators** (`src/validators/auth.validator.ts`)
  - Phone number validation (Mauritanian format)
  - Password strength validation
  - Device ID validation

### Security Requirements:
- ✅ Passwords NEVER in Firestore
- ✅ Bcrypt hashing (12 rounds)
- ✅ Account lockout after 5 failed attempts
- ✅ 30-minute lockout duration
- ✅ Password history (prevent reuse)

---

## 📋 Phase 7: Core Features

**Status**: ⏳ Not Started
**Progress**: 0/6 tasks

### Tasks:
- [ ] 7.1 **Transaction System**
  - Repository: `src/repositories/transaction.repository.ts`
  - Account Repository: `src/repositories/account.repository.ts`
  - Service: `src/services/transaction.service.ts`
  - Controller: `src/controllers/transaction.controller.ts`
  - Routes: `src/routes/transaction.routes.ts`
  - **CRITICAL**: Double-entry bookkeeping with ACID guarantees
  - **CRITICAL**: Idempotency keys for all transactions

- [ ] 7.2 **Election System**
  - Repository: `src/repositories/election.repository.ts`
  - Vote Repository: `src/repositories/vote.repository.ts`
  - Service: `src/services/election.service.ts`
  - Controller: `src/controllers/election.controller.ts`
  - Routes: `src/routes/election.routes.ts`
  - **CRITICAL**: Deterministic vote IDs (`${electionId}_${voterId}`)
  - **CRITICAL**: Vote integrity and anonymity

- [ ] 7.3 **Announcement System**
  - Repository: `src/repositories/announcement.repository.ts`
  - Service: `src/services/announcement.service.ts`
  - Controller: `src/controllers/announcement.controller.ts`
  - Routes: `src/routes/announcement.routes.ts`
  - Approval workflow: draft → pending → published

- [ ] 7.4 **Board Management**
  - Repository: `src/repositories/board.repository.ts`
  - Service: `src/services/board.service.ts`
  - Controller: `src/controllers/board.controller.ts`
  - Routes: `src/routes/board.routes.ts`

- [ ] 7.5 **Role & Tier Management**
  - Role Repository: `src/repositories/role.repository.ts`
  - Tier Repository: `src/repositories/tier.repository.ts`
  - Service: `src/services/role.service.ts`
  - Service: `src/services/tier.service.ts`
  - Controllers and Routes

- [ ] 7.6 **Event Sourcing**
  - Repository: `src/repositories/event.repository.ts`
  - Service: `src/services/event.service.ts`
  - Audit logging for all critical operations

---

## 📋 Phase 8: Express App Setup

**Status**: ⏳ Not Started
**Progress**: 0/3 tasks

### Tasks:
- [ ] 8.1 **Route Aggregator** (`src/routes/index.ts`)
  - Import all route modules
  - Mount routes with prefixes
  - Health check endpoint

- [ ] 8.2 **Express App** (`src/app.ts`)
  - Express initialization
  - Middleware setup (cors, helmet, compression)
  - Route mounting
  - Error handler
  - Swagger UI

- [ ] 8.3 **Server Entry Point** (`src/server.ts`)
  - Load environment variables
  - Start Express server
  - Graceful shutdown
  - Database connection check

### Endpoints Structure:
```
/api/health              - Health check
/api/admin/auth/*        - Admin authentication
/api/auth/*              - User authentication
/api/users/*             - User management
/api/transactions/*      - Financial transactions
/api/elections/*         - Elections & voting
/api/announcements/*     - Announcements
/api/boards/*            - Board management
/api/roles/*             - Role management
/api/tiers/*             - Tier management
/api-docs                - Swagger UI
/api-docs.json           - OpenAPI JSON
```

---

## 📋 Phase 9: Postman Collection

**Status**: ⏳ Not Started
**Progress**: 0/3 tasks

### Tasks:
- [ ] 9.1 **Postman Environment** (`postman/Tenmiye.postman_environment.json`)
  - Variables: baseUrl, token, adminToken
  - Firebase configuration

- [ ] 9.2 **Postman Collection** (`postman/Tenmiye.postman_collection.json`)
  - All endpoints organized by feature
  - Pre-request scripts for authentication
  - Tests for response validation
  - Example requests with sample data

- [ ] 9.3 **Postman README** (`postman/README.md`)
  - Import instructions
  - Environment setup
  - Usage guide

### Collection Structure:
```
Tenmiye API
├── Admin Auth
│   ├── Google Login
│   ├── Get Current Admin
│   ├── List Pending Admins
│   ├── Approve Admin
│   └── Suspend Admin
├── User Auth
│   ├── Register
│   ├── Login
│   ├── Get Current User
│   └── Change Password
├── Transactions
│   ├── Create Transaction
│   ├── List Transactions
│   ├── Get Transaction
│   └── Approve Transaction (Admin)
├── Elections
│   ├── Create Election (Admin)
│   ├── List Elections
│   ├── Cast Vote
│   └── Get Results
├── Announcements
│   ├── Create Announcement
│   ├── List Announcements
│   └── Publish (Admin)
└── Boards
    ├── Create Board
    ├── List Boards
    └── Add Member
```

---

## 🧪 Testing Strategy

### Unit Tests (70% coverage target):
- All service methods
- All repository methods
- All utility functions
- Middleware functions

### Integration Tests (20% coverage target):
- Authentication flows
- Transaction creation
- Election voting
- API endpoints

### E2E Tests (10% coverage target):
- Complete user registration → login → transaction
- Admin approval workflow
- Election creation → voting → results

---

## 📚 Documentation Requirements

### Code Documentation:
- ✅ JSDoc on all public methods
- ✅ Inline comments for complex logic
- ✅ Swagger annotations on all endpoints
- ✅ README with setup instructions

### API Documentation:
- ✅ Swagger UI at `/api-docs`
- ✅ Request/response examples
- ✅ Authentication requirements
- ✅ Error response formats

---

## 🔒 Security Checklist

- [ ] Passwords NEVER in Firestore (separate storage)
- [ ] JWT tokens with expiry
- [ ] Admin approval workflow
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all endpoints
- [ ] CORS configured properly
- [ ] Helmet security headers
- [ ] SQL injection prevention (N/A - NoSQL)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Environment variables for secrets
- [ ] Firestore security rules deployed

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] PM2 ecosystem file created
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Error tracking configured
- [ ] SSL/TLS certificates
- [ ] Domain configured
- [ ] Backup strategy in place

---

## 📝 Notes & Decisions Log

### 2025-01-21:
- ✅ Confirmed JWT secret will be auto-generated (64 chars)
- ✅ Confirmed port: 8080
- ✅ Confirmed CORS: `http://localhost:4200` (documented for updates)
- ✅ Confirmed bcrypt rounds: 12
- ✅ Confirmed rate limiting: 100 req/15min
- ✅ Winston chosen for logging (as per CLAUDE.md)
- ✅ Swagger UI Express for API documentation

### Future Considerations:
- SMS provider integration (Twilio/Africa Talking/Masrvi)
- Email service integration
- Real-time notifications
- Analytics tracking
- Backup automation

---

## 🎯 Success Criteria

### Phase Completion:
- ✅ All tasks in phase completed
- ✅ Code passes ESLint + Prettier
- ✅ TypeScript compiles without errors
- ✅ Unit tests written and passing
- ✅ Swagger documentation complete
- ✅ User validation received

### Project Completion:
- ✅ All 9 phases completed
- ✅ Postman collection working
- ✅ Test coverage > 70%
- ✅ Documentation complete
- ✅ Security checklist passed
- ✅ Deployment checklist ready

---

**Last Updated**: 2025-01-21 by Claude Code AI
**Next Update**: After Phase 1 completion
