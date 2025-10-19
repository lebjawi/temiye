# Tenmiye UI Architecture Plan

> **Philosophy**: Mobile-first for Home (`/`), Desktop-first for Dashboard (`/admin`)

## Layout Overview

### Home Layout (`/`) - Mobile-First
- **Primary Device**: Mobile (99% usage)
- **Route**: `/`
- **Strategy**: Mobile design, centered on larger screens
- **Max Content Width**: 428px

### Dashboard Layout (`/admin`) - Desktop-First
- **Primary Device**: Desktop/Tablet (90% usage)
- **Route**: `/admin`
- **Strategy**: Responsive desktop design with mobile fallback
- **Width**: Full viewport width

---

## Home Layout (`/`) - Responsive Behavior

### Mobile View (320px - 767px)
```
┌─────────────────────────┐
│  [Logo]    [Menu Icon]  │  ← Header (fixed)
├─────────────────────────┤
│                         │
│   Main Content Area     │
│   (Full width)          │
│                         │
│   - Dashboard Cards     │
│   - Announcements       │
│   - Quick Actions       │
│                         │
│                         │
│                         │
│                         │
├─────────────────────────┤
│   Navigation Bar        │  ← Bottom Nav (fixed)
│  [Home][Profile][More]  │
└─────────────────────────┘

Width: 100% of viewport
Padding: 16px
Max Width: 428px (auto-enforced)
```

### Tablet View (768px - 1023px)
```
┌─────────┬─────────────────────────┬─────────┐
│         │  [Logo]    [Menu Icon]  │         │  ← Header (fixed)
│ Empty   ├─────────────────────────┤  Empty  │
│ Space   │                         │  Space  │
│         │   Main Content Area     │         │
│ (Auto)  │   (428px max-width)     │  (Auto) │
│         │                         │         │
│         │   - Dashboard Cards     │         │
│         │   - Announcements       │         │
│         │   - Quick Actions       │         │
│         │                         │         │
│         │                         │         │
│         │                         │         │
│         ├─────────────────────────┤         │
│         │   Navigation Bar        │         │  ← Bottom Nav (fixed)
│         │ [Home][Profile][More]   │         │
└─────────┴─────────────────────────┴─────────┘

Content Width: 428px (centered)
Empty Space: calc((100vw - 428px) / 2) on each side
Background: Extends to full viewport
```

### Desktop View (1024px+)
```
┌──────────────┬─────────────────────────┬──────────────┐
│              │  [Logo]    [Menu Icon]  │              │  ← Header (fixed)
│              ├─────────────────────────┤              │
│   Empty      │                         │    Empty     │
│   Space      │   Main Content Area     │    Space     │
│              │   (428px max-width)     │              │
│   (Gradient  │                         │  (Gradient   │
│    or Blur)  │   - Dashboard Cards     │   or Blur)   │
│              │   - Announcements       │              │
│              │   - Quick Actions       │              │
│              │                         │              │
│              │                         │              │
│              │                         │              │
│              │                         │              │
│              ├─────────────────────────┤              │
│              │   Navigation Bar        │              │  ← Bottom Nav (fixed)
│              │ [Home][Profile][More]   │              │
└──────────────┴─────────────────────────┴──────────────┘

Content Width: 428px (centered)
Empty Space: calc((100vw - 428px) / 2) on each side
Optional: Background blur or gradient in empty spaces
```

---

## Dashboard Layout (`/admin`) - Responsive Behavior

### Mobile View (320px - 767px)
```
┌─────────────────────────────────┐
│ [☰]  Dashboard Title  [Profile] │  ← Header (fixed)
├─────────────────────────────────┤
│                                 │
│   Main Content (Stacked)        │
│                                 │
│   ┌─────────────────────┐       │
│   │   Card 1            │       │
│   │   (Full width)      │       │
│   └─────────────────────┘       │
│                                 │
│   ┌─────────────────────┐       │
│   │   Card 2            │       │
│   │   (Full width)      │       │
│   └─────────────────────┘       │
│                                 │
│   ┌─────────────────────┐       │
│   │   Card 3            │       │
│   │   (Full width)      │       │
│   └─────────────────────┘       │
│                                 │
│                                 │
└─────────────────────────────────┘

Features:
- Hamburger menu (☰) opens drawer sidebar
- Cards stack vertically (1 column)
- Tables scroll horizontally
- Width: 100% with 16px padding
- Sidebar: Off-canvas (slide-in overlay)
```

### Tablet View (768px - 1023px)
```
┌──────────┬──────────────────────────────────┐
│          │  Dashboard Title      [Profile]  │  ← Header
│          ├──────────────────────────────────┤
│  Side    │                                  │
│  bar     │   Main Content (2 columns)       │
│          │                                  │
│  • Home  │   ┌────────┐  ┌────────┐         │
│  • Users │   │ Card 1 │  │ Card 2 │         │
│  • Roles │   │        │  │        │         │
│  • Board │   └────────┘  └────────┘         │
│  • Trans │                                  │
│          │   ┌────────────────────┐         │
│  (200px) │   │   Full Width Card  │         │
│          │   │   (Analytics)      │         │
│          │   └────────────────────┘         │
│          │                                  │
│          │   ┌──────────────────────────┐   │
│          │   │   Data Table             │   │
│          │   │   (Full width, scroll)   │   │
│          │   └──────────────────────────┘   │
│          │                                  │
└──────────┴──────────────────────────────────┘

Features:
- Sidebar: Fixed, always visible (200px)
- Content: 2-column grid for cards
- Main Content Width: calc(100vw - 200px)
- Padding: 24px
```

