# Board Domain

**Collection**: `boards`
**Complexity**: ⭐⭐⭐ (High)
**Mutability**: Mutable
**Special**: Hierarchical structure (parent/child boards)

---

## Domain Purpose

The Board domain manages **organizational units** within the community. Boards represent teams, committees, or organizational structures that can have hierarchical relationships and manage their own members and elections.

### Key Concepts

- **Organizational hierarchy**: Boards can have parent/child relationships
- **Board members**: Users assigned to boards with specific roles
- **Board status**: Active or archived
- **Elections**: Elections happen within boards
- **Cascade operations**: Archiving a board affects its children and elections

---

## Firestore Document Structure

```javascript
// Collection: boards
{
  id: "board-123",

  name: "Finance Committee",
  description: "Handles financial decisions",

  parentBoardId: "board-456",     // Optional, creates hierarchy
  status: "active",               // active | archived

  members: [
    {
      userId: "user-123",
      role: "chair",              // chair | treasurer | secretary | member
      joinedAt: "2025-10-18T08:00:00Z"
    },
    {
      userId: "user-456",
      role: "member",
      joinedAt: "2025-10-18T09:00:00Z"
    }
  ],

  createdAt: "2025-10-18T08:00:00Z",
  updatedAt: "2025-10-18T10:00:00Z",
  archivedAt: null
}
```

---

## Entity (Board.js)

### Properties
```javascript
{
  id: string,
  name: string,
  description: string,
  parentBoardId: string | null,
  status: "active" | "archived",
  members: Array<{
    userId: string,
    role: "chair" | "treasurer" | "secretary" | "member",
    joinedAt: Date
  }>,
  createdAt: Date,
  updatedAt: Date,
  archivedAt: Date | null
}
```

### Methods
```javascript
// Validation
validate()
hasMember(userId)
getMemberRole(userId)

// Status checks
isActive()
isArchived()
canAddMember()
canRemoveMember(userId)

// Hierarchy
getHierarchyPath()        // Breadcrumb: Board1 > Board2 > Board3
getChildBoards()
getParentBoard()

// Business operations
addMember(userId, role)
removeMember(userId)
changeMemberRole(userId, newRole)

// Static factory
static create(data)
```

### Business Rules
1. **Board name is required**: 2-100 characters
2. **Status is active or archived**: Only two valid states
3. **Cannot delete if has members**: Must remove all members first
4. **Cannot delete if has elections**: Must close elections first
5. **Parent board must exist**: If parentBoardId provided
6. **Members must have valid roles**: chair, treasurer, secretary, member
7. **One chair per board**: Only one member can be chair
8. **Cannot archive if has active children**: Must archive children first

---

## DTOs

### CreateBoardDTO
```javascript
{
  name: "Finance Committee",
  description: "Handles financial decisions",
  parentBoardId: "board-456"     // Optional
}
```

**Validation**:
- name: Required, 2-100 chars
- description: Optional, 0-500 chars
- parentBoardId: Optional, must exist if provided

### UpdateBoardDTO
```javascript
{
  name: "Finance Committee",
  description: "Updated description",
  parentBoardId: "board-456"
}
```

### AddMemberDTO
```javascript
{
  userId: "user-123",
  role: "secretary"           // chair | treasurer | secretary | member
}
```

**Validation**:
- userId: Must exist in users collection
- role: Valid role
- Constraint: User not already in board
- Constraint: Only one chair per board

### RemoveMemberDTO
```javascript
{
  userId: "user-123"
}
```

### ArchiveBoardDTO
```javascript
{
  reason: "Committee dissolved"
}
```

---

## Repository Methods

```javascript
create(boardData)
findById(id)              // With members expanded
findAll()
findByStatus(status)      // active | archived
findByParent(parentId)    // All child boards
findByMember(userId)      // All boards user is in
update(id, updates)
archive(id, reason)
addMember(boardId, member)
removeMember(boardId, userId)
changeMemberRole(boardId, userId, newRole)
```

### Firestore Queries
- **Indexes**: status, parentBoardId
- **Compound indexes**: (status, parentBoardId)

---

## Service Methods

### Core CRUD
```javascript
async createBoard(data)
async getBoardById(id)
async getAllBoards()
async updateBoard(id, updates)
async deleteBoard(id)
```

