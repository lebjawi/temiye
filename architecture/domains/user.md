# User Domain

**Collection**: `users`
**Complexity**: ⭐⭐⭐ (High)
**Auth Type**: Custom (phone + bcrypt password, NOT Firebase)
**Mutability**: Fully mutable

---

## Domain Purpose

The User domain manages **community members** who authenticate with phone number and password. Users are the foundation of the system—they participate in voting, make transactions, and belong to boards.

### Key Concepts

- **Phone-based identity**: Users are uniquely identified by their phone number (Mauritanian format: +222XXXXXXXX)
- **Status flow**: Users progress through states (pending → active → inactive/banned)
- **Role assignment**: Each user has exactly one role (member, board, admin, superadmin)
- **Tier assignment**: Each user has exactly one tier (bronze, silver, gold, etc.)
- **Permissions**: User actions are restricted by their role
- **Custom auth**: NO Firebase Auth for main app (cost optimization). Use bcrypt hashing in Express backend.

---

## Firestore Document Structure

```javascript
// Collection: users
{
  id: "doc-id",

  // Identity
  phone: "+22212345678",        // Unique, primary identifier
  name: "Ahmed Mohamed",

  // Authentication (custom, not Firebase)
  passwordHash: "bcrypt_hash",  // Never store plain password

  // Relationships
  role: "member",               // Ref to role collection
  tier: "silver",               // Ref to tier collection

  // Status & Lifecycle
  status: "active",             // pending | active | inactive | banned
  approvedAt: "2025-10-18T10:00:00Z",
  approvedBy: "user-id",        // Which admin approved

  // Metadata
  createdAt: "2025-10-18T08:00:00Z",
  updatedAt: "2025-10-18T10:00:00Z",
  lastLoginAt: "2025-10-18T15:30:00Z"
}
```

---

## Entity (User.js)

### Properties
```javascript
{
  id: string,
  phone: string,
  name: string,
  role: string,
  tier: string,
  status: 'pending' | 'active' | 'inactive' | 'banned',
  passwordHash: string,
  approvedAt: Date,
  approvedBy: string,
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

### Methods
```javascript
// Validation
validate()                      // Check all properties
isValidPhone()                  // Check phone format

// Status checks
isActive()                      // status === 'active'
isPending()                     // status === 'pending'
isBanned()                      // status === 'banned'

// Permission checks
canVote()                       // role is member OR admin
canApproveUsers()              // role is admin OR superadmin
canAccessAdminDashboard()      // role is admin OR superadmin
canManageBoard()               // role is board OR admin OR superadmin

