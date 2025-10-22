# Prompt for Claude Code AI - Tenmiye Backend Implementation

---

## 📋 Simple Prompt (Copy & Paste to Claude Code AI)

```
I need you to implement a Node.js + TypeScript + Express backend for a community management system.

ARCHITECTURE:
- Layered Service-Oriented Monolith
- Layers: Routes → Controllers → Services → Repositories → Firestore
- Pattern: Repository Pattern for data access, Service Layer for business logic

FIREBASE STACK (MINIMAL - ONLY 4 SERVICES):
1. Firestore - Database (simple CRUD operations)
2. Cloud Storage - File uploads
3. Firebase Authentication - ONLY for admin Google sign-in
4. Service Account - Backend access
❌ NO Cloud Functions
❌ NO event listeners
❌ Simple request-response API

AUTHENTICATION:
1. Regular Users: Phone + Password (stored securely in backend, NOT Firestore)
2. Admins: Google OAuth via Firebase Auth
   - Frontend gets Firebase ID token
   - Sends to: POST /api/admin/auth/google { idToken }
   - Backend verifies token, creates/updates admin in Firestore admins collection
   - Backend returns JWT token for app usage
   - NO Cloud Functions, simple HTTP request-response

DATA MODELS:
I have a complete types.ts file with these main entities:
- User (phone, nameAr, roleId, tierId, status)
- Admin (Firebase UID, email, adminType, permissions, approvalStatus)
- Transaction (double-entry bookkeeping: debits[], credits[], idempotencyKey)
- Election (candidates[], votes, results)
- Board (members[], treasury)
- Announcement (status workflow: draft → pending → published)

CRITICAL REQUIREMENTS:
1. User passwords NEVER stored in Firestore (separate secure backend storage)
2. Transactions use double-entry bookkeeping with ACID guarantees
3. Admin approval workflow (new admins start as 'pending')
4. Optimistic concurrency control with version numbers
5. Idempotency keys for financial transactions
6. Deterministic vote IDs to prevent duplicates (${electionId}_${voterId})

FOLDER STRUCTURE:
src/
├── config/          # Firebase Admin SDK setup
├── types/           # TypeScript interfaces
├── repositories/    # Firestore CRUD (thin layer)
├── services/        # Business logic (fat layer)
├── controllers/     # HTTP handlers (thin layer)
├── middleware/      # Auth, validation, errors
├── routes/          # URL mapping
├── utils/           # JWT, crypto, helpers
├── app.ts           # Express setup
└── server.ts        # Entry point

IMPLEMENTATION PRIORITIES:
Phase 1: Setup (Start Here)
1. Initialize Node.js + TypeScript project
2. Set up Firebase Admin SDK
3. Create base repository pattern
4. Implement JWT utilities

Phase 2: Admin Authentication
1. POST /api/admin/auth/google - Verify Firebase token, return JWT
2. Admin repository and service
3. Admin approval workflow

Phase 3: User Authentication  
1. POST /api/auth/register - Phone + password
2. POST /api/auth/login - Verify credentials
3. Secure password storage (bcrypt, separate from Firestore)

Phase 4: Core Features
1. Transactions with double-entry bookkeeping
2. Elections with vote integrity
3. Announcements with approval workflow

ENVIRONMENT VARIABLES NEEDED:
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- FIREBASE_STORAGE_BUCKET
- JWT_SECRET
- BCRYPT_ROUNDS=12

KEY ENDPOINTS TO IMPLEMENT:
# Admin Auth
POST   /api/admin/auth/google
GET    /api/admin/auth/me

# Admin Management (Super Admin only)
GET    /api/admin/pending
POST   /api/admin/:id/approve
POST   /api/admin/:id/suspend

# User Auth
POST   /api/auth/register
POST   /api/auth/login

# Transactions
POST   /api/transactions
GET    /api/transactions
POST   /api/transactions/:id/approve (admin)

# Elections
POST   /api/elections (admin)
POST   /api/elections/:id/vote
GET    /api/elections/:id/results

TESTING:
- Unit tests for services (business logic)
- Integration tests for API endpoints
- Focus on transaction integrity and vote security

START WITH:
1. Create project structure
2. Set up Firebase Admin SDK in src/config/firebase.ts
3. Implement base repository in src/repositories/base.repository.ts
4. Build admin authentication flow first (it's the simplest)
5. Then add user authentication
6. Then financial transactions (most critical)

Please implement this step by step, starting with Phase 1, and make sure to follow the layered architecture pattern strictly.
```

