# Admin Domain

**Collection**: `admins`
**Complexity**: ⭐⭐ (Medium)
**Auth Type**: Firebase Google OAuth (NOT custom phone auth like main app)
**Special**: Approval workflow before first login

---

## Domain Purpose

The Admin domain manages **administrative users** who access the admin dashboard via Google OAuth. Unlike regular users (phone+password), admins use Firebase authentication and require superadmin approval before first login.

### Key Concepts

- **Firebase OAuth**: Admins login with Google (not phone+password)
- **Approval workflow**: New admins start as pending, need superadmin approval
- **Status-based access**: Only approved admins can access admin dashboard
- **Role-based permissions**: Admins have specific roles (admin, superadmin)
- **Audit trail**: Track approvals, rejections, who approved when

---

## Firestore Document Structure

```javascript
// Collection: admins
{
  id: "admin-123",

  // Firebase authentication
  firebaseUid: "firebase-uid-xyz",  // From Firebase Google Auth
  email: "admin@example.com",       // Unique, from Google

  // Admin status
  status: "pending",                // pending | approved | rejected

  // Approval workflow
  approvedAt: "2025-10-18T10:00:00Z",
  approvedBy: "superadmin-id",      // Who approved
  rejectionReason: null,            // Why rejected (if rejected)

  // Metadata
  createdAt: "2025-10-18T08:00:00Z",
  updatedAt: "2025-10-18T10:00:00Z",
  lastLoginAt: null
}
```

---

## Entity (Admin.js)

### Properties
```javascript
{
  id: string,
  firebaseUid: string,
  email: string,
  status: "pending" | "approved" | "rejected",
  approvedAt: Date | null,
  approvedBy: string | null,
  rejectionReason: string | null,
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date | null
}
```

### Methods
```javascript
// Validation
validate()
isValidEmail()

// Status checks
isPending()              // Awaiting approval
isApproved()            // Can login
isRejected()            // Denied access

// Permission checks
canLogin()              // status === 'approved'
canApproveAdmins()      // Only superadmins

// Static factory
static create(data)
```

### Business Rules
1. **Email must be unique**: Primary identifier for Firebase auth
2. **Firebase UID required**: From Google OAuth
3. **Initial status is pending**: Must be approved by superadmin
4. **Only approved can login**: Check status before granting access
5. **Rejection is permanent**: Rejected admins cannot become approved again
6. **First superadmin manual**: Must be created with status=approved in Firestore

---

## DTOs

### CreateAdminDTO
```javascript
{
  firebaseUid: "firebase-uid-xyz",   // Required, from Firebase
  email: "admin@example.com"         // Required, from Google
}
```

**Validation**:
- email: Valid email, unique
- firebaseUid: Required, must come from Firebase Google Auth
- Constraint: Only superadmin can create admins
- Constraint: Sets initial status to "pending"

### ApproveAdminDTO
```javascript
{
  adminId: "admin-123",
  reason: "Verified community board member"  // Optional, audit trail
}
```

**Constraints**:
- Only superadmin can approve
- Admin must be pending
- Sets status to approved

### RejectAdminDTO
```javascript
{
  adminId: "admin-123",
  reason: "Not verified community member"    // Required, audit trail
}
```

**Constraints**:
- Only superadmin can reject
- Admin must be pending
- Sets status to rejected
- Reason required (must explain why)

---

## Repository Methods

```javascript
create(adminData)
findById(id)
findByEmail(email)                  // Unique query
findByFirebaseUid(uid)              // Used during login
findAll()
findByStatus(status)                // pending | approved | rejected
findPendingApprovals()              // status = 'pending'
updateStatus(id, newStatus)
recordLastLogin(id)
update(id, updates)
delete(id)                          // Remove admin
```

### Firestore Queries
- **Unique indexes**: email, firebaseUid
- **Regular indexes**: status, createdAt

---

## Service Methods

