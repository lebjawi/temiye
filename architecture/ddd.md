# Domain-Driven Design (DDD) Architecture

**Version**: 1.0
**Last Updated**: October 18, 2025
**Architecture Pattern**: Three-Tier Layered Architecture with Domain-Driven Design
**Tech Stack**: Node.js + Express + Firebase Firestore

---

## Table of Contents

1. [Core Architecture Principles](#core-architecture-principles)
2. [Folder Structure](#folder-structure)
3. [Layer Responsibilities](#layer-responsibilities)
4. [Request Flow](#request-flow)
5. [Domain Overview](#domain-overview)
6. [Implementation Guidelines](#implementation-guidelines)
7. [Key Design Patterns](#key-design-patterns)

---

## Core Architecture Principles

### 1. **Separation of Concerns**
Each layer has a single responsibility:
- **Controller**: HTTP request/response handling only
- **Service**: Business logic and orchestration only
- **Repository**: Firestore interactions only
- **Entity**: Domain rules and validation only

### 2. **Domain Isolation**
Each domain is self-contained and independent:
- Changes to one domain don't affect others
- Domains communicate through well-defined interfaces
- Easy to add new domains without touching existing code

### 3. **Immutability Where Possible**
Some domains (Transaction, Vote) are immutable:
- No UPDATE operations
- All changes are tracked as new records
- Provides audit trail and data integrity

### 4. **Lifecycle Management**
Stateful domains (Election, Board) follow strict state machines:
- Only valid transitions allowed
- Validation at each state change
- Business rules enforced at service level

### 5. **Type Safety**
DTOs and Entities ensure data integrity:
- Request validation before business logic
- Clear data shapes (request/response)
- Entity validation before Firestore write

---

## Folder Structure

```
backend/
├── domains/
│   ├── user/
│   │   ├── controllers/
│   │   │   └── user.controller.js
│   │   ├── services/
│   │   │   └── user.service.js
│   │   ├── repositories/
│   │   │   └── user.repository.js
│   │   ├── entities/
│   │   │   └── User.js
│   │   ├── dtos/
│   │   │   ├── CreateUserDTO.js
│   │   │   └── UpdateUserDTO.js
│   │   ├── validators/
│   │   │   └── user.validator.js
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
│   ├── config/
│   │   └── firebase.js
│   ├── middleware/
│   │   ├── error-handler.js
│   │   └── validation.middleware.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── errors.js
│   └── constants/
│       └── app.constants.js
│
├── routes.js          # Main route aggregator
├── app.js             # Express app setup
├── server.js          # Server startup
├── package.json
└── .env
```

---

## Layer Responsibilities

### Controller Layer
**File**: `controllers/[domain].controller.js`

**Responsibility**: HTTP protocol handling
- Parse request data
- Call service methods
- Format response
- Pass errors to middleware

**Rules**:
- No business logic
- No Firestore queries
- No direct repository calls
- All errors → next(error) to middleware

**Example**:
```javascript
class UserController {
  async createUser(req, res, next) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error); // To error handler middleware
    }
  }
}
```

---

### Service Layer
**File**: `services/[domain].service.js`

**Responsibility**: Business logic orchestration
- Validate business rules
- Orchestrate repository calls
- Implement domain workflows
- Handle transactions/rollbacks
- Call other services if needed

**Rules**:
- No HTTP handling
- No direct Firestore queries
- Call repositories only
- Throw custom errors (caught by controller)

**Example**:
```javascript
class UserService {
  async createUser(data) {
    // 1. Validate incoming data
    const dto = new CreateUserDTO(data);
    dto.validate();

    // 2. Check business rules
    const existing = await this.userRepository.findByPhone(dto.phone);
    if (existing) throw new ConflictError('Phone already exists');

    // 3. Create entity
    const user = User.create(dto.toEntity());

    // 4. Save via repository
    return this.userRepository.create(user);
  }
}
```

---

### Repository Layer
**File**: `repositories/[domain].repository.js`

**Responsibility**: Firestore interactions
- Query Firestore
- Transform Firestore docs to Entities
- Handle database errors
- Encapsulate Firestore API

**Rules**:
- No business logic
- No HTTP handling
- All queries isolated here
- Return Entities, not raw Firestore docs

**Example**:
```javascript
class UserRepository {
  async create(userData) {
    const docRef = await this.db.collection('users').add(userData);
    return { id: docRef.id, ...userData };
  }

  async findByPhone(phone) {
    const snapshot = await this.db
      .collection('users')
      .where('phone', '==', phone)
      .get();
    if (snapshot.empty) return null;
    return new User({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
  }
}
```

---

### Entity Layer
**File**: `entities/[Domain].js`

**Responsibility**: Domain object with business rules
- Represent domain concept
- Encapsulate business rules
- Validate domain constraints
- Provide domain methods

**Rules**:
- No HTTP handling
- No Firestore queries
- No service calls
- Self-contained validation

**Example**:
```javascript
class User {
  constructor(data) {
    this.id = data.id;
    this.phone = data.phone;
    this.name = data.name;
    this.role = data.role;
  }

  validate() {
    if (!this.isValidPhone()) throw new Error('Invalid phone');
    if (!this.name) throw new Error('Name required');
  }

  isValidPhone() {
    return /^\+222\d{8}$/.test(this.phone);
  }

  canVote() {
    return this.role === 'member' || this.role === 'admin';
  }
}
```

---

### DTO Layer
**File**: `dtos/[Operation][Domain]DTO.js`

**Responsibility**: Input validation and transformation
- Define request shape
- Validate incoming data
- Transform to Entity or persistence format

**Rules**:
- Validate at construction time
- Throw validation errors immediately
- Separate DTOs for Create, Update, other operations

**Example**:
```javascript
class CreateUserDTO {
  constructor(data) {
    this.phone = data.phone;
    this.name = data.name;
    this.password = data.password;
  }

  validate() {
    if (!this.phone.match(/^\+222\d{8}$/)) throw new Error('Invalid phone');
    if (this.password.length < 8) throw new Error('Password too short');
  }

  toEntity() {
    return {
      phone: this.phone,
      name: this.name,
      passwordHash: hashPassword(this.password), // Don't store plain password
      createdAt: new Date(),
    };
  }
}
```

---

## Request Flow

```
HTTP Request
    ↓
Routes (user.routes.js)
    ↓
Controller (user.controller.js)
    ↓ (HTTP request data)
DTO (CreateUserDTO)
    ↓ (validate)
Service (user.service.js)
    ↓ (business logic)
Entity (User)
    ↓ (validate)
Repository (user.repository.js)
    ↓ (Firestore query)
Firestore Database
    ↓ (result)
Repository → Entity transformation
    ↓
Service → return result
    ↓
Controller → format response
    ↓
HTTP Response
    ↓
Middleware (error handler catches errors at any layer)
```

---

## Domain Overview

The system has 11 domains, each with specific business logic:

| # | Domain | Complexity | Type | Key Feature |
|---|--------|-----------|------|------------|
| 1 | **User** | ⭐⭐⭐ | Identity | Phone auth, status flow |
| 2 | **Role** | ⭐⭐ | Configuration | Permission sets |
| 3 | **Tier** | ⭐ | Configuration | Membership levels |
| 4 | **Board** | ⭐⭐⭐ | Organization | Hierarchy, members |
| 5 | **Transaction** | ⭐⭐ | Finance | Immutable records |
| 6 | **Election** | ⭐⭐⭐⭐ | Voting | Lifecycle, vote uniqueness |
| 7 | **Vote** | ⭐⭐ | Voting | Immutable, one per user |
| 8 | **Announcement** | ⭐ | Communication | Soft delete, expiry |
| 9 | **Admin** | ⭐⭐ | Identity | Approval workflow |
| 10 | **Password Reset** | ⭐ | Security | Temporary tokens |
| 11 | **Constants** | ⭐ | Configuration | Dynamic CRUD |

---

## Implementation Guidelines

### For Each Domain, Follow This Order:

1. **Define Entity** (`entities/[Domain].js`)
   - Define properties
   - Add validation logic
   - Add business methods

2. **Create DTOs** (`dtos/[Operation][Domain]DTO.js`)
   - Define request shape
   - Add validation
   - Add transformation methods

3. **Build Repository** (`repositories/[domain].repository.js`)
   - Write Firestore queries
   - Transform results to Entities

4. **Implement Service** (`services/[domain].service.js`)
   - Orchestrate repositories
   - Implement business logic
   - Validate against other services if needed

5. **Create Controller** (`controllers/[domain].controller.js`)
   - HTTP endpoints
   - Call service methods
   - Format responses

6. **Define Routes** (`[domain].routes.js`)
   - Map endpoints to controller methods
   - Standard CRUD pattern

### Standard CRUD Endpoints

Every domain follows this pattern (customize based on domain specifics):

```
POST   /api/[domains]              → Create
GET    /api/[domains]              → List all (with pagination)
GET    /api/[domains]/:id          → Get one
PUT    /api/[domains]/:id          → Update (if mutable)
DELETE /api/[domains]/:id          → Delete

Special endpoints per domain:
POST   /api/[domains]/:id/action   → Special actions (e.g., approve)
```

---

## Key Design Patterns

### 1. Repository Pattern
Encapsulate all database queries in repositories. Services never touch Firestore directly.

**Benefit**: Easy to swap database without changing business logic.

### 2. DTO Pattern
Validate all input at the boundary (DTO). Services trust data is valid.

**Benefit**: Clean separation between request format and domain model.

### 3. Entity Pattern
Domain objects with behavior (not just data). Business rules live in entities.

**Benefit**: Logic is close to data, easier to understand and test.

### 4. Service Locator / Dependency Injection
Services are injected into controllers (not created inside them).

```javascript
// In app.js
const userService = new UserService(userRepository);
const userController = new UserController(userService);
```

**Benefit**: Easy to mock for testing.

### 5. Error Handling
Custom errors at service level, caught by controller, formatted by middleware.

```javascript
// Service throws
throw new ValidationError('Phone already exists');

// Controller catches
catch (error) {
  next(error);
}

// Middleware formats
res.status(error.statusCode).json({ success: false, error: error.message });
```

**Benefit**: Consistent error responses across all endpoints.

### 6. State Machine Pattern
Stateful domains (Election, Board) validate state transitions.

```javascript
// In service
if (election.status !== 'created') {
  throw new InvalidStateError('Can only start voting from created status');
}
```

**Benefit**: Prevents invalid state transitions.

### 7. Immutability Pattern
Some domains (Transaction, Vote) prevent updates and deletes.

```javascript
// In controller - return 405 for immutable resources
async updateTransaction(req, res) {
  throw new MethodNotAllowedError('Transactions are immutable');
}
```

**Benefit**: Data integrity for critical records.

---

## Dependencies

### Core
- `express`: HTTP server
- `firebase-admin`: Firestore SDK
- `dotenv`: Environment variables

### Optional (Recommended)
- `joi`: Schema validation (for DTOs)
- `winston`: Logging
- `jest`: Testing

---

## Next Steps

1. Review individual domain documentation (see `domains/` folder)
2. Review diagrams (see `diagrams.md`)
3. Implement domains in order: User → Role → Tier → Board → Transaction → Election → Vote → Announcement → Admin → Password Reset → Constants
4. Create comprehensive tests for each domain
5. Implement error handling middleware
6. Set up logging and monitoring

---

## Contact & Questions

For architecture questions or clarifications, refer to the individual domain documentation files.

Each domain has a dedicated `.md` file explaining its specific requirements, business logic, and implementation approach.
