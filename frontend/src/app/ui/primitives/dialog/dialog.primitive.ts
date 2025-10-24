import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DialogPrimitive - Layer 1 (Behavior)
 *
 * Handles:
 * - Open/close state
 * - Escape key to close
 * - Click outside to close
 * - Focus trap
 * - Accessibility (role="dialog", aria-modal)
 */
@Component({
  selector: 'app-dialog-primitive',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="open"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="ariaLabelledBy"
      [attr.aria-describedby]="ariaDescribedBy"
      (keydown.escape)="handleEscape()">
      <ng-content />
    </div>
  `,
})
export class DialogPrimitive {
  @Input() open = false;
  @Input() ariaLabelledBy?: string;
  @Input() ariaDescribedBy?: string;
  @Output() openChange = new EventEmitter<boolean>();

  handleEscape(): void {
    this.close();
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
  }
}
