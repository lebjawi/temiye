# Tenmiye Home Layout UI Documentation

> **Version**: 1.0
> **Last Updated**: 2025-10-18
> **Target**: Mobile-first responsive design (99% mobile usage)
> **Authentication**: Phone + Password (custom authentication)
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

The **Home Layout** (`/`) is the primary interface for community members of El Gheddiya to access their personal information, view announcements, participate in elections, and track their financial contributions.

### Key Characteristics

- **Primary Users**: Community members (all residents of El Gheddiya)
- **Device Priority**: Mobile-first (320px+), centered on larger screens
- **Authentication**: Phone number + password (custom, no Firebase costs)
- **Authorization**: Role-based access (member level 1, board level 2)
- **Layout Strategy**: Fixed 428px max-width, centered on desktop
- **Data Intensity**: Medium (cards, lists, simple forms)
- **Connectivity**: Unreliable (desert environment, offline-first)

### Core Features

1. **Authentication**: Login, register, password recovery
2. **Dashboard**: Personal overview, quick stats, recent activity
3. **Profile**: View and edit personal information
4. **Transactions**: View contribution history
5. **Announcements**: Community news and updates
6. **Elections**: View and participate in voting
7. **Voting**: Cast votes in active elections

---

## Design System

### Color Palette

**Simple Dark Mode Theme** (shared with Admin)

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
$bg-primary: #0a0e1a;          // Main app background
$bg-secondary: #151b2e;        // Cards, surfaces
$bg-tertiary: #1f2937;         // Elevated surfaces
$bg-hover: #2d3748;            // Hover states

// ============================================
// TEXT COLORS
// ============================================
$text-primary: #f8fafc;        // Headings
$text-secondary: #cbd5e1;      // Body text
$text-tertiary: #94a3b8;       // Muted text
$text-disabled: #64748b;       // Disabled

// ============================================
// BORDERS & DIVIDERS
// ============================================
$border-color: #334155;
$border-hover: #475569;
$divider: #1e293b;

// ============================================
// SEMANTIC COLORS
// ============================================
$success: #10b981;
$warning: #f59e0b;
$error: #ef4444;
$info: #3b82f6;

// ============================================
// TIER COLORS
// ============================================
$tier-bronze: #cd7f32;
$tier-silver: #c0c0c0;
$tier-gold: #ffd700;
$tier-platinum: #e5e4e2;
```

### Typography

```scss
// Font Families
$font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
$font-arabic: 'Noto Sans Arabic', 'Dubai', 'Arial', sans-serif;

// Font Sizes (Mobile-optimized)
$text-xs: 0.75rem;      // 12px
$text-sm: 0.875rem;     // 14px
$text-base: 1rem;       // 16px (body default)
$text-lg: 1.125rem;     // 18px
$text-xl: 1.25rem;      // 20px
$text-2xl: 1.5rem;      // 24px
$text-3xl: 1.875rem;    // 30px

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
$spacing-1: 0.25rem;   // 4px
$spacing-2: 0.5rem;    // 8px
$spacing-3: 0.75rem;   // 12px
$spacing-4: 1rem;      // 16px
$spacing-5: 1.25rem;   // 20px
$spacing-6: 1.5rem;    // 24px
$spacing-8: 2rem;      // 32px
$spacing-10: 2.5rem;   // 40px
$spacing-12: 3rem;     // 48px
```

### Responsive Breakpoints

```scss
$mobile-max: 767px;
$tablet-min: 768px;
$tablet-max: 1023px;
$desktop-min: 1024px;

// Home Layout Content Width
$home-content-max-width: 428px;  // Fixed maximum
```

### Logo Usage

**Same as Admin Dashboard**

- **Full Logo**: Login/splash screens (height: 100px mobile, 120px tablet+)
- **Header Logo**: Top navigation (height: 40px)
- **Favicon**: 32×32px icon only

```html
<!-- Home Layout Header Logo -->
<div class="home-header-logo">
  <img src="assets/images/logo.png" alt="الغدية - Tenmiye" />
  <span class="logo-text">الغدية</span>
