# Tenmiye Backend - Folder Structure
## Architecture Pattern: Layered Service-Oriented Monolith

---

## 🏗️ Architecture Pattern Explanation

We're using a **Layered Service-Oriented Monolith** architecture, which is perfect for your scale (1000 users, can grow to 10,000+).

### Why This Pattern?

**From "Designing Data-Intensive Applications" (Chapter 4, Pages 136-140):**
- ✅ **Simple to understand** - Clear separation of concerns
- ✅ **Easy to maintain** - One codebase, one deployment
- ✅ **Cost-effective** - No microservices overhead
- ✅ **Fast development** - No distributed systems complexity
- ✅ **Testable** - Each layer can be tested independently
- ✅ **Scalable enough** - Handles 10K+ users easily

### The Layers (Top to Bottom):

```
┌─────────────────────────────────────────┐
│  1. ROUTES                              │  ← HTTP endpoint definitions
│     Define: POST /api/admin/auth/google │
├─────────────────────────────────────────┤
│  2. CONTROLLERS                         │  ← Request/Response handling
│     Parse request → Call service → Format response │
├─────────────────────────────────────────┤
│  3. SERVICES                            │  ← Business logic (FAT LAYER)
│     Transactions, Elections, Auth logic │
│     Coordinate multiple repositories    │
├─────────────────────────────────────────┤
│  4. REPOSITORIES                        │  ← Data access (Firestore CRUD)
│     Abstract Firestore operations       │
│     Handle version control              │
├─────────────────────────────────────────┤
│  5. DATABASE (Firestore)                │  ← Data storage
└─────────────────────────────────────────┘
```

### Key Principles:

1. **Separation of Concerns**: Each layer has one responsibility
2. **Dependency Direction**: Top → Down (Routes depend on Controllers, Controllers depend on Services, etc.)
3. **Fat Services, Thin Controllers**: Business logic lives in services, not controllers
4. **Repository Pattern**: Abstract data access for testability
5. **Single Responsibility**: Each file/class does one thing well

---

## 📁 Complete Folder Structure

