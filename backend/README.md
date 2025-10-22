# Tenmiye Backend API

Backend API for Tenmiye Community Management System - El Gheddiya, Teganet, Mauritania

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- npm 9+
- Firebase project with Firestore enabled

### Installation

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Firebase credentials
nano .env

# Run development server
npm run dev
```

Server will start at `http://localhost:8080`

## 📚 API Documentation

Once the server is running, access interactive API documentation:
- **Swagger UI**: http://localhost:8080/api-docs
- **OpenAPI JSON**: http://localhost:8080/api-docs.json

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Firebase, Logger, Swagger configuration
│   ├── types/           # TypeScript type definitions
│   ├── repositories/    # Data access layer (Firestore CRUD)
│   ├── services/        # Business logic layer
│   ├── controllers/     # Request/response handlers
│   ├── middleware/      # Authentication, validation, errors
│   ├── routes/          # API route definitions
│   ├── validators/      # Input validation schemas
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/               # Unit, integration, E2E tests
├── logs/                # Application logs (gitignored)
├── postman/             # Postman collection & environment
└── dist/                # Compiled TypeScript (gitignored)
```

## 🛠️ Development Commands

```bash
# Development
npm run dev                 # Start dev server with hot reload
npm run build               # Build TypeScript to dist/
npm start                   # Start production server

# Code Quality
npm run lint                # Run ESLint
npm run lint:fix            # Fix linting issues
npm run format              # Format code with Prettier
npm run format:check        # Check code formatting
npm run format-fix          # Fix linting + formatting
npm run typecheck           # TypeScript type checking
npm run validate            # Run all checks (type + lint + format)

# Testing
npm test                    # Run all tests with coverage
npm run test:watch          # Run tests in watch mode
npm run test:unit           # Run unit tests only
npm run test:integration    # Run integration tests
npm run test:e2e            # Run E2E tests

# Documentation
npm run docs                # Generate and open Swagger docs
```

## 🔧 Environment Variables

### Required Variables

```env
# Node Configuration
NODE_ENV=development
PORT=8080

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# JWT Configuration
JWT_SECRET=your-generated-secret
JWT_EXPIRY_HOURS=24

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4200

# Logging
LOG_LEVEL=debug
LOG_FILE_ENABLED=true
LOG_CONSOLE_ENABLED=true
```

### Updating CORS Origins

To allow multiple origins, use comma-separated values:

```env
# Development only
ALLOWED_ORIGINS=http://localhost:4200

# Production with multiple origins
ALLOWED_ORIGINS=http://localhost:4200,https://tenmiye.mr,https://www.tenmiye.mr
```

The CORS middleware will automatically parse and allow all specified origins.

## 🔐 Authentication

### User Authentication
- **Method**: Phone + Password
- **Storage**: Passwords hashed with bcrypt (12 rounds), stored separately from Firestore
- **Token**: JWT with 7-day expiry
- **Endpoints**:
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login

### Admin Authentication
- **Method**: Google OAuth (via Firebase Auth)
- **Flow**:
  1. Frontend handles Google sign-in
  2. Send Firebase ID token to `POST /api/admin/auth/google`
  3. Backend verifies token and returns JWT
- **Approval**: New admins require super admin approval
- **Token**: JWT with 24-hour expiry

## 📝 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Admin Auth
- `POST /api/admin/auth/google` - Admin Google login
- `GET /api/admin/auth/me` - Get current admin
- `GET /api/admin/pending` - List pending admin approvals (super admin)
- `POST /api/admin/:id/approve` - Approve admin (super admin)

### User Auth
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions
- `POST /api/transactions/:id/approve` - Approve transaction (admin)

### Elections
- `POST /api/elections` - Create election (admin)
- `GET /api/elections` - List elections
- `POST /api/elections/:id/vote` - Cast vote
- `GET /api/elections/:id/results` - Get results

See Swagger documentation for complete API reference.

## 🧪 Testing

### Running Tests

```bash
# All tests with coverage
npm test

# Watch mode for development
npm run test:watch

# Specific test suites
npm run test:unit           # Unit tests (services, repositories)
npm run test:integration    # Integration tests (API endpoints)
npm run test:e2e            # End-to-end tests (full workflows)
```

### Coverage Requirements
- **Global**: 70% minimum coverage
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 📦 Postman Collection

Import the Postman collection for easy API testing:

1. Open Postman
2. Import `postman/Tenmiye.postman_collection.json`
3. Import `postman/Tenmiye.postman_environment.json`
4. Select "Tenmiye" environment
5. Update `baseUrl` if needed
6. Start making requests!

## 🚢 Deployment

### Build for Production

```bash
# Install dependencies
npm ci --production=false

# Build TypeScript
npm run build

# Set environment to production
export NODE_ENV=production

# Start with PM2 (recommended)
npm run start:prod

# Or start directly
npm start
```

### PM2 Production Setup

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/server.js --name tenmiye-backend

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup

# Monitor logs
pm2 logs tenmiye-backend

# Monitor performance
pm2 monit
```

### Environment Checklist

Before deploying to production:

- [ ] Update `NODE_ENV=production` in `.env`
- [ ] Set strong `JWT_SECRET` (64+ characters)
- [ ] Configure production `ALLOWED_ORIGINS`
- [ ] Set `LOG_LEVEL=info` or `warn`
- [ ] Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Set up SSL/TLS certificates
- [ ] Configure domain and DNS
- [ ] Set up monitoring and alerting
- [ ] Configure automated backups

## 🔒 Security

### Password Security
- ✅ Bcrypt hashing with 12 rounds
- ✅ Passwords NEVER stored in Firestore
- ✅ Separate secure storage for authentication data
- ✅ Account lockout after 5 failed attempts
- ✅ 30-minute lockout duration

### JWT Security
- ✅ Strong secret (64+ characters)
- ✅ Token expiry (24h for admins, 7d for users)
- ✅ Token verification on all protected routes
- ✅ Refresh token capability

### API Security
- ✅ Helmet security headers
- ✅ CORS properly configured
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (N/A - NoSQL)
- ✅ XSS prevention

## 📊 Monitoring & Logs

### Log Files

Logs are stored in the `logs/` directory:
- `combined-YYYY-MM-DD.log` - All logs (14-day retention)
- `error-YYYY-MM-DD.log` - Errors only (30-day retention)

### Log Format

```
[2025-01-21 14:30:45.123] [info] [req_abc123]
Creating new user
File: src/services/user.service.ts
{ "phone": "+222123456789" }
```

### Accessing Logs

```bash
# View latest logs
tail -f logs/combined-*.log

# View errors only
tail -f logs/error-*.log

# Search logs
grep "Creating new user" logs/combined-*.log

# PM2 logs
pm2 logs tenmiye-backend
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3000
```

### Firebase Connection Issues

```bash
# Check credentials
cat .env | grep FIREBASE

# Verify project ID matches Firebase console
# Ensure private key has proper newlines (\n)
# Check service account permissions
```

### TypeScript Compilation Errors

```bash
# Clean build
rm -rf dist/

# Rebuild
npm run build

# Check for type errors
npm run typecheck
```

## 📞 Support

For issues or questions:
- Email: support@tenmiye.mr
- Documentation: See `docs/` folder
- Swagger API Docs: http://localhost:8080/api-docs

## 📄 License

Proprietary - Lebjawi Tech LLC © 2025
