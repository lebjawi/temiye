# Architecture Documentation

Welcome to the Tenmiye App Backend Architecture Documentation!

This folder contains comprehensive documentation for implementing the backend using **Domain-Driven Design (DDD)** with a **three-tier layered architecture** (Controller → Service → Repository).

---

## 📋 Quick Navigation

### Start Here
- **[ddd.md](./ddd.md)** - General DDD architecture principles, patterns, and guidelines

### Architecture Diagrams
- **[diagrams.md](./diagrams.md)** - Visual diagrams (system architecture, ERD, state machines, sequence diagrams)

### Domain Documentation (11 Domains)

Each domain has detailed documentation explaining:
- Purpose and key concepts
- Firestore document structure
- Entity definition and business rules
- DTOs for validation
- Repository methods
- Service methods
- Controller endpoints
- Error handling
- State machines (if applicable)
- Business logic rules
- Dependencies
- Implementation order

**Domains** (in recommended implementation order):

1. **[user.md](./domains/user.md)** ⭐⭐⭐
   - Community members with phone+password auth
   - Status flow: pending → active → inactive/banned
   - Role and tier assignment

2. **[role.md](./domains/role.md)** ⭐⭐
   - Permission sets (member, board, admin, superadmin)
   - Role hierarchy and permission checks

3. **[tier.md](./domains/tier.md)** ⭐
   - Membership levels (bronze, silver, gold, platinum)
   - Feature access by tier

4. **[board.md](./domains/board.md)** ⭐⭐⭐
   - Organizational structure with hierarchy
   - Board members and roles
   - Elections within boards

5. **[transaction.md](./domains/transaction.md)** ⭐⭐
   - **Immutable** financial records
   - Types: contribution, expense, dividend, fine
   - Amount validation against constants

6. **[election.md](./domains/election.md)** ⭐⭐⭐⭐
   - Voting lifecycle: created → voting → closed → archived
   - Ballot types: single-choice, multi-choice, ranking
   - Results calculation

7. **[vote.md](./domains/vote.md)** ⭐⭐
   - **Immutable** cast votes
   - One vote per user per election (composite index)
   - Vote tallying

8. **[announcement.md](./domains/announcement.md)** ⭐
   - Admin-created community notifications
   - Soft delete, expiration, pinning
   - Readable by all authenticated users

9. **[admin.md](./domains/admin.md)** ⭐⭐
   - Admin users with Firebase Google OAuth
   - Approval workflow: pending → approved/rejected
   - Separate from main User collection

10. **[password-reset.md](./domains/password-reset.md)** ⭐
    - Temporary reset tokens (15-minute expiry)
    - One-time use codes
    - SMS/WhatsApp integration

11. **[constants.md](./domains/constants.md)** ⭐
    - System configuration values
    - Categories: voting, board, transaction, system
    - Generic CRUD + named helper getters
    - In-memory caching

---

## 🏗️ Architecture Overview

### Three-Tier Layered Architecture

```
HTTP Request
    ↓
Routes → Controller → DTO → Service → Entity → Repository → Firestore
    ↑                                                           ↓
    └──────────────────── Error Middleware ←──────────────────┘
```

### Request Flow

1. **Routes**: Map HTTP endpoints to controller methods
2. **Controller**: Handle HTTP requests/responses (no business logic)
3. **DTO**: Validate incoming data and transform
4. **Service**: Implement business logic and orchestrate repositories
5. **Entity**: Domain object with validation and business methods
6. **Repository**: Firestore interactions only
7. **Firestore**: Database persistence

---

## 🎯 Key Principles

### 1. Separation of Concerns
- Each layer has **one responsibility**
- Controllers don't do business logic
- Services don't do HTTP handling
- Repositories don't do validation

### 2. Domain Isolation
- Each domain is **self-contained**
- Changes to one domain don't affect others
- Clear interfaces between domains
- Easy to add new domains

### 3. Type Safety
- **DTOs** validate all input
- **Entities** represent domain concepts
- Clear data shapes for every operation
- Error handling at each layer

### 4. Immutability Where Possible
- **Transaction** and **Vote** domains are immutable
- Append-only for audit trail
- Soft deletes keep history

### 5. Lifecycle Management
- **Election** and **Board** have state machines
- Strict validation of state transitions
- Business rules enforced at service level

---

## 📊 Domain Complexity Summary

