import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogPrimitive } from '../primitives/dialog/dialog.primitive';
import { Button } from '../button/button.component';

/**
 * Modal - Layer 2 (Styled Component)
 *
 * Composes DialogPrimitive with backdrop and styling
 *
 * Usage:
 *   <app-modal
 *     [open]="isOpen"
 *     title="Confirm Action"
 *     (openChange)="isOpen = $event"
 *     (confirm)="handleConfirm()">
 *     Are you sure?
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, DialogPrimitive, Button],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        (click)="handleBackdropClick()">
      </div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <app-dialog-primitive
          [open]="open"
          [ariaLabelledBy]="modalId + '-title'"
          (openChange)="openChange.emit($event)">
          <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 [id]="modalId + '-title'" class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h3>
            </div>

            <!-- Body -->
            <div class="px-6 py-4">
              <ng-content />
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <app-button
                variant="secondary"
                (onClick)="close()">
                {{ cancelText }}
              </app-button>
              <app-button
                [variant]="confirmVariant"
                (onClick)="handleConfirm()">
                {{ confirmText }}
              </app-button>
            </div>
          </div>
        </app-dialog-primitive>
      </div>
    </div>
  `,
})
export class Modal {
  @Input() open = false;
  @Input() title = '';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmVariant: 'primary' | 'danger' = 'primary';
  @Output() openChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();

  modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;

  handleBackdropClick(): void {
    this.close();
  }

  handleConfirm(): void {
    this.confirm.emit();
    this.close();
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
  }
}
