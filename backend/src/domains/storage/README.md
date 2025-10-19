# Storage Domain Implementation

## Overview

The Storage domain provides file upload, management, and download functionality using Firebase Storage with Firestore metadata tracking. It supports both **backend proxy upload** and **client-side direct upload** methods.

## Architecture

```
Controller → Service → Repository → Firebase (Firestore + Storage)
```

## Components

### 1. Entities (`entities/StorageFile.ts`)
- **StorageFile**: File metadata entity with validation, status tracking, and reference counting

### 2. DTOs (`dtos/`)
- **UploadUrlRequestDTO**: Request DTO for client-side upload URL generation
- **ConfirmUploadDTO**: Confirmation DTO after client-side upload

### 3. Repositories (`repositories/storage.repository.ts`)
- **StorageRepository**: Firestore operations for file metadata
  - CRUD operations
  - Reference count management (increment/decrement)
  - Soft delete
  - Filtering and pagination

### 4. Services (`services/`)
- **FileValidationService**: File validation rules by category
  - Size limits
  - MIME type validation
  - Extension validation
  - Storage path generation

- **StorageService**: Business logic for file operations
  - Backend proxy upload
  - Client-side signed URL generation
  - File retrieval with download URLs
  - Soft/hard delete
  - Reference counting

### 5. Controllers (`controllers/storage.controller.ts`)
- **StorageController**: HTTP request handling
  - All endpoints documented with Swagger

### 6. Routes (`storage.routes.ts`)
- Multer configuration for multipart/form-data
- Lazy controller initialization
- Both upload methods registered

### 7. Error Handling (`shared/errors/`)
- **FileReferencedError**: Thrown when attempting to delete a referenced file (HTTP 409)

## Upload Methods

### Method 1: Backend Proxy Upload (Recommended for testing)

**Endpoint**: `POST /api/storage/upload`

**Request**: `multipart/form-data`
- `file`: Binary file
- `category`: File category (user-profile, election-image, etc.)
- `ownerRef`: Owner entity ID
- `ownerType`: Owner entity type (user, election, blog, board, system)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "fileId123",
    "originalName": "test.png",
    "storagePath": "users/user123/profile-fileId123.png",
    "downloadUrl": "https://storage.googleapis.com/...",
    "mimeType": "image/png",
    "sizeBytes": 134722,
    "category": "user-profile",
    "ownerRef": "user123",
    "ownerType": "user",
    "uploadedBy": "user123",
    "status": "validated",
    "referenceCount": 0,
    "deleted": false,
    "createdAt": "2025-10-18T...",
    "updatedAt": "2025-10-18T..."
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -F "file=@test.png" \
  -F "category=user-profile" \
  -F "ownerRef=vicuydQ9j0HrCCG7gTFn" \
  -F "ownerType=user"
```

### Method 2: Client-Side Upload (Recommended for production)

**Step 1**: Request upload URL
```bash
POST /api/storage/upload-url
{
  "fileName": "profile.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 2048000,
  "category": "user-profile",
  "ownerRef": "user123",
  "ownerType": "user"
}
```

**Step 2**: Upload to signed URL
```bash
PUT <uploadUrl>
Content-Type: image/jpeg
<binary file data>
```

**Step 3**: Confirm upload
```bash
POST /api/storage/confirm
{
  "fileId": "fileId123"
}
```

## Validation Rules

### user-profile
- Max size: 5 MB
- MIME types: `image/jpeg`, `image/png`, `image/webp`
- Extensions: `jpg`, `jpeg`, `png`, `webp`

### election-image
- Max size: 10 MB
- MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Extensions: `jpg`, `jpeg`, `png`, `webp`, `gif`

### blog-feature
- Max size: 10 MB
- MIME types: `image/jpeg`, `image/png`, `image/webp`
- Extensions: `jpg`, `jpeg`, `png`, `webp`

### blog-attachment
- Max size: 50 MB
- MIME types: `application/pdf`, `image/jpeg`, `image/png`
- Extensions: `pdf`, `jpg`, `jpeg`, `png`

### board-logo
- Max size: 2 MB
- MIME types: `image/png`, `image/svg+xml`, `image/webp`
- Extensions: `png`, `svg`, `webp`

### community-asset
- Max size: 10 MB
- MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`
- Extensions: `jpg`, `jpeg`, `png`, `webp`, `svg`

## Storage Path Pattern

```
{folder}/{ownerRef}/{type}-{fileId}.{ext}
```

**Examples**:
- `users/user123/profile-fileId456.jpg` (user-profile)
- `elections/elec789/image-fileId456.png` (election-image)
- `blogs/blog123/attachment-fileId456.pdf` (blog-attachment)
- `boards/board456/logo-fileId789.svg` (board-logo)
- `community/asset-fileId123.png` (community-asset)

## Reference Counting

Files track how many entities reference them via the `referenceCount` field. This prevents deletion of files still in use.

### When to increment/decrement:

**Increment** (`POST /files/{fileId}/increment-reference`):
- User updates `profilePictureRef` to a fileId
- Election adds an image
- Blog adds a feature image or attachment

**Decrement** (`POST /files/{fileId}/decrement-reference`):
- User removes/changes `profilePictureRef`
- Election is deleted
- Blog attachment is removed

**Deletion rules**:
- Cannot delete if `referenceCount > 0` (throws `FileReferencedError`)
- Soft delete sets `deleted: true` but keeps file in storage
- Hard delete (admin only) removes file from storage