### Desktop View (1024px+)
```
┌────────────┬────────────────────────────────────────────────────┐
│            │  Dashboard Title                        [Profile]  │  ← Header
│            ├────────────────────────────────────────────────────┤
│  Sidebar   │                                                    │
│            │   Main Content (3-4 columns grid)                  │
│  • Home    │                                                    │
│  • Users   │   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  • Roles   │   │Card 1│  │Card 2│  │Card 3│  │Card 4│          │
│  • Tiers   │   │      │  │      │  │      │  │      │          │
│  • Board   │   └──────┘  └──────┘  └──────┘  └──────┘          │
│  • Trans   │                                                    │
│  • Elec    │   ┌────────────────────────────────────┐           │
│  • Annou   │   │   Full Width Analytics Chart       │           │
│  • Approv  │   │   (Graphs, Stats, Visualizations)  │           │
│  • Analyt  │   └────────────────────────────────────┘           │
│  • Settings│                                                    │
│            │   ┌────────────────────────────────────────────┐   │
│  (260px)   │   │   Data Table (Full width)                  │   │
│            │   │   ┌──────┬──────┬──────┬──────┬──────┐     │   │
│            │   │   │ ID   │ Name │ Role │ Tier │ Status│     │   │
│            │   │   ├──────┼──────┼──────┼──────┼──────┤     │   │
│            │   │   │ ...  │ ...  │ ...  │ ...  │ ...   │     │   │
│            │   │   └──────┴──────┴──────┴──────┴──────┘     │   │
│            │   └────────────────────────────────────────────┘   │
│            │                                                    │
└────────────┴────────────────────────────────────────────────────┘

Features:
- Sidebar: Fixed, expanded (260px)
- Content: 3-4 column grid for cards
- Main Content Width: calc(100vw - 260px)
- Padding: 32px
- Full-width tables with sorting/filtering
```

---

## Responsive Breakpoints

```scss
// Breakpoints
$mobile-max: 767px;
$tablet-min: 768px;
$tablet-max: 1023px;
$desktop-min: 1024px;
$large-desktop-min: 1440px;

// Home Layout Breakpoints
$home-content-max-width: 428px;  // Fixed max width for home content

// Dashboard Layout Breakpoints
$dashboard-sidebar-mobile: 0px;    // Hidden on mobile
$dashboard-sidebar-tablet: 200px;  // Narrow on tablet
$dashboard-sidebar-desktop: 260px; // Full width on desktop
```

---

## Angular Component Architecture

### Component File Structure
Each Angular component follows the **3-file pattern**:
1. **`.ts`** - Component logic (TypeScript class)
2. **`.html`** - Component template (UI markup)
3. **`.scss`** - Component styles (Scoped CSS)

**No separate `.spec.ts` files in the component directories** - tests are organized separately.

### Angular Configuration
```typescript
// Component decorator configuration
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule, RouterModule, ...],
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.scss']
})
```

**Key Points:**
- All components are **standalone** (no NgModules)
- Each component has its own **scoped SCSS file**
- Templates are **external** (not inline)
- Styles are **external** (not inline)

---

## Layout Component Structure

### Home Layout (`/`)
```
src/app/layouts/home/
├── home-layout.component.ts        # Layout logic & state
├── home-layout.component.html      # Layout template
├── home-layout.component.scss      # Layout styles
└── components/
    ├── home-header/
    │   ├── home-header.component.ts     # Header logic
    │   ├── home-header.component.html   # Header template
    │   └── home-header.component.scss   # Header styles
    ├── home-bottom-nav/
    │   ├── home-bottom-nav.component.ts    # Bottom nav logic
    │   ├── home-bottom-nav.component.html  # Bottom nav template
    │   └── home-bottom-nav.component.scss  # Bottom nav styles
    └── home-sidebar-menu/  (drawer on mobile)
        ├── home-sidebar-menu.component.ts    # Sidebar logic
        ├── home-sidebar-menu.component.html  # Sidebar template
        └── home-sidebar-menu.component.scss  # Sidebar styles
```

### Dashboard Layout (`/admin`)
```
src/app/layouts/dashboard/
├── dashboard-layout.component.ts        # Layout logic & state
├── dashboard-layout.component.html      # Layout template
├── dashboard-layout.component.scss      # Layout styles
└── components/
    ├── dashboard-header/
    │   ├── dashboard-header.component.ts     # Header logic
    │   ├── dashboard-header.component.html   # Header template
    │   └── dashboard-header.component.scss   # Header styles
    ├── dashboard-sidebar/
    │   ├── dashboard-sidebar.component.ts     # Sidebar logic
    │   ├── dashboard-sidebar.component.html   # Sidebar template
    │   └── dashboard-sidebar.component.scss   # Sidebar styles
    └── dashboard-mobile-nav/  (drawer on mobile)
        ├── dashboard-mobile-nav.component.ts    # Mobile nav logic
        ├── dashboard-mobile-nav.component.html  # Mobile nav template
        └── dashboard-mobile-nav.component.scss  # Mobile nav styles
```

### Feature Pages Structure
```
src/app/features/home/dashboard/
├── dashboard.component.ts         # Page logic & data
├── dashboard.component.html       # Page template
└── dashboard.component.scss       # Page styles

src/app/features/admin/users/
├── users.component.ts             # Page logic & CRUD operations
├── users.component.html           # Page template with table
└── users.component.scss           # Page styles
```

---

## NgRx Store Architecture

### Store Philosophy
- **Centralized State Management**: Single source of truth for all application data
- **Immutable State**: State is never modified directly, only through actions
- **Reactive**: Components subscribe to state changes via selectors
- **Predictable**: All state changes flow through reducers

