import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

/**
 * Auth feature routes
 *
 * All authentication-related pages:
 * - /auth/login
 * - /auth/register (coming soon)
 * - /auth/forgot-password (coming soon)
 * - /auth/verify-email (coming soon)
 */
export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  // Coming soon:
  // {
  //   path: 'register',
  //   component: RegisterComponent,
  // },
  // {
  //   path: 'forgot-password',
  //   component: ForgotPasswordComponent,
  // },
];
