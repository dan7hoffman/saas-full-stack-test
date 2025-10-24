import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge - Layer 2 (Styled Component)
 *
 * Status indicators, tags, labels
 *
 * Usage:
 *   <app-badge variant="success">Active</app-badge>
 *   <app-badge variant="error">Failed</app-badge>
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="computedClasses()">
      <ng-content />
    </span>
  `,
})
export class Badge {
  @Input() variant: 'default' | 'success' | 'warning' | 'error' = 'default';
  @Input() size: 'sm' | 'md' = 'md';

  computedClasses(): string {
    const base = 'inline-flex items-center font-medium rounded-full';

    const variants: Record<string, string> = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };

    const sizes: Record<string, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return `${base} ${variants[this.variant]} ${sizes[this.size]}`;
  }
}
