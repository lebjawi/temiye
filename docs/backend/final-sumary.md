# Tenmiye - Complete Architecture Overview
## Minimal Firebase Stack - Final Specification

---

## 🎯 What You Asked For

You want a **minimal Firebase/GCP setup** with:
- ✅ Firestore (database CRUD)
- ✅ Cloud Storage (file uploads)
- ✅ Firebase Auth (admin Google sign-in ONLY)
- ✅ Service Account (backend access)
- ❌ NO Cloud Functions
- ❌ NO event listeners
- ❌ NO Cloud Run

**Simple request-response backend deployed to your own server.**

---

## 📦 Deliverables

### 1. **types.ts** (13KB)
Complete TypeScript type system with:
- User, Admin, Transaction, Election, Board, etc.
- Clear documentation of Firebase services used
- Admin authentication flow explained
- All input/output types

### 2. **firestore.rules** (17KB)
Security rules covering:
- User authentication and authorization
- Admin approval workflow
- Financial transaction protections
- Secret vote handling
- Role-based permissions

### 3. **BACKEND_ARCHITECTURE.md** (12KB)
Implementation guide with:
- Minimal Firebase stack (4 services only)
- Admin Google auth flow (request-response)
- Project structure
- Code examples
- Deployment options (VPS/Vercel/Railway)
- **Total cost: $3-5/month + hosting**

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│        FRONTEND (Angular App)                    │
│                                                  │
│  ┌──────────────┐         ┌──────────────┐     │
│  │ User Login   │         │ Admin Login  │     │
│  │ Phone+Pass   │         │ Google OAuth │     │
│  └──────┬───────┘         └──────┬───────┘     │
└─────────┼───────────────────────┼──────────────┘
          │                       │
          │ JWT                   │ Firebase ID Token
          │                       │
┌─────────▼───────────────────────▼──────────────┐
│     YOUR BACKEND (Express + TypeScript)        │
│     Deploy to: VPS / Vercel / Railway          │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Routes                                  │  │
│  │    ↓                                     │  │
│  │  Controllers                             │  │
│  │    ↓                                     │  │
│  │  Services (Business Logic)               │  │
│  │    ↓                                     │  │
│  │  Repositories (Firestore CRUD)           │  │
│  └──────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Firebase Admin SDK
                  │
     ┌────────────┼────────────┬──────────────┐
     │            │            │              │
     ▼            ▼            ▼              ▼
┌─────────┐  ┌────────┐  ┌──────────┐  ┌─────────┐
│Firestore│  │Firebase│  │  Cloud   │  │ Service │
│         │  │  Auth  │  │ Storage  │  │ Account │
│ (CRUD)  │  │(Admin) │  │ (Files)  │  │ (Access)│
└─────────┘  └────────┘  └──────────┘  └─────────┘
   $2/mo      FREE         $3/mo         FREE
```

---

## 🔐 Admin Authentication Flow (Crystal Clear)

### Step-by-Step:

**1. Frontend (Angular):**
```typescript
// Admin clicks "Sign in with Google"
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);

// Get Firebase ID token
const idToken = await result.user.getIdToken();
```

**2. Frontend sends to YOUR backend:**
```typescript
POST https://your-api.com/api/admin/auth/google
Body: { idToken: "eyJhbG..." }
```

**3. Backend verifies token:**
```typescript
// Firebase Admin SDK verifies the token
const decoded = await admin.auth().verifyIdToken(idToken);
// decoded = { uid, email, name, picture }
```

**4. Backend checks Firestore:**
```typescript
// Check if admin exists in Firestore admins collection
let admin = await db.collection('admins').doc(decoded.uid).get();

if (!admin.exists) {
  // Create NEW admin with status='pending'
  await db.collection('admins').doc(decoded.uid).set({
    email: decoded.email,
    displayName: decoded.name,
    approvalStatus: 'pending',  // Must be approved
    isActive: false,
    requestedAt: Timestamp.now()
  });
  
  return res.status(403).json({
    message: 'Admin pending approval'
  });
}

