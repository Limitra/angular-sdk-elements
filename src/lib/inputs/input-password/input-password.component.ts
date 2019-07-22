import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {InputExtend} from '../../extends/input-extend';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-input-password',
  templateUrl: './input-password.component.html',
  styleUrls: ['./input-password.component.css']
})
export class InputPasswordComponent extends InputExtend implements AfterViewInit {
  constructor(public providers: SdkProviders) { super(providers); }

  @Input() minlength = 0;
  @Input() maxlength = 25;
  @Input() digit = 0;
  @Input() special = 0;
  @Input() uppercase = 0;
  @Input() lowercase = 1;

  public show: boolean;
  private chars = '!\'^+%&/()=?_"#$½¾{[]}\|-*<>@.,;:~';

  ngAfterViewInit() {
    this.init();
  }

  validation(value: any) {
    this.initRules(value, (digit, special, uppercase, lowercase) => {
      if (digit < this.digit && this.digit > 0) {
        this.addFormError('Digit');
      } else {
        this.removeFormError('Digit');
      }

      if (special < this.special && this.special > 0) {
        this.addFormError('Special');
      } else {
        this.removeFormError('Special');
      }

      if (uppercase < this.uppercase && this.uppercase > 0) {
        this.addFormError('UpperCase');
      } else {
        this.removeFormError('UpperCase');
      }

      if (lowercase < this.lowercase && this.lowercase > 0) {
        this.addFormError('LowerCase');
      } else {
        this.removeFormError('LowerCase');
      }
    });

    if (value.length < this.minlength) {
      this.addFormError('MinLength');
    } else {
      this.removeFormError('MinLength');
    }

    if (value.length > this.maxlength) {
      this.addFormError('MaxLength');

      if (value.length - this.maxlength > 1) {
        this.input.nativeElement.value = this.input.nativeElement.value.substring(0, this.maxlength + 1);
        this.value = this.input.nativeElement.value;
        this.valueChange.emit(this.value);
      }
    } else {
      this.removeFormError('MaxLength');
    }
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$MinLength]', this.minlength ? this.minlength.toString() : '');
    message = this.providers.String.Replace(message, '[$MaxLength]', this.maxlength ? this.maxlength.toString() : '');
    message = this.providers.String.Replace(message, '[$Digit]', this.digit ? this.digit.toString() : '');
    message = this.providers.String.Replace(message, '[$Special]', this.special ? this.special.toString() : '');
    message = this.providers.String.Replace(message, '[$UpperCase]', this.uppercase ? this.uppercase.toString() : '');
    message = this.providers.String.Replace(message, '[$LowerCase]', this.lowercase ? this.lowercase.toString() : '');
    return message;
  }

  initRules(value: any, call: (digit: number, special: number, uppercase: number, lowercase: number) => void) {
    let digitCount = 0;
    let specialCount = 0;
    let upperCount = 0;
    let lowerCount = 0;

    const length = value.length;
    for (let i = 0; i < length; i++) {
      const char = value[i];

      if (parseInt(char, 0)) {
        digitCount++;
      } else if (this.chars.includes(char)) {
        specialCount++;
      } else if (char === char.toString().toUpperCase()) {
        upperCount++;
      } else if (char === char.toString().toLowerCase()) {
        lowerCount++;
      }

      if (i === length - 1) {
        call(digitCount, specialCount, upperCount, lowerCount);
      }
    }
  }
}