```
tenmiye-backend/
│
├── src/                                    # Source code
│   │
│   ├── config/                            # Configuration files
│   │   ├── firebase.ts                    # Firebase Admin SDK initialization
│   │   ├── database.ts                    # Firestore connection setup
│   │   ├── storage.ts                     # Cloud Storage setup
│   │   └── environment.ts                 # Environment variables validation
│   │
│   ├── types/                             # TypeScript type definitions
│   │   └── index.ts                       # Shared types (User, Admin, Transaction, etc.)
│   │
│   ├── constants/                         # Application constants
│   │   ├── permissions.ts                 # Permission definitions
│   │   ├── error-codes.ts                 # Error code constants
│   │   └── validation-rules.ts            # Validation constants
│   │
│   ├── repositories/                      # DATA ACCESS LAYER (Firestore CRUD)
│   │   │                                  # Pattern: Repository Pattern (Page 70)
│   │   │                                  # Purpose: Abstract database operations
│   │   │
│   │   ├── base.repository.ts             # Base repository with common CRUD
│   │   ├── user.repository.ts             # User data access
│   │   ├── user-auth.repository.ts        # User password storage (secure)
│   │   ├── admin.repository.ts            # Admin data access
│   │   ├── role.repository.ts             # Roles data access
│   │   ├── tier.repository.ts             # Membership tiers
│   │   ├── board.repository.ts            # Boards data access
│   │   ├── account.repository.ts          # Financial accounts
│   │   ├── transaction.repository.ts      # Transactions with version control
│   │   ├── announcement.repository.ts     # Announcements
│   │   ├── election.repository.ts         # Elections
│   │   ├── vote.repository.ts             # Votes (with deterministic IDs)
│   │   ├── event.repository.ts            # Event sourcing events
│   │   ├── admin-action.repository.ts     # Admin audit trail
│   │   ├── metrics.repository.ts          # System metrics
│   │   └── config.repository.ts           # System configuration
│   │
│   ├── services/                          # BUSINESS LOGIC LAYER (FAT LAYER)
│   │   │                                  # Pattern: Service Layer (Page 136)
│   │   │                                  # Purpose: Orchestrate business operations
│   │   │
│   │   ├── auth.service.ts                # Authentication logic
│   │   │   # - loginUser() - Phone + password auth
│   │   │   # - loginAdmin() - Google OAuth verification
│   │   │   # - generateToken() - JWT creation
│   │   │   # - verifyToken() - JWT verification
│   │   │
│   │   ├── user.service.ts                # User management
│   │   │   # - createUser() - Register new user
│   │   │   # - authenticate() - Verify password
│   │   │   # - updateProfile()
│   │   │   # - changePassword()
│   │   │   # - banUser() - Admin action
│   │   │
│   │   ├── admin.service.ts               # Admin management
│   │   │   # - getOrCreateAdmin() - Google auth handler
│   │   │   # - approveAdmin() - Super admin approval
│   │   │   # - suspendAdmin() - Suspend admin
│   │   │   # - updateLastLogin()
│   │   │   # - getPermissionsForType()
│   │   │
│   │   ├── transaction.service.ts         # Financial transactions
│   │   │   # Pattern: Unit of Work (Page 228)
│   │   │   # - createContribution() - With double-entry
│   │   │   # - createSpending() - Board spending
│   │   │   # - completeTransaction() - Admin approval
│   │   │   # - reverseTransaction() - Compensating transaction
│   │   │   # - getAccountBalance()
│   │   │
│   │   ├── election.service.ts            # Election management
│   │   │   # Pattern: Strong Consistency (Pages 251-260)
│   │   │   # - createElection()
│   │   │   # - castVote() - With idempotency
│   │   │   # - closeElection()
│   │   │   # - computeResults() - CQRS pattern
│   │   │
│   │   ├── announcement.service.ts        # Announcements
│   │   │   # - create() - Draft/pending
│   │   │   # - publish() - Admin approval
│   │   │   # - update() - Author edits
│   │   │
│   │   ├── board.service.ts               # Board management
│   │   │   # - createBoard()
│   │   │   # - addMember()
│   │   │   # - removeMember()
│   │   │   # - updateBoardMetrics()
│   │   │
│   │   ├── event.service.ts               # Event sourcing
│   │   │   # Pattern: Event Sourcing (Pages 457-462)
│   │   │   # - recordEvent() - Immutable events
│   │   │   # - rebuildAggregateState() - Event replay
│   │   │   # - getEventsForAggregate()
│   │   │
│   │   ├── notification.service.ts        # Notifications (future)
│   │   │   # - sendNotification()
│   │   │   # - markAsRead()
│   │   │
│   │   ├── storage.service.ts             # Cloud Storage operations
│   │   │   # - uploadFile() - Receipts, photos
│   │   │   # - deleteFile()
│   │   │   # - getSignedUrl()
│   │   │
│   │   ├── analytics.service.ts           # Analytics and reports
│   │   │   # Pattern: Pre-computed Aggregates (Page 97)
│   │   │   # - computeDailyMetrics()
│   │   │   # - getUserContributionReport()
│   │   │   # - getBoardFinancialReport()
│   │   │
│   │   └── sms.service.ts                 # SMS/WhatsApp (future)
│   │       # - sendSMS() - Password reset codes
│   │       # - sendWhatsApp()
│   │
│   ├── controllers/                       # REQUEST/RESPONSE LAYER (THIN LAYER)
│   │   │                                  # Purpose: Parse request → Call service → Format response
│   │   │                                  # Rule: NO business logic here!
│   │   │
│   │   ├── auth.controller.ts             # Auth endpoints
│   │   │   # POST /api/auth/register
│   │   │   # POST /api/auth/login
│   │   │   # POST /api/auth/logout
│   │   │   # POST /api/auth/refresh
│   │   │
│   │   ├── admin-auth.controller.ts       # Admin auth endpoints
│   │   │   # POST /api/admin/auth/google
│   │   │   # POST /api/admin/auth/logout
│   │   │   # GET  /api/admin/auth/me
│   │   │
│   │   ├── admin.controller.ts            # Admin management endpoints
│   │   │   # GET  /api/admin (list all)
│   │   │   # GET  /api/admin/pending (pending approvals)
│   │   │   # POST /api/admin/:id/approve
│   │   │   # POST /api/admin/:id/suspend
│   │   │   # POST /api/admin/:id/reactivate
│   │   │
│   │   ├── user.controller.ts             # User endpoints
│   │   │   # GET  /api/users/me
│   │   │   # PUT  /api/users/me
│   │   │   # POST /api/users/me/password
│   │   │   # GET  /api/users (admin only)
│   │   │
│   │   ├── transaction.controller.ts      # Transaction endpoints
│   │   │   # POST /api/transactions
│   │   │   # GET  /api/transactions
│   │   │   # GET  /api/transactions/:id
│   │   │   # POST /api/transactions/:id/approve (admin)
│   │   │   # POST /api/transactions/:id/reverse (admin)
│   │   │
│   │   ├── election.controller.ts         # Election endpoints
│   │   │   # POST /api/elections (admin)
│   │   │   # GET  /api/elections
│   │   │   # GET  /api/elections/:id
│   │   │   # POST /api/elections/:id/vote
│   │   │   # POST /api/elections/:id/close (admin)
│   │   │   # GET  /api/elections/:id/results
│   │   │
│   │   ├── announcement.controller.ts     # Announcement endpoints
│   │   │   # POST /api/announcements
│   │   │   # GET  /api/announcements
│   │   │   # GET  /api/announcements/:slug
│   │   │   # PUT  /api/announcements/:id
│   │   │   # POST /api/announcements/:id/publish (admin)
│   │   │   # DELETE /api/announcements/:id (admin)
│   │   │
│   │   ├── board.controller.ts            # Board endpoints
│   │   │   # POST /api/boards (admin)
│   │   │   # GET  /api/boards
│   │   │   # GET  /api/boards/:id
│   │   │   # PUT  /api/boards/:id (admin)
│   │   │   # POST /api/boards/:id/members (admin)
│   │   │   # DELETE /api/boards/:id/members/:userId (admin)
│   │   │
│   │   └── analytics.controller.ts        # Analytics endpoints
│   │       # GET  /api/analytics/metrics
│   │       # GET  /api/analytics/contributions
│   │       # GET  /api/analytics/boards
│   │
│   ├── middleware/                        # Express middleware
│   │   │
│   │   ├── authenticate.ts                # JWT verification
│   │   │   # verifyToken() - Check JWT validity
│   │   │   # attachUser() - Add user to request
│   │   │
│   │   ├── authorize.ts                   # Permission checks
│   │   │   # requireAdmin() - Admin only routes
│   │   │   # requirePermission() - Specific permissions
│   │   │   # requireSuperAdmin() - Super admin only
│   │   │
│   │   ├── validate.ts                    # Input validation
│   │   │   # validateBody() - Validate request body
│   │   │   # validateParams() - Validate URL params
│   │   │   # validateQuery() - Validate query strings
│   │   │
│   │   ├── error-handler.ts               # Global error handling
│   │   │   # Pattern: Centralized error handling
│   │   │   # Log errors + format response
│   │   │
│   │   ├── rate-limit.ts                  # Rate limiting
│   │   │   # Pattern: Brute force protection (Page 330)
│   │   │   # Limit login attempts
│   │   │
│   │   ├── logger.ts                      # Request logging
│   │   │   # Log all requests/responses
│   │   │   # Performance monitoring
│   │   │
│   │   ├── cors.ts                        # CORS configuration
│   │   │   # Configure allowed origins
│   │   │
│   │   └── upload.ts                      # File upload handling
│   │       # Parse multipart/form-data
│   │       # Validate file types/sizes
│   │
│   ├── validators/                        # Input validation schemas
│   │   │                                  # Pattern: Input validation at boundary
│   │   │
│   │   ├── auth.validator.ts              # Auth input validation
│   │   ├── user.validator.ts              # User input validation
│   │   ├── admin.validator.ts             # Admin input validation
│   │   ├── transaction.validator.ts       # Transaction validation
│   │   ├── election.validator.ts          # Election validation
│   │   ├── announcement.validator.ts      # Announcement validation
│   │   └── board.validator.ts             # Board validation
│   │
│   ├── utils/                             # Utility functions
│   │   │
│   │   ├── jwt.utils.ts                   # JWT helpers
│   │   │   # generateToken()
│   │   │   # verifyToken()
│   │   │   # decodeToken()
│   │   │
│   │   ├── crypto.utils.ts                # Cryptography
│   │   │   # hashPassword() - bcrypt
│   │   │   # comparePassword()
│   │   │   # generateResetToken()
│   │   │
│   │   ├── date.utils.ts                  # Date helpers
│   │   │   # formatDate()
│   │   │   # getMonthKey() - YYYY-MM
│   │   │   # isDateInRange()
│   │   │
│   │   ├── pagination.utils.ts            # Pagination helpers
│   │   │   # getPaginationParams()
│   │   │   # formatPaginatedResponse()
│   │   │
│   │   ├── validation.utils.ts            # Common validators
│   │   │   # isValidPhone()
│   │   │   # isValidEmail()
│   │   │   # sanitizeInput()
│   │   │
│   │   ├── error.utils.ts                 # Custom error classes
│   │   │   # AppError
│   │   │   # ValidationError
│   │   │   # AuthenticationError
│   │   │   # AuthorizationError
│   │   │
│   │   └── response.utils.ts              # Response formatters
│   │       # successResponse()
│   │       # errorResponse()
│   │
│   ├── routes/                            # Route definitions
│   │   │                                  # Purpose: Map URLs to controllers
│   │   │
│   │   ├── index.ts                       # Route aggregator (combines all routes)
│   │   ├── auth.routes.ts                 # /api/auth/*
│   │   ├── admin-auth.routes.ts           # /api/admin/auth/*
│   │   ├── admin.routes.ts                # /api/admin/*
│   │   ├── user.routes.ts                 # /api/users/*
│   │   ├── transaction.routes.ts          # /api/transactions/*
│   │   ├── election.routes.ts             # /api/elections/*
│   │   ├── announcement.routes.ts         # /api/announcements/*
│   │   ├── board.routes.ts                # /api/boards/*
│   │   └── analytics.routes.ts            # /api/analytics/*
│   │
│   ├── jobs/                              # Background jobs (optional for now)
│   │   │                                  # Pattern: Batch processing (Page 402)
│   │   │                                  # Run via cron or Cloud Scheduler
│   │   │
│   │   ├── daily-metrics.job.ts           # Compute daily analytics
│   │   ├── reminder.job.ts                # Send payment reminders
│   │   ├── cleanup.job.ts                 # Clean expired tokens
│   │   └── index.ts                       # Job runner
│   │
│   ├── app.ts                             # Express app setup
│   │   # Configure middleware
│   │   # Mount routes
│   │   # Error handling
│   │
│   └── server.ts                          # Server entry point
│       # Start HTTP server
│       # Graceful shutdown
│
├── tests/                                 # Test files
│   │
│   ├── unit/                              # Unit tests (70% of tests)
│   │   ├── services/                      # Test services
│   │   │   ├── auth.service.test.ts
│   │   │   ├── transaction.service.test.ts
│   │   │   └── election.service.test.ts
│   │   │
│   │   ├── repositories/                  # Test repositories
│   │   │   └── user.repository.test.ts
│   │   │
│   │   └── utils/                         # Test utilities
│   │       └── jwt.utils.test.ts
│   │
│   ├── integration/                       # Integration tests (20% of tests)
│   │   ├── auth.integration.test.ts       # Test full auth flow
│   │   ├── transaction.integration.test.ts
│   │   └── election.integration.test.ts
│   │
│   ├── e2e/                               # End-to-end tests (10% of tests)
│   │   ├── user-journey.test.ts           # Full user flows
│   │   └── admin-workflow.test.ts         # Full admin workflows
│   │
│   ├── fixtures/                          # Test data
│   │   ├── users.fixture.ts
│   │   ├── admins.fixture.ts
│   │   └── transactions.fixture.ts
│   │
│   └── helpers/                           # Test helpers
│       ├── setup.ts                       # Test setup
│       └── teardown.ts                    # Test cleanup
│
├── scripts/                               # Utility scripts
│   │
│   ├── seed-database.ts                   # Seed initial data
│   │   # Create default roles, tiers
│   │   # Create first super admin
│   │   # Create system config
│   │
│   ├── migrate-data.ts                    # Data migrations
│   ├── backup-firestore.ts                # Backup script
│   └── deploy.sh                          # Deployment script
│
├── docs/                                  # Documentation
│   │
│   ├── API.md                             # API documentation
│   ├── SETUP.md                           # Setup instructions
│   ├── DEPLOYMENT.md                      # Deployment guide
│   └── ARCHITECTURE.md                    # Architecture details
│
├── .env.example                           # Example environment variables
├── .env                                   # Environment variables (gitignored)
├── .gitignore                             # Git ignore file
├── .eslintrc.js                           # ESLint configuration
├── .prettierrc                            # Prettier configuration
├── tsconfig.json                          # TypeScript configuration
├── package.json                           # NPM dependencies
├── package-lock.json                      # Dependency lock file
├── jest.config.js                         # Jest test configuration
├── nodemon.json                           # Nodemon configuration
└── README.md                              # Project readme
```

