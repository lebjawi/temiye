# Tenmiye Backend Architecture
## Node.js + TypeScript + Express + Firestore
## MINIMAL FIREBASE STACK - NO CLOUD FUNCTIONS

---

## Firebase/GCP Services Used

### ✅ WHAT WE'RE USING (4 services only):

1. **Firestore Database** - Main database, simple CRUD
2. **Cloud Storage** - File storage (receipts, photos)
3. **Firebase Authentication** - ONLY for admin Google sign-in
4. **Service Account** - Backend access to Firebase

### ❌ WHAT WE'RE NOT USING:
- ❌ Cloud Functions (no event listeners)
- ❌ Cloud Run (deploy backend to VPS/Vercel/Railway)
- ❌ Cloud Pub/Sub
- ❌ Cloud Tasks
- ❌ Any other GCP services

**Monthly Cost: ~$3-5** (just Firestore + Storage at 1000 users)

---

## Admin Authentication Flow (Simple Request-Response)

```
FRONTEND (Angular):
1. Admin clicks "Sign in with Google"
2. Firebase Auth SDK handles Google OAuth (client-side)
3. Gets Firebase ID token
4. Sends to backend: POST /api/admin/auth/google { idToken }

BACKEND (Your Express API):
5. Receives request
6. Verifies token with Firebase Admin SDK
7. Checks/creates admin in Firestore admins collection
8. Returns YOUR app's JWT token

FRONTEND:
9. Stores JWT token
10. Uses JWT for all subsequent API calls
```

**Key Point:** NO Cloud Functions. NO event listeners. Simple HTTP request-response.

---

## Backend Architecture

```
┌──────────────────────────────────────────────────────┐
│           YOUR BACKEND (Express.js)                   │
│  Deploy to: VPS / Vercel / Railway / Render          │
├──────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Repositories      │
└─────────────────┬────────────────────────────────────┘
                  │
                  │ Firebase Admin SDK
                  │
     ┌────────────┴────────────┬──────────────────┐
     │                         │                  │
     ▼                         ▼                  ▼
┌─────────┐            ┌──────────────┐   ┌─────────────┐
│Firestore│            │Firebase Auth │   │Cloud Storage│
│Database │            │(Admin Google)│   │   (Files)   │
└─────────┘            └──────────────┘   └─────────────┘
```

---

## Key Implementation: Admin Authentication

### 1. Frontend (Angular)

```typescript
// admin-login.component.ts
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase-config';

async loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  
  // Get Firebase ID token
  const idToken = await result.user.getIdToken();
  
  // Send to YOUR backend
  const response = await fetch('https://your-api.com/api/admin/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store YOUR JWT token
    localStorage.setItem('token', data.data.token);
    this.router.navigate(['/admin/dashboard']);
  }
}
```

### 2. Backend API

```typescript
// src/controllers/admin-auth.controller.ts
import admin from 'firebase-admin';

export class AdminAuthController {
  async loginWithGoogle(req, res) {
    const { idToken } = req.body;
    
    // Verify Google token
    const decoded = await admin.auth().verifyIdToken(idToken);
    
    // Get/create admin in Firestore
    const adminUser = await this.adminService.getOrCreateAdmin({
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
      photoUrl: decoded.picture
    });
    
    // Check approval status
    if (adminUser.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Admin pending approval'
      });
    }
    
    // Generate YOUR JWT
    const token = generateToken(adminUser.id, 'admin');
    
    return res.json({
      success: true,
      data: { token, admin: adminUser }
    });
  }
}
```

### 3. Admin Service

```typescript
// src/services/admin.service.ts
export class AdminService {
  async getOrCreateAdmin(googleData) {
    // Check if admin exists
    let admin = await this.adminRepo.findById(googleData.uid);
    
    if (admin) {
      return admin;
    }
    
    // Create new admin (pending approval)
    admin = await this.adminRepo.create(googleData.uid, {
      email: googleData.email,
      displayName: googleData.displayName,
      photoUrl: googleData.photoUrl,
      adminType: 'community_manager', // Default
      permissions: this.getDefaultPermissions(),
      approvalStatus: 'pending', // Must be approved
      isActive: false,
      loginCount: 0,
      requestedAt: Timestamp.now()
    });
    
    // TODO: Notify super admins
    
    return admin;
  }
  
  async approveAdmin(adminId, adminType, approvedBy) {
    const permissions = this.getPermissionsForType(adminType);
    
    return await this.adminRepo.update(adminId, {
      approvalStatus: 'approved',
      approvedAt: Timestamp.now(),
      approvedBy,
      adminType,
      permissions,
      isActive: true
    });
  }
}
```

---

## Project Structure

