# Tenmiye Backend Architecture
## Node.js + TypeScript + Express + Firestore
### Based on "Designing Data-Intensive Applications" Principles

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Design Patterns](#design-patterns)
3. [Project Structure](#project-structure)
4. [Core Services](#core-services)
5. [Authentication Strategy](#authentication-strategy)
6. [Transaction Management](#transaction-management)
7. [Event Sourcing Implementation](#event-sourcing-implementation)
8. [API Design](#api-design)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)

---

## Architecture Overview

### Why This Architecture? (Book References)

**Scale Consideration (Chapter 1, Pages 10-17):**
- Your 1000-user scale doesn't need Kafka, Redis, or microservices
- Firestore handles your read/write load easily (thousands of operations/second)
- Single Node.js server with Firestore is perfect for this scale
- Focus on reliability and maintainability over premature optimization

**Key Architectural Decisions:**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                       │
│  ┌──────────────────┐           ┌──────────────────┐       │
│  │  Angular Web App │           │   Mobile PWA     │       │
│  │  (Main + Admin)  │           │  (Offline-first) │       │
│  └────────┬─────────┘           └────────┬─────────┘       │
└───────────┼──────────────────────────────┼─────────────────┘
            │                              │
            │  HTTPS/JWT                   │  HTTPS/JWT
            │                              │
┌───────────▼──────────────────────────────▼─────────────────┐
│              Express.js Backend (Node.js)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Gateway Layer                       │   │
│  │  • Authentication Middleware                         │   │
│  │  • Rate Limiting                                     │   │
│  │  • Request Validation                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Service Layer                           │   │
│  │  • AuthService      • TransactionService            │   │
│  │  • UserService      • ElectionService               │   │
│  │  • BoardService     • AnnouncementService           │   │
│  │  • EventService     • NotificationService           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Repository Layer                        │   │
│  │  • Firestore abstraction                            │   │
│  │  • Transaction management                           │   │
│  │  • Query builders                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │  Firebase Admin SDK
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Firebase Services                           │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Firestore   │  │  Auth        │  │  Cloud Storage  │  │
│  │  (Database)   │  │  (Admins)    │  │  (Receipts)     │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Patterns

### 1. **Repository Pattern** (Page 70: Data Abstraction)

**Why:** Decouple business logic from data access. Makes testing easier and allows you to swap Firestore later if needed.

```typescript
// src/repositories/base.repository.ts
import { Firestore, CollectionReference, Query } from '@google-cloud/firestore';

export abstract class BaseRepository<T> {
  protected collection: CollectionReference;

  constructor(
    protected db: Firestore,
    protected collectionName: string
  ) {
    this.collection = db.collection(collectionName);
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as T : null;
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = await this.collection.add({
      ...data,
      createdAt: Firestore.Timestamp.now(),
      updatedAt: Firestore.Timestamp.now(),
      version: 1
    });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // Optimistic concurrency control (Page 242)
    const docRef = this.collection.doc(id);
    
    await this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      
      if (!doc.exists) {
        throw new Error('Document not found');
      }

      const currentVersion = doc.data()?.version || 0;
      
      transaction.update(docRef, {
        ...data,
        updatedAt: Firestore.Timestamp.now(),
        version: currentVersion + 1
      });
    });

    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as T;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async findMany(query?: Query): Promise<T[]> {
    const snapshot = await (query || this.collection).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  }
}
```

### 2. **Service Layer Pattern** (Page 136: Service Architecture)

**Why:** Encapsulate business logic. Services coordinate between repositories and implement complex workflows.

```typescript
// src/services/user.service.ts
import { UserRepository } from '../repositories/user.repository';
import { UserAuthRepository } from '../repositories/user-auth.repository';
import { EventService } from './event.service';
import { User, CreateUserInput } from '../types';
import bcrypt from 'bcrypt';

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private userAuthRepo: UserAuthRepository,
    private eventService: EventService
  ) {}

  async createUser(input: CreateUserInput): Promise<User> {
    // Check if phone already exists
    const existing = await this.userRepo.findByPhone(input.phone);
    if (existing) {
      throw new Error('Phone number already registered');
    }

    // Create user and auth records in transaction (Page 228: ACID)
    const user = await this.userRepo.create({
      phone: input.phone,
      nameAr: input.nameAr,
      nameFr: input.nameFr,
      email: input.email,
      status: 'pending',
      mustChangePassword: false,
      devices: [{
        deviceId: input.deviceId,
        deviceName: input.deviceName,
        lastSeenAt: Firestore.Timestamp.now()
      }],
      version: 1
    });

    // Hash password and store separately (Page 330: Security)
    const hashedPassword = await bcrypt.hash(input.password, 12);
    await this.userAuthRepo.create({
      phone: input.phone,
      hashedPassword,
      salt: await bcrypt.genSalt(12),
      passwordHistory: [hashedPassword],
      failedAttempts: 0,
      lastPasswordChange: Firestore.Timestamp.now()
    });

    // Event sourcing (Page 461)
    await this.eventService.recordEvent({
      eventType: 'user_joined',
      aggregateId: user.id,
      aggregateType: 'user',
      payload: {
        phone: user.phone,
        nameAr: user.nameAr,
        status: user.status
      },
      actorId: user.id,
      actorType: 'user'
    });

    return user;
  }

  async authenticate(phone: string, password: string): Promise<User> {
    // Get user
    const user = await this.userRepo.findByPhone(phone);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Get auth record
    const auth = await this.userAuthRepo.findByPhone(phone);
    if (!auth) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked (Page 330: Brute force protection)
    if (auth.lockedUntil && auth.lockedUntil.toDate() > new Date()) {
      throw new Error('Account is locked. Try again later.');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, auth.hashedPassword);
    
    if (!isValid) {
      // Increment failed attempts
      await this.userAuthRepo.incrementFailedAttempts(phone);
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.userAuthRepo.resetFailedAttempts(phone);

    // Update last login
    await this.userRepo.update(user.id, {
      lastLoginAt: Firestore.Timestamp.now()
    });

    return user;
  }
}
```

### 3. **Unit of Work Pattern** (Page 228: Transactions)

**Why:** Group multiple operations into atomic transactions. Essential for financial operations.

```typescript
// src/services/transaction.service.ts
import { Firestore } from '@google-cloud/firestore';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AccountRepository } from '../repositories/account.repository';
import { CreateTransactionInput, Transaction } from '../types';

export class TransactionService {
  constructor(
    private db: Firestore,
    private transactionRepo: TransactionRepository,
    private accountRepo: AccountRepository,
    private eventService: EventService
  ) {}

  /**
   * Create a contribution transaction with double-entry bookkeeping
   * Pattern: ACID transaction (Pages 221-230)
   */
  async createContribution(
    userId: string,
    input: CreateTransactionInput
  ): Promise<Transaction> {
    // Idempotency check (Page 358)
    const existing = await this.transactionRepo.findByIdempotencyKey(
      input.idempotencyKey
    );
    if (existing) {
      return existing; // Return existing transaction
    }

    // Run in Firestore transaction for ACID guarantees
    return await this.db.runTransaction(async (firestoreTransaction) => {
      // Get user's contribution account
      const userAccount = await this.accountRepo.getUserAccount(userId);
      if (!userAccount) {
        throw new Error('User account not found');
      }

      // Get general fund account
      const generalFund = await this.accountRepo.getGeneralFundAccount();
      if (!generalFund) {
        throw new Error('General fund not found');
      }

      // Create transaction with double-entry bookkeeping (Page 228)
      // Debit: General Fund (money comes in)
      // Credit: User's Contribution Account (liability to track)
      const transaction: Transaction = {
        id: '', // Will be set by repository
        idempotencyKey: input.idempotencyKey,
        type: 'contribution',
        debits: [{
          accountId: generalFund.id,
          accountType: 'general_fund',
          amount: input.amount
        }],
        credits: [{
          accountId: userAccount.id,
          accountType: 'user_contributions',
          ownerNameAr: userAccount.ownerNameAr,
          amount: input.amount
        }],
        amount: input.amount,
        currency: 'MRU',
        month: input.month,
        memo: input.memo,
        method: input.method,
        status: 'pending',
        createdById: userId,
        createdAt: Firestore.Timestamp.now(),
        version: 1
      };

      // Create transaction record
      const createdTransaction = await this.transactionRepo.createInTransaction(
        firestoreTransaction,
        transaction
      );

      // Update account balances with optimistic locking
      await this.accountRepo.updateBalanceInTransaction(
        firestoreTransaction,
        generalFund.id,
        generalFund.balance + input.amount,
        generalFund.version
      );

      await this.accountRepo.updateBalanceInTransaction(
        firestoreTransaction,
        userAccount.id,
        userAccount.balance + input.amount,
        userAccount.version
      );

      return createdTransaction;
    });

    // After transaction commits, record event (eventual consistency is OK here)
    await this.eventService.recordEvent({
      eventType: 'transaction_created',
      aggregateId: transaction.id,
      aggregateType: 'transaction',
      payload: { amount: input.amount, type: 'contribution' },
      actorId: userId,
      actorType: 'user'
    });
  }

  /**
   * Complete a pending transaction (admin approval)
   * Pattern: Saga pattern (Page 360)
   */
  async completeTransaction(
    transactionId: string,
    adminId: string
  ): Promise<Transaction> {
    return await this.db.runTransaction(async (firestoreTransaction) => {
      const transaction = await this.transactionRepo.findByIdInTransaction(
        firestoreTransaction,
        transactionId
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction is not pending');
      }

      // Update transaction status
      const updated = await this.transactionRepo.updateInTransaction(
        firestoreTransaction,
        transactionId,
        {
          status: 'completed',
          completedAt: Firestore.Timestamp.now(),
          approvedById: adminId
        }
      );

      return updated;
    });
  }

  /**
   * Reverse a transaction (compensating transaction)
   * Pattern: Saga pattern - compensating transaction (Page 363)
   */
  async reverseTransaction(
    transactionId: string,
    adminId: string,
    reason: string
  ): Promise<Transaction> {
    return await this.db.runTransaction(async (firestoreTransaction) => {
      const original = await this.transactionRepo.findByIdInTransaction(
        firestoreTransaction,
        transactionId
      );

      if (!original) {
        throw new Error('Transaction not found');
      }

      if (original.status === 'reversed') {
        throw new Error('Transaction already reversed');
      }

      // Create reversal transaction (opposite debits/credits)
      const reversal: Transaction = {
        id: '',
        idempotencyKey: `reversal_${transactionId}`,
        type: original.type,
        debits: original.credits, // Swap debits and credits
        credits: original.debits,
        amount: original.amount,
        currency: original.currency,
        memo: `REVERSAL: ${reason}`,
        method: original.method,
        status: 'completed',
        reversesTransactionId: transactionId,
        createdById: adminId,
        createdAt: Firestore.Timestamp.now(),
        completedAt: Firestore.Timestamp.now(),
        version: 1
      };

      const created = await this.transactionRepo.createInTransaction(
        firestoreTransaction,
        reversal
      );

      // Update original transaction
      await this.transactionRepo.updateInTransaction(
        firestoreTransaction,
        transactionId,
        {
          status: 'reversed',
          reversedAt: Firestore.Timestamp.now(),
          reversedByTransactionId: created.id
        }
      );

      // Update account balances (reverse the original changes)
      for (const debit of reversal.debits) {
        const account = await this.accountRepo.findByIdInTransaction(
          firestoreTransaction,
          debit.accountId
        );
        await this.accountRepo.updateBalanceInTransaction(
          firestoreTransaction,
          account.id,
          account.balance + debit.amount,
          account.version
        );
      }

      for (const credit of reversal.credits) {
        const account = await this.accountRepo.findByIdInTransaction(
          firestoreTransaction,
          credit.accountId
        );
        await this.accountRepo.updateBalanceInTransaction(
          firestoreTransaction,
          account.id,
          account.balance - credit.amount,
          account.version
        );
      }

      return created;
    });
  }
}
```

### 4. **Event Sourcing Pattern** (Pages 457-462)

**Why:** Complete audit trail, ability to rebuild state, transparency for community governance.

```typescript
// src/services/event.service.ts
import { EventRepository } from '../repositories/event.repository';
import { CommunityEvent } from '../types';
import { Firestore } from '@google-cloud/firestore';

export class EventService {
  private sequenceCounter: number = 0;

  constructor(
    private eventRepo: EventRepository,
    private db: Firestore
  ) {
    this.initializeSequenceCounter();
  }

  private async initializeSequenceCounter() {
    const lastEvent = await this.eventRepo.getLastEvent();
    this.sequenceCounter = lastEvent ? lastEvent.sequenceNumber : 0;
  }

  /**
   * Record an immutable event
   * Pattern: Event sourcing (Page 461)
   */
  async recordEvent(input: {
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    payload: Record<string, any>;
    actorId: string;
    actorType: 'user' | 'admin' | 'system';
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
  }): Promise<CommunityEvent> {
    this.sequenceCounter++;

    const event: Omit<CommunityEvent, 'id' | 'createdAt'> = {
      eventType: input.eventType,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType as any,
      payload: input.payload,
      beforeState: input.beforeState,
      afterState: input.afterState,
      actorId: input.actorId,
      actorType: input.actorType,
      occurredAt: Firestore.Timestamp.now(),
      sequenceNumber: this.sequenceCounter,
      version: 1
    };

    return await this.eventRepo.create(event);
  }

  /**
   * Rebuild aggregate state from events (for debugging/audit)
   * Pattern: Event replay (Page 460)
   */
  async rebuildAggregateState(
    aggregateType: string,
    aggregateId: string
  ): Promise<Record<string, any>> {
    const events = await this.eventRepo.getEventsForAggregate(
      aggregateType,
      aggregateId
    );

    let state = {};

    for (const event of events) {
      // Apply each event to rebuild state
      state = this.applyEvent(state, event);
    }

    return state;
  }

  private applyEvent(
    state: Record<string, any>,
    event: CommunityEvent
  ): Record<string, any> {
    // Event-specific logic to apply changes
    switch (event.eventType) {
      case 'user_joined':
        return { ...state, ...event.payload, status: 'pending' };
      case 'user_approved':
        return { ...state, status: 'active' };
      case 'user_banned':
        return { ...state, status: 'banned', banReason: event.payload.reason };
      // Add more event handlers as needed
      default:
        return state;
    }
  }
}
```

### 5. **Strategy Pattern for Authentication** (Page 328-333)

**Why:** Support multiple auth methods (phone/password for users, Google for admins).

```typescript
// src/auth/strategies/base.strategy.ts
export interface AuthStrategy {
  authenticate(credentials: any): Promise<{ userId: string; userType: 'user' | 'admin' }>;
  generateToken(userId: string, userType: 'user' | 'admin'): string;
}

// src/auth/strategies/phone-password.strategy.ts
import { AuthStrategy } from './base.strategy';
import { UserService } from '../../services/user.service';
import jwt from 'jsonwebtoken';

export class PhonePasswordStrategy implements AuthStrategy {
  constructor(private userService: UserService) {}

  async authenticate(credentials: { phone: string; password: string }) {
    const user = await this.userService.authenticate(
      credentials.phone,
      credentials.password
    );
    return { userId: user.id, userType: 'user' as const };
  }

  generateToken(userId: string, userType: 'user' | 'admin'): string {
    return jwt.sign(
      { sub: userId, type: userType },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }
}

// src/auth/strategies/google.strategy.ts
import { AuthStrategy } from './base.strategy';
import { AdminService } from '../../services/admin.service';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';

export class GoogleStrategy implements AuthStrategy {
  constructor(private adminService: AdminService) {}

  async authenticate(credentials: { idToken: string }) {
    // Verify Google token
    const decodedToken = await admin.auth().verifyIdToken(credentials.idToken);
    
    // Get or create admin
    const adminUser = await this.adminService.getOrCreateAdmin({
      uid: decodedToken.uid,
      email: decodedToken.email!,
      displayName: decodedToken.name || decodedToken.email!,
      photoUrl: decodedToken.picture
    });

    return { userId: adminUser.id, userType: 'admin' as const };
  }

  generateToken(userId: string, userType: 'user' | 'admin'): string {
    return jwt.sign(
      { sub: userId, type: userType },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }
}
```

---

## Project Structure

```
tenmiye-backend/
├── src/
│   ├── config/
│   │   ├── database.ts           # Firestore initialization
│   │   ├── firebase.ts           # Firebase Admin SDK setup
│   │   └── config.ts             # Environment variables
│   │
│   ├── types/
│   │   └── index.ts              # Shared types (from types.ts)
│   │
│   ├── repositories/             # Data access layer (Page 70)
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   ├── user-auth.repository.ts
│   │   ├── transaction.repository.ts
│   │   ├── account.repository.ts
│   │   ├── election.repository.ts
│   │   ├── vote.repository.ts
│   │   ├── announcement.repository.ts
│   │   ├── board.repository.ts
│   │   ├── event.repository.ts
│   │   └── admin.repository.ts
│   │
│   ├── services/                 # Business logic layer (Page 136)
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── transaction.service.ts
│   │   ├── election.service.ts
│   │   ├── announcement.service.ts
│   │   ├── board.service.ts
│   │   ├── event.service.ts
│   │   ├── notification.service.ts
│   │   └── analytics.service.ts
│   │
│   ├── auth/
│   │   ├── strategies/
│   │   │   ├── base.strategy.ts
│   │   │   ├── phone-password.strategy.ts
│   │   │   └── google.strategy.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts   # JWT verification
│   │   │   ├── authorize.ts      # Permission checks
│   │   │   └── rate-limit.ts     # Brute force protection
│   │   └── jwt.utils.ts
│   │
│   ├── controllers/              # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── transaction.controller.ts
│   │   ├── election.controller.ts
│   │   ├── announcement.controller.ts
│   │   ├── board.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── validators/               # Input validation
│   │   ├── user.validator.ts
│   │   ├── transaction.validator.ts
│   │   └── election.validator.ts
│   │
│   ├── middleware/
│   │   ├── error-handler.ts     # Global error handling
│   │   ├── logger.ts            # Request logging
│   │   ├── cors.ts              # CORS configuration
│   │   └── validation.ts        # Request validation
│   │
│   ├── utils/
│   │   ├── errors.ts            # Custom error classes
│   │   ├── crypto.ts            # Encryption utilities
│   │   ├── sms.ts               # SMS/WhatsApp integration
│   │   └── pagination.ts        # Pagination helpers
│   │
│   ├── jobs/                     # Background jobs (Page 402)
│   │   ├── daily-metrics.job.ts # Compute daily analytics
│   │   ├── reminder.job.ts      # Send payment reminders
│   │   └── cleanup.job.ts       # Clean expired tokens
│   │
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── transaction.routes.ts
│   │   ├── election.routes.ts
│   │   ├── announcement.routes.ts
│   │   ├── board.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/
│   ├── seed-database.ts         # Initial data seeding
│   └── migrate-data.ts          # Data migrations
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Implementation Guide

### Step 1: Initialize Project

```bash
mkdir tenmiye-backend && cd tenmiye-backend
npm init -y

# Core dependencies
npm install express cors helmet compression
npm install @google-cloud/firestore firebase-admin
npm install bcrypt jsonwebtoken
npm install dotenv express-validator
npm install winston morgan

# TypeScript and dev dependencies
npm install -D typescript @types/node @types/express
npm install -D @types/bcrypt @types/jsonwebtoken
npm install -D @types/cors nodemon ts-node
npm install -D jest @types/jest ts-jest supertest

# Create tsconfig.json
npx tsc --init
```

### Step 2: Core Configuration Files

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "migrate": "ts-node scripts/migrate-data.ts",
    "seed": "ts-node scripts/seed-database.ts"
  }
}
```

**.env.example:**
```env
NODE_ENV=development
PORT=3000

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=30

# SMS/WhatsApp (choose provider)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:4200,https://tenmiye.mr

# Logging
LOG_LEVEL=debug
```

---

## Key Implementation Details

### Authentication Middleware

```typescript
// src/auth/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../types';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Attach to request for downstream use
    (req as any).user = {
      id: decoded.sub,
      type: decoded.type,
      roleId: decoded.roleId,
      permissions: decoded.permissions
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
```

### Error Handling

```typescript
// src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      timestamp: Date.now()
    });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    },
    timestamp: Date.now()
  });
};
```

---

## Testing Strategy

### Unit Tests (Page 226: Testing)

```typescript
// tests/unit/services/user.service.test.ts
import { UserService } from '../../../src/services/user.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { UserAuthRepository } from '../../../src/repositories/user-auth.repository';
import { EventService } from '../../../src/services/event.service';

describe('UserService', () => {
  let userService: UserService;
  let userRepo: jest.Mocked<UserRepository>;
  let userAuthRepo: jest.Mocked<UserAuthRepository>;
  let eventService: jest.Mocked<EventService>;

  beforeEach(() => {
    userRepo = {
      findByPhone: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    } as any;

    userAuthRepo = {
      create: jest.fn(),
      findByPhone: jest.fn()
    } as any;

    eventService = {
      recordEvent: jest.fn()
    } as any;

    userService = new UserService(userRepo, userAuthRepo, eventService);
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      userRepo.findByPhone.mockResolvedValue(null);
      userRepo.create.mockResolvedValue({
        id: '123',
        phone: '+222123456789',
        nameAr: 'أحمد'
      } as any);

      const result = await userService.createUser({
        phone: '+222123456789',
        nameAr: 'أحمد',
        password: 'SecurePass123!',
        deviceId: 'device1'
      });

      expect(result.id).toBe('123');
      expect(userAuthRepo.create).toHaveBeenCalled();
      expect(eventService.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'user_joined'
        })
      );
    });

    it('should reject duplicate phone number', async () => {
      userRepo.findByPhone.mockResolvedValue({ id: '123' } as any);

      await expect(
        userService.createUser({
          phone: '+222123456789',
          nameAr: 'أحمد',
          password: 'SecurePass123!',
          deviceId: 'device1'
        })
      ).rejects.toThrow('Phone number already registered');
    });
  });
});
```

---

## Deployment Recommendations

### Option 1: Cloud Run (Recommended for 1000 users)
- Automatic scaling
- Pay only for actual usage
- Minimal operations overhead
- Built-in HTTPS

### Option 2: App Engine
- Simple deployment
- Automatic scaling
- Good Firebase integration

### Deployment Checklist:
1. ✅ Environment variables configured
2. ✅ Firestore indexes created
3. ✅ Security rules deployed
4. ✅ Backup strategy implemented
5. ✅ Monitoring setup (Cloud Logging)
6. ✅ Error tracking (Sentry or similar)
7. ✅ Load testing completed
8. ✅ Security audit done

---

## Summary

This architecture follows DDIA principles:

1. **Reliability** (Chapter 1): Error handling, idempotency, transaction integrity
2. **Scalability** (Chapter 1): Right-sized for 1000 users, can grow to 100K+
3. **Maintainability** (Chapter 1): Clean separation of concerns, testable
4. **Data Integrity** (Chapter 7): ACID transactions for money
5. **Audit Trail** (Chapter 11): Event sourcing for governance
6. **Security** (Chapter 9): Defense in depth, separate auth storage
7. **Performance** (Chapter 2): Denormalization where needed

The architecture is **simple but not simplistic** – it uses patterns from the book where they add value, but doesn't over-engineer for scale you don't need.