// Static factory
static create(data)            // Create and validate
```

### Business Rules
1. **Phone must be Mauritanian format**: `+222XXXXXXXX` (8 digits after +222)
2. **Phone must be unique**: No two users with same phone
3. **Name is required**: Minimum 2 characters
4. **Status must be valid**: pending, active, inactive, or banned
5. **Only active users can vote**: `isActive() && canVote()`
6. **Password never stored plain**: Always hashed with bcrypt (10 rounds)
7. **Role must exist**: Reference to valid role document
8. **Tier must exist**: Reference to valid tier document

---

## DTOs

### CreateUserDTO
**Purpose**: Validate phone signup registration request

```javascript
{
  phone: "+22212345678",        // Required, must be valid Mauritanian format
  name: "Ahmed Mohamed",        // Required, min 2 chars
  password: "securePass123"     // Required, min 8 chars (will be hashed)
}
```

**Validation**:
- phone: Match regex `^\+222\d{8}$`
- name: Min 2 chars, max 100 chars
- password: Min 8 chars, max 128 chars

**Transformation**:
- Hash password with bcrypt (10 rounds)
- Add `status: 'pending'`
- Add `createdAt` and `updatedAt` timestamps

### UpdateUserDTO
**Purpose**: Update user profile (name, tier, NOT phone or role)

```javascript
{
  name: "Ahmed Mohamed",        // Optional
  tier: "gold"                  // Optional (only superadmin can set)
}
```

**Validation**:
- If name provided: min 2 chars, max 100 chars
- If tier provided: must exist in tier collection

**Constraints**:
- Cannot change phone (immutable, primary identifier)
- Cannot change role (requires separate endpoint)
- Cannot change status (requires separate endpoint)

### ApproveUserDTO
**Purpose**: Admin approves new user to activate account

```javascript
{
  userId: "doc-id",             // Required, must exist
  reason: "Community member"    // Optional, audit trail
}
```

**Validation**:
- userId: Must exist in users collection
- User status must be 'pending'
- Only superadmin can approve

### ChangeRoleDTO
**Purpose**: Change user's role

```javascript
{
  userId: "doc-id",
  role: "board"                 // Required, must be valid role
}
```

**Validation**:
- userId: Must exist
- role: Must exist in role collection
- Only superadmin can change roles

### BanUserDTO
**Purpose**: Ban a user (admin action)

```javascript
{
  userId: "doc-id",
  reason: "Violation of community rules"
}
```

**Validation**:
- userId: Must exist and not already banned
- Only superadmin can ban users

---

## Repository Methods

### Query Methods
```javascript
create(userData)                // Create new user
findById(id)                    // Get user by ID
findByPhone(phone)              // Get user by phone (unique lookup)
findAll()                       // Get all users
findByRole(role)                // Get all users with this role
findByStatus(status)            // Get all active/pending/banned users
findByTier(tier)                // Get all users with this tier
findPendingApprovals()          // Get all status='pending' users
```

### Write Methods
```javascript
create(userData)
update(id, updates)
updateStatus(id, newStatus)
updateRole(id, role)
updateTier(id, tier)
updatePasswordHash(id, hash)
recordLastLogin(id)
banUser(id, reason)
```

### Firestore Queries
- **Unique index**: phone (primary lookup)
- **Regular indexes**: status, role, tier
- **Compound indexes**: (role, status), (tier, status)

---

## Service Methods

### Core CRUD
```javascript
async createUser(data)          // Register new user (status=pending initially)
async getUserById(id)           // Get user with all details
async getAllUsers(filters)      // Get all users with optional filters
async updateUser(id, updates)   // Update profile (name, tier)
async deleteUser(id)            // Soft delete (set status=inactive)
```

### Authentication
```javascript
async loginUser(phone, password)   // Verify password and return JWT
async changePassword(id, oldPwd, newPwd)
async generatePasswordResetToken(phone)
async resetPassword(phone, token, newPwd)
```

### Status Management
```javascript
async approveUser(userId, approvedBy, reason)  // pending → active
async rejectUser(userId, reason)               // pending → rejected
async banUser(userId, reason)                  // any → banned
async deactivateUser(userId)                   // any → inactive
async reactivateUser(userId)                   // inactive → active
```

### Role & Tier Management
```javascript
async changeUserRole(userId, newRole)          // Only superadmin
async changeUserTier(userId, newTier)          // Only superadmin
```

### Permission Checks
```javascript
async canUserVote(userId)                      // isActive && role allows
async canUserApprove(userId)                   // role is admin/superadmin
async canUserManageBoard(userId)               // role is board/admin/superadmin
```

---

## Controller Endpoints

### Public Endpoints (No Auth Required)
```
POST   /api/users/register              CreateUserDTO
POST   /api/users/login                 { phone, password }
POST   /api/users/request-password-reset { phone }
```

### Protected Endpoints (Authenticated)
```
GET    /api/users/me                    Get current user profile
PUT    /api/users/me                    UpdateUserDTO
POST   /api/users/me/change-password    { oldPassword, newPassword }

GET    /api/users                       List all users (admin only)
GET    /api/users/:id                   Get user by ID (admin or self)
```

### Admin-Only Endpoints
```
POST   /api/users/:id/approve           ApproveUserDTO
POST   /api/users/:id/reject            { reason }
POST   /api/users/:id/ban               BanUserDTO
POST   /api/users/:id/change-role       ChangeRoleDTO
POST   /api/users/:id/change-tier       { tier }
DELETE /api/users/:id                   Delete/deactivate user

