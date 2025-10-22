# Quick Start Guide - Tenmiye Backend Implementation
## From Zero to Production in 2 Weeks

---

## Week 1: Foundation Setup

### Day 1: Project Initialization

```bash
# 1. Create project
mkdir tenmiye-backend && cd tenmiye-backend
npm init -y

# 2. Install dependencies
npm install express cors helmet compression
npm install @google-cloud/firestore firebase-admin
npm install bcrypt jsonwebtoken dotenv
npm install express-validator winston

npm install -D typescript @types/node @types/express
npm install -D @types/bcrypt @types/jsonwebtoken
npm install -D nodemon ts-node

# 3. Copy types.ts to src/types/index.ts
mkdir -p src/types
cp types.ts src/types/index.ts

# 4. Initialize TypeScript
npx tsc --init
# (Use the tsconfig.json from BACKEND_ARCHITECTURE.md)

# 5. Create Firebase project
# Go to console.firebase.google.com
# Create new project: "tenmiye-mauritania"
# Enable Firestore
# Download service account key
# Save as: firebase-service-account.json (don't commit!)
```

### Day 2-3: Repository Layer

```typescript
// src/repositories/base.repository.ts
// (Copy from BACKEND_ARCHITECTURE.md)

// src/repositories/user.repository.ts
export class UserRepository extends BaseRepository<User> {
  constructor(db: Firestore) {
    super(db, 'users');
  }

  async findByPhone(phone: string): Promise<User | null> {
    const snapshot = await this.collection
      .where('phone', '==', phone)
      .limit(1)
      .get();
    
    return snapshot.empty 
      ? null 
      : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
  }
}

// Create similar repositories for:
// - UserAuthRepository (backend password storage)
// - TransactionRepository
// - AccountRepository
// - ElectionRepository
// - VoteRepository
// - AnnouncementRepository
// - BoardRepository
// - EventRepository
```

### Day 4-5: Authentication

```typescript
// src/auth/jwt.utils.ts
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export function generateToken(
  userId: string, 
  userType: 'user' | 'admin',
  additionalClaims?: Record<string, any>
): string {
  const payload: JwtPayload = {
    sub: userId,
    type: userType,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    ...additionalClaims
  };

  return jwt.sign(payload, process.env.JWT_SECRET!);
}

// src/services/auth.service.ts
export class AuthService {
  constructor(
    private userService: UserService,
    private adminService: AdminService
  ) {}

  async loginUser(phone: string, password: string): Promise<AuthPayload> {
    const user = await this.userService.authenticate(phone, password);
    const token = generateToken(user.id, 'user', { roleId: user.roleId });
    
    return {
      token,
      expiresIn: 7 * 24 * 60 * 60,
      user,
      userType: 'user'
    };
  }

  async loginAdmin(googleIdToken: string): Promise<AuthPayload> {
    // Verify Google token
    const decodedToken = await admin.auth().verifyIdToken(googleIdToken);
    const adminUser = await this.adminService.getOrCreateAdmin(decodedToken);
    
    const token = generateToken(adminUser.id, 'admin', {
      permissions: adminUser.permissions
    });
    
    return {
      token,
      expiresIn: 24 * 60 * 60,
      user: adminUser,
      userType: 'admin'
    };
  }
}

// src/auth/middleware/authenticate.ts
// (Copy from BACKEND_ARCHITECTURE.md)
```

### Day 6-7: API Routes & Testing

```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login/user', authController.loginUser);
router.post('/login/admin', authController.loginAdmin);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

export default router;

// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

export default app;

// src/server.ts
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Week 2: Core Features

### Day 8-9: Financial System

```typescript
// src/services/transaction.service.ts
// (Use the complete TransactionService from BACKEND_ARCHITECTURE.md)

// Key features to implement:
// 1. createContribution() - User pays monthly dues
// 2. createSpending() - Board spends from treasury
// 3. completeTransaction() - Admin approves
// 4. reverseTransaction() - Compensating transaction
// 5. getAccountBalance() - Current balance
// 6. getTransactionHistory() - User's history

