import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Avatar - Layer 2 (Styled Component)
 *
 * User profile images with fallback to initials
 *
 * Usage:
 *   <app-avatar [src]="user.avatarUrl" [name]="user.name" />
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClasses()">
      <img
        *ngIf="src && !imageError"
        [src]="src"
        [alt]="name"
        (error)="handleImageError()"
        class="w-full h-full object-cover" />

      <span *ngIf="!src || imageError" class="text-white font-medium">
        {{ getInitials() }}
      </span>
    </div>
  `,
})
export class Avatar {
  @Input() src = '';
  @Input() name = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  imageError = false;

  computedClasses(): string {
    const base = 'inline-flex items-center justify-center rounded-full bg-primary-600 overflow-hidden';

    const sizes: Record<string, string> = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
    };

    return `${base} ${sizes[this.size]}`;
  }

  getInitials(): string {
    if (!this.name) return '?';

    const parts = this.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return this.name.substring(0, 2).toUpperCase();
  }

  handleImageError(): void {
    this.imageError = true;
  }
}