GET    /api/users/pending-approvals     List pending users (superadmin)
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid phone format, weak password, etc.
- **409 Conflict**: Phone already exists
- **404 Not Found**: User not found
- **401 Unauthorized**: Invalid password
- **403 Forbidden**: User banned, not approved, insufficient permissions

### Custom Errors
```javascript
new ValidationError('Invalid phone format')
new ConflictError('Phone already exists')
new NotFoundError('User not found')
new UnauthorizedError('Invalid password')
new ForbiddenError('User is banned')
new ForbiddenError('User not approved yet')
```

---

## State Diagram

```
Signup
  ↓
[pending] ← (not approved)
  ↓
POST /approve
  ↓
[active] ← (normal state)
  ↓ (ban)
[banned] ← (permanent)

OR

[active] → (deactivate) → [inactive]
[inactive] → (reactivate) → [active]
```

---

## Business Logic Rules

### 1. Phone Validation
- Must start with +222
- Must have exactly 8 digits after +222
- Must be unique in users collection

### 2. Password Management
- Minimum 8 characters
- Never stored plain text
- Always hashed with bcrypt (10 rounds)
- Salted by bcrypt automatically

### 3. Status Flow
```
pending (awaiting admin approval)
  ↓
active (can use system)
  ↓
inactive (deactivated by self or admin)
  ↓
active (reactivated)

OR ANY → banned (admin action, permanent)
```

### 4. Permission Hierarchy
```
superadmin > admin > board > member

superadmin: Can do anything
admin: Can approve users, manage board, view analytics
board: Can manage their board, view analytics for their board
member: Can vote, view announcements, transactions
```

### 5. Approval Workflow
- New users start with `status: 'pending'`
- Must be approved by superadmin or admin
- Only approved users (`status: 'active'`) can use system
- Can be rejected (`status: 'rejected'`)

### 6. Login Requirements
- Phone must exist in users collection
- Password must match bcrypt hash
- User must be `active` status
- Return JWT token valid for 7 days

---

## Dependencies

- **userRepository**: For database queries
- **roleService**: To validate role exists
- **tierService**: To validate tier exists
- **bcrypt**: For password hashing (npm install bcrypt)
- **jsonwebtoken**: For JWT token generation (npm install jsonwebtoken)

---

## Implementation Order

1. Create `User.js` entity with validation
2. Create DTOs: `CreateUserDTO.js`, `UpdateUserDTO.js`, etc.
3. Create `user.repository.js` with Firestore queries
4. Create `user.service.js` with business logic
5. Create `user.controller.js` with HTTP endpoints
6. Create `user.routes.js` mapping endpoints
7. Add comprehensive error handling

---

## Testing Considerations

- Unit test: User entity validation (phone format, status transitions)
- Unit test: Password hashing and verification
- Integration test: Login workflow
- Integration test: Approval workflow
- Integration test: Role/tier changes
- Integration test: Ban user

---

## Security Considerations

1. **Never log passwords**: Don't log plain text passwords anywhere
2. **HTTPS only**: All endpoints must be HTTPS in production
3. **Rate limit login**: Prevent brute force on `/login` endpoint
4. **Session expiry**: JWT tokens expire after 7 days
5. **CORS**: Restrict to frontend domain
6. **CSRF tokens**: If using cookies for auth
7. **Input sanitization**: Sanitize all text inputs
8. **SQL injection proof**: Using Firestore (document database), not SQL

---

## Questions to Validate Understanding

- ✅ User = community member with phone+password auth (NOT Firebase)
- ✅ Phone is primary identifier (unique, Mauritanian format)
- ✅ Users must be approved before they can use system
- ✅ Roles determine permissions (member, board, admin, superadmin)
- ✅ Tiers represent membership levels (bronze, silver, gold)
- ✅ Status flow: pending → active → inactive/banned
- ✅ Passwords are hashed with bcrypt (never plain text)
- ✅ JWT tokens for session management
- ✅ Only superadmin can approve new users

---

Does this match your understanding of the User domain? Any corrections needed before we code it?