// Test thoroughly:
describe('TransactionService', () => {
  it('should maintain double-entry bookkeeping', async () => {
    // Create contribution
    const tx = await txService.createContribution(userId, {
      amount: 100,
      month: '2025-01',
      idempotencyKey: 'unique-key-123'
    });

    // Verify debits = credits
    const debitsSum = tx.debits.reduce((sum, d) => sum + d.amount, 0);
    const creditsSum = tx.credits.reduce((sum, c) => sum + c.amount, 0);
    expect(debitsSum).toBe(creditsSum);

    // Verify accounts updated
    const generalFund = await accountRepo.findById(tx.debits[0].accountId);
    expect(generalFund.balance).toBe(100);
  });

  it('should be idempotent', async () => {
    const key = 'idempotent-key-456';
    
    const tx1 = await txService.createContribution(userId, {
      amount: 100,
      idempotencyKey: key
    });

    const tx2 = await txService.createContribution(userId, {
      amount: 100,
      idempotencyKey: key  // Same key
    });

    expect(tx1.id).toBe(tx2.id);  // Same transaction returned
  });
});
```

### Day 10-11: Election System

```typescript
// src/services/election.service.ts
export class ElectionService {
  constructor(
    private electionRepo: ElectionRepository,
    private voteRepo: VoteRepository,
    private eventService: EventService
  ) {}

  async createElection(input: CreateElectionInput, adminId: string) {
    // Validate candidates exist
    // Create election
    // Record event
  }

  async castVote(input: CastVoteInput, voterId: string) {
    // CRITICAL: Use deterministic vote ID
    const voteId = `${input.electionId}_${voterId}`;

    // Check if already voted (deterministic ID prevents duplicates)
    const existing = await this.voteRepo.findById(voteId);
    if (existing) {
      throw new Error('Already voted in this election');
    }

    // Verify vote token
    // Verify election is active
    // Record vote with sealed=true
    // Increment election.voteCount
  }

  async closeElection(electionId: string) {
    // Count votes
    // Compute results
    // Create ElectionResults document
    // Update election status to 'closed'
  }
}
```

### Day 12-13: Board & Announcements

```typescript
// src/services/board.service.ts
export class BoardService {
  async addMember(boardId: string, userId: string, roleId: string) {
    // Verify board not full
    // Add to board.members (denormalized)
    // Update user.roleId
    // Record event
  }
}

// src/services/announcement.service.ts
export class AnnouncementService {
  async create(input: CreateAnnouncementInput, authorId: string) {
    // Create as 'draft' or 'pending'
    // Denormalize author info
    // Record event
  }

  async publish(announcementId: string, adminId: string) {
    // Update status to 'published'
    // Set publishedAt timestamp
    // Send notifications
    // Record event
  }
}
```

### Day 14: Deployment

```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Create Firestore indexes
firebase deploy --only firestore:indexes

# 3. Deploy to Cloud Run
# Create cloudbuild.yaml:
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/tenmiye-backend', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/tenmiye-backend']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'tenmiye-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/tenmiye-backend'
      - '--region'
      - 'europe-west1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

# Deploy:
gcloud builds submit --config cloudbuild.yaml

# 4. Set environment variables
gcloud run services update tenmiye-backend \
  --set-env-vars "JWT_SECRET=your-secret" \
  --set-env-vars "NODE_ENV=production"