## All Endpoints

### Upload
- `POST /api/storage/upload` - Backend proxy upload (multipart/form-data)
- `POST /api/storage/upload-url` - Request signed upload URL (client-side)
- `POST /api/storage/confirm` - Confirm client-side upload

### Retrieval
- `GET /api/storage/files` - List files (with pagination and filters)
- `GET /api/storage/files/:fileId` - Get file metadata + download URL
- `GET /api/storage/files/owner/:ownerRef` - Get files by owner

### Management
- `DELETE /api/storage/files/:fileId` - Soft delete file
- `POST /api/storage/files/:fileId/increment-reference` - Increment reference count
- `POST /api/storage/files/:fileId/decrement-reference` - Decrement reference count

## Firebase Storage Setup

### IMPORTANT: Before Testing

The Firebase Storage bucket must be created in the Firebase Console:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `tenmiye-gdy`
3. Navigate to **Storage** in left sidebar
4. Click **Get Started**
5. Choose security rules (start in production mode)
6. Bucket will be created at: `tenmiye-gdy.appspot.com`

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can read their own files
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Admins can read all files
    match /{allPaths=**} {
      allow read: if request.auth != null &&
        firestore.get(/databases/(default)/documents/admins/$(request.auth.uid)).data.approvalStatus == 'approved';
      allow write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/admins/$(request.auth.uid)).data.approvalStatus == 'approved';
    }
  }
}
```

## Testing

### 1. Create Firebase Storage Bucket

See **Firebase Storage Setup** section above.

### 2. Test Backend Proxy Upload

```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -F "file=@src/shared/assets/test.png" \
  -F "category=user-profile" \
  -F "ownerRef=vicuydQ9j0HrCCG7gTFn" \
  -F "ownerType=user" | jq .
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "originalName": "test.png",
    "downloadUrl": "https://storage.googleapis.com/...",
    "status": "validated"
  }
}
```

### 3. Get File Metadata

```bash
curl http://localhost:3000/api/storage/files/{fileId} | jq .
```

### 4. Update User Profile

```bash
curl -X PUT http://localhost:3000/api/users/vicuydQ9j0HrCCG7gTFn \
  -H "Content-Type: application/json" \
  -d '{"profilePictureRef": "{fileId}"}' | jq .
```

### 5. Increment Reference Count

```bash
curl -X POST http://localhost:3000/api/storage/files/{fileId}/increment-reference | jq .
```

### 6. List Files

```bash
curl http://localhost:3000/api/storage/files?category=user-profile | jq .
```

## Integration with Other Domains

### User Domain

**When updating user profile picture**:

```typescript
// 1. Upload file
const uploadResponse = await storageService.uploadFile(file, 'user-profile', userId, 'user', userId);
const fileId = uploadResponse.id;

// 2. Update user profile
await userService.update(userId, { profilePictureRef: fileId });

// 3. Increment reference count
await storageService.incrementReferenceCount(fileId);

// 4. If user had old profile picture, decrement its reference
if (oldProfilePictureRef) {
  await storageService.decrementReferenceCount(oldProfilePictureRef);
}
```

### Election Domain

**When creating election with image**:

```typescript
// 1. Upload election image
const uploadResponse = await storageService.uploadFile(file, 'election-image', electionId, 'election', userId);

// 2. Create election with imageRef
await electionService.create({
  ...electionData,
  imageRef: uploadResponse.id
});

// 3. Increment reference count
await storageService.incrementReferenceCount(uploadResponse.id);
```

### Blog Domain

**When adding blog attachments**:

```typescript
// 1. Upload feature image
const featureImage = await storageService.uploadFile(file, 'blog-feature', blogId, 'blog', userId);

// 2. Upload attachments
const attachments = await Promise.all(
  files.map(f => storageService.uploadFile(f, 'blog-attachment', blogId, 'blog', userId))
);

// 3. Create blog with file references
await blogService.create({
  ...blogData,
  featureImageRef: featureImage.id,
  attachmentRefs: attachments.map(a => a.id)
});

// 4. Increment all reference counts
await storageService.incrementReferenceCount(featureImage.id);
await Promise.all(attachments.map(a => storageService.incrementReferenceCount(a.id)));
```

## Error Handling

### ValidationError (400)
- Invalid file type/size
- Missing required fields
- File extension not allowed

### NotFoundError (404)
- File not found in Firestore
- File not found in Storage

### FileReferencedError (409)
- Attempting to delete a file with `referenceCount > 0`

## Future Enhancements

- [ ] Thumbnail generation for images (using Sharp or Cloud Functions)
- [ ] Image dimension detection
- [ ] Virus scanning integration
- [ ] CDN integration for faster delivery
- [ ] Cleanup job for soft-deleted files (30-day grace period)
- [ ] Storage quota tracking per user
- [ ] Duplicate file detection (hash-based)
- [ ] Batch upload support
- [ ] Progress tracking for large files

## Notes

- All download URLs expire after 10 years (far-future for simplicity)
- Files are stored in memory during upload (max 50MB)
- Firestore metadata is created before Storage upload to get fileId
- If Storage upload fails, Firestore metadata is soft-deleted
- Multer is configured with 50MB global limit
- Reference counting is manual (not automatic via Firestore triggers)

## Dependencies

```json
{
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.12",
  "firebase-admin": "^12.0.0"
}
```