### Store Structure
```
src/app/store/
├── index.ts                          # Root store configuration & meta-reducers
├── app.state.ts                      # Global app state interface
│
├── auth/                             # Authentication state (Home layout)
│   ├── auth.actions.ts               # Login, logout, register actions
│   ├── auth.effects.ts               # API calls, side effects
│   ├── auth.reducer.ts               # State mutations
│   ├── auth.selectors.ts             # State queries
│   └── auth.state.ts                 # State interface
│
├── admin-auth/                       # Admin authentication state
│   ├── admin-auth.actions.ts         # Google OAuth actions
│   ├── admin-auth.effects.ts         # Firebase auth side effects
│   ├── admin-auth.reducer.ts         # Admin state mutations
│   ├── admin-auth.selectors.ts       # Admin state queries
│   └── admin-auth.state.ts           # Admin state interface
│
├── users/                            # Users management
│   ├── users.actions.ts              # CRUD actions
│   ├── users.effects.ts              # API calls
│   ├── users.reducer.ts              # Users state mutations
│   ├── users.selectors.ts            # Users queries
│   └── users.state.ts                # Users state interface
│
├── roles/                            # Roles management
│   ├── roles.actions.ts
│   ├── roles.effects.ts
│   ├── roles.reducer.ts
│   ├── roles.selectors.ts
│   └── roles.state.ts
│
├── tiers/                            # Tiers management
│   ├── tiers.actions.ts
│   ├── tiers.effects.ts
│   ├── tiers.reducer.ts
│   ├── tiers.selectors.ts
│   └── tiers.state.ts
│
├── boards/                           # Boards management
│   ├── boards.actions.ts
│   ├── boards.effects.ts
│   ├── boards.reducer.ts
│   ├── boards.selectors.ts
│   └── boards.state.ts
│
├── transactions/                     # Transactions state
│   ├── transactions.actions.ts
│   ├── transactions.effects.ts
│   ├── transactions.reducer.ts
│   ├── transactions.selectors.ts
│   └── transactions.state.ts
│
├── elections/                        # Elections & voting
│   ├── elections.actions.ts
│   ├── elections.effects.ts
│   ├── elections.reducer.ts
│   ├── elections.selectors.ts
│   └── elections.state.ts
│
├── announcements/                    # Announcements
│   ├── announcements.actions.ts
│   ├── announcements.effects.ts
│   ├── announcements.reducer.ts
│   ├── announcements.selectors.ts
│   └── announcements.state.ts
│
└── ui/                              # UI state (loading, errors, modals)
    ├── ui.actions.ts
    ├── ui.reducer.ts
    ├── ui.selectors.ts
    └── ui.state.ts
```

### Global App State Interface
```typescript
// store/app.state.ts
export interface AppState {
  auth: AuthState;
  adminAuth: AdminAuthState;
  users: UsersState;
  roles: RolesState;
  tiers: TiersState;
  boards: BoardsState;
  transactions: TransactionsState;
  elections: ElectionsState;
  announcements: AnnouncementsState;
  ui: UIState;
}
```

### Example: Auth Store Implementation

**State Interface:**
```typescript
// store/auth/auth.state.ts
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};
```

**Actions:**
```typescript
// store/auth/auth.actions.ts
import { createAction, props } from '@ngrx/store';
import { User } from '../../shared/models/user.model';

// Login
export const login = createAction(
  '[Auth] Login',
  props<{ phone: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Register
export const register = createAction(
  '[Auth] Register',
  props<{ phone: string; password: string; fullName: string }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: User; token: string }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// Logout
export const logout = createAction('[Auth] Logout');

// Load user from storage
export const loadUserFromStorage = createAction('[Auth] Load User From Storage');
```

**Reducer:**
```typescript
// store/auth/auth.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Register
  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.registerSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),

  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Logout
  on(AuthActions.logout, () => initialAuthState)
);
```

**Effects:**
```typescript
// store/auth/auth.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, exhaustMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ phone, password }) =>
        this.authService.login(phone, password).pipe(
          map(({ user, token }) =>
            AuthActions.loginSuccess({ user, token })
          ),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.message }))
          )
        )
      )
    )
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ phone, password, fullName }) =>
        this.authService.register(phone, password, fullName).pipe(
          map(({ user, token }) =>
            AuthActions.registerSuccess({ user, token })
          ),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
      tap(({ user, token }) => {
        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
      })
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      })
    ),
    { dispatch: false }
  );

  loadUserFromStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserFromStorage),
      map(() => {
        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('user');

        if (token && userJson) {
          const user = JSON.parse(userJson);
          return AuthActions.loginSuccess({ user, token });
        }

        return AuthActions.logout();
      })
    )
  );

  constructor(
    private actions$: Actions,
    private authService: AuthService
  ) {}
}
```

**Selectors:**
```typescript
// store/auth/auth.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

export const selectAuthToken = createSelector(
  selectAuthState,
  (state) => state.token
);
```

---

## Caching Mechanism

### Multi-Layer Caching Strategy

#### 1. **NgRx Store Cache (In-Memory)**
- **Purpose**: Fast access to recently loaded data
- **Lifetime**: Session-based (cleared on page reload)
- **Use Cases**: Active user session data, recently viewed items

**Implementation:**
```typescript
// store/users/users.state.ts
export interface UsersState {
  entities: { [id: string]: User };  // Normalized entities
  ids: string[];                      // List of IDs
  selectedUserId: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;         // Timestamp for cache validation
}

// store/users/users.selectors.ts
export const selectAllUsers = createSelector(
  selectUsersState,
  (state) => state.ids.map(id => state.entities[id])
);

export const selectUserById = (id: string) => createSelector(
  selectUsersState,
  (state) => state.entities[id]
);

export const selectIsCacheValid = createSelector(
  selectUsersState,
  (state) => {
    const now = Date.now();
    const cacheAge = state.lastUpdated ? now - state.lastUpdated : Infinity;
    const maxCacheAge = 5 * 60 * 1000; // 5 minutes
    return cacheAge < maxCacheAge;
  }
);
```

