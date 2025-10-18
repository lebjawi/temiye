# Tenmiye Community Management System

> A digital tool to strengthen community bonds, preserve democratic values, and support collective growth in El Gheddiya, Teganet, Mauritania.

## Project Overview

**Tenmiye** is a community management system built specifically for the youth community of El Gheddiya. It is **one Angular application** with **two distinct layouts** optimized for cost and security:

### 📱 Main Layout (/)
**For Community Members**
- Simple user interface with role-based permissions
- Phone number + plain text password (self-service signup)
- See only what your permissions allow
- Direct Firestore access (cost-optimized)
- **Pages**: Login, Dashboard, Profile, Transactions, Announcements, Elections, Voting

### 🔐 Admin Layout (/admin)
**For Leadership Board Members**
- Full management capabilities
- Firebase Google Authentication (email-based)
- Approval workflow before first login
- Complete data visibility and control
- **Pages**: Admin Login, Admin Dashboard, User Management, Role/Tier Management, Board Management, Approvals Queue, Analytics, Settings

### Features (Shared Across Both Layouts)
- **Democratic Governance**: Board-based decision-making structure reflecting traditional leadership
- **Financial Transparency**: Complete tracking of contributions, donations, and community spendings
- **Member Engagement**: Voting system for elections and major community decisions
- **Community Initiatives**: Support for pharmacy, education, and development projects
- **Accessibility**: WhatsApp-familiar interface, Arabic language primary, mobile-first design

### Key Features

- **Board System**: Board of Honor (5 leaders) + specialized boards for each initiative
- **Roles & Permissions**: Fine-grained control over who can do what in the community
- **Contributions Tracking**: Monthly tier-based contributions with transparent record-keeping
- **Elections**: Democratic voting system for board member selection
- **Announcements**: Community-wide announcements with approval workflow
- **Offline Support**: Designed for unreliable desert connectivity

## Design Philosophy

This system respects our community's values and practical realities:

- **Simplicity over Complexity**: Minimalist design for accessibility and long-term sustainability
- **Community-Centric**: Reflects our traditional decision-making structures, not imposed frameworks
- **Minimal Maintenance**: Built to run with minimal ongoing technical support
- **Mobile-First**: Accessible to tech-diverse youth via familiar interfaces
- **Inclusive Design**: Arabic as primary interface with French as secondary
- **Cost-Optimized**: Dual-tier architecture eliminates expensive authentication for regular members
- **Secure Leadership**: Firebase Auth + approval workflow ensures only authorized board members manage the system

## Tech Stack

### Frontend
- **Angular 18**: Modern web framework with TypeScript
- **RxJS**: Reactive programming for event handling
- **Component Architecture**: .html, .scss, .ts files per component
- **Angular Router**: Client-side navigation
- **Angular Forms**: Reactive form handling

### Backend
- **Node.js + Express**: RESTful API controllers for CRUD operations
- **One controller per collection**: Organized, maintainable structure
- **TypeScript**: Type-safe backend development

### Database & Services
- **Firebase Firestore**: Cloud NoSQL database
  - Real-time synchronization
  - Built-in scalability
  - Security rules for access control
- **Authentication (Dual Strategy)**
  - **Main App**: Custom phone + password (bcrypt hashing, no Firebase Auth costs)
  - **Admin Dashboard**: Firebase Google Authentication (free tier covers admin features)
- **Firestore Security Rules**: Role-based access control enforcement
  - Restrict main app users to their allowed data
  - Give admins full access based on approval status

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **npm**: Dependency management

## Architecture

