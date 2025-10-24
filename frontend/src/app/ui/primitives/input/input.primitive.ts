import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * InputPrimitive - Layer 1 (Behavior)
 *
 * Handles:
 * - Value binding (ControlValueAccessor)
 * - Input/change events
 * - Focus/blur events
 * - Disabled state
 * - Validation state
 * - Accessibility
 */
@Component({
  selector: 'input[appInputPrimitive]',
  standalone: true,
  imports: [CommonModule],
  template: '',
  host: {
    '[attr.type]': 'type',
    '[attr.placeholder]': 'placeholder',
    '[attr.disabled]': 'disabled ? "" : null',
    '[attr.required]': 'required ? "" : null',
    '[attr.aria-invalid]': 'invalid',
    '[attr.aria-describedby]': 'ariaDescribedBy',
    '(input)': 'handleInput($event)',
    '(blur)': 'handleBlur()',
    '(focus)': 'handleFocus()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputPrimitive),
      multi: true,
    },
  ],
})
export class InputPrimitive implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() invalid = false;
  @Input() ariaDescribedBy?: string;

  @Output() valueChange = new EventEmitter<string>();
  @Output() focused = new EventEmitter<void>();
  @Output() blurred = new EventEmitter<void>();

  private _value = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  handleBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  handleFocus(): void {
    this.focused.emit();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this._value = value || '';
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
