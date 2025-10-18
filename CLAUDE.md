# Tenmiye App Development Plan

> **Focus**: Business logic first, UI second
> **Architecture**: Two Angular Apps → Express Backend → Firebase Firestore
> **Cost Strategy**: Dual authentication for budget optimization

This document tracks the development roadmap for the Tenmiye Community Management System. We prioritize robust backend logic and data models before building the user interface.

## Project Overview

**Tenmiye** is a community management system for El Gheddiya, Teganet, Mauritania. It is **one Angular application** with **two distinct layouts**:

### 📱 Main Layout (/)
- **For**: Community members
- **Access**: Direct URL access (plain URL)
- **Auth**: Phone number + plain text password (self-service signup)
- **Cost**: No Firebase Auth service costs (custom auth in Express)
- **Data Access**: Limited UI based on user permissions
- **Pages**: Login, Dashboard, Profile, Transactions, Announcements, Elections, Voting

### 🔐 Admin Layout (/admin)
- **For**: Leadership board members
- **Access**: Route to `/admin` with secret knowledge
- **Auth**: Firebase Google Authentication (email-based)
- **Cost**: Uses Firebase free tier (up to 50K users)
- **Workflow**: Admin approval required before first login
- **Data Access**: Full management capabilities
- **Pages**: Admin Login, Dashboard, User Management, Role/Tier Management, Board Management, Approvals Queue, Analytics, Settings

**Tech Stack**:
- **Frontend**: Angular 18 (Single app with two layouts)
  - Components: .html, .scss, .ts files per component
  - Two layout components: MainLayout, AdminLayout
  - Separate pages for each layout (main/ and admin/)
  - Two route guards: MainLayoutGuard, AdminLayoutGuard
  - Two auth services: AuthService (phone), FirebaseAuthService (OAuth)
  - Routing determines which layout to render based on path
- **Backend**: Node.js + Express (Controller-based CRUD)
  - One controller per collection
  - Single shared API for both layouts
  - Middleware validates both auth types (custom + Firebase)
- **Database**: Firebase Firestore (single instance, shared between layouts)
- **Authentication Dual Strategy**:
  - **Main Layout**: Custom phone + password (bcrypt hashing) - NO Firebase Auth costs
  - **Admin Layout**: Firebase Google Authentication - Uses free tier
  - **Guard Logic**: Separate guards check auth type and redirect to appropriate login
- **Language**: TypeScript (full stack)

---

## Development Phases

### Phase 1: Core Data & Business Logic ⏳ (CURRENT)

#### 1.1 Express Backend - Core Controllers
- [ ] UserController (CRUD + custom auth for main app)
- [ ] RoleController (CRUD)
- [ ] TierController (CRUD)
- [ ] BoardController (CRUD)
- [ ] TransactionController (CRUD)
- [ ] ElectionController (CRUD)
- [ ] VoteController (CRUD)
- [ ] AnnouncementController (CRUD)
- [ ] AdminController (CRUD + approval workflow)
- [ ] PasswordResetController (Send reset codes)

#### 1.2 Authentication Backend Logic
- [ ] **Main App Auth**: Phone + password custom auth in Express
  - [ ] bcrypt password hashing (10 rounds)
  - [ ] Login endpoint returns JWT token
  - [ ] Register endpoint validates phone format
  - [ ] Password recovery code generation
- [ ] **Admin Dashboard Auth**: Firebase Google OAuth integration
  - [ ] Firebase Admin SDK initialization
  - [ ] Approval workflow: Check admin approval status
  - [ ] Superadmin can approve new admins
  - [ ] Only approved admins can login

#### 1.3 Data Validation & Rules
- [ ] User validation (phone format: +222XXXXXXXX, password strength)
- [ ] Transaction validation (amount > 0, type required, references valid)
- [ ] Election constraint enforcement (one vote per member)
- [ ] Board hierarchy validation
- [ ] Admin approval status validation
- [ ] Role-based permission checks

#### 1.4 Firestore Security Rules
- [ ] **Public Data**: Announcements readable by all authenticated users
- [ ] **User Data**: Each user can only read/edit their own profile
- [ ] **Main App Users**: Restricted by role permissions via Firestore rules
- [ ] **Admin Data**: Only superadmins can read/modify admin collection
- [ ] **Transaction Data**: Financial records restricted by role
- [ ] **Vote Data**: One-vote-per-election enforcement via rules
- [ ] **Board Data**: Members visible based on board permissions

