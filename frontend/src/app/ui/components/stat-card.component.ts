import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * StatCard Component
 *
 * Layer 2 - Styled Component
 * A card component for displaying key metrics and statistics
 * with optional trend indicators.
 *
 * Based on Stripe/Ramp design patterns
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">{{ label }}</span>
        @if (trend) {
          <span class="stat-trend" [class.positive]="trend > 0" [class.negative]="trend < 0">
            <svg class="trend-icon" viewBox="0 0 12 12" fill="none">
              @if (trend > 0) {
                <path d="M6 2L10 6L6 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              } @else {
                <path d="M6 10L2 6L6 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              }
            </svg>
            {{ Math.abs(trend) }}%
          </span>
        }
      </div>
      <div class="stat-value">{{ value | number }}</div>
      @if (subtitle) {
        <div class="stat-subtitle">{{ subtitle }}</div>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      border-color: #d1d5db;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .stat-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      letter-spacing: -0.01em;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }

    .stat-trend.positive {
      color: #059669;
      background: #d1fae5;
    }

    .stat-trend.negative {
      color: #dc2626;
      background: #fee2e2;
    }

    .trend-icon {
      width: 12px;
      height: 12px;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.03em;
      margin-bottom: 0.25rem;
    }

    .stat-subtitle {
      font-size: 0.8125rem;
      color: #9ca3af;
    }

    @media (max-width: 640px) {
      .stat-card {
        padding: 1.25rem;
      }

      .stat-value {
        font-size: 1.75rem;
      }
    }
  `]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: number | string = 0;
  @Input() subtitle?: string;
  @Input() trend?: number; // Percentage change (positive or negative)

  protected readonly Math = Math;
}
