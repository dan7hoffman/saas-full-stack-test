import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const financeRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'accounts',
        loadComponent: () =>
          import('./accounts/accounts.component').then((m) => m.AccountsComponent),
      },
      {
        path: 'balance-entry',
        loadComponent: () =>
          import('./balance-entry/balance-entry.component').then((m) => m.BalanceEntryComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.FinanceDashboardComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
