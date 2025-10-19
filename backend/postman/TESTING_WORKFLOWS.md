# 🧪 Testing Workflows

Complete testing workflows for all Tenmiye backend features.

## 🎯 Complete End-to-End Test

### 1️⃣ System Setup
```
┌─────────────────────────────────────┐
│ Constants → Initialize Constants    │
└─────────────────────────────────────┘
  ↓ Creates default system settings
```

### 2️⃣ User Registration & Authentication
```
┌─────────────────────────────────────┐
│ Users → Register User               │
└─────────────────────────────────────┘
  ↓ Creates user (status: pending)
  ↓ Saves: test_user_id

┌─────────────────────────────────────┐
│ Users → Approve User                │
└─────────────────────────────────────┘
  ↓ Changes status to: active

┌─────────────────────────────────────┐
│ Users → Login User                  │
└─────────────────────────────────────┘
  ↓ Returns JWT token
  ↓ AUTO-SAVES: auth_token
  ↓ All requests now authenticated!
```

### 3️⃣ Create Organization Structure
```
┌─────────────────────────────────────┐
│ Boards → Create Board               │
└─────────────────────────────────────┘
  ↓ Creates "Executive Board"
  ↓ Saves: test_board_id

┌─────────────────────────────────────┐
│ Boards → Add Member to Board        │
└─────────────────────────────────────┘
  ↓ Adds test_user_id to board
  ↓ Position: President
```

### 4️⃣ Financial Transaction
```
┌─────────────────────────────────────┐
│ Transactions → Create Transaction   │
└─────────────────────────────────────┘
  ↓ Type: contribution
  ↓ Amount: 5000 MRU
  ↓ Saves: test_transaction_id
  ↓ ⚠️ IMMUTABLE (can't update/delete)

┌─────────────────────────────────────┐
│ Transactions → Get All Transactions │
└─────────────────────────────────────┘
  ↓ View all financial records
```

### 5️⃣ Community Announcement
```
┌─────────────────────────────────────┐
│ Announcements → Create Announcement │
└─────────────────────────────────────┘
  ↓ Title: "Community Meeting"
  ↓ isPinned: true
  ↓ Saves: test_announcement_id

┌─────────────────────────────────────┐
│ Announcements → Get Active          │
└─────────────────────────────────────┘
  ↓ Returns non-expired announcements
```

### 6️⃣ Election & Voting
```
┌─────────────────────────────────────┐
│ Elections → Create Election         │
└─────────────────────────────────────┘
  ↓ Status: draft
  ↓ Saves: test_election_id

┌─────────────────────────────────────┐
│ Elections → Start Voting            │
└─────────────────────────────────────┘
  ↓ Status: draft → voting

┌─────────────────────────────────────┐
│ Votes → Cast Vote                   │
└─────────────────────────────────────┘
  ↓ Vote for candidate
  ↓ ⚠️ IMMUTABLE (can't change vote)

┌─────────────────────────────────────┐
│ Elections → Close Voting            │
└─────────────────────────────────────┘
  ↓ Status: voting → closed

┌─────────────────────────────────────┐
│ Elections → Archive Election        │
└─────────────────────────────────────┘
  ↓ Status: closed → archived
```

---

## 🔐 Admin Management Workflow

### Setup Admin System
```
┌─────────────────────────────────────┐
│ Admins → Create Admin               │
└─────────────────────────────────────┘
  ↓ Email: admin@tenmiye.com
  ↓ Status: pending

┌─────────────────────────────────────┐
│ Admins → Get Pending Approvals      │
└─────────────────────────────────────┘
  ↓ View admins waiting approval

┌─────────────────────────────────────┐
│ Admins → Approve Admin              │
└─────────────────────────────────────┘
  ↓ Status: pending → approved
  ↓ Can now login with Google OAuth
```

---

## 🔄 Password Reset Workflow

### User Forgot Password
```
┌─────────────────────────────────────┐
│ Password Reset → Request Reset Code │
└─────────────────────────────────────┘
  ↓ Phone: +22212345678
  ↓ Sends 6-digit code via SMS
  ↓ (Check server logs in dev)

┌─────────────────────────────────────┐
│ Password Reset → Verify Reset Code  │
└─────────────────────────────────────┘
  ↓ Code: 123456
  ↓ Validates code is correct

┌─────────────────────────────────────┐
│ Password Reset → Reset Password     │
└─────────────────────────────────────┘
  ↓ New password set
  ↓ Can login with new password
```

---

## 📁 File Upload Workflows

