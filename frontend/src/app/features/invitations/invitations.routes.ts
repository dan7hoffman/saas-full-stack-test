import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { AcceptInviteComponent } from './accept-invite/accept-invite.component';
import { ManageInvitationsComponent } from './manage-invitations/manage-invitations.component';

export const invitationRoutes: Routes = [
  {
    path: 'accept',
    component: AcceptInviteComponent,
    canActivate: [authGuard],
  },
  {
    path: 'manage',
    component: ManageInvitationsComponent,
    canActivate: [authGuard],
  },
];