---

## 📊 File Count by Layer

```
Repositories:  ~15 files   (Data access)
Services:      ~12 files   (Business logic - MOST IMPORTANT)
Controllers:   ~9 files    (Request handlers)
Middleware:    ~8 files    (Cross-cutting concerns)
Routes:        ~9 files    (URL mapping)
Utils:         ~7 files    (Helpers)
Validators:    ~7 files    (Input validation)
Tests:         ~15+ files  (Quality assurance)

Total: ~80-100 files
```

---

## 🎯 Key Files to Focus On First

When starting implementation, focus on these files in order:

### Week 1: Foundation
1. `src/config/firebase.ts` - Firebase setup
2. `src/types/index.ts` - Type definitions
3. `src/repositories/base.repository.ts` - Base CRUD
4. `src/utils/jwt.utils.ts` - JWT handling
5. `src/middleware/authenticate.ts` - Auth middleware

### Week 2: Admin Auth
6. `src/repositories/admin.repository.ts`
7. `src/services/admin.service.ts`
8. `src/controllers/admin-auth.controller.ts`
9. `src/routes/admin-auth.routes.ts`

### Week 3: User Auth
10. `src/repositories/user.repository.ts`
11. `src/repositories/user-auth.repository.ts`
12. `src/services/user.service.ts`
13. `src/services/auth.service.ts`
14. `src/controllers/auth.controller.ts`