### Method 1: Backend Proxy Upload
```
┌─────────────────────────────────────┐
│ Storage → Upload File (Backend)    │
└─────────────────────────────────────┘
  ↓ Upload via multipart/form-data
  ↓ File stored in Firebase Storage
  ↓ Saves: test_file_id
  ↓ Status: validated
```

### Method 2: Client-Side Upload (Recommended)
```
┌─────────────────────────────────────┐
│ Storage → Request Upload URL        │
└─────────────────────────────────────┘
  ↓ Filename: profile-picture.jpg
  ↓ Returns signed URL
  ↓ Saves: test_file_id, upload_url

┌─────────────────────────────────────┐
│ External: Upload to Signed URL     │
│ curl -X PUT -T file.jpg "{{url}}"  │
└─────────────────────────────────────┘
  ↓ Direct upload to Firebase Storage
  ↓ No backend involvement

┌─────────────────────────────────────┐
│ Storage → Confirm Upload            │
└─────────────────────────────────────┘
  ↓ Validates file exists
  ↓ Generates download URL
  ↓ Status: validated
```

### File Management
```
┌─────────────────────────────────────┐
│ Storage → Get Files by Owner        │
└─────────────────────────────────────┘
  ↓ ownerRef: test_user_id
  ↓ Returns all user files

┌─────────────────────────────────────┐
│ Storage → Increment Reference       │
└─────────────────────────────────────┘
  ↓ referenceCount++
  ↓ Used when file is linked

┌─────────────────────────────────────┐
│ Storage → Decrement Reference       │
└─────────────────────────────────────┘
  ↓ referenceCount--
  ↓ Used when link removed

┌─────────────────────────────────────┐
│ Storage → Delete File               │
└─────────────────────────────────────┘
  ↓ If referenceCount > 0: soft delete
  ↓ If referenceCount = 0: hard delete
```

---

## 🧪 Testing Immutability

### Transactions Are IMMUTABLE
```
┌─────────────────────────────────────┐
│ Transactions → Create Transaction   │
└─────────────────────────────────────┘
  ↓ Amount: 5000
  ✓ 201 Created

┌─────────────────────────────────────┐
│ Transactions → Update (Should Fail) │
└─────────────────────────────────────┘
  ↓ Try to change amount
  ✗ 405 Method Not Allowed
  ✗ "Transactions are immutable"

┌─────────────────────────────────────┐
│ Transactions → Delete (Should Fail) │
└─────────────────────────────────────┘
  ✗ 405 Method Not Allowed
  ✗ "Transactions are immutable"
```

### Votes Are IMMUTABLE
```
┌─────────────────────────────────────┐
│ Votes → Cast Vote                   │
└─────────────────────────────────────┘
  ↓ Candidate: user-123
  ✓ 201 Created

┌─────────────────────────────────────┐
│ Votes → Update Vote (Should Fail)   │
└─────────────────────────────────────┘
  ↓ Try to change candidate
  ✗ 405 Method Not Allowed
  ✗ "Votes are immutable"

┌─────────────────────────────────────┐
│ Votes → Cast Second Vote (Fails)    │
└─────────────────────────────────────┘
  ↓ Same user, same election
  ✗ 409 Conflict
  ✗ "User already voted in this election"
```

---

## 🔄 Testing State Machines

### Election State Machine
```
draft → voting → closed → archived

┌─────────────────────────────────────┐
│ Elections → Create Election         │
└─────────────────────────────────────┘
  ✓ Status: draft
  ✓ Can update election details
  ✓ Can delete election

┌─────────────────────────────────────┐
│ Elections → Start Voting            │
└─────────────────────────────────────┘
  ✓ Status: draft → voting
  ✗ Can't update election details
  ✗ Can't delete election
  ✓ Users can vote

┌─────────────────────────────────────┐
│ Elections → Close Voting            │
└─────────────────────────────────────┘
  ✓ Status: voting → closed
  ✗ Users can't vote anymore
  ✓ Results visible

┌─────────────────────────────────────┐
│ Elections → Archive Election        │
└─────────────────────────────────────┘
  ✓ Status: closed → archived
  ✓ Historical record
```

### Invalid Transitions
```
┌─────────────────────────────────────┐
│ Try: draft → closed (Skip voting)  │
└─────────────────────────────────────┘
  ✗ 409 Conflict
  ✗ "Invalid state transition"

┌─────────────────────────────────────┐
│ Try: closed → voting (Go back)     │
└─────────────────────────────────────┘
  ✗ 409 Conflict
  ✗ "Invalid state transition"
```