```
                 ┌───────────────────────────────────┐
                 │  Single Angular 18 Application   │
                 │    (Port 4200)                   │
                 └───────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
        ┌────────▼────────┐      ┌────────▼────────┐
        │  MAIN LAYOUT    │      │  ADMIN LAYOUT   │
        │      (/)        │      │    (/admin)     │
        ├─────────────────┤      ├─────────────────┤
        │ Components:     │      │ Components:     │
        │ - Login (Phone) │      │ - Login (OAuth) │
        │ - Dashboard     │      │ - Dashboard     │
        │ - Profile       │      │ - User Mgmt     │
        │ - Transactions  │      │ - Role Mgmt     │
        │ - Announce.     │      │ - Board Mgmt    │
        │ - Elections     │      │ - Approvals     │
        │ - Voting        │      │ - Analytics     │
        │                 │      │ - Settings      │
        ├─────────────────┤      ├─────────────────┤
        │ Auth Type:      │      │ Auth Type:      │
        │ Phone + Pwd     │      │ Firebase OAuth  │
        │ (Self-service)  │      │ (Approval req.) │
        │                 │      │                 │
        │ Guard: Main     │      │ Guard: Admin    │
        │ Layout Guard    │      │ Layout Guard    │
        └────────┬────────┘      └────────┬────────┘
                 │                        │
                 └────────────┬───────────┘
                              │
                    ┌─────────▼────────┐
                    │ Angular Services │
                    │ & HTTP Client    │
                    └─────────┬────────┘
                              │
                         HTTP REST API (Port 3000)
                              │
                    ┌─────────▼────────┐
                    │ Express Backend  │
                    ├──────────────────┤
                    │ Controllers:     │
                    │ - User (+ Auth)  │
                    │ - Role (CRUD)    │
                    │ - Board (CRUD)   │
                    │ - Transaction    │
                    │ - Election       │
                    │ - Vote           │
                    │ - Announcement   │
                    │ - Admin (Mgmt)   │
                    ├──────────────────┤
                    │ Auth Middleware: │
                    │ - Custom (Phone) │
                    │ - Firebase OAuth │
                    │ - Validation     │
                    └─────────┬────────┘
                              │
                    ┌─────────▼────────┐
                    │ Firebase         │
                    ├──────────────────┤
                    │ Firestore DB:    │
                    │ - Users          │
                    │ - Roles/Tiers    │
                    │ - Boards         │
                    │ - Transactions   │
                    │ - Elections      │
                    │ - Votes          │
                    │ - Announcements  │
                    │ - Admins         │
                    │                  │
                    │ Services:        │
                    │ - Google Auth    │
                    │ - Security Rules │
                    └──────────────────┘
```

## Data Model

See `types.ts` for complete TypeScript interfaces. Key collections:

- **Users**: Community members with authentication, roles, and tiers
- **Roles**: Define permissions and responsibilities (e.g., Treasurer, Secretary)
- **Tiers**: Membership levels with monthly contribution amounts
- **Boards**: Organizational units (Board of Honor, Finance Board, etc.)
- **Transactions**: Financial tracking (contributions, donations, spendings)
- **Elections**: Voting events with candidates and voters
- **Votes**: Individual vote records (audit trail)
- **Announcements**: Community communications with approval workflow
- **PasswordResets**: Secure password recovery via SMS/WhatsApp
- **Constants**: Configuration and security settings

## Project Structure