</div>
```

---

## Layout Architecture

### Overview

The **Home Layout** is mobile-first with a fixed maximum width of **428px**. On larger screens, content remains centered with empty space on the sides.

#### Mobile View (320px - 767px)

```
┌─────────────────────────────────┐
│  [Logo] Dashboard  [Profile]    │ ← Header (fixed, 60px)
├─────────────────────────────────┤
│                                 │
│  Main Content Area              │
│  (Full width, scrollable)       │
│                                 │
│  - Dashboard cards              │
│  - Announcements                │
│  - Quick actions                │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│ [Home][Trans][Vote][More]       │ ← Bottom Nav (fixed, 60px)
└─────────────────────────────────┘
```

#### Desktop View (1024px+)

```
┌─────────┬─────────────────────────┬─────────┐
│         │ [Logo] Dashboard [Prof] │         │ ← Header
│  Empty  ├─────────────────────────┤  Empty  │
│  Space  │                         │  Space  │
│         │  Main Content           │         │
│ (Auto)  │  (428px max-width)      │ (Auto)  │
│         │                         │         │
│         │  - Content centered     │         │
│         │  - Fixed width          │         │
│         │                         │         │
│         ├─────────────────────────┤         │
│         │ [Home][Trans][Vote][More│         │ ← Bottom Nav
└─────────┴─────────────────────────┴─────────┘
```

### Layout Component Structure

```scss
.home-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-primary;

  // Fixed header
  .home-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: $bg-secondary;
    border-bottom: 1px solid $border-color;
    z-index: 100;

    // Center header content on desktop
    @media (min-width: $tablet-min) {
      display: flex;
      justify-content: center;

      .header-content {
        width: 100%;
        max-width: $home-content-max-width;
      }
    }
  }

  // Main content wrapper
  .home-content-wrapper {
    flex: 1;
    margin-top: 60px;      // Header height
    margin-bottom: 60px;   // Bottom nav height
    overflow-y: auto;

    // Center on larger screens
    @media (min-width: $tablet-min) {
      display: flex;
      justify-content: center;
      background: $bg-primary;
    }

    .home-content {
      width: 100%;
      padding: $spacing-4;

      // Enforce max width
      @media (min-width: $tablet-min) {
        max-width: $home-content-max-width;
      }
    }
  }

  // Fixed bottom navigation
  .home-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: $bg-secondary;
    border-top: 1px solid $border-color;
    z-index: 100;

    // Center on larger screens
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

---

## Page Specifications

### 1. Login (`/login`)

**Purpose**: Authenticate community members via phone + password

**Route**: `/login`
**Guard**: None (public)
**Layout**: Minimal (no header/bottom nav)

#### Screen Layout

```
┌─────────────────────────────────┐
│                                 │
│          ┌───────────┐          │
│          │  Logo     │          │
│          │  الغدية    │          │
│          └───────────┘          │
│                                 │
│      Welcome to Tenmiye         │
│      مرحباً بك في الغدية        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Phone Number            │   │
│  │ [+222________]          │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password                │   │
│  │ [••••••••]      [👁]    │   │
│  └─────────────────────────┘   │
│                                 │
│  [Forgot Password?]             │
│                                 │
│  ┌─────────────────────────┐   │
│  │      Login              │   │ ← Primary button
│  │      دخول               │   │
│  └─────────────────────────┘   │
│                                 │
│  Don't have an account?         │
│  [Register]                     │
│                                 │
└─────────────────────────────────┘
```

#### Component Structure

