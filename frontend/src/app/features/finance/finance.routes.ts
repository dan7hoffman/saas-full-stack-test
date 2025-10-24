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
        path: '',
        redirectTo: 'accounts',
        pathMatch: 'full',
      },
    ],
  },
];