// Check if approved
if (admin.data().approvalStatus !== 'approved') {
  return res.status(403).json({
    message: 'Admin not approved yet'
  });
}
```

**5. Backend returns YOUR JWT:**
```typescript
// Generate YOUR app's JWT token
const token = jwt.sign(
  { sub: admin.id, email: admin.data().email, type: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

res.json({
  success: true,
  data: { token, admin: admin.data() }
});
```

**6. Frontend stores and uses JWT:**
```typescript
// Store YOUR token (not Firebase token)
localStorage.setItem('token', response.data.token);

// Use for all API calls
fetch('/api/transactions', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Key Points:**
- ✅ NO Cloud Functions needed
- ✅ NO event listeners
- ✅ Simple HTTP request-response
- ✅ Admin data stored in Firestore `admins` collection
- ✅ Super admin can approve/suspend via API calls

---

## 💾 Firestore Collections

```
tenmiye-firestore/
├── users/                    # Regular members
│   └── {userId}
│       ├── phone
│       ├── nameAr
│       ├── roleId
│       └── ... (NO password)
│
├── admins/                   # Google auth admins
│   └── {firebaseUid}         # ID = Firebase Auth UID
│       ├── email
│       ├── displayName
│       ├── adminType
│       ├── permissions
│       ├── approvalStatus    # pending/approved/rejected
│       └── isActive
│
├── transactions/             # Financial records
│   └── {transactionId}
│       ├── idempotencyKey
│       ├── debits[]
│       ├── credits[]
│       └── status
│
├── elections/                # Voting
│   └── {electionId}
│       ├── candidates[]
│       ├── voteCount
│       └── status
│
├── votes/                    # Individual votes
│   └── {electionId}_{voterId}  # Deterministic ID
│       ├── sealed: true
│       └── candidateId
│
├── announcements/            # Community posts
├── boards/                   # Organizational units
├── accounts/                 # Financial accounts
├── community_events/         # Audit trail
└── system_config/            # Global settings
    └── global
```

---

## 🔧 Backend Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Create Node.js + TypeScript project
- [ ] Install dependencies (express, firebase-admin, etc.)
- [ ] Copy types.ts to project
- [ ] Set up Firebase Admin SDK
- [ ] Deploy Firestore security rules

### Phase 2: Admin Auth (Day 2-3)
- [ ] Implement POST /api/admin/auth/google
- [ ] Verify Firebase token
- [ ] Create/update admin in Firestore
- [ ] Generate JWT token
- [ ] Test with Angular frontend

### Phase 3: Admin Management (Day 4-5)
- [ ] GET /api/admin/pending (list pending approvals)
- [ ] POST /api/admin/:id/approve (super admin approves)
- [ ] POST /api/admin/:id/suspend (super admin suspends)
- [ ] Test approval workflow

### Phase 4: User Auth (Day 6-7)
- [ ] POST /api/auth/register (phone + password)
- [ ] POST /api/auth/login (phone + password)
- [ ] Implement bcrypt password hashing
- [ ] Store passwords in SEPARATE secure storage (NOT Firestore)

### Phase 5: Core Features (Week 2)
- [ ] Transaction CRUD with double-entry bookkeeping
- [ ] Election system with vote integrity
- [ ] Announcement publishing workflow
- [ ] Board management

---

## 📊 Cost Breakdown

### Firebase/GCP (1000 users):
```
Firestore:
- Reads:  500,000/month  = $0.18
- Writes: 100,000/month  = $0.54
- Storage: 5GB          = $0.90
Subtotal: $2.00/month

Cloud Storage:
- Storage: 10GB         = $0.26
- Bandwidth: 50GB       = $6.00
Subtotal: $6.00/month

Firebase Auth:
- Admin only (Google)   = FREE
- No user auth cost     = FREE

Total Firebase: $8/month
```

### Backend Hosting:
```
Option 1: VPS (DigitalOcean)     = $5/month
Option 2: Vercel                  = FREE (generous limits)
Option 3: Railway                 = $5/month
```

### Grand Total:
```
Minimum: $8/month (Firebase only, Vercel backend)
Typical: $13-15/month (Firebase + VPS)
```

**At 10,000 users: ~$80-100/month**

---

## 🚀 Deployment Steps

### 1. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init firestore
firebase init storage

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 2. Backend Deploy (Vercel Example)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd tenmiye-backend
vercel deploy --prod

# Set environment variables
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY
vercel env add JWT_SECRET
```

### 3. Frontend Config
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-backend.vercel.app/api',
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    // ... rest of config
  }
};
```

---

## ✅ Verification Checklist

Before going live:

### Security
- [ ] Firestore rules deployed and tested
- [ ] Passwords hashed with bcrypt (cost 12)
- [ ] JWT secret is secure and random
- [ ] HTTPS enforced
- [ ] Admin approval workflow working
- [ ] User passwords NOT in Firestore

### Functionality
- [ ] Admin can sign in with Google
- [ ] New admin starts as 'pending'
- [ ] Super admin can approve/suspend admins
- [ ] Users can register with phone + password
- [ ] Transactions use double-entry bookkeeping
- [ ] Elections prevent duplicate votes
- [ ] Files upload to Cloud Storage

### Performance
- [ ] API responses < 1 second
- [ ] Firestore indexes created
- [ ] Large result sets paginated

---

## 📞 Support & Resources

- **Firestore Docs:** https://firebase.google.com/docs/firestore
- **Firebase Auth Docs:** https://firebase.google.com/docs/auth
- **Cloud Storage Docs:** https://firebase.google.com/docs/storage
- **Express Docs:** https://expressjs.com/
- **TypeScript Docs:** https://www.typescriptlang.org/

---

## 🎯 Summary

You have a **simple, clean architecture**:

1. ✅ Minimal Firebase stack (4 services, $8/month)
2. ✅ Simple request-response backend (NO Cloud Functions)
3. ✅ Admin Google auth with approval workflow
4. ✅ Regular users with phone + password
5. ✅ Deploy backend anywhere you want
6. ✅ Scales to 10,000+ users easily

**No over-engineering. No unnecessary complexity. Just what you need.**

Your community in El Gheddiya deserves a reliable, maintainable system. This architecture delivers exactly that. 🇲🇷

---

**Ready to build? Start with types.ts, then backend auth, then deploy. You've got this!** 🚀