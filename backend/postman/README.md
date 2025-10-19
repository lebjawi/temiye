# Tenmiye Backend - Postman Collection

Complete Postman collection and environment for testing the Tenmiye Backend API.

## 📦 Files

- **Tenmiye-Backend.postman_collection.json** - Complete API collection with all endpoints
- **Tenmiye-Backend.postman_environment.json** - Environment variables for local development

## 🚀 Quick Start

### 1. Import into Postman

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop both JSON files:
   - `Tenmiye-Backend.postman_collection.json`
   - `Tenmiye-Backend.postman_environment.json`
4. Click **Import**

### 2. Select Environment

1. Click the environment dropdown (top right)
2. Select **Tenmiye Backend - Local**
3. Verify `base_url` is set to `http://localhost:3000`

### 3. Start Your Backend

```bash
cd backend
npm run dev
```

Server should be running at `http://localhost:3000`

### 4. Test the API

1. Open the collection in Postman
2. Start with **Health Check** → **Health Check**
3. Click **Send**
4. Should receive: `{ "success": true, "message": "Server is running" }`

## 🔐 Authentication Flow

The collection automatically manages authentication tokens for you.

### Register & Login Flow

1. **Register User**
   ```
   POST /api/users/register
   ```
   - Creates new user
   - Auto-saves `test_user_id` to environment

2. **Login**
   ```
   POST /api/users/login
   ```
   - Returns JWT token
   - **Auto-saves token to `auth_token` environment variable**
   - Token automatically used for all protected endpoints

3. **Use Protected Endpoints**
   - All endpoints now use the saved token
   - No manual token management needed!

### Token Details

- Token stored in: `{{auth_token}}` environment variable
- Applied via: Collection-level Bearer Auth
- Expiry: 7 days (configurable in backend .env)
- Auto-refresh: Re-login when expired

## 📚 Collection Structure

### 1. Health Check
- **GET** `/health` - Server status check

### 2. Constants (System Configuration)
- **GET** `/api/constants` - Get all constants (cached 5 min)
- **GET** `/api/constants/min-contribution` - Get min contribution
- **GET** `/api/constants/max-contribution` - Get max contribution
- **GET** `/api/constants/voting-duration` - Get voting duration
- **PUT** `/api/constants` - Update constants
- **POST** `/api/constants/initialize` - Create defaults

### 3. Users (Phone + Password Auth)
- **POST** `/api/users/register` - Register (no auth)
- **POST** `/api/users/login` - Login (no auth, auto-saves token)
- **GET** `/api/users` - List all users (paginated)
- **GET** `/api/users/pending` - Pending approvals
- **GET** `/api/users/:id` - Get user by ID
- **PUT** `/api/users/:id` - Update user
- **POST** `/api/users/:id/approve` - Approve user
- **POST** `/api/users/:id/ban` - Ban user

### 4. Roles (Permission Management)
- **GET** `/api/roles` - List all roles
- **GET** `/api/roles/:id` - Get role by ID
- **GET** `/api/roles/level/:level` - Get roles by level
- **POST** `/api/roles` - Create role
- **PUT** `/api/roles/:id` - Update role
- **DELETE** `/api/roles/:id` - Delete role

### 5. Tiers (Membership Levels)
- **GET** `/api/tiers` - List all tiers
- **GET** `/api/tiers/:id` - Get tier by ID
- **POST** `/api/tiers` - Create tier
- **PUT** `/api/tiers/:id` - Update tier
- **DELETE** `/api/tiers/:id` - Delete tier

### 6. Admins (Google OAuth)
- **POST** `/api/admins` - Create admin (requires approval)
- **GET** `/api/admins` - List all admins
- **GET** `/api/admins/pending` - Pending approvals
- **GET** `/api/admins/:id` - Get admin by ID
- **POST** `/api/admins/:id/approve` - Approve admin
- **POST** `/api/admins/:id/reject` - Reject admin
- **DELETE** `/api/admins/:id` - Delete admin

### 7. Password Reset
- **POST** `/api/password-reset/request` - Request reset code (no auth)
- **POST** `/api/password-reset/verify` - Verify code (no auth)
- **POST** `/api/password-reset/reset` - Reset password (no auth)

