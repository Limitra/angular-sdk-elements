import {AfterViewInit, Component, ElementRef, HostListener, Input, ViewChild} from '@angular/core';
import {InputExtend} from '../../extends/input-extend';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-input-number',
  templateUrl: './input-number.component.html',
  styleUrls: ['./input-number.component.css']
})
export class InputNumberComponent extends InputExtend implements AfterViewInit {
  constructor(public providers: SdkProviders) {
    super(providers);
  }

  @Input() min = 0;
  @Input() max = 999999;
  @Input() fixed = 0;

  private decimalSeperator: string;
  private thousandSeperator: string;

  ngAfterViewInit() {
    this.init(() => {
      this.decimalSeperator = this.validationMessages.DecimalSeperator || '.';
      this.thousandSeperator = this.validationMessages.ThousandSeperator || ',';
    });
  }

  validation(value: number) {
    value = this.value;
    if (value < this.min) {
      this.addFormError('GreaterThan');
    } else {
      this.removeFormError('GreaterThan');
    }

    if (value > this.max) {
      this.addFormError('LessThan');
    } else {
      this.removeFormError('LessThan');
    }
  }

  forceValue() {
    let value: any = this.providers.String.Replace(this.input.nativeElement.value, this.thousandSeperator, '');
    value = this.providers.String.Replace(value, this.decimalSeperator, '.');

    value = parseFloat(value);
    if ((value === 0 || value) && !isNaN(value)) {
      this.value = value;
    } else {
      this.value = undefined;
    }
    this.valueChange.emit(this.value);
  }

  formatValue(value: number): string {
    if (value || value === 0) {
      if (value > 1e16) {
        value = 0;
      }

      let decimalCount = this.fixed;
      const decimal = this.decimalSeperator;
      const thousands = this.thousandSeperator;

      let amount: any = value;
      decimalCount = Math.abs(decimalCount);
      decimalCount = isNaN(decimalCount) ? this.fixed : decimalCount;

      const negativeSign = amount < 0 ? '-' : '';

      const i: any = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount), 0).toString();
      const j = (i.length > 3) ? i.length % 3 : 0;

      return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands)
        + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
    } else {
      return '';
    }
  }

  @HostListener('input', ['$event'])
  @HostListener('keydown', ['$event'])
  setMask(event: any) {
    event.stopPropagation();
    if (!((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57))
      && (event.keyCode < 96 || event.keyCode > 105))
      || this.isDefaultKey(event)
      || event.key === this.decimalSeperator) {
      if (event.key === this.decimalSeperator && this.input.nativeElement.value.indexOf(this.decimalSeperator)
        !== this.input.nativeElement.selectionStart) {
        event.preventDefault();
      }
    } else {
      event.preventDefault();
    }

    const char = this.input.nativeElement.value[this.input.nativeElement.value.length - 1];
    let start = this.input.nativeElement.selectionStart;

    if ((event.keyCode === 8 && this.input.nativeElement.value[start - 1] === this.decimalSeperator)
      || (event.keyCode === 46 && this.input.nativeElement.value[start] === this.decimalSeperator)) {
        event.preventDefault();
    }

    if (event.type === 'input') {
      let value: any = this.providers.String.Replace(this.input.nativeElement.value, this.thousandSeperator, '');
      value = this.providers.String.Replace(value, this.decimalSeperator + this.decimalSeperator, this.decimalSeperator);
      const partials = value.split(this.decimalSeperator);
      value = this.providers.String.Replace(value, this.decimalSeperator, '.');

      value = partials.length > 1 ? partials[0] + '.' + partials[1].substring(0, this.fixed) : value;
      value = parseFloat(value);
      if (value || value === 0) {
        if (char === this.decimalSeperator) {
          start = this.input.nativeElement.value.indexOf(this.decimalSeperator);
        }

        this.input.nativeElement.value = this.formatValue(value);

        const before = this.input.nativeElement.value.substring(0, start);
        if (char !== this.decimalSeperator
          && before.includes(this.thousandSeperator)
          && !before.includes(this.decimalSeperator) && before.length % 4 === 0 && before.length !== 0) {
          start++;
        }

        if (event.inputType === 'insertFromPaste') {
          start = this.input.nativeElement.value.length;
        }

        this.input.nativeElement.selectionStart = start;
        this.input.nativeElement.selectionEnd = start;
      } else {
        this.input.nativeElement.value = '';
      }
    }

    this.validate();
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$Min]', this.min ? this.min.toString() : '');
    message = this.providers.String.Replace(message, '[$Max]', this.max ? this.max.toString() : '');
    return message;
  }
}
