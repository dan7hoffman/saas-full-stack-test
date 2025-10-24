import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { StatCardComponent } from '@ui/components/stat-card.component';

/**
 * Dashboard Component
 *
 * Main dashboard/home page after login
 * Shows user welcome, key stats, and quick actions
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent],
  template: `
    <div class="dashboard">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div>
          <h1 class="welcome-title">Welcome back, {{ displayName() }}!</h1>
          <p class="welcome-subtitle">Here's what's happening with your account</p>
        </div>
        <div class="user-badge">
          <span class="badge-role">{{ userRole() }}</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <app-stat-card
          label="Total Users"
          [value]="15"
          subtitle="Active accounts"
          [trend]="12.5"
        />
        <app-stat-card
          label="Active Sessions"
          [value]="8"
          subtitle="Currently online"
          [trend]="5.2"
        />
        <app-stat-card
          label="Total Activity"
          [value]="342"
          subtitle="Actions this week"
          [trend]="-2.1"
        />
        <app-stat-card
          label="System Health"
          value="98%"
          subtitle="All systems operational"
        />
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-card" (click)="viewProfile()">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="action-content">
              <h3>View Profile</h3>
              <p>Manage your account settings</p>
            </div>
          </button>

          <button class="action-card" (click)="viewActivity()">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div class="action-content">
              <h3>Activity Log</h3>
              <p>View recent actions</p>
            </div>
          </button>

          <button class="action-card" (click)="logout()">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div class="action-content">
              <h3>Logout</h3>
              <p>Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="info-banner">
        <div class="banner-content">
          <div class="banner-icon">ℹ️</div>
          <div>
            <h4 class="banner-title">Platform Status</h4>
            <p class="banner-text">All systems are running smoothly. Last updated: {{ lastUpdated }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Welcome Section */
    .welcome-section {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 2.5rem;
      gap: 1.5rem;
    }

    .welcome-title {
      font-size: 2.25rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.03em;
    }

    .welcome-subtitle {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .badge-role {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: capitalize;
      letter-spacing: 0.02em;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    /* Quick Actions */
    .quick-actions-section {
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1.5rem 0;
      letter-spacing: -0.02em;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .action-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }

    .action-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: #eff6ff;
      border-radius: 10px;
      color: #3b82f6;
      flex-shrink: 0;
    }

    .action-icon svg {
      width: 24px;
      height: 24px;
    }

    .action-content {
      flex: 1;
    }

    .action-content h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .action-content p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.5;
    }

    /* Info Banner */
    .info-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 1.5rem;
      color: white;
    }

    .banner-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .banner-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .banner-title {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .banner-text {
      margin: 0;
      font-size: 0.9375rem;
      opacity: 0.95;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard {
        padding: 1rem;
      }

      .welcome-section {
        flex-direction: column;
        align-items: stretch;
      }

      .welcome-title {
        font-size: 1.875rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent {
  private authService = inject(AuthService);

  // Computed values from auth service
  displayName = computed(() => {
    const user = this.authService.currentUser;
    return user?.firstName || user?.email?.split('@')[0] || 'User';
  });

  userRole = computed(() => {
    const user = this.authService.currentUser;
    return user?.role?.toLowerCase() || 'user';
  });

  lastUpdated = new Date().toLocaleString();

  viewProfile(): void {
    console.log('View profile clicked');
    // TODO: Navigate to profile page
  }

  viewActivity(): void {
    console.log('View activity clicked');
    // TODO: Navigate to activity page
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