#### 1.5 Business Logic Utilities
- [ ] Password hashing & verification (bcrypt)
- [ ] Permission checker utility (role-based)
- [ ] Vote uniqueness validator
- [ ] Transaction type router
- [ ] Board hierarchy resolver
- [ ] Admin approval status checker
- [ ] JWT token generation & verification

### Phase 2: Frontend - Single Angular App with Two Layouts (After Phase 1)

#### 2.1 Layout Components (Base Templates)
- [ ] MainLayout component (community member layout)
  - Header with user menu
  - Sidebar with main nav
  - Footer
- [ ] AdminLayout component (admin dashboard layout)
  - Header with admin user menu
  - Sidebar with admin nav
  - Footer

#### 2.2 Main Layout Pages (Community Members)
- [ ] src/app/pages/main/login/ (phone + password form)
- [ ] src/app/pages/main/register/ (self-service signup)
- [ ] src/app/pages/main/password-reset/
- [ ] src/app/pages/main/dashboard/ (role-based limited view)
- [ ] src/app/pages/main/profile/ (my profile page)
- [ ] src/app/pages/main/transactions/ (my contributions view)
- [ ] src/app/pages/main/announcements/ (announcements feed)
- [ ] src/app/pages/main/elections/ (view elections)
- [ ] src/app/pages/main/voting/ (cast vote)

#### 2.3 Admin Layout Pages (Leadership Board)
- [ ] src/app/pages/admin/login/ (Google OAuth login)
- [ ] src/app/pages/admin/dashboard/ (overview & analytics)
- [ ] src/app/pages/admin/users-management/ (CRUD users)
- [ ] src/app/pages/admin/roles-management/ (CRUD roles)
- [ ] src/app/pages/admin/tiers-management/ (CRUD tiers)
- [ ] src/app/pages/admin/boards-management/ (CRUD boards)
- [ ] src/app/pages/admin/approvals-queue/ (approve new admins)
- [ ] src/app/pages/admin/transactions-management/ (view/manage all transactions)
- [ ] src/app/pages/admin/elections-management/ (create/manage elections)
- [ ] src/app/pages/admin/analytics/ (detailed reporting)
- [ ] src/app/pages/admin/settings/ (system configuration)

#### 2.4 Services & Guards (Shared)
- [ ] AuthService (phone + password for main layout)
- [ ] FirebaseAuthService (Google OAuth for admin layout)
- [ ] MainLayoutGuard (protect main layout routes)
- [ ] AdminLayoutGuard (protect admin layout routes)
- [ ] HTTP/API service (calls Express backend)
- [ ] User service
- [ ] Role service
- [ ] Board service
- [ ] Transaction service
- [ ] Announcement service
- [ ] Election service
- [ ] Admin service

#### 2.5 Routing Setup
- [ ] Configure app.routes.ts with:
  - Main layout routes (/)
  - Admin layout routes (/admin)
  - MainLayoutGuard protection
  - AdminLayoutGuard protection
  - Redirect logic between layouts

---

## Known Constraints & TODOs

### Authentication & Security
1. **Admin Approval**: Initial superadmin must be created manually in Firestore
   - Set `approvalStatus: 'approved'` for first superadmin
   - All other admins require superadmin approval before login
2. **Dual Auth Strategy**: Express backend validates both:
   - Main app: Phone + password via bcrypt
   - Admin: Firebase token from Google OAuth
3. **JWT Tokens**: Main app uses JWT for session management (no Firebase sessions)

### Data Integrity
4. **Vote Uniqueness**: Implement compound index on (electionRef, voterRef) in Firestore
5. **User Status Flow**: Document state transitions (pending → active → inactive/banned)
6. **Board Status Management**: Handle cascade when boards transition to archived
7. **Admin Status Flow**: pending → approved/rejected (only approved can login)

### Integration & Connectivity
8. **Password Recovery**: SMS/WhatsApp integration for reset codes (Twilio or similar)
9. **Offline Support**: Design sync strategy for desert connectivity
   - Main app: Service Workers for offline read caching
   - Admin: Less critical, but consider offline editing queue

### Cost Optimization
10. **Free Tier Limits**: Monitor Firestore usage
    - Main app: Direct reads/writes (no backend service costs)
    - Admin: Firebase Auth free tier includes up to 50,000 users
11. **Express Backend**: Host on cloud run or self-hosted VM (watch quota usage)

---

## File Structure (To Be Created)

