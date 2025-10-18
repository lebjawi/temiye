# Architecture Diagrams

This document contains visual diagrams of the system architecture, domain relationships, and key workflows.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Request Flow Diagram](#request-flow-diagram)
3. [Domain Relationship Diagram](#domain-relationship-diagram)
4. [Authentication Flow](#authentication-flow)
5. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
6. [State Machine Diagrams](#state-machine-diagrams)
7. [Sequence Diagrams](#sequence-diagrams)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Angular)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Two Layouts (One App)                     │  │
│  │  ┌──────────────────────┐  ┌──────────────────────────┐ │  │
│  │  │   Main Layout (/)    │  │   Admin Layout (/admin)  │ │  │
│  │  │  - Community members │  │  - Admin dashboard      │ │  │
│  │  │  - Phone + Password  │  │  - Google OAuth        │ │  │
│  │  └──────────────────────┘  └──────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 11 Domain Services                        │  │
│  │  ┌─────────────────────────────────────────────────────┐│  │
│  │  │ User │ Role │ Tier │ Board │ Transaction │ Election││  │
│  │  │ Vote │ Announcement │ Admin │ Password Reset│ Const││  │
│  │  └─────────────────────────────────────────────────────┘│  │
│  │  ┌─────────────────────────────────────────────────────┐│  │
│  │  │ Each Domain: Controller → Service → Repository     ││  │
│  │  └─────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Firestore SDK
┌─────────────────────────────────────────────────────────────────┐
│                  Firebase Firestore (Database)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Collections: users, roles, tiers, boards, transactions │  │
│  │              elections, votes, announcements, admins,    │  │
│  │              password_reset_tokens, config              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagram

```
HTTP Request (e.g., POST /api/users)
           ↓
    Routes (user.routes.js)
           ↓
    Controller (user.controller.js)
       ├─ Parse request
       ├─ Extract data
       └─ Validate auth
           ↓
    DTO (CreateUserDTO)
       ├─ Validate shape
       ├─ Validate constraints
       └─ Transform data
           ↓
    Service (user.service.js)
       ├─ Business logic
       ├─ Check rules
       └─ Call repository
           ↓
    Entity (User.js)
       ├─ Domain validation
       └─ Business methods
           ↓
    Repository (user.repository.js)
       ├─ Build Firestore query
       └─ Execute
           ↓
    Firestore
       ├─ Store data
       └─ Return result
           ↓
    Repository → Entity transformation
           ↓
    Service → Return business object
           ↓
    Controller → Format HTTP response
           ↓
    HTTP Response (200, { success: true, data: {...} })
           ↓
    [If error anywhere]
           ↓
    Error Middleware
       ├─ Catch error
       ├─ Format error
       └─ Return error response
```

---

## Domain Relationship Diagram

```
┌─────────────┐
│   User      │ (identity, authentication)
└──────┬──────┘
       │
       ├─→ Role (what user can do)
       │
       ├─→ Tier (membership level)
       │
       ├─→ Transaction (financial records)
       │
       └─→ Announcement (notifications)

┌─────────────┐
│   Board     │ (organizational structure)
└──────┬──────┘
       │
       ├─→ User (members)
       │
       ├─→ Election (voting within board)
       │
       └─→ Announcement (board notifications)

┌─────────────┐
│  Election   │ (voting process)
└──────┬──────┘
       │
       ├─→ Board (which board)
       │
       ├─→ Vote (cast votes)
       │
       └─→ User (eligible voters)

┌─────────────┐
│   Vote      │ (individual vote)
└──────┬──────┘
       │
       ├─→ Election (which election)
       │
       └─→ User (who voted)

┌─────────────┐
│   Admin     │ (admin users)
└──────┬──────┘
       │
       └─→ User (optional, can also be user)

┌─────────────┐
│  Constants  │ (system config)
└─────────────┘
       ↑
       └─ Used by all domains

┌─────────────────────────┐
│  Password Reset Token   │ (temporary)
└──────┬──────────────────┘
       │
       └─→ User (password reset for)

┌──────────────┐
│  Role        │ (permission sets)
└──────┬───────┘
       │
       ├─→ User (assigned to users)
       └─→ Predefined roles (member, board, admin, superadmin)

┌──────────────┐
│  Tier        │ (membership levels)
└──────┬───────┘
       │
       └─→ User (assigned to users)
```

---

## Authentication Flow

### Main App (Phone + Password)

```
User enters phone + password
           ↓
     POST /api/users/login
           ↓
  UserService.loginUser()
           ↓
  Find user by phone
           ↓
  Compare password with bcrypt hash
           ↓
  Check user status = "active"
           ↓
  Generate JWT token (7-day expiry)
           ↓
  Return: { token, user }
           ↓
Frontend stores token in localStorage
           ↓
  Add token to Authorization header
           ↓
  All subsequent requests include token
           ↓
  Middleware verifies token
           ↓
  Request proceeds with userId
```

### Admin Dashboard (Firebase Google OAuth)

```
User clicks "Login with Google"
           ↓
Firebase Google OAuth flow
           ↓
User approves
           ↓
Firebase returns ID token
           ↓
Frontend sends token to backend
           ↓
POST /api/admins/login
           ↓
  AdminService finds admin by firebaseUid
           ↓
  Check admin status = "approved"
           ↓
  If pending: "Waiting for approval"
  If rejected: "Access denied"
  If approved: Generate backend JWT
           ↓
  Return: { token, admin }
           ↓
Frontend stores token
           ↓
Access admin dashboard
```

---

## Entity Relationship Diagram (ERD)

```
┌──────────────────┐
│     User         │
├──────────────────┤
│ id (PK)          │
│ phone (U)        │ ← Unique
│ name             │
│ passwordHash     │
│ role_id (FK)     │ ──→ Role
│ tier_id (FK)     │ ──→ Tier
│ status           │
│ createdAt        │
└──────────────────┘

┌──────────────────┐
│      Role        │
├──────────────────┤
│ id (PK)          │
│ name (U)         │
│ permissions []   │
│ level            │
└──────────────────┘

┌──────────────────┐
│      Tier        │
├──────────────────┤
│ id (PK)          │
│ name (U)         │
│ level            │
│ features []      │
└──────────────────┘

┌──────────────────────┐
│      Board           │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ parentBoardId (FK)   │ ──→ Board (self)
│ status               │
│ members []           │
│   - userId (FK)      │ ──→ User
│   - role             │
│   - joinedAt         │
└──────────────────────┘

┌──────────────────────┐
│    Transaction       │
├──────────────────────┤
│ id (PK)              │
│ userId (FK)          │ ──→ User
│ type                 │
│ amount               │
│ description          │
│ createdAt            │
│ deletedAt            │
└──────────────────────┘

┌──────────────────────┐
│     Election         │
├──────────────────────┤
│ id (PK)              │
│ boardId (FK)         │ ──→ Board
│ title                │
│ ballotType           │
│ candidates []        │
│ status               │
│ startDate            │
│ endDate              │
└──────────────────────┘

┌──────────────────────┐
│       Vote           │
├──────────────────────┤
│ id (PK)              │
│ electionId (FK)      │ ──→ Election
│ userId (FK)          │ ──→ User
│ choice               │
│ castAt               │
│ Unique(electionId,   │
│        userId)       │
└──────────────────────┘

┌──────────────────────┐
│   Announcement       │
├──────────────────────┤
│ id (PK)              │
│ title                │
│ content              │
│ author (FK)          │ ──→ User (admin)
│ isPinned             │
│ expiresAt            │
│ deletedAt            │
└──────────────────────┘

┌──────────────────────┐
│       Admin          │
├──────────────────────┤
│ id (PK)              │
│ email (U)            │
│ firebaseUid (U)      │
│ status               │
│ approvedBy (FK)      │ ──→ Admin (self)
│ approvedAt           │
└──────────────────────┘

┌──────────────────────┐
│  PasswordResetToken  │
├──────────────────────┤
│ id (PK)              │
│ phone                │
│ code                 │
│ expiresAt            │
│ isUsed               │
├──────────────────────┤
│ (temporary, 15 min)  │
└──────────────────────┘

┌──────────────────────┐
│     Constants        │
├──────────────────────┤
│ id = "settings"      │
│ voting {}            │
│ board {}             │
│ transaction {}       │
│ system {}            │
│ updatedAt            │
└──────────────────────┘
```

---

## State Machine Diagrams

### User Status

```
[Pending] ──approval──→ [Active] ←──reactivate──  [Inactive]
   ↑                        │                          ↓
   └──rejection──           │ ──deactivate──→
                            ↓
                        [Banned]
                         (final)
```

### Board Status

```
[Active] ──archive──→ [Archived]
   ↓                      ↑
   └──────restore────────┘

(Boards can have child boards - must archive children before parent)
```

### Election Status

```
[Created] ──start_voting──→ [Voting] ──close_voting──→ [Closed] ──archive──→ [Archived]
   ↓
   └─ Can edit until voting starts

[Voting]
   ↓
   └─ Voting window: startDate < now < endDate
   └─ Cannot edit during voting
```

### Admin Approval Status

```
[Pending] ──approve──→ [Approved]
   ↓
   └──reject──→ [Rejected] (terminal)

[Approved] ──only access here──→ Can login to admin dashboard
```

### Vote Recording

```
Election [Voting] ──cast vote──→ Vote [Recorded] (immutable)
   ↓                                 ↓
   └── Verify: user hasn't voted     └── Check uniqueness index
   └── Verify: user is eligible      └── One vote per user per election
```

---

## Sequence Diagrams

### User Registration & Login

```
User                   Frontend              Backend            Firestore
 │                        │                     │                   │
 │─1. Register───────────→│                     │                   │
 │                        │─2. POST /register──→│                   │
 │                        │                     │─3. Validate DTO  │
 │                        │                     │                   │
 │                        │                     │─4. Hash password │
 │                        │                     │                   │
 │                        │                     │─5. Create user───→│
 │                        │                     │                   │
 │                        │                     │←6. Success────────│
 │                        │←7. { status: pending, user }            │
 │                        │                                         │
 │ (Wait for approval)                                             │
 │                                                                  │
 │─8. Login──────────────→│                                        │
 │                        │─9. POST /login────→│                   │
 │                        │                     │─10. Find user────→│
 │                        │                     │←11. User data────│
 │                        │                     │                   │
 │                        │                     │─12. bcrypt.compare()
 │                        │                     │─13. Check status=active
 │                        │                     │─14. Generate JWT │
 │                        │                     │                   │
 │                        │←15. { token, user }                     │
 │                        │                     │                   │
 │←16. Success ──────────│                     │                   │
 │    Store token        │                     │                   │
```

### Create Transaction

```
Admin                  Frontend              Backend            Firestore
 │                        │                     │                   │
 │─1. Create trans.──────→│                     │                   │
 │    amount: 50000       │─2. POST /trans.────→│                   │
 │                        │                     │─3. Validate DTO  │
 │                        │                     │                   │
 │                        │                     │─4. Get Constants─→│
 │                        │                     │←5. min/max amounts
 │                        │                     │                   │
 │                        │                     │─6. Find user─────→│
 │                        │                     │←7. User exists───│
 │                        │                     │                   │
 │                        │                     │─8. Create txn────→│
 │                        │                     │                   │
 │                        │                     │←9. Success────────│
 │                        │←10. { txn }                             │
 │                        │                     │                   │
 │←11. Transaction saved │                     │                   │
 │   (immutable, can't   │                     │                   │
 │    edit or delete)    │                     │                   │
```

### Cast Vote in Election

```
Voter                  Frontend              Backend           Firestore
 │                        │                     │                  │
 │─1. View election──────→│                    │                   │
 │                        │─2. GET /election──→│                   │
 │                        │                     │─3. Find election─→│
 │                        │                     │←4. Election data──│
 │                        │←5. Display ballot  │                   │
 │                        │                    │                   │
 │─6. Cast vote──────────→│                    │                   │
 │    choice: candidate_1 │─7. POST /vote─────→│                   │
 │                        │                    │─8. Validate DTO  │
 │                        │                    │                   │
 │                        │                    │─9. Verify voting open
 │                        │                    │─10. Find user────→│
 │                        │                    │←11. User data────│
 │                        │                    │                   │
 │                        │                    │─12. Check not voted
 │                        │                    │   Query: (elec_id, │
 │                        │                    │    user_id)       │
 │                        │                    │←13. Not found ✓   │
 │                        │                    │                   │
 │                        │                    │─14. Create vote───→│
 │                        │                    │                   │
 │                        │                    │←15. Success────────│
 │                        │←16. { vote }                            │
 │                        │                    │                   │
 │←17. "Vote recorded"    │                    │                   │
 │    (immutable)         │                    │                   │
```

### Approve New Admin

```
SuperAdmin             Frontend              Backend           Firestore
 │                        │                     │                  │
 │─1. Check pending───────→│                    │                  │
 │    approvals           │─2. GET /pending───→│                  │
 │                        │                     │─3. Query pending─→│
 │                        │                     │←4. Pending admins─│
 │                        │←5. List pending    │                  │
 │                        │                    │                  │
 │─6. Approve admin──────→│                    │                  │
 │    adminId: admin_123  │─7. POST /approve──→│                  │
 │                        │                     │─8. Validate DTO  │
 │                        │                     │─9. Check is pending
 │                        │                     │─10. Find admin───→│
 │                        │                     │←11. Admin pending─│
 │                        │                     │                  │
 │                        │                     │─12. Update status→│
 │                        │                     │   status='approved'
 │                        │                     │                  │
 │                        │                     │←13. Success────────│
 │                        │←14. { admin }                           │
 │                        │                    │                  │
 │←15. "Admin approved"   │                    │                  │
 │    Can now login       │                    │                  │
```

---

## Data Flow for Complex Operations

### Complete Election Flow

```
1. Create Election
   Board Owner → Backend → Create election (status=created)

2. Add Candidates
   Board Owner → Backend → Update election candidates

3. Start Voting
   Board Owner → Backend → Transition election to voting status
   (Voting window now open based on startDate/endDate)

4. Users Vote
   Voter A → Backend → Cast vote for candidate_1
   Voter B → Backend → Cast vote for candidate_2
   Voter C → Backend → Cast vote for candidate_1
   (Each vote recorded immutably)

5. Close Voting
   Board Owner → Backend → Close election (status=closed)
   (Cannot vote after this)

6. View Results
   Anyone → Backend → GET /election/:id/results
   (Aggregate votes by candidate)

7. Archive Election
   Board Owner → Backend → Archive election (status=archived)
   (Locked for reference)
```

---

## Caching Strategy

```
┌─────────────────────────────┐
│   Constants Domain          │
├─────────────────────────────┤
│ 1. Get all constants        │
│ 2. Check if cached          │
│ 3. Return from cache        │
│ 4. On update: invalidate    │
│ 5. Next read: load fresh    │
└─────────────────────────────┘
     ↓         ↑
  Fresh    Invalidate
  read     on write
     │         │
     ↓         ↑
┌─────────────────────────────┐
│   In-memory Cache           │
│   { voting: {...},          │
│     board: {...},           │
│     ... }                   │
└─────────────────────────────┘
     ↓         ↑
  Cache    Load from
  miss     Firestore
     │         │
     ↓         ↑
┌─────────────────────────────┐
│   Firestore Collection      │
│   /config/settings          │
└─────────────────────────────┘
```

---

## Error Flow

```
Request → Controller
           ↓
        DTO Validation
           ↓
     [ERROR] ──→ ValidationError
                     ↓
                 Error Middleware
                     ↓
        Response: 400 + error message

        ────────────────────────────

Request → Controller
           ↓
        DTO Validation ✓
           ↓
        Service Business Logic
           ↓
     [ERROR] ──→ ConflictError / NotFoundError
                     ↓
                 Error Middleware
                     ↓
        Response: 409/404 + error message

        ────────────────────────────

Request → Controller
           ↓
        DTO Validation ✓
           ↓
        Service ✓
           ↓
        Repository
           ↓
        Firestore
           ↓
     [ERROR] ──→ FirestoreError
                     ↓
                 Error Middleware
                     ↓
        Response: 500 + "Database error"
```

---

## Summary

This DDD architecture provides:
- ✅ Clear separation of concerns (Controller → Service → Repository)
- ✅ Domain isolation (each domain self-contained)
- ✅ Type safety (DTOs + Entities)
- ✅ Scalability (add domains without touching others)
- ✅ Testability (mock at each layer)
- ✅ Maintainability (business logic grouped by domain)