```
tenmiye-backend/
├── src/
│   ├── config/
│   │   ├── firebase.ts         # Firebase Admin SDK init
│   │   └── database.ts         # Firestore connection
│   │
│   ├── types/
│   │   └── index.ts            # Shared types
│   │
│   ├── repositories/           # Firestore CRUD
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   ├── admin.repository.ts
│   │   ├── transaction.repository.ts
│   │   └── ...
│   │
│   ├── services/               # Business logic
│   │   ├── auth.service.ts
│   │   ├── admin.service.ts
│   │   ├── user.service.ts
│   │   ├── transaction.service.ts
│   │   └── ...
│   │
│   ├── controllers/            # HTTP handlers
│   │   ├── admin-auth.controller.ts
│   │   ├── user-auth.controller.ts
│   │   ├── transaction.controller.ts
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── authenticate.ts    # JWT verification
│   │   ├── authorize.ts       # Permission checks
│   │   └── error-handler.ts
│   │
│   ├── routes/
│   │   ├── admin-auth.routes.ts
│   │   ├── user-auth.routes.ts
│   │   ├── transaction.routes.ts
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── jwt.utils.ts
│   │   ├── crypto.utils.ts
│   │   └── storage.utils.ts   # Cloud Storage helpers
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env
├── package.json
└── tsconfig.json
```

---

## Firebase Admin SDK Setup

```typescript
// src/config/firebase.ts
import admin from 'firebase-admin';
import { Firestore } from '@google-cloud/firestore';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

export const db: Firestore = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// For Cloud Storage file uploads
export async function uploadFile(
  file: Buffer, 
  path: string,
  contentType: string
): Promise<string> {
  const bucket = storage.bucket();
  const fileRef = bucket.file(path);
  
  await fileRef.save(file, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000'
    }
  });
  
  await fileRef.makePublic();
  
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}
```

---

## Environment Variables

```env
# .env
NODE_ENV=development
PORT=3000

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY_HOURS=24

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=30
```

---

## API Endpoints

### Admin Auth
- `POST /api/admin/auth/google` - Google sign-in
- `POST /api/admin/auth/logout` - Logout
- `GET /api/admin/auth/me` - Current admin

### Admin Management (Super Admin only)
- `GET /api/admin/pending` - Pending approvals
- `POST /api/admin/:id/approve` - Approve admin
- `POST /api/admin/:id/suspend` - Suspend admin
- `GET /api/admin` - List all admins

### User Auth
- `POST /api/auth/register` - User signup
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions
- `POST /api/transactions/:id/approve` - Approve (admin)

### Elections
- `POST /api/elections` - Create election (admin)
- `POST /api/elections/:id/vote` - Cast vote
- `GET /api/elections/:id/results` - View results

---

## Deployment Options

### Option 1: VPS (DigitalOcean, Linode, Hetzner)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and deploy
git clone your-repo
cd tenmiye-backend
npm install
npm run build
pm2 start dist/server.js
```

**Cost: $5-10/month**

### Option 2: Vercel
```bash
# vercel.json
{
  "version": 2,
  "builds": [{ "src": "src/server.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/src/server.ts" }]
}

vercel deploy --prod
```

**Cost: Free tier sufficient**

### Option 3: Railway
```bash
railway login
railway init
railway up
```

**Cost: $5/month (pay as you go)**

---

## Testing

```typescript
// tests/integration/admin-auth.test.ts
describe('Admin Google Auth', () => {
  it('should create pending admin on first login', async () => {
    const mockToken = 'mock-google-token';
    
    const response = await request(app)
      .post('/api/admin/auth/google')
      .send({ idToken: mockToken });
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('pending approval');
  });
  
  it('should return JWT for approved admin', async () => {
    // Setup: Create approved admin
    const admin = await createApprovedAdmin();
    
    const response = await request(app)
      .post('/api/admin/auth/google')
      .send({ idToken: 'mock-token' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});
```

---

## Security Checklist

- [x] Admin passwords NEVER stored (Google OAuth only)
- [x] User passwords hashed with bcrypt (cost 12)
- [x] JWT tokens expire (24h for admins, 7d for users)
- [x] Admin approval workflow
- [x] Firestore Security Rules deployed
- [x] HTTPS enforced
- [x] Rate limiting on auth endpoints
- [x] Input validation

---

## Summary

Your backend is **simple and focused**:

1. ✅ Express API (Node.js + TypeScript)
2. ✅ Firestore for data (simple CRUD)
3. ✅ Cloud Storage for files
4. ✅ Firebase Auth ONLY for admin Google sign-in
5. ✅ NO Cloud Functions
6. ✅ NO complex event listeners
7. ✅ Deploy anywhere (VPS, Vercel, Railway)

**Cost: $3-5/month + your backend hosting**

Simple. Maintainable. Scales to 10,000+ users easily.