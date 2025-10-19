# Firebase Authentication Setup Validation

## ✅ Backend Implementation Status

### 1. Firebase Admin SDK Configuration
- ✅ **Initialized**: `firebase.config.ts` properly initializes Firebase Admin SDK
- ✅ **Service Account**: Uses environment variables for credentials
- ✅ **Auth Module**: `admin.auth()` available for token verification

### 2. Admin Authentication Flow
```
Step 1: User signs in with Google (Frontend)
   ↓
Step 2: Firebase returns ID token to frontend
   ↓
Step 3: Frontend sends token to POST /api/auth/login/admin
   ↓
Step 4: Backend verifies token with Firebase Admin SDK
   ↓
Step 5: Backend creates/fetches admin from Firestore
   ↓
Step 6: Backend returns JWT token for API access
```

### 3. Implementation Details

**Endpoint**: `POST /api/auth/login/admin`

**Request Body**:
```json
{
  "firebaseToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Backend Process**:
1. ✅ Verifies Firebase token: `admin.auth().verifyIdToken(firebaseToken)`
2. ✅ Extracts `uid` and `email` from decoded token
3. ✅ Checks if admin exists in Firestore by `firebaseUid`
4. ✅ **First time**: Creates admin with `status: 'pending'`, returns 403 error
5. ✅ **After approval**: Validates `status === 'approved'`
6. ✅ Generates JWT token for API access
7. ✅ Updates `lastLoginAt` timestamp

**Response (First Time)**:
```json
{
  "success": false,
  "error": {
    "message": "Admin account created but requires approval. Please contact a superadmin.",
    "statusCode": 403
  }
}
```

**Response (After Approval)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "admin-id-123",
      "email": "admin@example.com",
      "status": "approved",
      "approvedAt": "2025-10-19T14:00:00.000Z",
      "approvedBy": "superadmin-id",
      "createdAt": "2025-10-19T10:00:00.000Z",
      "updatedAt": "2025-10-19T14:00:00.000Z",
      "lastLoginAt": "2025-10-19T15:00:00.000Z"
    },
    "expiresAt": "2025-10-26T15:00:00.000Z"
  }
}
```

## 🔧 Firebase Console Configuration

### Required Settings (Already Configured ✅)

Based on your screenshots:

1. ✅ **Google Sign-In Provider**: Enabled in Firebase Console
2. ✅ **Sign-in method**: Google is shown as "Enabled"

### What You Need to Add (Frontend Configuration)

**For Web App**, you need to add your domain to **Authorized domains**:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (e.g., `tenmiye.com`, `app.tenmiye.com`)

**Firebase SDK Configuration (Frontend)**:

Your Angular frontend needs Firebase configuration:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "YOUR_API_KEY",
    authDomain: "tenmiye-gdy.firebaseapp.com",
    projectId: "tenmiye-gdy",
    storageBucket: "tenmiye-gdy.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