```typescript
// login.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from '@store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);

  loginForm!: FormGroup;
  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  showPassword = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\+222\d{8}$/)
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { phone, password } = this.loginForm.value;
      this.store.dispatch(AuthActions.login({ phone, password }));
    }
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) {
      return field === 'phone'
        ? 'رقم الهاتف مطلوب - Phone number required'
        : 'كلمة المرور مطلوبة - Password required';
    }

    if (control.errors['pattern']) {
      return 'رقم هاتف غير صالح (+222XXXXXXXX) - Invalid phone format';
    }

    if (control.errors['minlength']) {
      return 'كلمة المرور قصيرة جداً (6 أحرف على الأقل) - Password too short (min 6)';
    }

    return '';
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
      <img src="assets/images/logo.png" alt="الغدية - Tenmiye" />
      <h1 class="logo-text-ar">الغــــــدية</h1>
      <p class="logo-subtitle-ar">لتنمية القبيلة التقليدية</p>
    </div>

    <!-- Welcome Text -->
    <div class="welcome">
      <h2 class="welcome-title">Welcome to Tenmiye</h2>
      <p class="welcome-subtitle">مرحباً بك في الغدية</p>
    </div>

    <!-- Error Banner -->
    <div *ngIf="error$ | async as error" class="error-banner" role="alert">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error }}</span>
    </div>

    <!-- Login Form -->
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
      <!-- Phone Field -->
      <div class="form-field">
        <label for="phone" class="field-label">
          Phone Number
          <span class="label-ar">رقم الهاتف</span>
        </label>
        <input
          id="phone"
          type="tel"
          formControlName="phone"
          placeholder="+222XXXXXXXX"
          class="field-input"
          [class.error]="loginForm.get('phone')?.invalid && loginForm.get('phone')?.touched"
          autocomplete="tel"
        />
        <p *ngIf="getErrorMessage('phone')" class="field-error">
          {{ getErrorMessage('phone') }}
        </p>
      </div>

      <!-- Password Field -->
      <div class="form-field">
        <label for="password" class="field-label">
          Password
          <span class="label-ar">كلمة المرور</span>
        </label>
        <div class="password-field">
          <input
            id="password"
            [type]="showPassword ? 'text' : 'password'"
            formControlName="password"
            placeholder="••••••••"
            class="field-input"
            [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="toggle-password"
            (click)="togglePasswordVisibility()"
            [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
          >
            <span *ngIf="!showPassword">👁️</span>
            <span *ngIf="showPassword">🙈</span>
          </button>
        </div>
        <p *ngIf="getErrorMessage('password')" class="field-error">
          {{ getErrorMessage('password') }}
        </p>
      </div>

      <!-- Forgot Password Link -->
      <div class="forgot-password">
        <a routerLink="/password-reset" class="forgot-link">
          Forgot Password? / نسيت كلمة المرور؟
        </a>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="submit-btn"
        [disabled]="loginForm.invalid || (loading$ | async)"
      >
        <span *ngIf="!(loading$ | async)" class="btn-text">
          <span>Login</span>
          <span class="btn-text-ar">دخول</span>
        </span>
        <span *ngIf="loading$ | async" class="btn-spinner">
          <span class="spinner-icon"></span>
          <span>Logging in...</span>
        </span>
      </button>
    </form>

    <!-- Register Link -->
    <div class="register-link">
      <p class="register-text">
        Don't have an account?
        <a routerLink="/register" class="register-action">Register</a>
      </p>
      <p class="register-text-ar">
        ليس لديك حساب؟
        <a routerLink="/register" class="register-action">سجل الآن</a>
      </p>
    </div>
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
    border: 1px solid $border-color;
    border-radius: $radius-xl;
    padding: $spacing-8;
    max-width: 400px;
    width: 100%;

    .logo {
      text-align: center;
      margin-bottom: $spacing-8;

      img {
        height: 100px;
        width: auto;
        margin-bottom: $spacing-3;
      }

      .logo-text-ar {
        font-family: $font-arabic;
        font-size: $text-2xl;
        font-weight: $font-bold;
        color: $brand-green;
        margin: $spacing-2 0;
        letter-spacing: 2px;
      }

      .logo-subtitle-ar {
        font-family: $font-arabic;
        font-size: $text-sm;
        color: $text-secondary;
        margin: 0;
      }
    }

    .welcome {
      text-align: center;
      margin-bottom: $spacing-6;

      .welcome-title {
        font-size: $text-xl;
        font-weight: $font-semibold;
        color: $text-primary;
        margin-bottom: $spacing-2;
      }

      .welcome-subtitle {
        font-family: $font-arabic;
        font-size: $text-base;
        color: $text-secondary;
      }
    }

    .error-banner {
      background: rgba($error, 0.1);
      border: 1px solid $error;
      border-radius: $radius-md;
      padding: $spacing-3;
      margin-bottom: $spacing-6;
      display: flex;
      align-items: center;
      gap: $spacing-2;

      .error-icon {
        font-size: $text-lg;
        flex-shrink: 0;
      }

      .error-text {
        color: $text-primary;
        font-size: $text-sm;
      }
    }

    .login-form {
      .form-field {
        margin-bottom: $spacing-5;

        .field-label {
          display: block;
          font-size: $text-sm;
          font-weight: $font-medium;
          color: $text-secondary;
          margin-bottom: $spacing-2;

          .label-ar {
            font-family: $font-arabic;
            margin-left: $spacing-2;
          }
        }

        .field-input {
          width: 100%;
          padding: $spacing-3;
          background: $bg-primary;
          border: 1px solid $border-color;
          border-radius: $radius-md;
          color: $text-primary;
          font-size: $text-base;
          transition: all 0.2s;

          &:focus {
            outline: none;
            border-color: $brand-green;
            box-shadow: 0 0 0 3px rgba($brand-green, 0.1);
          }

          &.error {
            border-color: $error;
          }

          &::placeholder {
            color: $text-disabled;
          }
        }

        .password-field {
          position: relative;

          .field-input {
            padding-right: 40px;
          }

          .toggle-password {
            position: absolute;
            right: $spacing-2;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            padding: $spacing-2;
            font-size: $text-lg;
            opacity: 0.7;
            transition: opacity 0.2s;

            &:hover {
              opacity: 1;
            }
          }
        }

        .field-error {
          font-size: $text-xs;
          color: $error;
          margin-top: $spacing-1;
        }
      }

      .forgot-password {
        text-align: right;
        margin-bottom: $spacing-6;

        .forgot-link {
          font-size: $text-sm;
          color: $brand-green;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .submit-btn {
        width: 100%;
        padding: $spacing-3;
        background: $brand-green;
        color: white;
        border: none;
        border-radius: $radius-md;
        font-size: $text-base;
        font-weight: $font-semibold;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background: $brand-green-dark;
          box-shadow: 0 4px 12px rgba($brand-green, 0.3);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: $spacing-2;

          .btn-text-ar {
            font-family: $font-arabic;
          }
        }

        .btn-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: $spacing-2;

          .spinner-icon {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(white, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
        }
      }
    }

    .register-link {
      text-align: center;
      margin-top: $spacing-6;
      padding-top: $spacing-6;
      border-top: 1px solid $divider;

      .register-text {
        font-size: $text-sm;
        color: $text-secondary;
        margin-bottom: $spacing-1;

        .register-action {
          color: $brand-green;
          font-weight: $font-semibold;
          text-decoration: none;
          margin-left: $spacing-1;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .register-text-ar {
        font-family: $font-arabic;
        font-size: $text-sm;
        color: $text-secondary;
        direction: rtl;

        .register-action {
          color: $brand-green;
          font-weight: $font-semibold;
          text-decoration: none;
          margin-right: $spacing-1;

          &:hover {
            text-decoration: underline;
          }
        }
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
        height: 80px;
      }

      .welcome-title {
        font-size: $text-lg;
      }
    }
  }
}
```