#### 2. **LocalStorage Cache (Persistent)**
- **Purpose**: Persist data across page reloads
- **Lifetime**: Until manually cleared or expired
- **Use Cases**: User auth, user preferences, offline data

**Implementation:**
```typescript
// core/services/storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  // Set item with optional expiry
  setItem(key: string, value: any, expiryMinutes?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  // Get item with expiry check
  getItem<T>(key: string): T | null {
    const itemJson = localStorage.getItem(key);
    if (!itemJson) return null;

    try {
      const item = JSON.parse(itemJson);

      // Check if expired
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return null;
      }

      return item.value as T;
    } catch {
      return null;
    }
  }

  // Remove item
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all storage
  clear(): void {
    localStorage.clear();
  }

  // Check if item exists and is valid
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
}
```

#### 3. **IndexedDB Cache (Large Data)**
- **Purpose**: Store large datasets (elections, transaction history)
- **Lifetime**: Long-term persistent storage
- **Use Cases**: Offline-first features, large datasets

**Implementation:**
```typescript
// core/services/indexed-db.service.ts
import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TenmiyeDB extends DBSchema {
  users: {
    key: string;
    value: User;
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': number };
  };
  announcements: {
    key: string;
    value: Announcement;
    indexes: { 'by-date': number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private db: IDBPDatabase<TenmiyeDB> | null = null;

  async initDB(): Promise<void> {
    this.db = await openDB<TenmiyeDB>('tenmiye-db', 1, {
      upgrade(db) {
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // Transactions store with index
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'createdAt');
        }

        // Announcements store with index
        if (!db.objectStoreNames.contains('announcements')) {
          const announcementStore = db.createObjectStore('announcements', { keyPath: 'id' });
          announcementStore.createIndex('by-date', 'createdAt');
        }
      }
    });
  }

  async saveUsers(users: User[]): Promise<void> {
    if (!this.db) await this.initDB();
    const tx = this.db!.transaction('users', 'readwrite');
    await Promise.all(users.map(user => tx.store.put(user)));
    await tx.done;
  }

  async getUsers(): Promise<User[]> {
    if (!this.db) await this.initDB();
    return this.db!.getAll('users');
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    if (!this.db) await this.initDB();
    const tx = this.db!.transaction('transactions', 'readwrite');
    await Promise.all(transactions.map(t => tx.store.put(t)));
    await tx.done;
  }

  async getTransactionsByDateRange(startDate: number, endDate: number): Promise<Transaction[]> {
    if (!this.db) await this.initDB();
    const index = this.db!.transaction('transactions').store.index('by-date');
    return index.getAll(IDBKeyRange.bound(startDate, endDate));
  }

  async clearStore(storeName: 'users' | 'transactions' | 'announcements'): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.clear(storeName);
  }
}
```

#### 4. **HTTP Interceptor Cache**
- **Purpose**: Cache HTTP responses to reduce API calls
- **Lifetime**: Configurable per endpoint
- **Use Cases**: Static data (roles, tiers), infrequently changing data

**Implementation:**
```typescript
// core/interceptors/cache.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpResponse, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Endpoints that should be cached
  private readonly CACHEABLE_ENDPOINTS = [
    '/api/roles',
    '/api/tiers',
    '/api/constants'
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Check if endpoint is cacheable
    const isCacheable = this.CACHEABLE_ENDPOINTS.some(endpoint =>
      req.url.includes(endpoint)
    );

    if (!isCacheable) {
      return next.handle(req);
    }

    // Check cache
    const cachedResponse = this.cache.get(req.url);
    if (cachedResponse) {
      const age = Date.now() - cachedResponse.timestamp;
      if (age < this.CACHE_DURATION) {
        return of(cachedResponse.response.clone());
      } else {
        // Expired, remove from cache
        this.cache.delete(req.url);
      }
    }

    // Fetch and cache
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.url, {
            response: event.clone(),
            timestamp: Date.now()
          });
        }
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

### Cache Strategy Per Feature

| Feature | Cache Layer | TTL | Strategy |
|---------|-------------|-----|----------|
| Auth Token | LocalStorage | 24 hours | Persist across sessions |
| User Profile | NgRx Store + LocalStorage | Session / 1 hour | Fast access + persistence |
| Roles/Tiers | HTTP Cache + NgRx Store | 5 minutes | Rarely changes |
| Announcements | NgRx Store + IndexedDB | Session / 1 day | Offline access |
| Transactions | NgRx Store + IndexedDB | Session / 7 days | Offline viewing |
| Elections | NgRx Store | Session | Real-time updates needed |
| Users List (Admin) | NgRx Store | Session | Frequently updated |

### Cache Invalidation Strategies

**1. Time-Based Expiration:**
```typescript
// Check cache age before using
export const shouldRefreshCache = createSelector(
  selectLastUpdated,
  (lastUpdated) => {
    if (!lastUpdated) return true;
    const age = Date.now() - lastUpdated;
    return age > 5 * 60 * 1000; // Older than 5 minutes
  }
);
```

**2. Manual Invalidation:**
```typescript
// Clear cache on specific actions
export const clearUsersCache = createAction('[Users] Clear Cache');