### Frontend (Angular - Single App, Two Layouts)
```
src/
├── app/
│   ├── layouts/                          # Layout components
│   │   ├── main-layout/
│   │   │   ├── main-layout.component.ts
│   │   │   ├── main-layout.component.html
│   │   │   └── main-layout.component.scss
│   │   └── admin-layout/
│   │       ├── admin-layout.component.ts
│   │       ├── admin-layout.component.html
│   │       └── admin-layout.component.scss
│   │
│   ├── pages/
│   │   ├── main/                        # Community member pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── password-reset/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── transactions/
│   │   │   ├── announcements/
│   │   │   ├── elections/
│   │   │   └── voting/
│   │   │
│   │   └── admin/                       # Admin pages
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── users-management/
│   │       ├── roles-management/
│   │       ├── tiers-management/
│   │       ├── boards-management/
│   │       ├── approvals-queue/
│   │       ├── transactions-management/
│   │       ├── elections-management/
│   │       ├── analytics/
│   │       └── settings/
│   │
│   ├── components/                      # Shared components
│   │   ├── header/
│   │   ├── footer/
│   │   ├── sidebar/
│   │   ├── forms/
│   │   └── shared-ui/
│   │
│   ├── services/
│   │   ├── api.service.ts               # HTTP calls to Express backend
│   │   ├── auth.service.ts              # Phone + password auth (main layout)
│   │   ├── firebase-auth.service.ts     # Google OAuth auth (admin layout)
│   │   ├── user.service.ts
│   │   ├── role.service.ts
│   │   ├── board.service.ts
│   │   ├── transaction.service.ts
│   │   ├── election.service.ts
│   │   ├── announcement.service.ts
│   │   └── admin.service.ts
│   │
│   ├── guards/
│   │   ├── main-layout.guard.ts         # Protect main layout routes
│   │   └── admin-layout.guard.ts        # Protect admin layout routes
│   │
│   ├── interceptors/
│   │   └── error.interceptor.ts         # Global error handling
│   │
│   ├── app.config.ts                    # Angular config
│   └── app.routes.ts                    # Route definitions (main + admin)
│
├── main.ts                              # App bootstrap
└── styles/
    ├── global.scss
    ├── main-layout.scss
    └── admin-layout.scss
```

### Backend (Express)
```
backend/
├── src/
│   ├── controllers/
│   │   ├── user.controller.ts           # User CRUD
│   │   ├── role.controller.ts           # Role CRUD
│   │   ├── board.controller.ts          # Board CRUD
│   │   ├── transaction.controller.ts    # Transaction CRUD
│   │   ├── election.controller.ts       # Election CRUD
│   │   ├── vote.controller.ts           # Vote CRUD
│   │   ├── announcement.controller.ts   # Announcement CRUD
│   │   └── password-reset.controller.ts # Password recovery
│   ├── middleware/
│   │   ├── auth.middleware.ts           # Token verification
│   │   ├── error.middleware.ts          # Error handling
│   │   └── validation.middleware.ts     # Request validation
│   ├── services/
│   │   ├── firebase.service.ts          # Firestore operations
│   │   ├── permission.service.ts        # Permission checking
│   │   └── validation.service.ts        # Business logic validation
│   ├── routes/
│   │   ├── users.routes.ts
│   │   ├── roles.routes.ts
│   │   ├── boards.routes.ts
│   │   ├── transactions.routes.ts
│   │   ├── elections.routes.ts
│   │   ├── votes.routes.ts
│   │   ├── announcements.routes.ts
│   │   └── password-reset.routes.ts
│   ├── utils/
│   │   ├── password-hash.util.ts        # Hash & verify passwords
│   │   ├── validators.util.ts           # Data validators
│   │   └── error-handler.util.ts        # Error handling
│   └── app.ts                           # Express app
├── .env                                 # Firebase credentials
└── package.json
```

---

## Testing Strategy

- [ ] Unit tests for all services
- [ ] Permission logic tests
- [ ] Vote validation tests
- [ ] Transaction logic tests
- [ ] Firestore security rules testing

---

## Notes

- **Arabic First**: UI will be Arabic-primary with French as secondary
- **Mobile-First**: Design for mobile accessibility
- **Offline Capability**: Plan for unreliable desert connectivity
- **Security**: Hash all passwords, never store plain text credentials
- **Audit Trail**: Log all financial transactions and votes

---

## Last Updated

October 16, 2025 - Updated with dual-application architecture and two-tier authentication strategy
