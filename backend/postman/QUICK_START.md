# 🚀 Postman Quick Start Guide

Get started testing the Tenmiye Backend API in 2 minutes!

## ⚡ 1-2-3 Setup

### 1️⃣ Import (30 seconds)

1. Open Postman
2. Click **Import** (top left)
3. Drag these 2 files:
   - `Tenmiye-Backend.postman_collection.json`
   - `Tenmiye-Backend.postman_environment.json`

### 2️⃣ Select Environment (5 seconds)

1. Environment dropdown (top right)
2. Select **"Tenmiye Backend - Local"**

### 3️⃣ Start Backend (30 seconds)

```bash
cd backend
npm run dev
```

✅ You're ready to test!

## 🎯 First Test (30 seconds)

1. Open collection: **Tenmiye Backend API**
2. Navigate to: **Health Check** → **Health Check**
3. Click **Send**
4. ✅ Should see: `{ "success": true, "message": "Server is running" }`

## 🔐 Authentication Flow (2 minutes)

### Step 1: Initialize System
```
Constants → Initialize Constants
```
Click **Send**

### Step 2: Register a User
```
Users → Register User
```
Click **Send**
- ✅ Creates user
- ✅ Auto-saves user ID to `{{test_user_id}}`

### Step 3: Approve User
```
Users → Approve User
```
Click **Send**
- Uses saved `{{test_user_id}}`

### Step 4: Login
```
Users → Login User
```
Click **Send**
- ✅ Returns JWT token
- ✅ **Auto-saves to `{{auth_token}}`**
- ✅ All requests now authenticated!

### Step 5: Test Protected Endpoint
```
Users → Get User by ID
```
Click **Send**
- Uses saved `{{test_user_id}}`
- Uses saved `{{auth_token}}`
- ✅ Returns user data!

## 🎉 That's It!

You now have:
- ✅ Working authentication
- ✅ Auto-managed tokens
- ✅ Saved entity IDs
- ✅ Full API access

## 📚 Next Steps

### Explore the API
Each folder in the collection represents a domain:
- **Constants** - System config
- **Users** - User management
- **Roles** - Permissions
- **Tiers** - Membership levels
- **Boards** - Organization structure
- **Transactions** - Financial records
- **Elections** - Voting system
- **Storage** - File uploads

### Test Immutability
Try updating a transaction:
```
Transactions → Create Transaction
Transactions → Update Transaction (Should Fail)
```
Returns `405 Method Not Allowed` - transactions are IMMUTABLE!

### Test State Machines
Create and manage an election:
```
Elections → Create Election (draft)
Elections → Start Voting (draft → voting)
Votes → Cast Vote
Elections → Close Voting (voting → closed)
Elections → Archive Election (closed → archived)
```

### Upload Files
Test the 3-step upload flow:
```
Storage → Request Upload URL
  ↓ (upload file to signed URL)
Storage → Confirm Upload
```

## 💡 Pro Tips

### Auto-Saved Variables
These variables are saved automatically:
- `{{auth_token}}` - JWT token (from login)
- `{{test_user_id}}` - User ID (from register)
- `{{test_board_id}}` - Board ID (from create board)
- `{{test_transaction_id}}` - Transaction ID
- `{{test_election_id}}` - Election ID

### No Manual Token Management!
The collection automatically:
1. Saves token when you login
2. Applies it to all protected endpoints
3. You never need to copy/paste tokens!

### Check Postman Console
View → Show Postman Console to see:
- Auto-saved variables
- Token management
- Response logs

## 🐛 Troubleshooting

### "Unauthorized" error
→ Run **Users → Login User** to refresh token

### Variables not saving
→ Check environment is selected (top right dropdown)

### Server not responding
→ Verify backend is running: `npm run dev`

## 📖 Full Documentation

For detailed docs, see:
- **README.md** - Complete collection documentation
- **API Docs** - http://localhost:3000/api-docs (Swagger UI)

---

**Ready to test!** 🚀