---

## 🎯 Alternative: Super Simple Prompt (If Above is Too Long)

```
Build a Node.js + TypeScript + Express backend with:

1. FIREBASE (4 services only):
   - Firestore (database)
   - Cloud Storage (files)
   - Firebase Auth (admin Google sign-in only)
   - Service Account

2. ARCHITECTURE:
   - Layers: Routes → Controllers → Services → Repositories → Firestore
   - Repository pattern for data access
   - Services contain business logic

3. AUTH:
   - Users: Phone + password (passwords NOT in Firestore)
   - Admins: Google OAuth → verify token → return JWT
   - Admin approval workflow (new admins = 'pending')

4. KEY FEATURES:
   - Transactions with double-entry bookkeeping
   - Elections with deterministic vote IDs
   - Admin approval workflows

5. START WITH:
   - Project setup + TypeScript
   - Firebase Admin SDK config
   - Base repository pattern
   - Admin Google authentication (POST /api/admin/auth/google)

Follow layered architecture: thin controllers, fat services, thin repositories.
Implement step by step starting with admin auth.
```

---

## 📝 Even Simpler: "Just Get Started" Prompt

```
Create a Node.js + TypeScript + Express backend for a community management system.

Firebase stack:
- Firestore for database
- Firebase Auth for admin Google login only
- Cloud Storage for files

Architecture:
- Layered: Routes → Controllers → Services → Repositories
- Repository pattern for Firestore access
- Services have business logic

Start by implementing:
1. Project setup with TypeScript
2. Firebase Admin SDK initialization
3. Admin Google authentication endpoint: POST /api/admin/auth/google
   - Verify Firebase token
   - Create/update admin in Firestore
   - Return JWT token

Then build:
- User phone/password authentication
- Transaction management with double-entry bookkeeping
- Election voting system

Use proper folder structure with src/config, src/services, src/repositories, src/controllers, src/routes.
```

---

## 💡 Pro Tips for Claude Code AI

### 1. **Upload These Files First:**
- Upload `types.ts` → Claude will know all your data models
- Upload `firestore.rules` → Claude will understand security model
- Upload `BACKEND_FOLDER_STRUCTURE.md` → Claude will know the structure

### 2. **Ask Step by Step:**
Instead of one big prompt, break it down:

**Step 1:**
```
Set up the project structure for a Node.js + TypeScript + Express backend.
Use this folder structure: [paste folder structure from BACKEND_FOLDER_STRUCTURE.md]
Include package.json with all dependencies.
```

**Step 2:**
```
Implement Firebase Admin SDK setup in src/config/firebase.ts
Use environment variables for credentials.
Export db (Firestore), auth, and storage.
```

**Step 3:**
```
Create base repository pattern in src/repositories/base.repository.ts
Include: findById, create, update, delete, findMany
Use optimistic concurrency control with version numbers.
```

**Step 4:**
```
Implement admin Google authentication:
1. src/repositories/admin.repository.ts
2. src/services/admin.service.ts (with getOrCreateAdmin method)
3. src/controllers/admin-auth.controller.ts
4. POST /api/admin/auth/google endpoint

Admin workflow: New admins start as 'pending', super admin must approve.
```

### 3. **Provide Context:**
```
I'm building this for a 1000-user community in Mauritania.
Cost is important ($8/month Firebase target).
Security is critical (financial transactions involved).
Follow patterns from "Designing Data-Intensive Applications" book.
```

---

## 🎯 Recommended Approach with Claude Code AI