on(clearUsersCache, (state) => ({
  ...initialUsersState
}));
```

**3. Server-Driven Invalidation:**
```typescript
// Use ETag or Last-Modified headers
private checkCacheValidity(etag: string): boolean {
  const cachedEtag = localStorage.getItem('users_etag');
  return cachedEtag === etag;
}
```

### Offline-First Strategy

**Service Worker Configuration:**
```typescript
// ngsw-config.json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-cache",
      "urls": [
        "/api/roles",
        "/api/tiers",
        "/api/constants"
      ],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "strategy": "freshness"
      }
    },
    {
      "name": "api-performance",
      "urls": [
        "/api/announcements",
        "/api/transactions"
      ],
      "cacheConfig": {
        "maxSize": 500,
        "maxAge": "1d",
        "strategy": "performance"
      }
    }
  ]
}
```

---

## SCSS Implementation Examples

### Home Layout Styles

```scss
// home-layout.component.scss

.home-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .home-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: 60px;

    // Center header content on larger screens
    @media (min-width: $tablet-min) {
      display: flex;
      justify-content: center;

      .header-content {
        width: 100%;
        max-width: $home-content-max-width;
      }
    }
  }

  .home-content-wrapper {
    flex: 1;
    margin-top: 60px; // Header height
    margin-bottom: 60px; // Bottom nav height

    // Center content on larger screens with side padding
    @media (min-width: $tablet-min) {
      display: flex;
      justify-content: center;
      padding: 0 max(16px, calc((100vw - #{$home-content-max-width}) / 2));
    }

    .home-content {
      width: 100%;
      padding: 16px;

      // Enforce max width on larger screens
      @media (min-width: $tablet-min) {
        max-width: $home-content-max-width;
        padding: 24px 16px;
      }
    }
  }

  .home-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: 60px;

    // Center bottom nav on larger screens
    @media (min-width: $tablet-min) {
      display: flex;
      justify-content: center;

      .nav-content {
        width: 100%;
        max-width: $home-content-max-width;
      }
    }
  }
}
```

### Dashboard Layout Styles

```scss
// dashboard-layout.component.scss

.dashboard-layout {
  min-height: 100vh;
  display: flex;

  .dashboard-sidebar {
    background: #1a1d2e;

    // Mobile: Hidden by default, shown as overlay drawer
    @media (max-width: $mobile-max) {
      position: fixed;
      top: 0;
      left: -100%;
      width: 280px;
      height: 100vh;
      z-index: 1000;
      transition: left 0.3s ease;

      &.open {
        left: 0;
      }
    }

    // Tablet: Fixed narrow sidebar
    @media (min-width: $tablet-min) and (max-width: $tablet-max) {
      width: $dashboard-sidebar-tablet;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
    }

    // Desktop: Fixed full sidebar
    @media (min-width: $desktop-min) {
      width: $dashboard-sidebar-desktop;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
    }
  }

  .dashboard-main {
    flex: 1;
    display: flex;
    flex-direction: column;

    // Mobile: Full width
    @media (max-width: $mobile-max) {
      width: 100%;
    }

    // Tablet: Offset by sidebar width
    @media (min-width: $tablet-min) and (max-width: $tablet-max) {
      margin-left: $dashboard-sidebar-tablet;
      width: calc(100% - #{$dashboard-sidebar-tablet});
    }

    // Desktop: Offset by sidebar width
    @media (min-width: $desktop-min) {
      margin-left: $dashboard-sidebar-desktop;
      width: calc(100% - #{$dashboard-sidebar-desktop});
    }

    .dashboard-header {
      height: 64px;
      border-bottom: 1px solid #2a2d3e;
    }

    .dashboard-content {
      flex: 1;
      padding: 16px;

      @media (min-width: $tablet-min) {
        padding: 24px;
      }

      @media (min-width: $desktop-min) {
        padding: 32px;
      }
    }
  }

  // Overlay for mobile drawer
  .dashboard-overlay {
    display: none;

    @media (max-width: $mobile-max) {
      &.visible {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      }
    }
  }
}
```

---

## Grid System for Dashboard Content

### Mobile (1 Column)
```scss
.dashboard-cards {
  display: grid;
  gap: 16px;

  // Mobile: 1 column
  @media (max-width: $mobile-max) {
    grid-template-columns: 1fr;
  }

  // Tablet: 2 columns
  @media (min-width: $tablet-min) and (max-width: $tablet-max) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  // Desktop: 3-4 columns
  @media (min-width: $desktop-min) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
  }

  @media (min-width: $large-desktop-min) {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## Navigation Patterns

### Home Layout Navigation
- **Mobile**: Bottom navigation bar (Home, Profile, Transactions, More)
- **Tablet/Desktop**: Same bottom nav, centered to content width
- **Menu**: Hamburger menu opens drawer with full navigation

### Dashboard Layout Navigation
- **Mobile**: Hamburger menu opens drawer sidebar
- **Tablet**: Fixed narrow sidebar with icons + text
- **Desktop**: Fixed full sidebar with expanded menu items

---

## Routing Structure

```typescript
// app.routes.ts
export const routes: Routes = [
  // Home Layout Routes (/)
  {
    path: '',
    loadComponent: () => import('./layouts/home/home-layout.component'),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./features/home/auth/login/login.component') },
      { path: 'dashboard', loadComponent: () => import('./features/home/dashboard/dashboard.component') },
      { path: 'profile', loadComponent: () => import('./features/home/profile/profile.component') },
      { path: 'transactions', loadComponent: () => import('./features/home/transactions/transactions.component') },
      { path: 'announcements', loadComponent: () => import('./features/home/announcements/announcements.component') },
      { path: 'elections', loadComponent: () => import('./features/home/elections/elections.component') },
    ]
  },

  // Dashboard Layout Routes (/admin)
  {
    path: 'admin',
    loadComponent: () => import('./layouts/dashboard/dashboard-layout.component'),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./features/admin/auth/login/login.component') },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component') },
      { path: 'users', loadComponent: () => import('./features/admin/users/users.component') },
      { path: 'roles', loadComponent: () => import('./features/admin/roles/roles.component') },
      { path: 'tiers', loadComponent: () => import('./features/admin/tiers/tiers.component') },
      { path: 'boards', loadComponent: () => import('./features/admin/boards/boards.component') },
      { path: 'approvals', loadComponent: () => import('./features/admin/approvals/approvals.component') },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics.component') },
      { path: 'settings', loadComponent: () => import('./features/admin/settings/settings.component') },
    ]
  }
];
```

---

## Key Responsive Features

### Home Layout (`/`)
1. **Fixed Max Width**: Content never exceeds 428px
2. **Centered on Desktop**: Empty space on sides with gradient/blur
3. **Bottom Navigation**: Always visible, centered to content
4. **Touch-Friendly**: Large tap targets (min 44px)
5. **Vertical Scroll**: Primary navigation pattern

### Dashboard Layout (`/admin`)
1. **Flexible Sidebar**: Off-canvas → Narrow → Full width
2. **Grid Adaptation**: 1 col → 2 cols → 3-4 cols
3. **Data Tables**: Horizontal scroll on mobile, full width on desktop
4. **Touch & Mouse**: Optimized for both interaction methods
5. **Responsive Charts**: Scale based on container width

---

## Performance Considerations

### Home Layout
- Optimize for 3G/4G networks
- Lazy load images
- Service worker for offline access
- Minimize JavaScript bundle size

### Dashboard Layout
- Code splitting by route
- Virtual scrolling for large tables
- Debounced search/filter inputs
- Cached API responses

---

## Accessibility

### Both Layouts
- Semantic HTML (header, nav, main, footer)
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus management for drawers/modals
- Min contrast ratio 4.5:1
- Touch targets min 44x44px

---

## Next Steps

1. ✅ Define layout structure and responsive breakpoints
2. [ ] Create layout components (home-layout, dashboard-layout)
3. [ ] Implement responsive SCSS with breakpoints
4. [ ] Build navigation components (headers, sidebars, bottom nav)
5. [ ] Create page templates for each feature
6. [ ] Integrate NgRx store
7. [ ] Connect to Express backend APIs
8. [ ] Add animations and transitions
9. [ ] Test on real devices
10. [ ] Optimize performance

---

## Implementation Roadmap

### Phase 0: Project Setup & Tooling Configuration

#### Project Structure Overview
```
temiye/                           # Root project directory
├── frontend/                     # Angular application
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.json
│   ├── .prettierrc
│   └── .prettierignore
├── backend/                      # Express application (existing)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

#### Step 0.1: Create Angular Project

```bash
# Navigate to root directory
cd /Users/ukg/Projects/POC/temiye

# Create Angular project named 'frontend'
ng new frontend --routing --style=scss --standalone --skip-git

# Navigate to frontend directory
cd frontend
```

**Angular CLI prompts:**
- Would you like to enable Server-Side Rendering (SSR)? **No**
- Would you like to enable prerendering? **No**

#### Step 0.2: Install Core Dependencies

```bash
# NgRx for state management
npm install @ngrx/store@latest @ngrx/effects@latest @ngrx/store-devtools@latest

# Firebase for admin authentication
npm install firebase@latest @angular/fire@latest

# IndexedDB wrapper for offline caching
npm install idb@latest

# Development dependencies
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

#### Step 0.3: Configure Angular Settings

**Update `angular.json`:**

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "frontend": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "inlineTemplate": false,
          "inlineStyle": false,
          "style": "scss",
          "skipTests": true,
          "standalone": true
        },
        "@schematics/angular:directive": {
          "skipTests": true,
          "standalone": true
        },
        "@schematics/angular:pipe": {
          "skipTests": true,
          "standalone": true
        },
        "@schematics/angular:service": {
          "skipTests": true
        },
        "@schematics/angular:guard": {
          "skipTests": true
        },
        "@schematics/angular:interceptor": {
          "skipTests": true
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/frontend",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": []
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "port": 4200,
            "host": "localhost"
          }
        },
        "lint": {
          "builder": "@angular-eslint/builder:lint",
          "options": {
            "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"]
          }
        }
      }
    }
  },
  "cli": {
    "analytics": false
  }
}
```

#### Step 0.4: ESLint Configuration

**Install Angular ESLint:**

```bash
ng add @angular-eslint/schematics
```

**Create `.eslintrc.json`:**

```json
{
  "root": true,
  "ignorePatterns": ["projects/**/*"],
  "overrides": [
    {
      "files": ["*.ts"],
      "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
        "plugin:prettier/recommended"
      ],
      "rules": {
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "app",
            "style": "camelCase"
          }
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "app",
            "style": "kebab-case"
          }
        ],
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { "argsIgnorePattern": "^_" }
        ],
        "no-console": ["warn", { "allow": ["warn", "error"] }]
      }
    },
    {
      "files": ["*.html"],
      "extends": [
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility",
        "plugin:prettier/recommended"
      ],
      "rules": {}
    }
  ]
}
```

#### Step 0.5: Prettier Configuration

**Create `.prettierrc`:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "angular"
      }
    }
  ]
}
```