```
tenmiye-app/
├── src/
│   ├── app/
│   │   ├── layouts/                      # Two layout components
│   │   │   ├── main-layout.component.*   # Community member layout
│   │   │   └── admin-layout.component.*  # Admin dashboard layout
│   │   │
│   │   ├── pages/
│   │   │   ├── main/                     # Main layout pages
│   │   │   │   ├── login/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── profile/
│   │   │   │   ├── transactions/
│   │   │   │   ├── announcements/
│   │   │   │   ├── elections/
│   │   │   │   └── voting/
│   │   │   │
│   │   │   └── admin/                    # Admin layout pages
│   │   │       ├── login/
│   │   │       ├── dashboard/
│   │   │       ├── users-management/
│   │   │       ├── roles-management/
│   │   │       ├── boards-management/
│   │   │       ├── approvals-queue/
│   │   │       ├── analytics/
│   │   │       └── settings/
│   │   │
│   │   ├── components/                   # Shared components
│   │   │   ├── header/
│   │   │   ├── footer/
│   │   │   ├── sidebar/
│   │   │   └── forms/
│   │   │
│   │   ├── services/                     # Angular services
│   │   │   ├── api.service.ts            # HTTP calls to Express backend
│   │   │   ├── auth.service.ts           # Custom auth (main app)
│   │   │   ├── firebase-auth.service.ts  # Firebase auth (admin)
│   │   │   ├── user.service.ts
│   │   │   ├── role.service.ts
│   │   │   ├── board.service.ts
│   │   │   ├── transaction.service.ts
│   │   │   ├── election.service.ts
│   │   │   └── announcement.service.ts
│   │   │
│   │   ├── guards/                       # Route guards
│   │   │   ├── main-layout.guard.ts      # Main layout protection
│   │   │   └── admin-layout.guard.ts     # Admin layout protection
│   │   │
│   │   ├── interceptors/                 # HTTP interceptors
│   │   │   └── error.interceptor.ts
│   │   │
│   │   ├── app.config.ts                 # Angular configuration
│   │   └── app.routes.ts                 # Route definitions (main & admin)
│   │
│   ├── main.ts                           # Angular bootstrap
│   └── styles/
│       ├── main-layout.scss              # Main layout styles
│       ├── admin-layout.scss             # Admin layout styles
│       └── global.scss                   # Global styles
│
├── backend/                     # Express backend (separate folder)
│   ├── src/
│   │   ├── controllers/         # CRUD controllers
│   │   │   ├── user.controller.ts
│   │   │   ├── role.controller.ts
│   │   │   ├── board.controller.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── election.controller.ts
│   │   │   ├── vote.controller.ts
│   │   │   ├── announcement.controller.ts
│   │   │   └── password-reset.controller.ts
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── services/            # Business logic
│   │   │   ├── firebase.service.ts
│   │   │   ├── permission.service.ts
│   │   │   └── validation.service.ts
│   │   ├── routes/              # API routes
│   │   │   ├── users.routes.ts
│   │   │   ├── roles.routes.ts
│   │   │   ├── boards.routes.ts
│   │   │   ├── transactions.routes.ts
│   │   │   ├── elections.routes.ts
│   │   │   ├── votes.routes.ts
│   │   │   ├── announcements.routes.ts
│   │   │   └── password-reset.routes.ts
│   │   ├── utils/               # Utilities
│   │   │   ├── password-hash.util.ts
│   │   │   ├── validators.util.ts
│   │   │   └── error-handler.util.ts
│   │   └── app.ts               # Express app entry point
│   ├── .env                     # Firebase config & secrets
│   └── package.json
│
├── types.ts                     # Shared TypeScript interfaces
├── tsconfig.json                # TypeScript configuration
├── angular.json                 # Angular build configuration
├── package.json                 # Frontend dependencies
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
└── CLAUDE.md                    # Development plan & checklist
```

## Development Workflow

### Data Flow

1. **User Action** → Angular Component
2. **Service Call** → HTTP Request to Express API
3. **Controller Processing** → Validation & Business Logic
4. **Firestore Operation** → Read/Write/Update/Delete
5. **Response** → Angular Service → Component → UI Update

### Request Flow Example (Create Transaction)

```
TransactionComponent
  ↓
TransactionService.createTransaction(data)
  ↓
HTTP POST to /api/transactions
  ↓
TransactionController.create()
  ↓
ValidationService.validateTransaction()
  ↓
FirebaseService.saveToFirestore()
  ↓
Response with created document
  ↓
TransactionService updates RxJS Subject
  ↓
TransactionComponent receives data & updates UI
```

## Security Architecture

### Dual Authentication Strategy (Single App, Two Layouts)

#### Main Layout (Community Members)
- **Phone + Password**: Self-service signup via simple form
- **Password Hashing**: bcrypt hashing with salt (10 rounds)
- **Access Control**: Firestore Security Rules restrict data access by user permissions
- **Cost Optimized**: No Firebase Authentication service costs (custom auth in Express)
- **Data Access**: Users can only read/write their own records and shared data based on permissions
- **Layout Protection**: MainLayoutGuard checks for phone-based authentication before rendering