| Domain | Complexity | Key Feature |
|--------|-----------|------------|
| User | ⭐⭐⭐ | Phone auth, status flow |
| Role | ⭐⭐ | Permission sets |
| Tier | ⭐ | Membership levels |
| Board | ⭐⭐⭐ | Hierarchy, members |
| Transaction | ⭐⭐ | **Immutable** records |
| Election | ⭐⭐⭐⭐ | Lifecycle, voting |
| Vote | ⭐⭐ | **Immutable**, unique |
| Announcement | ⭐ | Soft delete, expiry |
| Admin | ⭐⭐ | Approval workflow |
| Password Reset | ⭐ | Temporary tokens |
| Constants | ⭐ | System config |

---

## 🚀 Implementation Order

### Phase 1: Foundation
1. User (requires Role + Tier to exist)
2. Role
3. Tier
4. Constants

### Phase 2: Core Features
5. Board
6. Transaction
7. Announcement

### Phase 3: Voting System
8. Election
9. Vote

### Phase 4: Admin & Security
10. Admin
11. Password Reset

---

## 📁 Folder Structure

```
backend/
├── domains/
│   ├── user/
│   │   ├── controllers/user.controller.js
│   │   ├── services/user.service.js
│   │   ├── repositories/user.repository.js
│   │   ├── entities/User.js
│   │   ├── dtos/
│   │   │   ├── CreateUserDTO.js
│   │   │   └── UpdateUserDTO.js
│   │   ├── validators/user.validator.js
│   │   └── user.routes.js
│   │
│   ├── role/
│   ├── tier/
│   ├── board/
│   ├── transaction/
│   ├── election/
│   ├── vote/
│   ├── announcement/
│   ├── admin/
│   ├── password-reset/
│   └── constants/
│
├── shared/
│   ├── config/firebase.js
│   ├── middleware/
│   ├── utils/
│   └── constants/
│
├── routes.js
├── app.js
├── server.js
├── package.json
└── .env
```

---

## 🔍 How to Review the Plan

1. **Read [ddd.md](./ddd.md)** first for general architecture principles
2. **Review [diagrams.md](./diagrams.md)** for visual understanding
3. **Go through each domain** in order:
   - Understand the purpose and concepts
   - Review the Firestore structure
   - Check the entity, DTOs, and business rules
   - Validate against your understanding
4. **Ask questions** on any domain before we start coding

---

## ✅ Validation Checklist

For each domain, confirm:
- ✅ Do I understand the purpose?
- ✅ Are the Firestore structures clear?
- ✅ Do the business rules match my requirements?
- ✅ Are the DTOs and validation comprehensive?
- ✅ Do the endpoints make sense?
- ✅ Are error scenarios handled?

---

## 🎓 Key Concepts to Understand

### Immutability
- **Transaction** and **Vote** domains are immutable
- No UPDATE endpoints, only CREATE and (soft) DELETE
- Provides audit trail and data integrity
- If mistake, delete and recreate

### State Machines
- **Election**: created → voting → closed → archived
- **User**: pending → active OR rejected (or deactivated)
- **Board**: active ↔ archived
- **Admin**: pending → approved OR rejected

### Relationships
- **User** is the core entity
- Users are assigned **Role** + **Tier**
- Users participate in **Board** members
- Users cast **Vote** in **Election**
- Users make **Transaction** records

### Authentication
- **Main app**: Phone + password (bcrypt, custom Express auth)
- **Admin app**: Google OAuth (Firebase Auth)
- **JWT tokens**: For session management (both)

### Caching
- **Constants** domain cached in memory
- Cache invalidated on write
- Reload on next read

---

## 📚 Additional Resources

### Design Patterns Used
- **Repository Pattern**: Encapsulate database access
- **DTO Pattern**: Validate input at boundary
- **Entity Pattern**: Domain objects with behavior
- **Service Locator**: Dependency injection
- **State Machine**: Validate state transitions
- **Error Handling**: Consistent error responses

### Technology Stack
- **Node.js + Express**: HTTP server
- **Firebase Firestore**: Database
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT tokens
- **Firebase Admin SDK**: Google Auth, Firestore

---

## 🤝 Next Steps

1. **Review all documentation** and ask questions
2. **Approve the plan** for each domain
3. **Start implementation** starting with User domain
4. **Create unit tests** as we go
5. **Deploy gradually** (start with User + Role + Tier + Constants)

---

## 📝 Notes

- Each domain documentation validates my understanding at the top
- Ask me to clarify any domain concepts BEFORE we code
- We'll build each domain following the exact 6-step process outlined in [ddd.md](./ddd.md)
- Each domain will have comprehensive tests
- Error handling is consistent across all domains

---

**Questions?** Review the specific domain file and ask for clarifications!