**Create `.prettierignore`:**

```
# Dependencies
node_modules/

# Build outputs
dist/
.angular/

# Environment files
.env
.env.local

# IDE
.vscode/
.idea/

# Misc
coverage/
*.log
```

#### Step 0.6: Update package.json Scripts

**Edit `frontend/package.json`:**

```json
{
  "name": "frontend",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "build:prod": "ng build --configuration production",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "format": "prettier --write \"src/**/*.{ts,html,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss,json}\"",
    "check": "npm run format:check && npm run lint",
    "fix": "npm run format && npm run lint:fix",
    "serve:dev": "ng serve --host 0.0.0.0 --port 4200",
    "serve:prod": "ng serve --configuration production"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/compiler": "^18.0.0",
    "@angular/core": "^18.0.0",
    "@angular/fire": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/platform-browser": "^18.0.0",
    "@angular/platform-browser-dynamic": "^18.0.0",
    "@angular/router": "^18.0.0",
    "@ngrx/effects": "^18.0.0",
    "@ngrx/store": "^18.0.0",
    "@ngrx/store-devtools": "^18.0.0",
    "firebase": "^10.0.0",
    "idb": "^8.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^18.0.0",
    "@angular-eslint/builder": "^18.0.0",
    "@angular-eslint/eslint-plugin": "^18.0.0",
    "@angular-eslint/eslint-plugin-template": "^18.0.0",
    "@angular-eslint/schematics": "^18.0.0",
    "@angular-eslint/template-parser": "^18.0.0",
    "@angular/cli": "^18.0.0",
    "@angular/compiler-cli": "^18.0.0",
    "@types/jasmine": "~5.1.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "prettier": "^3.0.0",
    "typescript": "~5.4.0"
  }
}
```

