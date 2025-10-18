# Role Domain

**Collection**: `roles`
**Complexity**: ⭐⭐ (Medium)
**Mutability**: Mostly immutable (can't delete if users assigned)

---

## Domain Purpose

The Role domain manages **permission sets** that define what actions users can perform in the system. Roles are predefined (member, board, admin, superadmin) but new roles can be added dynamically.

### Key Concepts

- **Permission sets**: Each role has a set of permissions (vote, approve, manage_board, etc.)
- **Role hierarchy**: superadmin > admin > board > member
- **User assignments**: Users have exactly one role
- **Immutable references**: Once users are assigned a role, the role can't be deleted
- **Dynamic roles**: New roles can be added, but should follow hierarchy pattern

---

## Firestore Document Structure

```javascript
// Collection: roles
{
  id: "member",           // Unique ID (lowercase, no spaces)

  name: "Member",         // Display name

  permissions: [
    "vote",
    "view_announcements",
    "view_transactions",
    "view_elections"
  ],

  description: "Community member with basic permissions",
  level: 1,               // Hierarchy level (1-5, higher = more power)

  createdAt: "2025-10-18T08:00:00Z",
  updatedAt: "2025-10-18T08:00:00Z"
}
```

---

## Entity (Role.js)

### Properties
```javascript
{
  id: string,
  name: string,
  permissions: string[],
  description: string,
  level: number,           // 1-5, higher = more permissions
  createdAt: Date,
  updatedAt: Date
}
```

### Methods
```javascript
// Validation
validate()                 // Check all properties
isValidLevel()            // Level 1-5

// Permission checks
hasPermission(permission) // Does this role have this permission?
canApproveUsers()         // Shorthand checks
canManageBoard()
canViewAnalytics()

// Hierarchy
isHigherThan(otherRole)   // Compare levels
isEqualTo(otherRole)
isLowerThan(otherRole)

// Static factory
static create(data)       // Create and validate
```

### Business Rules
1. **ID must be unique**: Lowercase, no spaces, alphanumeric
2. **Name must be unique**: Display name must be unique
3. **Permissions must be valid**: Check against predefined permission list
4. **Level must be 1-5**: 5 is superadmin, 1 is member
5. **Cannot delete if users assigned**: Checked at service level
6. **Cannot duplicate permissions**: Each permission appears once

---

## DTOs

### CreateRoleDTO
```javascript
{
  id: "board",                    // Required, unique, immutable
  name: "Board Member",           // Required, unique
  level: 3,                       // Required, 1-5
  permissions: [
    "vote",
    "approve_users",
    "manage_board",
    "view_analytics"
  ],
  description: "Board member with management privileges"
}
```

**Validation**:
- id: Alphanumeric, lowercase, 3-20 chars, unique
- name: 2-50 chars, unique
- level: 1-5 integer
- permissions: Array of valid permission names
- description: 0-200 chars (optional)

### UpdateRoleDTO
```javascript
{
  name: "Board Member",           // Optional
  permissions: [...],             // Optional
  description: "..."              // Optional
}
```

**Constraints**:
- Cannot change ID (immutable)
- Cannot change level (immutable to prevent hierarchy breaking)
- Cannot delete if users assigned

---

## Predefined Roles

```javascript
{
  id: "member",
  name: "Member",
  level: 1,
  permissions: ["vote", "view_announcements", "view_transactions", "view_elections"],
  description: "Community member with basic permissions"
}

{
  id: "board",
  name: "Board Member",
  level: 3,
  permissions: ["vote", "view_announcements", "approve_users", "manage_board", "view_analytics"],
  description: "Board member with management privileges"
}

{
  id: "admin",
  name: "Administrator",
  level: 4,
  permissions: ["vote", "approve_users", "manage_board", "manage_roles", "manage_users", "view_analytics", "manage_elections"],
  description: "Admin with most privileges"
}

{
  id: "superadmin",
  name: "Super Administrator",
  level: 5,
  permissions: ["*"],  // Wildcard: all permissions
  description: "Super admin with all privileges"
}
```

---

## Repository Methods

```javascript
create(roleData)              // Create new role
findById(id)                  // Get role by ID
findByName(name)              // Get role by name (unique query)
findAll()                     // Get all roles
update(id, updates)           // Update role
delete(id)                    // Delete role (checked at service level)
countUsersWithRole(id)        // How many users have this role?
```

### Firestore Queries
- **Unique indexes**: id, name
- **Regular indexes**: level

---

## Service Methods

### Core CRUD
```javascript
async createRole(data)         // Create new role
async getRoleById(id)          // Get role
async getAllRoles()            // Get all roles (cached)
async updateRole(id, updates)  // Update role
async deleteRole(id)           // Delete if no users assigned
```

### Permission Management
```javascript
async hasPermission(roleId, permission)    // Check if role has permission
async addPermissionToRole(roleId, permission)
async removePermissionFromRole(roleId, permission)
```

### Role Hierarchy
```javascript
async getRolesByLevel(level)   // Get roles at specific level
async isRoleHigherThan(roleA, roleB)  // Compare hierarchy
```

### Validation
```javascript
async roleExists(roleId)       // Validate role exists
async canDeleteRole(roleId)    // Check if no users assigned
```

---

## Controller Endpoints

### Public Endpoints
```
GET    /api/roles                 List all roles
GET    /api/roles/:id             Get role by ID
```

### Admin-Only Endpoints
```
POST   /api/roles                 CreateRoleDTO
PUT    /api/roles/:id             UpdateRoleDTO
DELETE /api/roles/:id             Delete (if no users assigned)

POST   /api/roles/:id/permissions/add        AddPermissionDTO
DELETE /api/roles/:id/permissions/:permission RemovePermissionDTO
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid level, invalid permissions, etc.
- **409 Conflict**: ID or name already exists
- **404 Not Found**: Role not found
- **400 Bad Request (Constraint)**: Cannot delete role with assigned users

### Custom Errors
```javascript
new ValidationError('Invalid permission')
new ConflictError('Role ID already exists')
new ConflictError('Role name already exists')
new NotFoundError('Role not found')
new ConstraintError('Cannot delete role with assigned users')
```

---

## Business Logic Rules

### 1. Role Hierarchy
```
Level 5: superadmin (all permissions)
Level 4: admin (most permissions)
Level 3: board (board management)
Level 1-2: member (basic permissions)
```

### 2. Permission Model
- Each role has specific permissions
- superadmin has wildcard "*" permission (all)
- Permissions are strings: "vote", "approve_users", etc.

### 3. Deletion Constraint
- Cannot delete role if users are assigned to it
- Check: `countUsersWithRole(id) > 0` → throw error

### 4. Immutability
- ID and level cannot change once created
- Name and permissions can be updated

---

## Dependencies

- **roleRepository**: For database queries
- **userRepository**: To count users with role (before delete)

---

## Implementation Order

1. Create `Role.js` entity
2. Create `CreateRoleDTO.js`, `UpdateRoleDTO.js`
3. Create `role.repository.js`
4. Create `role.service.js`
5. Create `role.controller.js`
6. Create `role.routes.js`
7. Create predefined roles in Firestore (seed data)

---

## Testing Considerations

- Unit test: Role permission checks
- Unit test: Role hierarchy comparisons
- Integration test: Cannot delete role with users
- Integration test: Add/remove permissions
- Integration test: CRUD operations

---

## Questions to Validate Understanding

- ✅ Roles = permission sets that control what users can do
- ✅ Predefined roles: member, board, admin, superadmin
- ✅ Roles have hierarchy: superadmin > admin > board > member
- ✅ Cannot delete role if users assigned to it
- ✅ Permissions are strings: vote, approve_users, manage_board, etc.
- ✅ superadmin has "*" (all) permissions
- ✅ Roles are mostly immutable (ID and level can't change)

---

Does this match your understanding? Any corrections?