#### Admin Layout (Leadership)
- **Google OAuth**: Firebase Authentication with Google accounts
- **Approval Workflow**: New admins must be approved by existing superadmin before first login
  1. Admin signs up with email → Status: `pending`
  2. Superadmin approves in admin panel → Status: `approved`
  3. Next login with Google Auth succeeds → Can access admin pages
- **Higher Security**: Firebase handles authentication, not custom code
- **Full Access**: Only approved admins have unrestricted Firestore access
- **Layout Protection**: AdminLayoutGuard checks for Firebase OAuth + approval status

### Routing Strategy
- Route to `/` → Check MainLayoutGuard → Render Main Layout
- Route to `/admin` → Check AdminLayoutGuard → Render Admin Layout
- Guards redirect to appropriate login based on layout type

### Firestore Security Rules
- **Users Collection**: Members can only read/edit their own profile
- **Transactions Collection**: Financial records restricted by role (read: finance board, write: treasurer)
- **Elections/Votes**: One-vote-per-member enforcement via database rules
- **Admins Collection**: Only superadmins can read/modify this collection
- **Public Data**: Announcements visible to all authenticated users

### Password Management (Main Layout Only)
- Passwords hashed with bcrypt (salt rounds: 10)
- Never stored in plain text
- Phone-based password recovery via SMS/WhatsApp with temporary codes
- JWT tokens generated on successful login (session management)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Firebase project setup

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies (when created)
cd backend && npm install && cd ..
```

### Configuration

1. **Create Firebase Project**
   - Go to Firebase Console
   - Create new project
   - Set up Firestore database
   - Create service account key

2. **Environment Variables**
   - Create `backend/.env` with Firebase credentials
   - Configure API endpoints in `src/environments/`

### Running the Application

```bash
# Terminal 1: Start Express backend
cd backend && npm start

# Terminal 2: Start Angular frontend
ng serve
# or
npm start
```

Frontend: http://localhost:4200
Backend API: http://localhost:3000

## Development Roadmap

### Phase 1: Backend Infrastructure ⏳
- [ ] Express server setup
- [ ] Firebase service integration
- [ ] All CRUD controllers
- [ ] Middleware & error handling
- [ ] Authentication system
- [ ] Permission & role management

### Phase 2: Frontend Services & Guards
- [ ] Angular services for all APIs
- [ ] Auth guard & route protection
- [ ] HTTP interceptors
- [ ] Error handling

### Phase 3: UI Components
- [ ] Authentication pages (login, password reset)
- [ ] Dashboard (role-based)
- [ ] Board management
- [ ] Transaction tracking
- [ ] Elections & voting
- [ ] Announcements

### Phase 4: Testing & Deployment
- [ ] Security testing
- [ ] Performance optimization
- [ ] Offline support refinement
- [ ] Deployment to production

## Key Implementation Notes

### Vote Uniqueness Constraint
- Compound index on (electionRef, voterRef) in Firestore
- Backend validates before write
- Firestore Security Rules prevent duplicates

### Offline Support Strategy
- Service Workers for offline caching
- Sync queue for offline changes
- Graceful degradation for desert connectivity

### Multilingual Support
- Arabic as primary interface
- French translations optional
- RTL support for Arabic

### Mobile Optimization
- Responsive design (mobile-first)
- Touch-friendly interfaces
- Minimal data usage

## Deployment

### Firebase Hosting (Frontend)
```bash
firebase deploy --only hosting
```

### Backend Deployment
- Cloud Run (serverless)
- Cloud Compute Engine (VM)
- Self-hosted on community server

## Contributing

This project is developed with love for the El Gheddiya community.

**Guidelines:**
- Keep code simple and maintainable
- Document business logic clearly
- Test thoroughly before changes
- Respect community feedback

## Copyright & License

**Copyright © 2025 Lebjawi Tech LLC**

Built with ❤️ for El Gheddiya, Teganet, Mauritania

## Contact

For questions or issues related to this project, please reach out to the development team.

---

**Last Updated**: October 16, 2025
