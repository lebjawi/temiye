# 🗺️ Tenmiye Project - Complete Plan

**Project:** Tenmiye Community Management System
**Location:** El Gheddiya, Teganet, Mauritania
**Last Updated:** 2025-10-18

---

## 📋 Table of Contents

1. [Project Vision](#project-vision)
2. [Technical Architecture](#technical-architecture)
3. [Complete Feature List](#complete-feature-list)
4. [Backend Domains (14 Total)](#backend-domains-14-total)
5. [Frontend Applications](#frontend-applications)
6. [Infrastructure & Production](#infrastructure--production)
7. [Future Enhancements](#future-enhancements)

---

## Project Vision

**Tenmiye** is a comprehensive community management system for El Gheddiya community in Mauritania.

### Core Goals
- Community member management with tiered memberships
- Financial transaction tracking (immutable audit trail)
- Democratic election and voting system
- Board organization with hierarchical structure
- Communication via announcements and blog content
- Static informational pages (About, Vision, History)
- Contact form for community inquiries

### Key Principles
1. **Mobile-First** - Desert connectivity, offline-capable
2. **Arabic-First** - Primary language Arabic, French secondary
3. **Cost-Optimized** - Stay within Firebase free tier
4. **Audit-Ready** - Immutable financial records and votes
5. **Democratic** - Transparent election and voting system

---

## Technical Architecture

### Stack
- **Frontend:** Angular 18 (single app, two layouts)
- **Backend:** Node.js + Express (TypeScript, DDD architecture)
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage (direct client upload)
- **Auth:** Dual strategy (Phone+bcrypt for users, Google OAuth for admins)

### Architecture Pattern
**Domain-Driven Design (DDD) + Three-Tier Pattern**
```
Controller (HTTP) → Service (Business Logic) → Repository (Data Access) → Firestore
```

### Authentication Strategy
- **Main App (Community Members):** Phone number + bcrypt password (custom JWT)
  - Cost: $0 (no Firebase Auth service costs)
  - Self-service signup with admin approval
- **Admin Dashboard (Leadership Board):** Firebase Google Authentication
  - Cost: Free tier (up to 50K users)
  - Requires superadmin approval before login

---

## Complete Feature List

### User Management
- [x] User registration (phone + password)
- [x] Admin approval workflow
- [x] Role-based permissions (member, board, admin, superadmin)
- [x] Tiered memberships (bronze, silver, gold, platinum)
- [x] Status management (pending, active, inactive, banned)
- [x] Password reset (6-digit SMS codes)
- [x] Profile management
- [ ] Profile pictures (linked to Storage domain)
- [ ] User directory/search
- [ ] User activity tracking

### Financial Management
- [x] Transaction recording (contributions, expenses, dividends, fines)
- [x] Immutability enforcement (405 on UPDATE/DELETE)
- [x] Soft delete with reason (audit trail)
- [x] Amount validation (min/max from Constants)
- [ ] Financial reports/analytics
- [ ] Balance tracking per user
- [ ] Export to CSV/PDF

### Elections & Voting
- [x] Election creation (draft → voting → closed → archived)
- [x] State machine enforcement
- [x] Multiple candidates
- [x] Ballot types (single-choice, multi-choice, ranking)
- [x] Voting window (start/end dates)
- [x] Vote casting (one per user per election)
- [x] Vote immutability
- [ ] Election images (linked to Storage domain)
- [ ] Results visualization
- [ ] Voter eligibility rules

### Board Management
- [x] Hierarchical board structure
- [x] Board members with positions
- [x] Member add/remove
- [x] Cascade archive
- [ ] Board logos (linked to Storage domain)
- [ ] Board permissions
- [ ] Meeting scheduling
- [ ] Board analytics

### Communication
- [x] Announcements (pinned, with expiry)
- [x] Soft delete
- [ ] Blog posts (draft → published workflow)
- [ ] Blog feature images & attachments
- [ ] Blog SEO (slugs, meta, keywords)
- [ ] Blog scheduling
- [ ] Blog tags/categories
- [ ] Static pages (About, Vision, History)
- [ ] Static page version history
- [ ] Contact form submissions
- [ ] Contact spam detection

### File Management
- [ ] File upload (dual method: backend proxy + client-side)
- [ ] Signed upload/download URLs
- [ ] File categorization (user-profile, blog, election, board, community)
- [ ] File validation (type, size, by category)
- [ ] Reference counting
- [ ] Thumbnail generation (images)
- [ ] Orphaned file cleanup
- [ ] Storage usage monitoring

### System Configuration
- [x] Constants management (system settings)
- [x] 5-minute cache
- [x] Named getters (min/max contribution, voting duration, etc.)
- [x] Admin-only updates

---

## Backend Domains (14 Total)

### ✅ Completed (11 domains)

1. **Constants** - System configuration
   - Collection: `config/settings`
   - Features: CRUD, caching, named getters

2. **Role** - Permission management
   - Collection: `roles`
   - Predefined: member, board, admin, superadmin
   - Features: CRUD, deletion protection, level hierarchy

3. **Tier** - Membership levels
   - Collection: `tiers`
   - Predefined: bronze, silver, gold, platinum
   - Features: CRUD, deletion protection, feature access

4. **User** - Community members
   - Collection: `users`
   - Auth: Phone (+222) + bcrypt password
   - Features: Register, login, approval, ban, JWT tokens

5. **Admin** - Leadership board
   - Collection: `admins`
   - Auth: Firebase Google OAuth
   - Features: Approval workflow, role-based access

6. **Password Reset** - Account recovery
   - Collection: `password_reset_tokens`
   - Features: 6-digit codes, 15-min expiry, one-time use

7. **Board** - Organizational structure
   - Collection: `boards`
   - Features: Hierarchy, members, positions, cascade archive

8. **Transaction** - Financial records (IMMUTABLE)
   - Collection: `transactions`
   - Types: contribution, expense, dividend, fine
   - Features: Create-only, soft delete, 405 on UPDATE

9. **Announcement** - Community notices
   - Collection: `announcements`
   - Features: Pinning, expiry, soft delete

10. **Election** - Democratic elections (State Machine)
    - Collection: `elections`
    - States: created → voting → closed → archived
    - Ballot types: single-choice, multi-choice, ranking

11. **Vote** - Cast votes (IMMUTABLE)
    - Collection: `votes`
    - Features: One per user per election, 405 on UPDATE/DELETE

### ⏳ In Progress (1 domain)

12. **Storage** - File management
    - Collection: `files`
    - Status: 80% complete
    - Missing: Integration with User/Board/Election domains

### 📋 Planned (2 domains)

13. **Blog** - Editorial content
    - Collection: `blogs`
    - Workflow: draft → scheduled → published → archived
    - Features: Slugs, SEO, attachments, scheduling, tags

14. **Static Pages** - System pages
    - Collection: `staticPages`
    - Predefined: about-us, vision, history, contact-info
    - Features: Version history, admin-only editing

15. **Contact** - Form submissions
    - Collection: `contacts`
    - Features: Spam detection, rate limiting, admin response, notifications

---

## Frontend Applications

### Single Angular 18 App - Two Layouts

#### Main Layout (/) - Community Members
**Routes:**
- `/` - Home/Dashboard
- `/login` - Phone + password login
- `/register` - Self-service signup
- `/password-reset` - Recovery flow
- `/profile` - My profile
- `/transactions` - My contributions
- `/announcements` - Community notices
- `/elections` - View elections
- `/voting/:electionId` - Cast vote
- `/blogs` - Browse blog posts
- `/blogs/:slug` - Read blog post
- `/about` - About us (static page)
- `/vision` - Vision (static page)
- `/history` - History (static page)
- `/contact` - Contact form

**Auth:** Custom JWT from phone+password login
**Access:** Limited based on user role and tier

#### Admin Layout (/admin) - Leadership Board
**Routes:**
- `/admin/login` - Google OAuth
- `/admin/dashboard` - Overview & analytics
- `/admin/users` - User management
- `/admin/approvals` - Approve users/admins
- `/admin/roles` - Role management
- `/admin/tiers` - Tier management
- `/admin/boards` - Board management
- `/admin/transactions` - All transactions
- `/admin/elections` - Election management
- `/admin/announcements` - Announcement management
- `/admin/blogs` - Blog management
- `/admin/blogs/new` - Create blog
- `/admin/blogs/:id/edit` - Edit blog
- `/admin/static-pages` - Static page management
- `/admin/contacts` - Contact submissions
- `/admin/storage` - File management
- `/admin/analytics` - Detailed reports
- `/admin/settings` - System configuration

**Auth:** Firebase Google OAuth + superadmin approval
**Access:** Full management capabilities

---

## Infrastructure & Production

### Firebase Services
- **Firestore** - Primary database
- **Firebase Storage** - File storage (5GB free tier)
- **Firebase Auth** - Admin OAuth only
- **Cloud Functions** - Thumbnail generation (optional)

### Production Features
- [x] Rate limiting (auth, uploads, general API)
- [x] Winston logging (structured JSON logs)
- [x] Environment validation
- [x] Enhanced health checks
- [x] Graceful shutdown
- [ ] Error tracking (Sentry - optional)
- [ ] Uptime monitoring
- [ ] Database backups
- [ ] Security headers (Helmet)
- [ ] Response compression

### Deployment Options
1. **Google Cloud Run** (recommended) - Auto-scaling, serverless
2. **Google Compute Engine** - VM with PM2
3. **Heroku** - Quick deployment
4. **DigitalOcean** - Cost-effective VPS

### Monitoring Plan
- Health checks: GET /health (Firestore + Storage latency)
- Uptime monitoring: uptimerobot.com (free)
- Logs: logs/error.log, logs/combined.log
- Firebase Console: Usage tracking

---

## Future Enhancements (Phase 5+)

### Advanced Features
- [ ] Blog comments system
- [ ] Multilingual content (Arabic + French)
- [ ] Advanced search (Algolia integration)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Mobile app (React Native or Flutter)
- [ ] Email newsletters
- [ ] Social media integration
- [ ] Analytics dashboard (charts, graphs)
- [ ] Export capabilities (PDF, Excel)
- [ ] Bulk operations
- [ ] Advanced permissions (granular)
- [ ] Audit log viewer
- [ ] User activity feed
- [ ] Real-time notifications
- [ ] Calendar/events system
- [ ] Document repository
- [ ] Forums/discussions

### Optimizations
- [ ] Redis caching layer
- [ ] CDN for static assets
- [ ] Database sharding (if >100K users)
- [ ] Microservices architecture (if needed)
- [ ] GraphQL API (alternative to REST)
- [ ] WebSocket real-time updates

---

## Timeline

### Completed
- **Weeks 1-8:** Backend Phase 1 (11 domains) ✅

### Current
- **Week 9:** Storage domain integration ⏳

### Upcoming
- **Weeks 10-11:** Blog domain
- **Weeks 12-13:** Static Pages + Contact domains
- **Weeks 14-15:** Frontend Main Layout
- **Weeks 16-17:** Frontend Admin Layout
- **Week 18:** Testing, polish, deployment

**Total Estimated Time:** 18 weeks (4.5 months)

---

## Cost Projections

### Firebase Free Tier Limits
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Storage: 5GB total, 1GB/day downloads
- Firebase Auth: 50K MAU (monthly active users)

### Estimated Usage (1,000 users)
- Firestore reads: ~15K/day (30% of limit) ✅
- Firestore writes: ~5K/day (25% of limit) ✅
- Storage: ~500MB (10% of limit) ✅
- Auth (admins only): ~50 users (0.1% of limit) ✅

**Conclusion:** Can operate entirely on free tier for first 1,000 users

---

## Success Metrics

### Technical
- 99%+ uptime
- <200ms average API response time
- Zero data loss incidents
- 80%+ test coverage (when implemented)

### Business
- 1,000+ registered users
- 100+ monthly transactions recorded
- 10+ elections conducted
- 50+ blog posts published
- Active community engagement

---

**This is the complete roadmap. All items in DONE.md are implemented. IN_PROGRESS.md shows current work. This document is the master plan.**