#### Step 0.7: TypeScript Configuration

**Verify `tsconfig.json` includes:**

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": false,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": ["ES2022", "dom"],
    "baseUrl": "./",
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@layouts/*": ["src/app/layouts/*"],
      "@store/*": ["src/app/store/*"],
      "@env/*": ["src/environments/*"]
    }
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

#### Step 0.8: Git Configuration

**Update root `.gitignore`:**

```gitignore
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Build outputs
frontend/dist/
frontend/.angular/
backend/dist/

# Environment files
.env
.env.local
.env.*.local
frontend/src/environments/environment.prod.ts

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
frontend/coverage/
backend/coverage/

# Misc
.angular/
.firebase/
```

#### Step 0.9: Environment Files Setup

**Create `frontend/src/environments/environment.ts`:**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
```

**Create `frontend/src/environments/environment.prod.ts`:**

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api',
  firebase: {
    apiKey: 'PROD_API_KEY',
    authDomain: 'PROD_AUTH_DOMAIN',
    projectId: 'PROD_PROJECT_ID',
    storageBucket: 'PROD_STORAGE_BUCKET',
    messagingSenderId: 'PROD_MESSAGING_SENDER_ID',
    appId: 'PROD_APP_ID',
  },
};
```

#### Step 0.10: Verify Setup

**Run verification commands:**

```bash
# Check if all dependencies are installed
npm list --depth=0

# Run linting
npm run lint

# Run format check
npm run format:check

# Fix formatting
npm run format

# Fix linting issues
npm run lint:fix

# Run combined check (format + lint)
npm run check

# Run combined fix (format + lint fix)
npm run fix

# Start development server
npm start
```

**Verification Checklist:**
- [ ] Angular project created in `frontend/` directory
- [ ] All dependencies installed successfully
- [ ] ESLint configured and running
- [ ] Prettier configured and running
- [ ] `npm run check` passes without errors
- [ ] `npm run fix` auto-fixes issues
- [ ] `npm start` launches dev server on port 4200
- [ ] Path aliases configured in `tsconfig.json`
- [ ] Environment files created

---

### Phase 1: Foundation & Setup (Admin Dashboard Priority)

#### Step 1: Create Angular Project
```bash
# Create new Angular project
ng new tenmiye --routing --style=scss --standalone

# Navigate to project
cd tenmiye

# Install core dependencies
npm install @ngrx/store @ngrx/effects @ngrx/store-devtools
npm install firebase @angular/fire
npm install idb
```

**Configure Angular for 3-File Components:**
Update `angular.json`:
```json
{
  "schematics": {
    "@schematics/angular:component": {
      "inlineTemplate": false,
      "inlineStyle": false,
      "style": "scss",
      "skipTests": true
    }
  }
}
```

#### Step 2: Environment Configuration
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
```

#### Step 3: Core Services (Foundation Layer)
Build in this order:

1. **API Service** (`core/services/api.service.ts`)
   - HTTP wrapper with base URL
   - Error handling
   - Token injection via interceptor

2. **Storage Service** (`core/services/storage.service.ts`)
   - LocalStorage wrapper with expiry
   - Get/set/remove methods

3. **Firebase Auth Service** (`core/services/firebase-auth.service.ts`)
   - Google OAuth login
   - Token management
   - User profile retrieval

#### Step 4: NgRx Store Setup (State Management Layer)

1. **Store Root** (`store/index.ts`)
   - Root configuration
   - Register all reducers
   - Store DevTools setup

2. **Admin Auth Store** (`store/admin-auth/`)
   - State interface (user, token, loading, error)
   - Actions (login, logout, loadFromStorage)
   - Reducer (state mutations)
   - Effects (Firebase OAuth, API calls)
   - Selectors (state queries)

3. **UI Store** (`store/ui/`)
   - Loading states
   - Error messages
   - Toast notifications

#### Step 5: Dashboard Layout Shell (Visual Structure)

1. **Dashboard Layout Component** (`layouts/dashboard/`)
   - Shell: header + sidebar + content area
   - Responsive SCSS (mobile drawer, tablet narrow, desktop full)
   - Mobile drawer logic

2. **Dashboard Header** (`layouts/dashboard/components/dashboard-header/`)
   - Logo
   - Page title
   - User profile dropdown
   - Logout button

3. **Dashboard Sidebar** (`layouts/dashboard/components/dashboard-sidebar/`)
   - Navigation menu
   - Responsive behavior
   - Active route highlighting
   - Icons + text

#### Step 6: Authentication Flow (Login & Guards)

1. **Admin Login Page** (`features/admin/auth/login/`)
   - Google OAuth button
   - Loading spinner
   - Error display
   - Auto-redirect after login

2. **Auth Guard** (`core/guards/admin-layout.guard.ts`)
   - Protect admin routes
   - Redirect to login if not authenticated
   - Check token validity
   - Verify admin approval status

3. **HTTP Interceptors**
   - `auth.interceptor.ts` - Add token to requests
   - `error.interceptor.ts` - Handle API errors globally

#### Step 7: First Feature - Dashboard Overview

1. **Admin Dashboard Page** (`features/admin/dashboard/`)
   - Stats cards (users count, roles count, tiers count, etc.)
   - Connect to NgRx store
   - Call backend APIs
   - Display loading states
   - Error handling

---

### Backend Requirements (Minimum Viable)

To build the admin UI, these backend endpoints **must be ready**:

#### **Priority 1: Admin Auth**
- [ ] `POST /api/admin/verify-token` - Verify Firebase token
- [ ] `GET /api/admin/profile` - Get admin user profile
- [ ] Check approval status in response

#### **Priority 2: Constants** ✅ (Already Done)
- [x] `GET /api/constants` - Get all system constants

#### **Priority 3: Roles** ✅ (Already Done)
- [x] `GET /api/roles` - List all roles
- [x] `GET /api/roles/level/:level` - Get roles by level

#### **Priority 4: Tiers** ✅ (Already Done)
- [x] `GET /api/tiers` - List all tiers

#### **Priority 5: Users** (Next to Build)
- [ ] `GET /api/users` - List users (with pagination)
- [ ] `GET /api/users/:id` - Get single user
- [ ] `POST /api/users` - Create user
- [ ] `PUT /api/users/:id` - Update user
- [ ] `DELETE /api/users/:id` - Delete user

---

### Build Schedule (First Week)

#### **Day 1-2: Foundation**
- [x] Create Angular project ✅
- [ ] Install dependencies
- [ ] Configure angular.json (3-file pattern, no tests)
- [ ] Set up environment files
- [ ] Create folder structure

#### **Day 3: Core Services**
- [ ] API Service (HTTP wrapper)
- [ ] Storage Service (LocalStorage wrapper)
- [ ] Firebase Auth Service (Google OAuth)

#### **Day 4: Store Setup**
- [ ] Store root configuration
- [ ] Admin Auth store (complete implementation)
- [ ] UI store (loading, errors, toasts)

#### **Day 5: Layout Shell**
- [ ] Dashboard Layout component (header + sidebar + content)
- [ ] Dashboard Header component
- [ ] Dashboard Sidebar component
- [ ] Responsive SCSS (mobile drawer logic)

#### **Day 6-7: Auth Flow**
- [ ] Admin Login page (Google OAuth)
- [ ] Auth Guard (route protection)
- [ ] Connect Firebase
- [ ] Test login flow end-to-end

#### **Day 8: First Feature**
- [ ] Dashboard Overview page
- [ ] Stats cards (fetch from backend)
- [ ] Loading/error states
- [ ] Verify full flow works

---

### Starter File Structure

```
src/
├── app/
│   ├── core/                         # Singleton services
│   │   ├── guards/
│   │   │   └── admin-layout.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   └── services/
│   │       ├── api.service.ts
│   │       ├── storage.service.ts
│   │       └── firebase-auth.service.ts
│   │
│   ├── store/
│   │   ├── index.ts
│   │   ├── app.state.ts
│   │   ├── admin-auth/
│   │   │   ├── admin-auth.state.ts
│   │   │   ├── admin-auth.actions.ts
│   │   │   ├── admin-auth.reducer.ts
│   │   │   ├── admin-auth.effects.ts
│   │   │   └── admin-auth.selectors.ts
│   │   └── ui/
│   │       ├── ui.state.ts
│   │       ├── ui.actions.ts
│   │       ├── ui.reducer.ts
│   │       └── ui.selectors.ts
│   │
│   ├── layouts/
│   │   └── dashboard/
│   │       ├── dashboard-layout.component.ts
│   │       ├── dashboard-layout.component.html
│   │       ├── dashboard-layout.component.scss
│   │       └── components/
│   │           ├── dashboard-header/
│   │           │   ├── dashboard-header.component.ts
│   │           │   ├── dashboard-header.component.html
│   │           │   └── dashboard-header.component.scss
│   │           └── dashboard-sidebar/
│   │               ├── dashboard-sidebar.component.ts
│   │               ├── dashboard-sidebar.component.html
│   │               └── dashboard-sidebar.component.scss
│   │
│   ├── features/
│   │   └── admin/
│   │       ├── auth/
│   │       │   └── login/
│   │       │       ├── login.component.ts
│   │       │       ├── login.component.html
│   │       │       └── login.component.scss
│   │       └── dashboard/
│   │           ├── dashboard.component.ts
│   │           ├── dashboard.component.html
│   │           └── dashboard.component.scss
│   │
│   ├── shared/
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── role.model.ts
│   │       └── tier.model.ts
│   │
│   ├── app.config.ts
│   └── app.routes.ts
│
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

### App Configuration Template

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideStore({}),
    provideEffects([]),
    provideStoreDevtools({ maxAge: 25, logOnly: false })
  ]
};
```

---

*Last Updated: 2025-10-18*
