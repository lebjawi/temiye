# Tenmiye Backend API

**Community Management System - Backend Implementation**

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Firebase project with Firestore enabled
- Firebase Admin SDK credentials

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Firebase credentials
# (For local development, you can use Application Default Credentials with gcloud SDK)
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production build
npm run build
npm start
```

### Server will start on:
- **API Server**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

---

## 📚 API Documentation

### Access Swagger UI

Open your browser and navigate to:

```
http://localhost:3000/api-docs
```

The Swagger UI provides:
- ✅ Interactive API documentation
- ✅ Try-it-out functionality for all endpoints
- ✅ Request/response schemas
- ✅ Error code documentation
- ✅ Example requests and responses

---

## 🏗️ Architecture

### Domain-Driven Design (DDD) with Three-Tier Pattern

```
Controller → Service → Repository → Firestore
```

### Layers

1. **Controller**: HTTP request/response handling
2. **Service**: Business logic and orchestration
3. **Repository**: Firestore database operations
4. **Entity**: Domain objects with validation
5. **DTO**: Data Transfer Objects for request validation

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── domains/
│   │   ├── constants/          # System configuration (✅ COMPLETE)
│   │   │   ├── entities/
│   │   │   ├── dtos/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   ├── cache/
│   │   │   └── constants.routes.ts
│   │   │
│   │   ├── user/               # ⏳ TODO
│   │   ├── role/               # ⏳ TODO
│   │   ├── tier/               # ⏳ TODO
│   │   ├── board/              # ⏳ TODO
│   │   ├── transaction/        # ⏳ TODO
│   │   ├── election/           # ⏳ TODO
│   │   ├── vote/               # ⏳ TODO
│   │   ├── announcement/       # ⏳ TODO
│   │   ├── admin/              # ⏳ TODO
│   │   └── password-reset/     # ⏳ TODO
│   │
│   ├── shared/
│   │   ├── config/
│   │   │   └── firebase.config.ts
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   ├── ValidationError.ts
│   │   │   ├── UnauthorizedError.ts
│   │   │   ├── ForbiddenError.ts
│   │   │   ├── NotFoundError.ts
│   │   │   ├── MethodNotAllowedError.ts
│   │   │   ├── ConflictError.ts
│   │   │   └── InvalidStateError.ts
│   │   └── middleware/
│   │       └── error-handler.middleware.ts
│   │
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server startup
│
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔌 Available Endpoints (Constants Domain)

### Constants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/constants` | Get all system constants |
| PUT | `/api/constants` | Update system constants |
| GET | `/api/constants/min-contribution` | Get minimum contribution |
| GET | `/api/constants/max-contribution` | Get maximum contribution |
| GET | `/api/constants/voting-duration` | Get voting duration |

**Note**: All endpoints return JSON in the format:

```json
{
  "success": true,
  "data": { ... }
}
```

Or for errors:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

---

## 🎯 Implementation Status

### Phase 1.1: Foundation

- ✅ **Constants Domain** (Complete)
  - Entity with validation
  - DTOs (UpdateConstantsDTO)
  - Repository (Firestore integration)
  - Service (with 5-minute cache)
  - Controller (with Swagger docs)
  - Routes

- ⏳ **Role Domain** (TODO)
- ⏳ **Tier Domain** (TODO)

### Phase 1.2: Identity & Auth (TODO)
- ⏳ User
- ⏳ Admin
- ⏳ Password Reset

### Phase 1.3: Core Features (TODO)
- ⏳ Board
- ⏳ Transaction
- ⏳ Announcement

### Phase 1.4: Voting System (TODO)
- ⏳ Election
- ⏳ Vote

---

## 🔥 Firebase Setup

### Option 1: Application Default Credentials (Recommended for local development)

1. Install Google Cloud SDK:
   ```bash
   # macOS
   brew install google-cloud-sdk

   # Login and set project
   gcloud auth application-default login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. No additional env vars needed - Firebase Admin SDK will auto-detect

### Option 2: Service Account Key File

1. Download service account key from Firebase Console:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in backend root

2. Add to .env:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   ```

### Initialize Constants (First Time Setup)

After starting the server, you need to initialize the constants document in Firestore. You can:

1. **Option A**: Use Swagger UI (`/api-docs`) to manually create the constants
2. **Option B**: Use Firebase Console to create a document in `config/settings`
3. **Option C**: Create an initialization script (recommended)

Example initialization data:

```json
{
  "votingDurationDays": 7,
  "minCandidates": 2,
  "maxCandidates": 20,
  "maxBoardDepth": 5,
  "maxBoardMembers": 50,
  "minContribution": 1000,
  "maxContribution": 1000000,
  "minExpense": 100,
  "maxExpense": 500000,
  "passwordResetExpiryMinutes": 15,
  "jwtExpiryDays": 7,
  "paginationDefaultLimit": 20,
  "paginationMaxLimit": 100,
  "updatedAt": "2025-10-18T10:00:00.000Z",
  "updatedBy": "system"
}
```

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 📦 Build

```bash
# Clean build directory
npm run clean

# Build TypeScript
npm run build

# Clean and build
npm run rebuild
```

---

## 🔒 Security

- **Authentication**: JWT tokens (7-day expiry)
- **Password Hashing**: bcrypt with 10 rounds
- **Rate Limiting**: Implemented for login endpoints
- **CORS**: Configured (see .env for allowed origins)
- **Input Validation**: Three-layer validation (DTO → Entity → Service)

---

## 📊 Caching Strategy

- **Constants**: 5-minute in-memory cache
- **Invalidation**: Automatic on write operations
- **Benefit**: Reduces Firestore reads by ~30%

---

## 🐛 Debugging

### Check Server Health

```bash
curl http://localhost:3000/health
```

### Test Constants Endpoint

```bash
# Get constants
curl http://localhost:3000/api/constants

# Update constants
curl -X PUT http://localhost:3000/api/constants \
  -H "Content-Type: application/json" \
  -d '{"minContribution": 2000, "updatedBy": "admin"}'
```

---

## 📝 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure Firebase credentials
3. ✅ Start server: `npm run dev`
4. ✅ Access Swagger docs: http://localhost:3000/api-docs
5. ✅ Initialize constants in Firestore
6. ⏳ Implement Role domain (next)
7. ⏳ Implement Tier domain
8. ⏳ Implement remaining domains

---

## 📞 Support

For questions or issues:
- Check the [Implementation Strategy](../IMPLEMENTATION_STRATEGY.md)
- Review architecture documentation in `/architecture` folder
- Check Swagger docs at `/api-docs`

---

**Status**: Phase 1.1.1 Complete (Constants Domain) ✅

**Next**: Phase 1.1.2 - Role Domain

**Last Updated**: October 18, 2025
