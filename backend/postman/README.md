# Tenmiye API - Postman Collection

Complete Postman collection for testing the Tenmiye Community Management API.

## 📦 Quick Start

### 1. Import to Postman

1. Open Postman
2. Click **Import** button
3. Select **Files**
4. Import both files:
   - `Tenmiye.postman_collection.json`
   - `Tenmiye.postman_environment.json`

### 2. Select Environment

1. Click environment dropdown (top right)
2. Select **Tenmiye Backend**
3. Verify `baseUrl` is set to `http://localhost:8080`

### 3. Start Testing!

The collection is organized into folders:
- **Health** - Server health checks
- **Admin Auth** - Admin Google OAuth
- **User Auth** - User registration & login
- **Transactions** - Financial transactions
- **Elections** - Elections & voting
- **Announcements** - Community announcements

---

## 🔐 Authentication Flow

### For User Endpoints:

1. **Register** or **Login** in the "User Auth" folder
2. Token is automatically saved to `{{token}}` variable
3. All subsequent user requests use this token automatically

### For Admin Endpoints:

1. **Google Login** in the "Admin Auth" folder
   - You'll need a Firebase ID token from your Angular app
   - Paste it in the `{{firebaseIdToken}}` environment variable
2. Token is automatically saved to `{{adminToken}}` variable
3. All admin requests use this token automatically

---

## 📋 Environment Variables

The environment includes these variables:

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `baseUrl` | API base URL | Manual |
| `apiPath` | API path prefix | Manual |
| `token` | User JWT token | Auto |
| `adminToken` | Admin JWT token | Auto |
| `userId` | Current user ID | Auto |
| `adminId` | Current admin ID | Auto |
| `transactionId` | Last transaction ID | Auto |
| `electionId` | Last election ID | Auto |
| `announcementId` | Last announcement ID | Auto |
| `firebaseIdToken` | Firebase ID token | Manual |

**Auto-Set**: These are set automatically by test scripts after successful requests
**Manual**: You need to set these manually

---

## 🧪 Testing Workflow

### Complete User Flow:

```
1. Health Check (/api/health)
   → Verify server is running

2. Register (/api/auth/register)
   → Creates user, saves token

3. Login (/api/auth/login)
   → Gets token (already have from register)

4. Get Current User (/api/auth/me)
   → Verify authentication works

5. Create Transaction (/api/transactions)
   → Creates pending transaction

6. List My Transactions (/api/transactions)
   → See your transactions
```

### Complete Admin Flow:

```
1. Get Firebase ID Token from Angular app
   → Sign in with Google in your Angular app
   → Copy the ID token
   → Paste in {{firebaseIdToken}} environment variable

2. Google Login (/api/admin/auth/google)
   → First time: Creates pending admin
   → Response: "Admin pending approval"

3. Super Admin approves your admin
   → Use Firebase Console or existing super admin

4. Google Login again
   → Now returns JWT token
   → Token saved automatically

5. Approve Transaction (/api/transactions/:id/approve)
   → Approve pending user transaction
```

---

## 🎯 Common Use Cases

### Register and Login a User

1. Run **User Auth → Register**
   - Token saved automatically
2. Optionally run **User Auth → Login** to test login
3. Run **User Auth → Get Current User** to verify

### Create and Approve a Transaction

1. Run **Transactions → Create Transaction**
   - Transaction ID saved automatically
2. Switch to admin token
3. Run **Transactions → Approve Transaction (Admin)**
4. Run **Transactions → Get Transaction** to verify status is 'completed'

### Create Election and Vote

1. (As Admin) Run **Elections → Create Election**
   - Election ID saved automatically
2. (As User) Run **Elections → Cast Vote**
3. Run **Elections → Get Results**

---

## 🔧 Troubleshooting

### "Authentication required" error

**Solution**: Make sure you have a valid token
- For user endpoints: Run Login first
- For admin endpoints: Run Google Login first
- Check that {{token}} or {{adminToken}} is set in environment

### "Admin pending approval" error

**Solution**: Your admin account needs approval
1. Contact an existing super admin
2. Or use Firebase Console to manually set `approvalStatus: 'approved'` and `isActive: true`

### "Transaction not found" error

**Solution**: Make sure {{transactionId}} is set
- Run "Create Transaction" first
- Check environment variables

### Connection refused

**Solution**: Make sure backend server is running
```bash
cd backend
npm run dev
```

---

## 📝 Notes

### Firebase ID Token

To get a Firebase ID token for admin login:

1. Open your Angular admin app
2. Sign in with Google
3. In browser console, run:
   ```javascript
   firebase.auth().currentUser.getIdToken().then(token => console.log(token))
   ```
4. Copy the token
5. Paste in Postman environment: `{{firebaseIdToken}}`

### Sample Data

The collection includes sample data for Mauritania:
- Phone format: `+222XXXXXXXX`
- Names in Arabic and French
- Currency: MRU (Mauritanian Ouguiya)

---

## 🚀 Advanced Usage

### Running Multiple Tests

Use **Collection Runner**:
1. Click collection name
2. Click **Run**
3. Select requests to run
4. Click **Run Tenmiye API**

### Automated Testing

Set up test scripts (already included):
- Register/Login automatically save tokens
- Create requests automatically save IDs
- Tests validate responses

### Variables

You can add custom variables:
```javascript
pm.environment.set('myVariable', 'myValue');
pm.environment.get('myVariable');
```

---

## 📞 Support

If you encounter issues:
1. Check server logs in terminal
2. Verify environment variables are set
3. Check Swagger docs: http://localhost:8080/api-docs
4. Review backend README.md

---

**Happy Testing!** 🎉
