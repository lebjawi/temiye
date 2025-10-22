import { Routes } from '@angular/router';
import { adminLayoutGuard } from './core/guards/admin-layout.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full',
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/auth/login/login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/dashboard/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
    canActivate: [adminLayoutGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      // Placeholder routes for future pages
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/admin/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'tiers',
        loadComponent: () =>
          import('./features/admin/tiers/tiers.component').then((m) => m.TiersComponent),
      },
      {
        path: 'boards',
        loadComponent: () =>
          import('./features/admin/boards/boards.component').then((m) => m.BoardsComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/admin/transactions/transactions.component').then(
            (m) => m.TransactionsComponent
          ),
      },
      {
        path: 'elections',
        loadComponent: () =>
          import('./features/admin/elections/elections.component').then(
            (m) => m.ElectionsComponent
          ),
      },
      {
        path: 'announcements',
        loadComponent: () =>
          import('./features/admin/announcements/announcements.component').then(
            (m) => m.AnnouncementsComponent
          ),
      },
      {
        path: 'approvals',
        loadComponent: () =>
          import('./features/admin/approvals/approvals.component').then(
            (m) => m.ApprovalsComponent
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/admin/analytics/analytics.component').then(
            (m) => m.AnalyticsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'admin',
  },
];