### Core CRUD
```javascript
async createAdmin(data)             // Creates with status=pending
async getAdminById(id)
async getAllAdmins()
async deleteAdmin(id)
```

### Approval Workflow
```javascript
async getPendingApprovals()         // List admins awaiting approval
async approveAdmin(adminId, approvedBy, reason)
async rejectAdmin(adminId, reason)
```

### Authentication
```javascript
async canAdminLogin(firebaseUid)    // Check status=approved
async findAdminByFirebaseUid(uid)   // Used during login
async recordLastLogin(adminId)
```

### Validation
```javascript
async adminExists(adminId)
async isApproved(adminId)
async canApprove(userId)            // Only superadmin
```

---

## Controller Endpoints

### Admin Login (Public, uses Firebase)
```
POST   /api/admins/login            Expects Firebase token
GET    /api/admins/me               Get current admin profile
```

### Superadmin-Only
```
POST   /api/admins                  CreateAdminDTO
GET    /api/admins                  List all admins
GET    /api/admins/:id              Get admin

POST   /api/admins/pending          Get pending approvals
POST   /api/admins/:id/approve      ApproveAdminDTO
POST   /api/admins/:id/reject       RejectAdminDTO
DELETE /api/admins/:id              Delete admin
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid email, Firebase UID conflict, etc.
- **404 Not Found**: Admin not found
- **409 Conflict**: Email already exists
- **403 Forbidden**: Admin not approved, cannot login

### Custom Errors
```javascript
new ValidationError('Invalid email format')
new ConflictError('Email already exists')
new ForbiddenError('Admin not approved yet')
new ForbiddenError('Admin rejected, cannot login')
new NotFoundError('Admin not found')
```

---

## Business Logic Rules

### 1. Admin Creation Flow
- New admin created with status = "pending"
- Superadmin receives notification (implement separately)
- Superadmin reviews and approves/rejects
- Only approved admins can access admin dashboard

### 2. First Superadmin Bootstrap
- When system first starts, create initial superadmin manually
- Set status = "approved" directly in Firestore (skip approval)
- Subsequent admins go through normal approval workflow

### 3. Authentication Flow
1. User logs in with Google (Firebase handles)
2. Firebase returns firebaseUid
3. System looks up admin by firebaseUid
4. Check if status = "approved"
5. If approved: Grant access, set JWT token
6. If pending: Redirect to "awaiting approval" message
7. If rejected: Deny access

### 4. Approval vs Rejection
- **Approved**: Admin can now login and access dashboard
- **Rejected**: Admin cannot login, rejection is permanent
- Cannot change rejected back to pending

---

## Dependencies

- **adminRepository**
- **userRepository**: Admin might also be a user (optional)
- **firebaseService**: Verify Firebase tokens

---

## Implementation Order

1. Create `Admin.js`
2. Create DTOs: `CreateAdminDTO.js`, `ApproveAdminDTO.js`, `RejectAdminDTO.js`
3. Create `admin.repository.js`
4. Create `admin.service.js`
5. Create `admin.controller.js`
6. Create `admin.routes.js`
7. Create Firebase Google OAuth setup
8. Seed initial superadmin

---

## Firebase Setup Required

1. Enable Google OAuth in Firebase Console
2. Configure OAuth redirect URI
3. Create OAuth credentials (web application)
4. Store client ID and client secret in `.env`

---

## Testing Considerations

- Unit test: Status validation
- Integration test: Approval workflow
- Integration test: Login with approved admin
- Integration test: Cannot login if pending/rejected
- Integration test: Rejection is permanent
- Integration test: Only superadmin can approve

---

## Questions to Validate Understanding

- ✅ Admins = administrative users with Google OAuth (NOT phone+password)
- ✅ Status flow: pending → approved OR rejected
- ✅ Only approved admins can login
- ✅ Approval required before first login
- ✅ First superadmin created manually with status=approved
- ✅ Rejection is permanent (cannot undo)
- ✅ Separate from main User collection

---

Does this match your understanding?
