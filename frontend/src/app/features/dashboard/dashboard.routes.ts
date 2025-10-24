import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard.component').then((m) => m.DashboardComponent),
  },
];
