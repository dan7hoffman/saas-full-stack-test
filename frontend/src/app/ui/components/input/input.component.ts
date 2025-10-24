import { Component, Input as InputDecorator, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { InputPrimitive } from '@ui/primitives/input/input.primitive';

/**
 * Input - Layer 2 (Styled Component)
 *
 * Composes InputPrimitive with professional styling
 * Includes label, error message, helper text
 *
 * Usage:
 *   <app-input
 *     type="email"
 *     label="Email Address"
 *     placeholder="you@example.com"
 *     [error]="emailError"
 *     [(ngModel)]="email" />
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputPrimitive],
  template: `
    <div class="w-full">
      <label *ngIf="label" [for]="inputId" class="block text-sm font-medium text-gray-700 mb-1">
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>

      <input
        appInputPrimitive
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [invalid]="!!error"
        [attr.aria-describedby]="error ? inputId + '-error' : helperText ? inputId + '-helper' : null"
        [class]="computedClasses()"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        (focused)="onFocused()"
        (blurred)="onBlurred()" />

      <p *ngIf="helperText && !error" [id]="inputId + '-helper'" class="mt-1 text-sm text-gray-500">
        {{ helperText }}
      </p>

      <p *ngIf="error" [id]="inputId + '-error'" class="mt-1 text-sm text-red-600">
        {{ error }}
      </p>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
})
export class Input implements ControlValueAccessor {
  @InputDecorator() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @InputDecorator() label = '';
  @InputDecorator() placeholder = '';
  @InputDecorator() helperText = '';
  @InputDecorator() error = '';
  @InputDecorator() disabled = false;
  @InputDecorator() required = false;

  value = '';
  inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  computedClasses(): string {
    const base = [
      'block w-full rounded-lg border px-4 py-2',
      'text-gray-900 placeholder-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'transition-colors',
      'disabled:bg-gray-100 disabled:cursor-not-allowed',
    ].join(' ');

    const stateClasses = this.error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

    return `${base} ${stateClasses}`;
  }

  onValueChange(value: string): void {
    this.onChange(value);
  }

  onFocused(): void {
    // Can be extended for focus behaviors
  }

  onBlurred(): void {
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