# 5. Verify deployment
curl https://tenmiye-backend-xxxx.run.app/health
```

---

## Essential Endpoints to Implement

### Authentication
- `POST /api/auth/register` - User signup
- `POST /api/auth/login/user` - User login (phone + password)
- `POST /api/auth/login/admin` - Admin login (Google)
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users/me` - Current user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/me/password` - Change password
- `GET /api/users` - List users (admin only)

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions
- `GET /api/transactions/:id` - Transaction details
- `POST /api/transactions/:id/approve` - Approve (admin)
- `POST /api/transactions/:id/reverse` - Reverse (admin)

### Elections
- `POST /api/elections` - Create election (admin)
- `GET /api/elections` - List elections
- `GET /api/elections/:id` - Election details
- `POST /api/elections/:id/vote` - Cast vote
- `GET /api/elections/:id/results` - View results
- `POST /api/elections/:id/close` - Close election (admin)

### Announcements
- `POST /api/announcements` - Create announcement
- `GET /api/announcements` - List announcements
- `GET /api/announcements/:slug` - View announcement
- `PUT /api/announcements/:id` - Update (author)
- `POST /api/announcements/:id/publish` - Publish (admin)

### Boards
- `POST /api/boards` - Create board (admin)
- `GET /api/boards` - List boards
- `GET /api/boards/:id` - Board details
- `POST /api/boards/:id/members` - Add member (admin)
- `DELETE /api/boards/:id/members/:userId` - Remove member

---

## Testing Checklist

Before production:

### Unit Tests
- [ ] UserService.authenticate() validates password
- [ ] TransactionService maintains double-entry
- [ ] TransactionService enforces idempotency
- [ ] ElectionService prevents duplicate votes
- [ ] EventService records events correctly

### Integration Tests
- [ ] Create user → login → get profile
- [ ] Create transaction → approve → verify balance
- [ ] Create election → cast vote → close → verify results
- [ ] Create announcement → publish → verify visible

### Security Tests
- [ ] Cannot access without token
- [ ] Cannot access another user's data
- [ ] Cannot approve transaction without admin role
- [ ] Cannot vote twice in same election
- [ ] Password stored securely (hashed)

### Performance Tests
- [ ] 100 concurrent users can login
- [ ] Transaction creation < 1 second
- [ ] Vote casting < 500ms
- [ ] List queries paginated

---

## Common Issues & Solutions

### Issue: "Cannot find module 'firebase-admin'"
**Solution:** Install dependencies
```bash
npm install @google-cloud/firestore firebase-admin
```

### Issue: "Firestore transaction failed"
**Solution:** Check you're using runTransaction correctly
```typescript
// Wrong:
await accountRepo.update(id, { balance: newBalance });

// Right:
await db.runTransaction(async (tx) => {
  await accountRepo.updateInTransaction(tx, id, { balance: newBalance });
});
```

### Issue: "JWT verification failed"
**Solution:** Check JWT_SECRET is set in .env
```bash
JWT_SECRET=your-super-secret-key-here
```

### Issue: "Permission denied in Firestore"
**Solution:** Deploy security rules
```bash
firebase deploy --only firestore:rules
```

### Issue: "Duplicate votes"
**Solution:** Use deterministic vote ID
```typescript
const voteId = `${electionId}_${voterId}`;
```

---

## Production Checklist

Before going live:

### Security
- [ ] Passwords hashed with bcrypt (cost 12+)
- [ ] JWT secret is random and secure
- [ ] HTTPS enforced (Cloud Run does this)
- [ ] Firestore rules deployed and tested
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### Data
- [ ] Firestore rules deployed
- [ ] Firestore indexes created
- [ ] Initial data seeded (roles, tiers, system config)
- [ ] Backup strategy configured

### Monitoring
- [ ] Cloud Logging enabled
- [ ] Error tracking setup (Sentry)
- [ ] Uptime monitoring
- [ ] Cost alerts configured

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Admin user guide
- [ ] Deployment runbook
- [ ] Emergency contacts

---

## Next Steps After Launch

### Week 3-4: Polish
1. Add notification system
2. Implement SMS for password reset
3. Build analytics dashboard
4. Add data export functionality

### Week 5-6: Mobile Optimization
1. Optimize API for mobile bandwidth
2. Implement offline sync properly
3. Add service worker for PWA
4. Test on 2G networks

### Month 2-3: Community Features
1. Profile pictures
2. Activity feed
3. Discussion forums
4. Photo galleries for events

### Month 4+: Scale & Optimize
1. Monitor usage patterns
2. Optimize slow queries
3. Add caching where needed
4. Consider regional deployment

---

## Support Resources

- **Firestore Docs:** https://firebase.google.com/docs/firestore
- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **Book:** "Designing Data-Intensive Applications" (your reference)
- **TypeScript:** https://www.typescriptlang.org/docs

---

## Emergency Contacts

**If something breaks:**
1. Check Cloud Logging: https://console.cloud.google.com/logs
2. Check Firestore status: https://status.firebase.google.com
3. Rollback deployment: `gcloud run services update-traffic --to-revisions=PREVIOUS_REVISION=100`
4. Contact your tech lead

---

**Remember:** Start simple, test thoroughly, deploy with confidence. Your community is counting on you! 🚀