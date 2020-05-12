import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';
import {InputExtend} from '../../extends/input-extend';

@Component({
  selector: 'lim-input-time',
  templateUrl: './input-time.component.html',
  styleUrls: ['./input-time.component.css']
})
export class InputTimeComponent extends InputExtend implements AfterViewInit {
  public supported = true;

  @Input() min: number;
  @Input() max: number;

  @Input() status = true;
  @Input() icon = true;

  @ViewChild('supportInput', {static: false}) supportInput: ElementRef;

  constructor(public providers: SdkProviders) {
    super(providers);

    const browser = this.providers.Device.Get().Browser.toLowerCase();
    if (browser.includes('msie') || browser.includes('safari')) {
      this.supported = false;
    }
  }

  preInit(changed: boolean = false) {
    if (this.overrideHasValue(this.value)) {
      const hourVal = Math.floor(this.value / 1000 / 60 / 60);
      const minuteVal = Math.floor((this.value - (hourVal * 1000 * 60 * 60)) / 1000 / 60);
      const formatted = (hourVal < 10 ? '0' + hourVal : hourVal) +  ':' + (minuteVal < 10 ? '0' + minuteVal : minuteVal);
      if (this.supported) {
        this.supportInput.nativeElement.value = formatted;
      }
    }
  }

  ngAfterViewInit() {
    this.init(() => {
      this.mask = this.validationMessages.TimeMask;
      this.preInit();
    });
  }

  overrideHasValue(value: any): boolean {
    return value || value == 0;
  }

  keyboardQuery(event: KeyboardEvent): boolean {
    return !((event.shiftKey || (event.keyCode < 48
      || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105));
  }

  forceValue() {
    const start = this.input.nativeElement.selectionStart;
    const getHour = (): any => {
      const first = this.mask.toLowerCase().indexOf('h');
      let str = '';
      for (let i = first; i < first + 2; i++) {
        str += this.input.nativeElement.value[i];
      }
      return {Index: first, Value: parseInt(str, 0)};
    };

    const getMinute = (): any => {
      const first = this.mask.toLowerCase().indexOf('m');
      let str = '';
      for (let i = first; i < first + 2; i++) {
        str += this.input.nativeElement.value[i];
      }
      return {Index: first, Value: parseInt(str, 0)};
    };

    if (getHour().Value < 0) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '0', getHour().Index);
    } else if (getHour().Value > 23) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '0', getHour().Index);
    }

    if (getMinute().Value < 0) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '0', getMinute().Index);
    } else if (getMinute().Value > 59) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '0', getMinute().Index);
    }

    this.input.nativeElement.selectionStart = start;
    this.input.nativeElement.selectionEnd = start;

    this.value = (getHour().Value * 60 * 60 * 1000) + (getMinute().Value * 60 * 1000);
    this.valueChange.emit(this.value);
  }

  findMaskSeperator(): Array<string> {
    const charArray = [];
    if (this.mask) {
      let mask = this.providers.String.Replace(this.mask.toLowerCase(), 'h', '');
      mask = this.providers.String.Replace(mask, 'm', '');
      const length = mask.length;
      for (let i = 0; i < length; i++) {
        if (!charArray.includes(mask[i])) {
          charArray.push(mask[i]);
        }
      }
    }
    return charArray;
  }

  formatValue(value: any): string {
    let formatted = '';
    if (this.mask && this.overrideHasValue(value)) {
      const hourVal = Math.floor(value / 1000 / 60 / 60);
      const minuteVal = Math.floor((value - (hourVal * 1000 * 60 * 60)) / 1000 / 60);

      const hour = this.mask.indexOf('h');
      const minute = this.mask.indexOf('m');

      const array = [
        {Index: hour, Value: hourVal},
        {Index: minute, Value: minuteVal}];

      let index = 0;
      while (array.length > 0) {
        const obj = array[index];
        if (array.length > 1 ? obj.Index === Math.min.apply(Math, array.map(y => y.Index)) : true) {
          formatted = this.changeWordByIndex(formatted, ('0' + obj.Value).slice(-2), obj.Index);
          index = 0;
          array.splice(array.indexOf(obj), 1);

          if (array.length > 0) {
            let valid = false;

            while (!valid) {
              if (this.findMaskSeperator().includes(this.mask[formatted.length])) {
                formatted = this.changeCharByIndex(formatted, this.mask[formatted.length], formatted.length);
              } else {
                valid = true;
              }
            }
          }
        } else {
          index = index + 1;
        }
      }
    }
    return formatted;
  }

  validation(value: any, mask: any) {
    if ((this.min && (this.value <= this.min || value.length !== mask.length))) {
      this.addFormError('GreaterThan');
    } else {
      this.removeFormError('GreaterThan');
    }

    if ((this.max && (this.value >= this.max || value.length !== mask.length))) {
      this.addFormError('LessThan');
    } else {
      this.removeFormError('LessThan');
    }
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$Min]', this.formatValue(this.min));
    message = this.providers.String.Replace(message, '[$Max]', this.formatValue(this.max));
    return message;
  }

  setMask(event: any) {
    if (!this.supported) {
      super.setMask(event);
    }
  }

  setSupportedMask(event: any) {
    if (this.supported) {
      const value = event.target.value;
      const partials = value.split(':');
      if (partials.length > 0) {
        const hourMillis = parseInt(partials[0], 0) * 60 * 60 * 1000;
        const minuteMillis = parseInt(partials[1], 0) * 60 * 1000;
        const millis = hourMillis + minuteMillis;
        this.input.nativeElement.value = this.formatValue(millis);
        if (millis || millis == 0) {
          this.value = millis;
          if (this.form && this.property) {
            this.form.model[this.property] = millis;
          }
        } else {
          delete this.value;
          if (this.form && this.property) {
            delete this.form.model[this.property];
          }
        }
      }
      this.validate();
    }
  }
}