```

You can find these values in:
**Firebase Console → Project Settings → General → Your apps → Web app**

## 📱 Frontend Implementation (Angular)

### 1. Install Firebase SDK

```bash
npm install firebase @angular/fire
```

### 2. Firebase Service (Angular)

```typescript
// src/app/services/firebase-auth.service.ts
import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, UserCredential } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  constructor(private auth: Auth) {}

  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  async getIdToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }
    return user.getIdToken();
  }

  async signOut(): Promise<void> {
    return this.auth.signOut();
  }
}
```

### 3. Admin Login Component

```typescript
// src/app/pages/admin/login/login.component.ts
import { Component } from '@angular/core';
import { FirebaseAuthService } from '../../../services/firebase-auth.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  template: `
    <div class="login-container">
      <h1>Admin Login</h1>
      <button (click)="loginWithGoogle()" [disabled]="loading">
        <img src="assets/google-logo.svg" alt="Google">
        Sign in with Google
      </button>
      <p *ngIf="error" class="error">{{ error }}</p>
    </div>
  `
})
export class AdminLoginComponent {
  loading = false;
  error: string | null = null;

  constructor(
    private firebaseAuth: FirebaseAuthService,
    private authService: AuthService,
    private router: Router
  ) {}

  async loginWithGoogle() {
    this.loading = true;
    this.error = null;

    try {
      // Step 1: Sign in with Google (Firebase)
      const credential = await this.firebaseAuth.signInWithGoogle();

      // Step 2: Get Firebase ID token
      const firebaseToken = await credential.user.getIdToken();

      // Step 3: Send token to your backend
      const response = await this.authService.loginAdmin(firebaseToken);

      // Step 4: Store JWT token
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.admin));

      // Step 5: Navigate to admin dashboard
      this.router.navigate(['/admin/dashboard']);

    } catch (error: any) {
      console.error('Login error:', error);

      if (error.status === 403) {
        this.error = 'Your admin account is pending approval. Please contact a superadmin.';
      } else {
        this.error = 'Login failed. Please try again.';
      }
    } finally {
      this.loading = false;
    }
  }
}
```

### 4. Auth Service (HTTP calls to backend)

```typescript
// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface AuthResponse {
  token: string;
  admin: any;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  async loginAdmin(firebaseToken: string): Promise<AuthResponse> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; data: AuthResponse }>(
        `${this.apiUrl}/login/admin`,
        { firebaseToken }
      )
    );
    return response.data;
  }
}
```

## 🧪 Testing the Flow

### Manual Test (Using curl)

**Step 1**: Get Firebase ID token from frontend (after Google Sign-In)

**Step 2**: Test backend endpoint
```bash
curl -X POST http://localhost:3000/api/auth/login/admin \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseToken": "PASTE_YOUR_FIREBASE_TOKEN_HERE"
  }'
```

**Expected (First Time)**:
```json
{
  "success": false,
  "error": {
    "message": "Admin account created but requires approval. Please contact a superadmin.",
    "statusCode": 403
  }
}
```

**Step 3**: Approve admin in Firestore
```bash
# Manually set in Firestore Console or via script:
# Collection: admins
# Document: <admin-id>
# Fields:
#   status: "approved"
#   approvedAt: <current timestamp>
#   approvedBy: "superadmin-manual"
```

**Step 4**: Try login again
```bash
# Same curl command as Step 2
```

**Expected (After Approval)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": { ... },
    "expiresAt": "..."
  }
}
```

## ✅ Validation Checklist

- ✅ Firebase Admin SDK initialized in backend
- ✅ Google Sign-In provider enabled in Firebase Console
- ✅ `POST /api/auth/login/admin` endpoint implemented
- ✅ Token verification with `admin.auth().verifyIdToken()`
- ✅ Auto-creation of admin on first login
- ✅ Approval workflow implemented
- ⚠️ **TODO**: Add authorized domains in Firebase Console (Settings → Authorized domains)
- ⚠️ **TODO**: Implement Firebase SDK in Angular frontend
- ⚠️ **TODO**: Create admin login UI with "Sign in with Google" button
- ⚠️ **TODO**: Create first superadmin manually in Firestore (with `status: 'approved'`)

## 🚨 Important Notes

1. **First Superadmin**: You must manually create the first superadmin in Firestore with `status: 'approved'` so they can approve other admins.

2. **Security Rules**: Make sure Firestore security rules prevent direct writes to the `admins` collection from the frontend.

3. **Environment Variables**: Ensure all Firebase environment variables are set in backend `.env`:
   ```
   PROJECT_ID=tenmiye-gdy
   PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   CLIENT_EMAIL=firebase-adminsdk-xxxxx@tenmiye-gdy.iam.gserviceaccount.com
   ```

## 📚 Additional Resources

- [Firebase Auth with Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [Verify ID Tokens (Backend)](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Angular Fire Documentation](https://github.com/angular/angularfire)