#### NgRx Integration

**Actions Dispatched:**
```typescript
// On form submit
AuthActions.login({ phone, password })

// Effects handle:
// 1. POST /api/auth/login with phone + password
// 2. Receive JWT token + user data
// 3. Store in localStorage
// 4. Update store
// 5. Navigate to /dashboard
```

**Selectors Subscribed:**
```typescript
selectAuthLoading  // Show spinner in button
selectAuthError    // Display error banner
```

**Effects:**
```typescript
// auth.effects.ts
login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.login),
    exhaustMap(({ phone, password }) =>
      this.apiService.post('/auth/login', { phone, password }).pipe(
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

loginSuccess$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.loginSuccess),
    tap(({ user, token }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      this.router.navigate(['/dashboard']);
    })
  ),
  { dispatch: false }
);
```

---

### 2. Register (`/register`)

**Purpose**: Self-service registration for new community members

**Route**: `/register`
**Guard**: None (public)

#### Screen Layout

```
┌─────────────────────────────────┐
│  [← Back]    Register            │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Full Name               │   │
│  │ [_____________]         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Phone Number            │   │
│  │ [+222________]          │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password                │   │
│  │ [••••••••]      [👁]    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Confirm Password        │   │
│  │ [••••••••]      [👁]    │   │
│  └─────────────────────────┘   │
│                                 │
│  [✓] I agree to terms           │
│                                 │
│  ┌─────────────────────────┐   │
│  │      Register           │   │
│  │      سجل الآن           │   │
│  └─────────────────────────┘   │
│                                 │
│  Already have an account?       │
│  [Login]                        │
│                                 │
└─────────────────────────────────┘
```

*Due to length, I'll create a comprehensive outline for the remaining pages. The pattern is established - should I continue with full detail for all 9 home pages, or would you prefer to focus on specific pages you'll implement first?*

---

## Remaining Home Pages (Outline)

### 3. Password Reset (`/password-reset`)
- Phone input → SMS code → New password
- Same styling as login
- Three-step flow with validation

### 4. Dashboard (`/dashboard`)
- Welcome card with user info
- Balance/tier display
- Recent transactions (last 3)
- Active elections notice
- Quick links to announcements/elections

### 5. Profile (`/profile`)
- View personal information
- Edit name, phone
- Change password
- View tier status
- Transaction history link

### 6. Transactions (`/transactions`)
- List of all contributions
- Filter by date, type
- Search by reference
- Download receipt (future)

### 7. Announcements (`/announcements`)
- Card-based feed
- Newest first
- Infinite scroll
- Share announcement (future)

### 8. Elections (`/elections`)
- List active/past elections
- View candidates
- "Vote Now" CTA
- Results for closed elections

### 9. Voting (`/voting/:id`)
- Election details
- Candidate list with photos
- Single selection
- Confirm vote modal
- Success confirmation

---

Would you like me to:
1. **Complete all 9 pages with full detail** (like login)
2. **Continue with dashboard + 1-2 key pages** in detail
3. **Move this to a summary format** and we expand pages as you need them

What would be most helpful for starting your implementation?