### 8. Boards (Hierarchical Structure)
- **POST** `/api/boards` - Create board
- **GET** `/api/boards` - List all boards
- **GET** `/api/boards/:id` - Get board by ID
- **PUT** `/api/boards/:id` - Update board
- **DELETE** `/api/boards/:id` - Delete board
- **POST** `/api/boards/:id/members` - Add member
- **DELETE** `/api/boards/:id/members/:userId` - Remove member
- **POST** `/api/boards/:id/archive` - Archive board

### 9. Transactions (IMMUTABLE)
- **POST** `/api/transactions` - Create transaction
- **GET** `/api/transactions` - List transactions (paginated)
- **GET** `/api/transactions/:id` - Get transaction by ID
- **PUT** `/api/transactions/:id` - ⚠️ Returns 405 (IMMUTABLE)
- **DELETE** `/api/transactions/:id` - ⚠️ Returns 405 (IMMUTABLE)

### 10. Announcements
- **POST** `/api/announcements` - Create announcement
- **GET** `/api/announcements` - Get active announcements
- **GET** `/api/announcements/:id` - Get by ID
- **PUT** `/api/announcements/:id` - Update announcement
- **DELETE** `/api/announcements/:id` - Soft delete

### 11. Elections (State Machine)
- **POST** `/api/elections` - Create election (draft)
- **GET** `/api/elections` - List elections
- **GET** `/api/elections/:id` - Get by ID
- **PUT** `/api/elections/:id` - Update (draft only)
- **DELETE** `/api/elections/:id` - Delete (draft only)
- **POST** `/api/elections/:id/start-voting` - Draft → Voting
- **POST** `/api/elections/:id/close-voting` - Voting → Closed
- **POST** `/api/elections/:id/archive` - Closed → Archived

### 12. Votes (IMMUTABLE)
- **POST** `/api/votes` - Cast vote (one per user per election)
- **GET** `/api/votes/elections/:electionId` - Get election votes
- **PUT** `/api/votes/:id` - ⚠️ Returns 405 (IMMUTABLE)
- **DELETE** `/api/votes/:id` - ⚠️ Returns 405 (IMMUTABLE)

### 13. Storage (File Management)
#### Backend Proxy Upload
- **POST** `/api/storage/upload` - Upload via backend (multipart/form-data)

#### Client-side Upload (3-step)
1. **POST** `/api/storage/upload-url` - Request signed URL
2. **PUT** to signed URL - Upload file (client-side)
3. **POST** `/api/storage/confirm` - Validate & finalize

#### File Management
- **GET** `/api/storage/files` - List files (paginated)
- **GET** `/api/storage/files/:fileId` - Get by ID
- **GET** `/api/storage/files/owner/:ownerRef` - Get by owner
- **DELETE** `/api/storage/files/:fileId` - Delete file
- **POST** `/api/storage/files/:fileId/increment-reference` - Inc ref count
- **POST** `/api/storage/files/:fileId/decrement-reference` - Dec ref count

## 🔧 Environment Variables

### Auto-Managed Variables

These are automatically saved by test scripts:

| Variable | Source | Description |
|----------|--------|-------------|
| `auth_token` | Login endpoint | JWT token (auto-saved) |
| `test_user_id` | Register endpoint | Created user ID |
| `test_board_id` | Create board | Created board ID |
| `test_transaction_id` | Create transaction | Created transaction ID |
| `test_announcement_id` | Create announcement | Created announcement ID |
| `test_election_id` | Create election | Created election ID |
| `test_file_id` | Upload/request URL | Created file ID |
| `upload_url` | Request upload URL | Signed upload URL |
| `min_contribution` | Get constants | Min contribution amount |
| `max_contribution` | Get constants | Max contribution amount |
| `voting_duration_days` | Get constants | Voting duration |

### Manual Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `base_url` | `http://localhost:3000` | API base URL |

## 📋 Testing Workflows

### Complete User Registration & Login Flow

1. **Constants** → **Initialize Constants**
   - Sets up system defaults

2. **Users** → **Register User**
   - Creates user with status `pending`
   - Saves `test_user_id`

3. **Users** → **Approve User**
   - Changes status to `active`

4. **Users** → **Login User**
   - Returns JWT token
   - **Auto-saves to `auth_token`**

5. **Users** → **Get User by ID**
   - Uses saved `test_user_id`
   - Authenticated with saved token

### Transaction Testing Flow

