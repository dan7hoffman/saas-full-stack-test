import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Card - Layer 2 (Styled Component)
 *
 * Container component with header/body/footer slots
 * Stripe/Linear-inspired design
 *
 * Usage:
 *   <app-card>
 *     <div header>Card Title</div>
 *     <div body>Card content</div>
 *     <div footer>Card actions</div>
 *   </app-card>
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClasses()">
      <div *ngIf="hasHeader" class="px-6 py-4 border-b border-gray-200">
        <ng-content select="[header]" />
      </div>

      <div class="px-6 py-4">
        <ng-content select="[body]" />
        <ng-content />
      </div>

      <div *ngIf="hasFooter" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
})
export class Card {
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() hasHeader = false;
  @Input() hasFooter = false;

  computedClasses(): string {
    return [
      'bg-white rounded-lg',
      'border border-gray-200',
      'shadow-sm',
    ].join(' ');
  }
}
