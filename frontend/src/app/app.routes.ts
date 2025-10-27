import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  {
    path: 'finance',
    loadChildren: () =>
      import('./features/finance/finance.routes').then((m) => m.financeRoutes),
  },
  {
    path: 'invite',
    loadChildren: () =>
      import('./features/invitations/invitations.routes').then((m) => m.invitationRoutes),
  },
];
