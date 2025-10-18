# Announcement Domain

**Collection**: `announcements`
**Complexity**: ⭐ (Low)
**Mutability**: Mutable with soft delete

---

## Domain Purpose

The Announcement domain manages **community communications** that inform all members. Announcements are created by admins, are readable by all authenticated users, and can be pinned for visibility.

### Key Concepts

- **Admin-created**: Only admins can create announcements
- **Readable by all**: Any authenticated user can read
- **Soft delete**: Archived, not hard deleted (keeps history)
- **Expiration dates**: Optional, auto-hide after expiry
- **Pinning**: Admins can pin important announcements
- **Audit trail**: Track who created, when, who updated

---

## Firestore Document Structure

```javascript
// Collection: announcements
{
  id: "ann-123",

  // Content
  title: "Community Meeting Scheduled",
  content: "Annual community meeting on October 25th at 8 PM...",

  // Author
  author: "user-123",           // Admin who created

  // Status
  isPinned: false,
  expiresAt: "2025-12-25T23:59:59Z",     // Optional, null = no expiry

  // Soft delete
  deletedAt: null,              // null = active
  deletedBy: null,              // Who deleted

  // Metadata
  createdAt: "2025-10-18T10:00:00Z",
  updatedAt: "2025-10-18T10:00:00Z"
}
```

---

## Entity (Announcement.js)

### Properties
```javascript
{
  id: string,
  title: string,
  content: string,
  author: string,
  isPinned: boolean,
  expiresAt: Date | null,
  deletedAt: Date | null,
  deletedBy: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Methods
```javascript
// Validation
validate()
hasValidExpiry()

// Status checks
isActive()              // deletedAt === null AND (no expiry OR expiry > now)
isExpired()            // expiresAt < now
isDeleted()            // deletedAt !== null

// Permissions
canUpdate(userId)      // author === userId OR user is superadmin
canDelete(userId)      // author === userId OR user is superadmin
canPin(userId)         // user is admin or superadmin

// Display
getDisplayStatus()     // Active, Expired, Deleted

// Static factory
static create(data)
```

### Business Rules
1. **Title required**: 3-100 characters
2. **Content required**: Min 10 characters
3. **Author must be admin**: Only admins create
4. **Expiry optional**: If provided, must be future date
5. **Only author or superadmin can update**: Permission check
6. **Soft delete only**: Never hard delete

---

## DTOs

### CreateAnnouncementDTO
```javascript
{
  title: "Community Meeting Scheduled",
  content: "Annual community meeting on October 25th...",
  isPinned: false,
  expiresAt: "2025-12-25T23:59:59Z"   // Optional
}
```

**Validation**:
- title: Required, 3-100 chars
- content: Required, min 10 chars
- isPinned: Optional, boolean
- expiresAt: Optional, must be future date if provided
- Constraint: creator must be admin

### UpdateAnnouncementDTO
```javascript
{
  title: "New title",
  content: "New content",
  isPinned: true,
  expiresAt: "..."
}
```

**Constraints**:
- Only author or superadmin can update
- Cannot update if deleted

---

## Repository Methods

```javascript
create(announcementData)
findById(id)
findAll()
findActive()                    // Not deleted, not expired
findExpired()                   // expiresAt < now
findDeleted()
findByAuthor(userId)
findPinned()
findPinnedAndActive()          // Pinned + not deleted + not expired
update(id, updates)
softDelete(id, deletedBy, reason)
```

### Firestore Queries
- **Indexes**: author, isPinned, createdAt, expiresAt
- **Compound indexes**: (isPinned, createdAt), (expiresAt, isActive)

---

## Service Methods

### Core CRUD
```javascript
async createAnnouncement(data)
async getAnnouncementById(id)
async getAllAnnouncements()
async getActiveAnnouncements()
async updateAnnouncement(id, updates)
async deleteAnnouncement(id, reason)    // Soft delete
```

### Query Methods
```javascript
async getAnnouncementsByAuthor(userId)
async getPinnedAnnouncements()
async getRecentAnnouncements(days)
async searchAnnouncements(query)
```

### Permissions
```javascript
async canUpdateAnnouncement(userId, announcementId)
async canDeleteAnnouncement(userId, announcementId)
async canPinAnnouncement(userId)        // Admin check
```

### Maintenance
```javascript
async removeExpiredAnnouncements()      // Called by scheduler
```

---

## Controller Endpoints

### Public (Authenticated)
```
GET    /api/announcements              Get active announcements
GET    /api/announcements/pinned       Get pinned announcements
GET    /api/announcements/:id          Get single announcement
GET    /api/announcements/search       Search announcements
```

### Admin-Only
```
POST   /api/announcements              CreateAnnouncementDTO
PUT    /api/announcements/:id          UpdateAnnouncementDTO
DELETE /api/announcements/:id          Soft delete

POST   /api/announcements/:id/pin      Pin announcement
POST   /api/announcements/:id/unpin    Unpin announcement
```

---

## Error Handling

### Expected Errors
- **400 Bad Request**: Invalid title/content, invalid expiry, etc.
- **404 Not Found**: Announcement not found
- **403 Forbidden**: User not author, user not admin
- **400 Bad Request**: Cannot update deleted announcement

### Custom Errors
```javascript
new ValidationError('Expiry date must be in future')
new NotFoundError('Announcement not found')
new ForbiddenError('Only author or superadmin can update')
new ForbiddenError('Cannot update deleted announcement')
```

---

## Business Logic Rules

### 1. Lifecycle
- Created: Admin creates announcement
- Active: Announcement visible until expiry or deletion
- Expired: Automatically after expiryAt date
- Deleted: Soft deleted (archive not removal)

### 2. Expiry
- Optional expiry date
- If set, announcement auto-hides after date
- Service method to clean expired (call from scheduler)

### 3. Pinning
- Only admins can pin
- Pinned announcements always appear first
- Can pin/unpin at any time

### 4. Soft Delete
- Mark as deleted, don't remove
- Keeps history/audit trail
- Who deleted and why recorded

---

## Dependencies

- **announcementRepository**
- **userRepository**: Validate author is admin

---

## Implementation Order

1. Create `Announcement.js`
2. Create DTOs: `CreateAnnouncementDTO.js`, `UpdateAnnouncementDTO.js`
3. Create `announcement.repository.js`
4. Create `announcement.service.js`
5. Create `announcement.controller.js`
6. Create `announcement.routes.js`

---

## Testing Considerations

- Unit test: Expiry check
- Integration test: Only author/superadmin can update
- Integration test: Soft delete
- Integration test: Pin/unpin
- Integration test: Active announcements query excludes expired/deleted

---

## Questions to Validate Understanding

- ✅ Announcements = community communications
- ✅ Created by admins only
- ✅ Readable by all authenticated users
- ✅ Soft delete (archive, not remove)
- ✅ Optional expiry dates
- ✅ Can be pinned for visibility
- ✅ Only author/superadmin can update

---

Does this match your understanding?
