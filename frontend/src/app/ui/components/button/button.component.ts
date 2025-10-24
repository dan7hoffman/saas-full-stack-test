import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonPrimitive } from '@ui/primitives/button/button.primitive';

/**
 * Button - Layer 2 (Styled Component)
 *
 * Composes ButtonPrimitive with Stripe/Linear-inspired styling
 * Provides variant-based styling using Tailwind classes
 *
 * Usage:
 *   <app-button variant="primary" (onClick)="handleClick()">
 *     Click Me
 *   </app-button>
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, ButtonPrimitive],
  template: `
    <button
      appButtonPrimitive
      [type]="type"
      [disabled]="disabled || loading"
      [class]="computedClasses()"
      (clicked)="onClick.emit()">
      <span *ngIf="loading" class="mr-2">
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
      <ng-content />
    </button>
  `,
})
export class Button {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() onClick = new EventEmitter<void>();

  computedClasses(): string {
    const base = [
      'inline-flex items-center justify-center',
      'font-medium rounded-lg transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ].join(' ');

    const variants: Record<string, string> = {
      primary:
        'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
      secondary:
        'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      ghost:
        'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    };

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return `${base} ${variants[this.variant]} ${sizes[this.size]}`;
  }
}
