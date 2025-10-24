import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ButtonPrimitive - Layer 1 (Behavior)
 *
 * Handles:
 * - Click events
 * - Keyboard navigation (Enter, Space)
 * - Focus management
 * - Disabled state
 * - Accessibility (ARIA)
 *
 * Does NOT handle styling - that's Layer 2's job
 */
@Component({
  selector: 'button[appButtonPrimitive]',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content />`,
  host: {
    '[attr.type]': 'type',
    '[attr.disabled]': 'disabled ? "" : null',
    '[attr.aria-disabled]': 'disabled',
    '(click)': 'handleClick($event)',
    '(keydown.enter)': 'handleKeydown($event)',
    '(keydown.space)': 'handleKeydown($event)',
  },
})
export class ButtonPrimitive {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();

  handleClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled) {
      event.preventDefault();
      return;
    }
    // Enter and Space trigger click
    this.clicked.emit();
  }
}
