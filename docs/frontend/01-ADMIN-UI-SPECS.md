# Tenmiye Admin Dashboard UI Documentation

> **Version**: 1.0
> **Last Updated**: 2025-10-18
> **Target**: Desktop-first responsive design (90% desktop/tablet usage)
> **Authentication**: Firebase Google OAuth with approval workflow
> **State Management**: NgRx Store with Effects

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design System](#design-system)
3. [Layout Architecture](#layout-architecture)
4. [Page Specifications](#page-specifications)
5. [Component Library](#component-library)
6. [User Flows](#user-flows)
7. [NgRx Architecture](#ngrx-architecture)
8. [Accessibility](#accessibility)
9. [Implementation Guide](#implementation-guide)

---

## Executive Summary

The **Admin Dashboard** (`/admin`) is the leadership board's management interface for the Tenmiye Community Management System. It provides comprehensive CRUD operations, approval workflows, analytics, and system configuration.

### Key Characteristics

- **Primary Users**: Leadership board members (admins, superadmins)
- **Device Priority**: Desktop-first (1024px+), responsive down to mobile (320px+)
- **Authentication**: Firebase Google OAuth with approval requirement
- **Authorization**: Role-based permissions (admin level 3, superadmin level 4)
- **Layout Strategy**: Full-width responsive with collapsible sidebar
- **Data Intensity**: High (tables, charts, detailed forms)
- **Connectivity**: Reliable (office/home environments)

### Core Features

1. **User Management**: CRUD operations on community members
2. **Role & Tier Management**: Configure permission levels and membership tiers
3. **Board Management**: Manage leadership structure
4. **Approval Queue**: Approve/reject new admin requests
5. **Transaction Management**: View and manage financial records
6. **Election Management**: Create and manage voting campaigns
7. **Analytics Dashboard**: Community metrics and insights
8. **System Settings**: Application configuration

---

## Design System

### Color Palette

**Simple Dark Mode Theme**

The design uses a minimal color palette centered around the brand green from the logo, with a pure dark mode background and simple semantic colors.

```scss
// ============================================
// BRAND COLOR (from logo)
// ============================================
$brand-green: #008548;         // Primary brand color
$brand-green-dark: #006838;    // Hover/active states
$brand-green-light: #00a85a;   // Highlights/selected

// ============================================
// DARK MODE BACKGROUNDS
// ============================================
$bg-primary: #0a0e1a;          // Main app background (very dark blue-black)
$bg-secondary: #151b2e;        // Cards, surfaces
$bg-tertiary: #1f2937;         // Elevated surfaces (modals, dropdowns)
$bg-hover: #2d3748;            // Hover states

// ============================================
// TEXT COLORS (Dark Mode)
// ============================================
$text-primary: #f8fafc;        // Headings, primary text
$text-secondary: #cbd5e1;      // Body text
$text-tertiary: #94a3b8;       // Muted text, labels
$text-disabled: #64748b;       // Disabled text

// ============================================
// BORDERS & DIVIDERS
// ============================================
$border-color: #334155;        // Default borders
$border-hover: #475569;        // Hover borders
$divider: #1e293b;             // Subtle dividers

// ============================================
// SEMANTIC COLORS (Simple)
// ============================================
$success: #10b981;             // Green (success, approved)
$warning: #f59e0b;             // Orange (warning, pending)
$error: #ef4444;               // Red (error, danger, banned)
$info: #3b82f6;                // Blue (informational)

// ============================================
// ROLE COLORS (Simplified)
// ============================================
$role-member: #64748b;         // Gray (Level 1)
$role-board: $brand-green;     // Brand green (Level 2)
$role-admin: $warning;         // Orange (Level 3)
$role-superadmin: $error;      // Red (Level 4)

// ============================================
// TIER COLORS (Metallic theme)
// ============================================
$tier-bronze: #cd7f32;
$tier-silver: #c0c0c0;
$tier-gold: #ffd700;
$tier-platinum: #e5e4e2;
```

### Typography

```scss
// Font Families
$font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
$font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
$font-arabic: 'Noto Sans Arabic', 'Dubai', 'Arial', sans-serif;

// Font Sizes
$text-xs: 0.75rem;      // 12px - Helper text
$text-sm: 0.875rem;     // 14px - Secondary text
$text-base: 1rem;       // 16px - Body text
$text-lg: 1.125rem;     // 18px - Subheadings
$text-xl: 1.25rem;      // 20px - Card titles
$text-2xl: 1.5rem;      // 24px - Page titles
$text-3xl: 1.875rem;    // 30px - Hero text
$text-4xl: 2.25rem;     // 36px - Dashboard metrics

// Font Weights
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;

// Line Heights
$leading-tight: 1.25;
$leading-normal: 1.5;
$leading-relaxed: 1.75;
```

### Spacing Scale

```scss
// Base: 4px unit
$spacing-0: 0;
$spacing-1: 0.25rem;   // 4px
$spacing-2: 0.5rem;    // 8px
$spacing-3: 0.75rem;   // 12px
$spacing-4: 1rem;      // 16px
$spacing-5: 1.25rem;   // 20px
$spacing-6: 1.5rem;    // 24px
$spacing-8: 2rem;      // 32px
$spacing-10: 2.5rem;   // 40px
$spacing-12: 3rem;     // 48px
$spacing-16: 4rem;     // 64px
```

### Border Radius

```scss
$radius-sm: 0.25rem;   // 4px - Small elements
$radius-md: 0.375rem;  // 6px - Buttons, inputs
$radius-lg: 0.5rem;    // 8px - Cards
$radius-xl: 0.75rem;   // 12px - Modals
$radius-full: 9999px;  // Pills, avatars
```

### Shadows

```scss
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Responsive Breakpoints

```scss
$mobile-max: 767px;
$tablet-min: 768px;
$tablet-max: 1023px;
$desktop-min: 1024px;
$desktop-lg: 1280px;
$desktop-xl: 1536px;

// Sidebar Widths
$sidebar-mobile: 0px;      // Hidden (drawer overlay)
$sidebar-tablet: 200px;    // Narrow with icons
$sidebar-desktop: 260px;   // Full width
```

### Logo Usage Guidelines

**Logo Asset:**
- **File**: `logo.png` (PNG format with transparency)
- **Location**: `frontend/src/assets/images/logo.png`
- **Dimensions**: Original aspect ratio maintained
- **Color**: Green (#008548) with white/transparent background

**Logo Variations:**

1. **Full Logo** (Login, About pages)
   - Image + Arabic text "الغــــــدية" + Subtitle
   - Height: 120px (desktop), 80px (mobile)
   - Used for: Login page, About page, Print headers

2. **Logo + Text** (Dashboard header, compact)
   - Image only with optional text beside it
   - Height: 40px (header), 48px (sidebar top)
   - Used for: Dashboard sidebar, App header

3. **Icon Only** (Very small spaces)
   - Just the well/hands symbol
   - Size: 32px × 32px (favicon, mobile icons)
   - Used for: Favicon, PWA icons, notifications

**Usage Examples:**

```html
<!-- Full Logo (Login Page) -->
<div class="logo-full">
  <img src="assets/images/logo.png" alt="الغدية - Tenmiye" />
  <h1 class="logo-text-ar">الغــــــدية</h1>
  <p class="logo-subtitle-ar">لتنمية القبيلة التقليدية</p>
</div>

<!-- Dashboard Sidebar Logo -->
<div class="sidebar-logo">
  <img src="assets/images/logo.png" alt="Tenmiye" class="logo-icon" />
  <span class="logo-text">الغدية</span>
</div>

<!-- Favicon/PWA Icon -->
<!-- Generated from logo.png cropped to icon only -->
<link rel="icon" type="image/png" href="assets/icons/favicon.png" />
```

**Color Usage with Logo:**

```scss
// Primary actions use brand green from logo
.primary-btn {
  background: $brand-green;

  &:hover {
    background: $brand-green-dark;
  }
}

// Active navigation items
.nav-item.active {
  background: rgba($brand-green, 0.1);
  border-left: 3px solid $brand-green;
  color: $brand-green-light;
}

// Success states complement the brand
.success-badge {
  background: $secondary-green; // Lighter than brand green
  color: white;
}
```

**Accessibility:**

```html
<!-- Always include descriptive alt text in Arabic and English -->
<img
  src="assets/images/logo.png"
  alt="الغدية لتنمية القبيلة التقليدية - El Gheddiya Community Development"
  role="img"
/>
```

---

## Layout Architecture

### Overview

The Admin Dashboard uses a **desktop-first layout** with a fixed sidebar and responsive header. Content area is fluid and adapts to viewport width.

```
┌────────────┬────────────────────────────────────────┐
│  Sidebar   │  Header (fixed top)                    │
│  (fixed)   ├────────────────────────────────────────┤
│            │                                        │
│  • Home    │  Content Area (scrollable)             │
│  • Users   │                                        │
│  • Roles   │  ┌──────────────────────────────────┐  │
│  • Tiers   │  │  Page Content                    │  │
│  • Boards  │  │                                  │  │
│  • Trans   │  │  • Stats cards                   │  │
│  • Elec    │  │  • Data tables                   │  │
│  • Announ  │  │  • Forms                         │  │
│  • Approv  │  │  • Charts                        │  │
│  • Analyt  │  │                                  │  │
│  • Settings│  │                                  │  │
│            │  └──────────────────────────────────┘  │
│            │                                        │
└────────────┴────────────────────────────────────────┘
```

### Responsive Behavior

#### Desktop (1024px+)

```scss
.dashboard-layout {
  .sidebar {
    width: 260px;
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    background: $background-dark;
  }

  .main-content {
    margin-left: 260px;
    min-height: 100vh;

    .header {
      height: 64px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .content {
      padding: 32px;
    }
  }
}
```

#### Tablet (768px - 1023px)

```scss
.dashboard-layout {
  .sidebar {
    width: 200px;  // Narrower
    // Icons + abbreviated text
  }

  .main-content {
    margin-left: 200px;

    .content {
      padding: 24px;  // Less padding
    }
  }
}
```

#### Mobile (320px - 767px)

```scss
.dashboard-layout {
  .sidebar {
    width: 280px;
    position: fixed;
    left: -280px;  // Hidden by default
    z-index: 1000;
    transition: left 0.3s ease;

    &.open {
      left: 0;
    }
  }

  .sidebar-overlay {
    display: none;

    &.visible {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 999;
    }
  }

  .main-content {
    margin-left: 0;
    width: 100%;

    .header {
      .hamburger-menu {
        display: block;  // Show hamburger
      }
    }

    .content {
      padding: 16px;
    }
  }
}
```

---

## Page Specifications

### 1. Admin Login (`/admin/login`)

**Purpose**: Authenticate administrators via Google OAuth

**Route**: `/admin/login`
**Guard**: None (public)
**Layout**: Minimal (no sidebar/header)

#### Screen Layout (All Devices)

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│          ┌───────────────┐              │
│          │   Tenmiye     │              │
│          │   Logo        │              │
│          └───────────────┘              │
│                                         │
│      Admin Dashboard Login              │
│      تسجيل دخول لوحة الإدارة            │
│                                         │
│      ┌─────────────────────────────┐    │
│      │  🔐 Sign in with Google     │    │ ← Google OAuth Button
│      └─────────────────────────────┘    │
│                                         │
│      Restricted to approved admins      │
│      محدود للمسؤولين المعتمدين فقط      │
│                                         │
└─────────────────────────────────────────┘
```

#### Component Structure

```typescript
// login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AdminAuthActions from '@store/admin-auth/admin-auth.actions';
import { selectAdminAuthLoading, selectAdminAuthError } from '@store/admin-auth/admin-auth.selectors';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class AdminLoginComponent {
  private store = inject(Store);
  private router = inject(Router);

  loading$ = this.store.select(selectAdminAuthLoading);
  error$ = this.store.select(selectAdminAuthError);

  onGoogleLogin(): void {
    this.store.dispatch(AdminAuthActions.loginWithGoogle());
  }
}
```

#### Template

```html
<!-- login.component.html -->
<div class="login-container">
  <div class="login-card">
    <!-- Logo -->
    <div class="logo">
      <img src="assets/images/logo.png" alt="الغدية لتنمية القبيلة التقليدية - Tenmiye Logo" />
      <p class="logo-tagline">الغــــــدية</p>
      <p class="logo-subtitle">لتنمية القبيلة التقليدية</p>
    </div>

    <!-- Title -->
    <h1 class="title">Admin Dashboard</h1>
    <h2 class="subtitle">لوحة الإدارة</h2>

    <!-- Error Message -->
    <div *ngIf="error$ | async as error" class="error-banner" role="alert">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error }}</span>
    </div>

    <!-- Google Login Button -->
    <button
      class="google-login-btn"
      [disabled]="loading$ | async"
      (click)="onGoogleLogin()"
      aria-label="Sign in with Google"
    >
      <span *ngIf="!(loading$ | async)" class="btn-content">
        <img src="assets/icons/google.svg" alt="Google" class="google-icon" />
        <span>Sign in with Google</span>
      </span>
      <span *ngIf="loading$ | async" class="spinner" aria-live="polite">
        <span class="spinner-icon"></span>
        <span>Signing in...</span>
      </span>
    </button>

    <!-- Restricted Notice -->
    <p class="notice">
      Restricted to approved admins<br />
      <span class="notice-ar">محدود للمسؤولين المعتمدين فقط</span>
    </p>
  </div>
</div>
```

#### Styles

```scss
// login.component.scss
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-primary;
  padding: $spacing-4;

  .login-card {
    background: $bg-secondary;
    border-radius: $radius-xl;
    border: 1px solid $border-color;
    padding: $spacing-10;
    box-shadow: $shadow-xl;
    max-width: 400px;
    width: 100%;
    text-align: center;

    .logo {
      margin-bottom: $spacing-8;
      text-align: center;

      img {
        height: 120px;
        width: auto;
        margin-bottom: $spacing-3;
      }

      .logo-tagline {
        font-family: $font-arabic;
        font-size: $text-2xl;
        font-weight: $font-bold;
        color: $brand-green;
        margin: $spacing-2 0;
        letter-spacing: 2px;
      }

      .logo-subtitle {
        font-family: $font-arabic;
        font-size: $text-sm;
        color: $text-secondary;
        margin: 0;
      }
    }

    .title {
      font-size: $text-2xl;
      font-weight: $font-bold;
      color: $text-primary;
      margin-bottom: $spacing-2;
    }

    .subtitle {
      font-size: $text-lg;
      font-family: $font-arabic;
      color: $text-secondary;
      margin-bottom: $spacing-8;
    }

    .error-banner {
      background: rgba($error, 0.1);
      border: 1px solid $error;
      border-radius: $radius-md;
      padding: $spacing-3 $spacing-4;
      margin-bottom: $spacing-6;
      display: flex;
      align-items: center;
      gap: $spacing-2;

      .error-icon {
        font-size: $text-lg;
      }

      .error-text {
        color: $text-primary;
        font-size: $text-sm;
        text-align: left;
      }
    }

    .google-login-btn {
      width: 100%;
      padding: $spacing-3 $spacing-6;
      background: white;
      color: #1f2937;
      border: 1px solid $border-color;
      border-radius: $radius-md;
      font-size: $text-base;
      font-weight: $font-medium;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: $spacing-6;

      &:hover:not(:disabled) {
        background: #f9fafb;
        border-color: $brand-green;
        box-shadow: 0 0 0 3px rgba($brand-green, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $spacing-3;
      }

      .google-icon {
        height: 20px;
        width: 20px;
      }

      .spinner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $spacing-2;

        .spinner-icon {
          width: 16px;
          height: 16px;
          border: 2px solid $border-color;
          border-top-color: $brand-green;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }

    .notice {
      font-size: $text-sm;
      color: $text-tertiary;
      line-height: $leading-relaxed;

      .notice-ar {
        font-family: $font-arabic;
        display: block;
        margin-top: $spacing-1;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Mobile adjustments
@media (max-width: $mobile-max) {
  .login-container {
    padding: $spacing-2;

    .login-card {
      padding: $spacing-6;

      .logo img {
        height: 60px;
      }

      .title {
        font-size: $text-xl;
      }

      .subtitle {
        font-size: $text-base;
      }
    }
  }
}
```

#### NgRx Integration

**Actions Dispatched:**
```typescript
// On button click
AdminAuthActions.loginWithGoogle()

// Effects will handle:
// 1. Firebase auth popup
// 2. Get ID token
// 3. Send to backend for verification
// 4. Check approval status
// 5. Store user + token
// 6. Navigate to /admin/dashboard
```

**Selectors Subscribed:**
```typescript
selectAdminAuthLoading  // Show spinner
selectAdminAuthError    // Display error message
```

**Success Flow:**
```typescript
// admin-auth.effects.ts
loginWithGoogle$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AdminAuthActions.loginWithGoogle),
    exhaustMap(() =>
      from(this.firebaseAuth.signInWithGoogle()).pipe(
        switchMap((credential) =>
          this.apiService.post('/admin/verify-token', {
            token: credential.idToken
          }).pipe(
            map(({ admin }) => {
              if (admin.approvalStatus !== 'approved') {
                return AdminAuthActions.loginFailure({
                  error: 'Your admin account is pending approval'
                });
              }
              return AdminAuthActions.loginSuccess({
                user: admin,
                token: credential.idToken
              });
            }),
            catchError((error) =>
              of(AdminAuthActions.loginFailure({ error: error.message }))
            )
          )
        ),
        catchError((error) =>
          of(AdminAuthActions.loginFailure({ error: error.message }))
        )
      )
    )
  )
);

loginSuccess$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AdminAuthActions.loginSuccess),
    tap(() => {
      this.router.navigate(['/admin/dashboard']);
    })
  ),
  { dispatch: false }
);
```

#### Error Messages

```typescript
// Error message mapping
const ERROR_MESSAGES = {
  'auth/popup-closed-by-user': 'Login cancelled. Please try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/unauthorized-domain': 'This domain is not authorized for OAuth.',
  'approval-pending': 'Your admin account is pending approval. Contact a superadmin.',
  'approval-rejected': 'Your admin request was rejected.',
  'default': 'Login failed. Please try again.'
};
```

#### Accessibility

```html
<!-- ARIA labels -->
<button
  aria-label="Sign in with Google"
  [attr.aria-busy]="loading$ | async"
  [attr.aria-disabled]="loading$ | async"
>

<!-- Error announcements -->
<div
  *ngIf="error$ | async"
  role="alert"
  aria-live="assertive"
>

<!-- Loading announcements -->
<span
  *ngIf="loading$ | async"
  aria-live="polite"
>
  Signing in...
</span>
```

---

### 2. Admin Dashboard (`/admin/dashboard`)

**Purpose**: Overview of community statistics and recent activity

**Route**: `/admin/dashboard`
**Guard**: `AdminLayoutGuard`
**Permissions**: admin (level 3+), superadmin (level 4)

#### Screen Layout (Desktop 1024px+)

```
┌────────────┬────────────────────────────────────────────────────────┐
│  Sidebar   │  Dashboard                             [Profile Menu] │ ← Header
│            ├────────────────────────────────────────────────────────┤
│  • Home ✓  │  Welcome back, Ahmed Mohamed                          │
│  • Users   │  آخر دخول: 2 hours ago                                │
│  • Roles   │                                                       │
│  • Tiers   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  • Boards  │  │ Users    │ │ Pending  │ │ Boards   │ │ Revenue  │ │
│  • Trans   │  │ 1,234    │ │ 12       │ │ 8        │ │ 45,000   │ │
│  • Elec    │  │ +5%      │ │ 🔔       │ │ Active   │ │ MRU      │ │
│  • Announ  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  • Approv  │                                                       │
│  • Analyt  │  Recent Activity                        [View All]   │
│  • Settings│  ┌────────────────────────────────────────────────┐   │
│            │  │ New user registered: Fatima Mint Ali          │   │
│  (260px)   │  │ 5 minutes ago                                  │   │
│            │  ├────────────────────────────────────────────────┤   │
│            │  │ Board meeting scheduled: Water Committee       │   │
│            │  │ 1 hour ago                                     │   │
│            │  ├────────────────────────────────────────────────┤   │
│            │  │ Election created: Community President 2025     │   │
│            │  │ 3 hours ago                                    │   │
│            │  └────────────────────────────────────────────────┘   │
│            │                                                       │
│            │  Quick Actions                                        │
│            │  [+ Add User] [Create Announcement] [New Election]   │
│            │                                                       │
└────────────┴────────────────────────────────────────────────────────┘
```

#### Component Structure

```typescript
// dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as DashboardActions from '@store/dashboard/dashboard.actions';
import {
  selectDashboardStats,
  selectRecentActivity,
  selectDashboardLoading
} from '@store/dashboard/dashboard.selectors';

interface DashboardStats {
  totalUsers: number;
  usersGrowth: number;
  pendingApprovals: number;
  activeBoards: number;
  totalRevenue: number;
  revenueGrowth: number;
}

interface Activity {
  id: string;
  type: 'user' | 'board' | 'election' | 'announcement' | 'transaction';
  message: string;
  timestamp: Date;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private store = inject(Store);

  stats$: Observable<DashboardStats> = this.store.select(selectDashboardStats);
  activities$: Observable<Activity[]> = this.store.select(selectRecentActivity);
  loading$: Observable<boolean> = this.store.select(selectDashboardLoading);

  ngOnInit(): void {
    this.store.dispatch(DashboardActions.loadDashboardStats());
    this.store.dispatch(DashboardActions.loadRecentActivity());
  }

  onAddUser(): void {
    // Navigate to user creation
  }

  onCreateAnnouncement(): void {
    // Navigate to announcement creation
  }

  onCreateElection(): void {
    // Navigate to election creation
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-MR', {
      style: 'currency',
      currency: 'MRU'
    }).format(value);
  }

  formatRelativeTime(date: Date): string {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = date.getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
    return rtf.format(days, 'day');
  }
}
```

#### Template

```html
<!-- dashboard.component.html -->
<div class="dashboard-page">
  <!-- Header Section -->
  <div class="dashboard-header">
    <div class="welcome">
      <h1 class="welcome-title">Welcome back, Ahmed Mohamed</h1>
      <p class="welcome-subtitle">آخر دخول: 2 hours ago</p>
    </div>
  </div>

  <!-- Loading State -->
  <div *ngIf="loading$ | async" class="loading-skeleton">
    <div class="skeleton-stats">
      <div class="skeleton-card" *ngFor="let i of [1,2,3,4]"></div>
    </div>
  </div>

  <!-- Stats Cards -->
  <div *ngIf="stats$ | async as stats" class="stats-grid">
    <!-- Users Card -->
    <div class="stat-card stat-card-users">
      <div class="stat-icon">
        <svg><!-- Users icon --></svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Total Users</p>
        <p class="stat-value">{{ stats.totalUsers | number }}</p>
        <p class="stat-change" [class.positive]="stats.usersGrowth > 0">
          <span class="change-icon">{{ stats.usersGrowth > 0 ? '↑' : '↓' }}</span>
          {{ stats.usersGrowth }}% from last month
        </p>
      </div>
    </div>

    <!-- Pending Approvals Card -->
    <div class="stat-card stat-card-pending">
      <div class="stat-icon stat-icon-warning">
        <svg><!-- Bell icon --></svg>
        <span *ngIf="stats.pendingApprovals > 0" class="badge">
          {{ stats.pendingApprovals }}
        </span>
      </div>
      <div class="stat-content">
        <p class="stat-label">Pending Approvals</p>
        <p class="stat-value">{{ stats.pendingApprovals }}</p>
        <a routerLink="/admin/approvals" class="stat-link">View queue →</a>
      </div>
    </div>

    <!-- Active Boards Card -->
    <div class="stat-card stat-card-boards">
      <div class="stat-icon">
        <svg><!-- Boards icon --></svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Active Boards</p>
        <p class="stat-value">{{ stats.activeBoards }}</p>
        <p class="stat-meta">Leadership committees</p>
      </div>
    </div>

    <!-- Revenue Card -->
    <div class="stat-card stat-card-revenue">
      <div class="stat-icon">
        <svg><!-- Money icon --></svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Total Revenue</p>
        <p class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</p>
        <p class="stat-change" [class.positive]="stats.revenueGrowth > 0">
          <span class="change-icon">{{ stats.revenueGrowth > 0 ? '↑' : '↓' }}</span>
          {{ stats.revenueGrowth }}% this month
        </p>
      </div>
    </div>
  </div>

  <!-- Recent Activity Section -->
  <div class="section-container">
    <div class="section-header">
      <h2 class="section-title">Recent Activity</h2>
      <a routerLink="/admin/activity" class="section-link">View All →</a>
    </div>

    <div *ngIf="activities$ | async as activities" class="activity-list">
      <div
        *ngFor="let activity of activities"
        class="activity-item"
        [attr.data-type]="activity.type"
      >
        <div class="activity-icon">
          <span [innerHTML]="activity.icon"></span>
        </div>
        <div class="activity-content">
          <p class="activity-message">{{ activity.message }}</p>
          <p class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="activities.length === 0" class="empty-state">
        <svg class="empty-icon"><!-- Empty icon --></svg>
        <p>No recent activity</p>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="quick-actions">
    <h3 class="quick-actions-title">Quick Actions</h3>
    <div class="actions-grid">
      <button class="action-btn action-btn-primary" (click)="onAddUser()">
        <svg><!-- Plus icon --></svg>
        <span>Add User</span>
      </button>
      <button class="action-btn action-btn-secondary" (click)="onCreateAnnouncement()">
        <svg><!-- Megaphone icon --></svg>
        <span>Create Announcement</span>
      </button>
      <button class="action-btn action-btn-secondary" (click)="onCreateElection()">
        <svg><!-- Vote icon --></svg>
        <span>New Election</span>
      </button>
    </div>
  </div>
</div>
```

#### Styles (Continued in next section due to length...)

```scss
// dashboard.component.scss
.dashboard-page {
  .dashboard-header {
    margin-bottom: $spacing-8;

    .welcome-title {
      font-size: $text-2xl;
      font-weight: $font-bold;
      color: $text-primary;
      margin-bottom: $spacing-2;
    }

    .welcome-subtitle {
      font-size: $text-sm;
      color: $text-muted;
      font-family: $font-arabic;
    }
  }

  // Stats Grid
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: $spacing-6;
    margin-bottom: $spacing-10;

    @media (min-width: $desktop-lg) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .stat-card {
    background: $surface-dark;
    border-radius: $radius-lg;
    padding: $spacing-6;
    border: 1px solid $border-dark;
    display: flex;
    gap: $spacing-4;
    transition: all 0.2s;

    &:hover {
      border-color: $primary-blue;
      box-shadow: $shadow-md;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: $radius-md;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;

      svg {
        width: 24px;
        height: 24px;
        color: white;
      }

      .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: $secondary-red;
        color: white;
        font-size: 10px;
        font-weight: $font-bold;
        padding: 2px 6px;
        border-radius: $radius-full;
        min-width: 18px;
        text-align: center;
      }
    }

    &-users .stat-icon {
      background: linear-gradient(135deg, $primary-blue, $primary-blue-dark);
    }

    &-pending .stat-icon {
      background: linear-gradient(135deg, $secondary-yellow, #d97706);
    }

    &-boards .stat-icon {
      background: linear-gradient(135deg, $secondary-purple, #6d28d9);
    }

    &-revenue .stat-icon {
      background: linear-gradient(135deg, $secondary-green, #059669);
    }

    .stat-content {
      flex: 1;

      .stat-label {
        font-size: $text-sm;
        color: $text-muted;
        margin-bottom: $spacing-1;
      }

      .stat-value {
        font-size: $text-3xl;
        font-weight: $font-bold;
        color: $text-primary;
        margin-bottom: $spacing-2;
      }

      .stat-change {
        font-size: $text-xs;
        color: $text-secondary;
        display: flex;
        align-items: center;
        gap: $spacing-1;

        &.positive {
          color: $secondary-green;
        }

        .change-icon {
          font-size: $text-sm;
        }
      }

      .stat-link {
        font-size: $text-sm;
        color: $primary-blue;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: $spacing-1;

        &:hover {
          color: $primary-blue-light;
          text-decoration: underline;
        }
      }

      .stat-meta {
        font-size: $text-xs;
        color: $text-muted;
      }
    }
  }

  // Recent Activity
  .section-container {
    background: $surface-dark;
    border-radius: $radius-lg;
    border: 1px solid $border-dark;
    padding: $spacing-6;
    margin-bottom: $spacing-8;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-6;

      .section-title {
        font-size: $text-xl;
        font-weight: $font-semibold;
        color: $text-primary;
      }

      .section-link {
        font-size: $text-sm;
        color: $primary-blue;
        text-decoration: none;

        &:hover {
          color: $primary-blue-light;
          text-decoration: underline;
        }
      }
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;

      .activity-item {
        display: flex;
        gap: $spacing-4;
        padding: $spacing-4;
        border-radius: $radius-md;
        transition: background 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: $radius-full;
          background: $surface-light;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;

          .activity-message {
            font-size: $text-sm;
            color: $text-primary;
            margin-bottom: $spacing-1;
          }

          .activity-time {
            font-size: $text-xs;
            color: $text-muted;
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: $spacing-10;
        color: $text-muted;

        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto $spacing-4;
          opacity: 0.5;
        }
      }
    }
  }

  // Quick Actions
  .quick-actions {
    .quick-actions-title {
      font-size: $text-lg;
      font-weight: $font-semibold;
      color: $text-primary;
      margin-bottom: $spacing-4;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: $spacing-4;

      .action-btn {
        padding: $spacing-4 $spacing-6;
        border-radius: $radius-md;
        border: none;
        font-size: $text-sm;
        font-weight: $font-medium;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: $spacing-2;
        transition: all 0.2s;

        svg {
          width: 20px;
          height: 20px;
        }

        &-primary {
          background: $primary-blue;
          color: white;

          &:hover {
            background: $primary-blue-dark;
            box-shadow: $shadow-md;
          }
        }

        &-secondary {
          background: $surface-light;
          color: $text-primary;
          border: 1px solid $border-dark;

          &:hover {
            background: $surface-dark;
            border-color: $primary-blue;
          }
        }
      }
    }
  }

  // Mobile Responsive
  @media (max-width: $mobile-max) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: $spacing-4;
    }

    .stat-card {
      padding: $spacing-4;

      .stat-value {
        font-size: $text-2xl;
      }
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }
  }
}
```

#### NgRx Integration

**State Shape:**
```typescript
// store/dashboard/dashboard.state.ts
export interface DashboardState {
  stats: DashboardStats | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export const initialDashboardState: DashboardState = {
  stats: null,
  activities: [],
  loading: false,
  error: null,
  lastUpdated: null
};
```

**Actions:**
```typescript
// store/dashboard/dashboard.actions.ts
export const loadDashboardStats = createAction('[Dashboard] Load Stats');
export const loadDashboardStatsSuccess = createAction(
  '[Dashboard] Load Stats Success',
  props<{ stats: DashboardStats }>()
);
export const loadDashboardStatsFailure = createAction(
  '[Dashboard] Load Stats Failure',
  props<{ error: string }>()
);

export const loadRecentActivity = createAction('[Dashboard] Load Recent Activity');
export const loadRecentActivitySuccess = createAction(
  '[Dashboard] Load Recent Activity Success',
  props<{ activities: Activity[] }>()
);
export const loadRecentActivityFailure = createAction(
  '[Dashboard] Load Recent Activity Failure',
  props<{ error: string }>()
);
```

**Effects:**
```typescript
// store/dashboard/dashboard.effects.ts
loadStats$ = createEffect(() =>
  this.actions$.pipe(
    ofType(DashboardActions.loadDashboardStats),
    switchMap(() =>
      this.apiService.get<DashboardStats>('/admin/dashboard/stats').pipe(
        map((stats) => DashboardActions.loadDashboardStatsSuccess({ stats })),
        catchError((error) =>
          of(DashboardActions.loadDashboardStatsFailure({ error: error.message }))
        )
      )
    )
  )
);

loadActivity$ = createEffect(() =>
  this.actions$.pipe(
    ofType(DashboardActions.loadRecentActivity),
    switchMap(() =>
      this.apiService.get<Activity[]>('/admin/dashboard/activity?limit=5').pipe(
        map((activities) => DashboardActions.loadRecentActivitySuccess({ activities })),
        catchError((error) =>
          of(DashboardActions.loadRecentActivityFailure({ error: error.message }))
        )
      )
    )
  )
);
```

---

### 3. Users Management (`/admin/users`)

**Purpose**: CRUD operations for community members

**Route**: `/admin/users`
**Guard**: `AdminLayoutGuard`
**Permissions**: admin (level 3+)

#### Screen Layout (Desktop 1024px+)

```
┌────────────┬────────────────────────────────────────────────────────┐
│  Sidebar   │  Users Management                      [+ Add User]   │
│            ├────────────────────────────────────────────────────────┤
│  • Home    │  [Search users...]  [Role ▼] [Tier ▼] [Status ▼]     │
│  • Users ✓ │  [Clear Filters]                                      │
│  • Roles   │                                                       │
│  • Tiers   │  ┌──────────────────────────────────────────────────┐ │
│  • Boards  │  │ ☐  Name          Phone       Role    Tier  Status│ │
│  • Trans   │  ├──────────────────────────────────────────────────┤ │
│  • Elec    │  │ ☐  Ahmed M.      +222...     Member  Gold  Active│ │
│  • Announ  │  │ ☐  Fatima A.     +222...     Board   Plat  Active│ │
│  • Approv  │  │ ☐  Mohamed S.    +222...     Member  Silv  Pend  │ │
│  • Analyt  │  │ ☐  Khadija B.    +222...     Member  Gold  Active│ │
│  • Settings│  │ ...                                              │ │
│            │  └──────────────────────────────────────────────────┘ │
│            │                                                       │
│            │  [Bulk Actions ▼]    Showing 1-20 of 1,234   [< 1 >] │
│            │                                                       │
└────────────┴────────────────────────────────────────────────────────┘
```

*Due to length constraints, I'll continue with the remaining pages in a structured format. Would you like me to continue with the complete specifications for all 11 admin pages, or would you prefer I move to the home-ui.md documentation?*

The admin-ui.md will include:
- ✅ Login page (complete)
- ✅ Dashboard page (complete)
- 🔄 Users Management (started)
- Roles Management
- Tiers Management
- Boards Management
- Approvals Queue
- Transactions Management
- Elections Management
- Analytics
- Settings

Each with full component code, NgRx integration, responsive layouts, and accessibility specs.

Should I:
1. **Continue with full admin-ui.md** (all 11 pages detailed)
2. **Create home-ui.md now** (9 pages for community members)
3. **Generate both as comprehensive outlines** first, then we can expand specific pages as needed

Which approach would be most helpful for your implementation?