---

## 🔒 Testing Protected Deletions

### Can't Delete Predefined Roles
```
┌─────────────────────────────────────┐
│ Roles → Delete Role (member)        │
└─────────────────────────────────────┘
  ✗ 409 Conflict
  ✗ "Cannot delete predefined role"

Predefined Roles:
  • member
  • board
  • admin
  • superadmin
```

### Can't Delete Predefined Tiers
```
┌─────────────────────────────────────┐
│ Tiers → Delete Tier (bronze)        │
└─────────────────────────────────────┘
  ✗ 409 Conflict
  ✗ "Cannot delete predefined tier"

Predefined Tiers:
  • bronze
  • silver
  • gold
  • platinum
```

### Can't Delete If Assigned
```
┌─────────────────────────────────────┐
│ Roles → Create Custom Role          │
└─────────────────────────────────────┘
  ✓ 201 Created (id: moderator)

┌─────────────────────────────────────┐
│ Users → Update User (assign role)   │
└─────────────────────────────────────┘
  ✓ User now has "moderator" role

┌─────────────────────────────────────┐
│ Roles → Delete Role (moderator)     │
└─────────────────────────────────────┘
  ✗ 409 Conflict
  ✗ "Role is assigned to 1 user(s)"
```

---

## 📊 Testing Pagination

### List Endpoints with Pagination
```
┌─────────────────────────────────────┐
│ Users → Get All Users               │
│ ?page=1&limit=20                    │
└─────────────────────────────────────┘
  ✓ Returns first 20 users
  ✓ Response includes pagination meta

┌─────────────────────────────────────┐
│ Users → Get All Users               │
│ ?page=2&limit=20                    │
└─────────────────────────────────────┘
  ✓ Returns next 20 users

Response Format:
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 🎯 Performance Testing

### Test Cache Behavior
```
┌─────────────────────────────────────┐
│ Constants → Get All Constants       │
└─────────────────────────────────────┘
  ↓ First request: Reads from Firestore
  ↓ Response time: ~200ms

┌─────────────────────────────────────┐
│ Constants → Get All Constants       │
│ (within 5 minutes)                  │
└─────────────────────────────────────┘
  ↓ Reads from cache
  ↓ Response time: ~5ms
  ✓ 40x faster!

┌─────────────────────────────────────┐
│ Wait 5+ minutes...                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Constants → Get All Constants       │
└─────────────────────────────────────┘
  ↓ Cache expired
  ↓ Reads from Firestore again
  ↓ Response time: ~200ms
```

---

## 🔍 Error Handling Tests

### Validation Errors (400)
```
┌─────────────────────────────────────┐
│ Users → Register User               │
│ Invalid phone: "123"                │
└─────────────────────────────────────┘
  ✗ 400 Bad Request
  ✗ "Phone must start with +222"

┌─────────────────────────────────────┐
│ Transactions → Create Transaction   │
│ Amount: -100                        │
└─────────────────────────────────────┘
  ✗ 400 Bad Request
  ✗ "Amount must be positive"
```

### Unauthorized (401)
```
┌─────────────────────────────────────┐
│ Clear auth_token in environment     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Users → Get All Users               │
└─────────────────────────────────────┘
  ✗ 401 Unauthorized
  ✗ "Missing or invalid token"
```

### Not Found (404)
```
┌─────────────────────────────────────┐
│ Users → Get User by ID              │
│ ID: "nonexistent-user-id"           │
└─────────────────────────────────────┘
  ✗ 404 Not Found
  ✗ "User not found"
```

### Conflict (409)
```
┌─────────────────────────────────────┐
│ Users → Register User               │
│ Phone: +22212345678 (exists)        │
└─────────────────────────────────────┘
  ✗ 409 Conflict
  ✗ "User with this phone exists"
```

---

## 💡 Tips

### Run Workflows in Order
For best results, run workflows top to bottom:
1. System Setup first
2. Then User Registration
3. Then feature-specific workflows

### Check Environment Variables
After each request, check:
- Postman Console (View → Show Postman Console)
- Environment variables (click eye icon)
- Verify auto-saved values

### Use Collection Runner
To run entire workflows:
1. Click collection "..."
2. Select "Run collection"
3. Choose folder/requests
4. Click "Run"

### Export Test Results
After running tests:
1. Collection Runner → Export Results
2. Save as JSON for documentation
3. Share with team

---

**Happy Testing!** 🧪