### Board Hierarchy
```javascript
async getBoardHierarchy(id)     // Get path to root
async getChildBoards(id)        // Immediate children only
async getDescendants(id)        // All descendants recursively
async canChangeParent(boardId, newParentId)  // Check for cycles
```

### Member Management
```javascript
async addMemberToBoard(boardId, userId, role)
async removeMemberFromBoard(boardId, userId)
async changeMemberRole(boardId, userId, newRole)
async getBoardMembers(boardId)
async getUserBoards(userId)
```

### Status Management
```javascript
async archiveBoard(boardId, reason)
async canArchiveBoard(boardId)  // Check if children are archived
async canDeleteBoard(boardId)   // Check members/elections
```

### Validation
```javascript
async boardExists(boardId)
async canAddMember(boardId, userId)  // Check user exists
async isMemberOfBoard(userId, boardId)
```

---

## Controller Endpoints

### Public
```
GET    /api/boards                  List all active boards
GET    /api/boards/:id              Get board with members
GET    /api/boards/:id/hierarchy    Get board hierarchy path
GET    /api/boards/:id/children     Get child boards
GET    /api/boards/:id/members      Get board members
```

### Authenticated
```
GET    /api/me/boards               Get boards I'm member of
```

### Admin-Only
```
POST   /api/boards                  CreateBoardDTO
PUT    /api/boards/:id              UpdateBoardDTO
DELETE /api/boards/:id              Delete board

POST   /api/boards/:id/members      AddMemberDTO
DELETE /api/boards/:id/members/:userId  Remove member
PUT    /api/boards/:id/members/:userId/role  ChangeRoleDTO

POST   /api/boards/:id/archive      ArchiveBoardDTO
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid data, invalid role, etc.
- **404 Not Found**: Board not found
- **409 Conflict**: Board already has member, only one chair, cycle detected
- **400 Bad Request (Constraint)**: Cannot delete with members/elections

### Custom Errors
```javascript
new ValidationError('Invalid role')
new ConflictError('User already member of board')
new ConflictError('Board can only have one chair')
new ConstraintError('Cannot archive board with active children')
new ConstraintError('Cannot delete board with members')
```

---

## Business Logic Rules

### 1. Board Hierarchy
- Boards can have optional parent board
- No cycles allowed (board cannot be ancestor of itself)
- When listing children, only list immediate children
- Breadcrumb can be built: Board1 > Board2 > Board3

### 2. Member Roles
```
chair      - Leadership, can approve decisions
treasurer  - Financial management
secretary  - Record keeping
member     - General member
```

### 3. Constraints
- One chair per board maximum
- Cannot add same user twice to board
- Cannot remove last chair
- Cannot archive if has active child boards
- Cannot delete if has members or active elections

### 4. Archive vs Delete
- Archive: Soft delete, keeps history
- Delete: Hard delete, removes everything (admin only, rare)

---

## State Diagram

```
[Create Board]
     ↓
[active]
     ↓ (archive)
[archived]
     ↓
(can restore by changing status back to active)
```

---

## Dependencies

- **boardRepository**
- **userRepository**: Validate users exist before adding
- **electionRepository**: Count elections before delete
- **announcementRepository**: Related to board

---

## Implementation Order

1. Create `Board.js`
2. Create DTOs: `CreateBoardDTO.js`, `AddMemberDTO.js`, `ArchiveBoardDTO.js`, etc.
3. Create `board.repository.js`
4. Create `board.service.js`
5. Create `board.controller.js`
6. Create `board.routes.js`

---

## Testing Considerations

- Unit test: Hierarchy path building
- Unit test: Role validation
- Integration test: Add/remove members
- Integration test: Cannot archive with children
- Integration test: Cannot delete with members
- Integration test: Cycle detection

---

## Questions to Validate Understanding

- ✅ Boards = organizational units (committees, teams)
- ✅ Boards can have parent/child relationships (hierarchy)
- ✅ Members have roles: chair, treasurer, secretary, member
- ✅ One chair per board maximum
- ✅ Status: active or archived
- ✅ Cannot delete if has members or elections
- ✅ Cannot archive if has active children

---

Does this match your understanding?