### Week 4: Financial Core
15. `src/repositories/account.repository.ts`
16. `src/repositories/transaction.repository.ts`
17. `src/services/transaction.service.ts` - **MOST CRITICAL FILE**
18. `src/controllers/transaction.controller.ts`

---

## 🔄 Request Flow Example

**Example: Admin Google Sign-in**

```
1. POST /api/admin/auth/google
   ↓
2. src/routes/admin-auth.routes.ts
   # Maps URL to controller
   ↓
3. src/middleware/validate.ts
   # Validates { idToken: string }
   ↓
4. src/controllers/admin-auth.controller.ts
   # Parses request
   # Calls adminService.loginWithGoogle()
   ↓
5. src/services/admin.service.ts
   # Verifies Firebase token
   # Calls adminRepo.findById()
   # Calls adminRepo.create() if new
   # Checks approval status
   ↓
6. src/repositories/admin.repository.ts
   # Firestore: db.collection('admins').doc(uid).get()
   # Returns admin data
   ↓
7. src/utils/jwt.utils.ts
   # Generates YOUR JWT token
   ↓
8. Back to controller
   # Formats response: { success: true, data: { token, admin } }
   ↓
9. Response sent to client
```

---

## 💡 Architecture Benefits

### Why This Structure Works:

1. **Clear Separation** - Each layer has one job
2. **Easy Testing** - Mock one layer, test another
3. **Maintainable** - Find files intuitively
4. **Scalable** - Add features without refactoring
5. **Team-Friendly** - Multiple devs can work simultaneously

### When to Evolve:

**Stay monolithic until:**
- ❌ 10,000+ users → Consider splitting
- ❌ Multiple teams → Consider microservices
- ❌ Different scaling needs → Consider splitting services

**For now:** This structure is perfect. Don't over-engineer.

---

## 📝 Naming Conventions

```typescript
// Files: kebab-case
admin-auth.controller.ts
transaction.service.ts

// Classes: PascalCase
class AdminAuthController {}
class TransactionService {}

// Functions: camelCase
async loginWithGoogle() {}
async createTransaction() {}

// Constants: UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 5;
const JWT_EXPIRY_HOURS = 24;

// Interfaces: PascalCase
interface User {}
interface Transaction {}
```

---

## ✅ Summary

This folder structure implements:
- ✅ **Layered Architecture** - Clear separation of concerns
- ✅ **Repository Pattern** - Abstract data access
- ✅ **Service Layer** - Centralized business logic
- ✅ **Dependency Injection** - Services receive dependencies
- ✅ **Single Responsibility** - Each file does one thing
- ✅ **Testability** - Easy to mock and test

**Perfect for 1000 users, scales to 10,000+ without major refactoring.**

Start with the core files, build incrementally, and you'll have a maintainable system that serves your community well! 🚀