### Option A: Start from Scratch
```
Create a complete Node.js + TypeScript + Express backend following this architecture:
[Upload BACKEND_FOLDER_STRUCTURE.md]
[Upload types.ts]

Start with Phase 1: Project setup and Firebase configuration.
Then implement admin Google authentication.
Use layered architecture: Routes → Controllers → Services → Repositories.
```

### Option B: Implement Feature by Feature
```
I need to implement admin Google authentication for my backend.

Stack: Node.js + TypeScript + Express + Firestore

Flow:
1. Frontend sends Firebase ID token to POST /api/admin/auth/google
2. Backend verifies token with Firebase Admin SDK
3. Backend checks/creates admin in Firestore admins collection
4. Backend returns JWT token

Implement:
- src/repositories/admin.repository.ts
- src/services/admin.service.ts
- src/controllers/admin-auth.controller.ts
- src/routes/admin-auth.routes.ts

Admin approval workflow: New admins start with approvalStatus='pending'.
```

### Option C: "Build Everything" (Most Complete)
```
Build a production-ready Node.js + TypeScript + Express backend.

[Upload ALL these files:]
- types.ts
- BACKEND_FOLDER_STRUCTURE.md
- BACKEND_ARCHITECTURE.md
- firestore.rules

Requirements:
1. Minimal Firebase stack (Firestore + Storage + Auth for admins)
2. Layered architecture (Repository pattern + Service layer)
3. Admin Google OAuth authentication
4. User phone/password authentication
5. Transaction system with double-entry bookkeeping
6. Election voting system

Start with project setup, then admin auth, then build features incrementally.
Follow the folder structure exactly as specified.
```

---

## ✅ Best Prompt (Recommended - Copy This)

```
I need to build a Node.js + TypeScript + Express backend for a community management system (1000 users, Mauritania).

MINIMAL FIREBASE STACK (4 services only):
✅ Firestore - database
✅ Cloud Storage - files
✅ Firebase Auth - admin Google sign-in ONLY
✅ Service Account - backend access
❌ NO Cloud Functions, NO event listeners

ARCHITECTURE PATTERN:
Layered Service-Oriented Monolith
Routes → Controllers (thin) → Services (fat) → Repositories (thin) → Firestore

AUTHENTICATION:
1. Users: Phone + password (bcrypt, NOT stored in Firestore)
2. Admins: Google OAuth
   - Frontend: POST /api/admin/auth/google { idToken }
   - Backend: Verify token → Check/create admin in Firestore → Return JWT
   - Approval workflow: New admins = 'pending'

I will upload:
- types.ts (all data models)
- BACKEND_FOLDER_STRUCTURE.md (project structure)
- firestore.rules (security rules)

Please implement step by step:

PHASE 1 - SETUP:
1. Initialize project with TypeScript + Express
2. Create folder structure as specified
3. Set up Firebase Admin SDK (src/config/firebase.ts)
4. Create base repository (src/repositories/base.repository.ts)

PHASE 2 - ADMIN AUTH:
1. Admin repository (src/repositories/admin.repository.ts)
2. Admin service with getOrCreateAdmin() (src/services/admin.service.ts)
3. Admin auth controller (src/controllers/admin-auth.controller.ts)
4. Route: POST /api/admin/auth/google
5. Approval workflow: GET /api/admin/pending, POST /api/admin/:id/approve

PHASE 3 - USER AUTH:
1. User + UserAuth repositories (passwords separate from Firestore)
2. User service with authentication
3. Auth controller
4. Routes: POST /api/auth/register, POST /api/auth/login

PHASE 4 - CORE FEATURES:
1. Transaction service (double-entry bookkeeping, idempotency)
2. Election service (deterministic vote IDs)
3. Announcement service (approval workflow)

Start with Phase 1. Use environment variables for Firebase credentials.
Follow the folder structure exactly. Keep controllers thin, services fat.
```

---

## 📌 Summary

**Use the "Best Prompt" above** - it's comprehensive but clear.

**Upload these 3 files to Claude Code AI:**
1. types.ts
2. BACKEND_FOLDER_STRUCTURE.md  
3. firestore.rules

Then Claude Code AI will have all the context it needs to build your backend correctly! 🚀