1. **Transactions** → **Create Transaction**
   - Creates immutable transaction
   - Saves `test_transaction_id`

2. **Transactions** → **Get Transaction by ID**
   - Retrieves created transaction

3. **Transactions** → **Update Transaction (Should Fail)**
   - Returns `405 Method Not Allowed`
   - Transactions are IMMUTABLE

4. **Transactions** → **Delete Transaction (Should Fail)**
   - Returns `405 Method Not Allowed`
   - Transactions are IMMUTABLE

### Election & Voting Flow

1. **Elections** → **Create Election**
   - Creates election in `draft` state
   - Saves `test_election_id`

2. **Elections** → **Start Voting**
   - Transitions to `voting` state

3. **Votes** → **Cast Vote**
   - Cast vote for candidate
   - One vote per user per election

4. **Votes** → **Get Votes by Election**
   - View all votes (admin only in production)

5. **Elections** → **Close Voting**
   - Transitions to `closed` state

6. **Elections** → **Archive Election**
   - Transitions to `archived` state

### File Upload Flow (Client-side)

1. **Storage** → **Request Upload URL**
   - Get signed URL
   - Saves `test_file_id` and `upload_url`

2. **Use external tool (curl/browser)** to upload:
   ```bash
   curl -X PUT -T /path/to/file.jpg "{{upload_url}}"
   ```

3. **Storage** → **Confirm Upload**
   - Validates file exists
   - Generates download URL
   - Updates status to `validated`

## 🎯 Tips & Tricks

### Automatic Token Management

The collection uses test scripts to automatically:
1. Save the JWT token from login
2. Apply it to all requests via collection auth
3. Save entity IDs for chaining requests

You don't need to manually copy/paste tokens!

### Using Saved IDs

Requests use environment variables like:
- `{{test_user_id}}`
- `{{test_board_id}}`
- `{{test_transaction_id}}`

These are auto-populated when you create entities.

### Pagination

List endpoints support pagination:
```
GET /api/users?page=1&limit=20
```

Default: `page=1`, `limit=20`
Max: `limit=100`

### Error Testing

Included requests that should fail (e.g., updating transactions):
- Returns proper HTTP status codes
- Returns error in standard format:
  ```json
  {
    "success": false,
    "error": {
      "message": "Error description",
      "statusCode": 405
    }
  }
  ```

### Console Logs

Check Postman console (View → Show Postman Console) to see:
- Auto-saved variables
- Token management
- Response data

## 🌐 Production Environment

To test against production:

1. Duplicate the environment
2. Rename to "Tenmiye Backend - Production"
3. Update `base_url` to production URL
4. Update any other production-specific values

## 📖 API Documentation

For complete API documentation with schemas:
- Start backend: `npm run dev`
- Visit: http://localhost:3000/api-docs
- Interactive Swagger UI with all endpoints

## 🐛 Troubleshooting

### "Unauthorized" errors
- Run **Users** → **Login User** to refresh token
- Check token in environment variables (should not be empty)

### Variables not saving
- Check test scripts in request (Tests tab)
- Ensure environment is selected (top right dropdown)
- Check Postman console for errors

### Server not responding
- Verify backend is running: `npm run dev`
- Check `base_url` matches your server
- Check firewall/port 3000 is open

### File upload fails
- For backend proxy: Ensure file is selected in form-data
- For client-side: Use the signed URL within 15 minutes
- Check file size limits (50MB max)

## 📝 Notes

### Immutable Domains
- **Transactions**: Cannot UPDATE or DELETE
- **Votes**: Cannot UPDATE or DELETE
- Both return `405 Method Not Allowed`

### State Machines
- **Elections**: draft → voting → closed → archived
- **Users**: pending → active → banned/inactive
- Invalid transitions return `409 Conflict`

### Predefined Data
Cannot delete predefined:
- **Roles**: member, board, admin, superadmin
- **Tiers**: bronze, silver, gold, platinum

### Caching
Some endpoints are cached:
- **Constants**: 5 minutes
- May see stale data briefly after updates

## 🔗 Related Documentation

- Backend README: `../README.md`
- API Docs: http://localhost:3000/api-docs
- Environment Setup: `../.env.example`

---

**Last Updated**: 2025-10-18
**Collection Version**: 1.0.0
**Environment**: Local Development
