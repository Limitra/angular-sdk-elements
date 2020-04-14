import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';
import {InputExtend} from '../../extends/input-extend';

@Component({
  selector: 'lim-input-date',
  templateUrl: './input-date.component.html',
  styleUrls: ['./input-date.component.css']
})
export class InputDateComponent extends InputExtend implements AfterViewInit {
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
    if (this.value) {
      const date = new Date(this.value);
      let month: any = (date.getMonth() + 1);
      month = month < 10 ? '0' + month : month;
      let day: any = date.getDate();
      day = day < 10 ? '0' + day : day;
      const formatted = date.getFullYear() + '-' + month + '-' + day;
      this.supportInput.nativeElement.value = formatted;
    }
  }

  ngAfterViewInit() {
    this.init(() => {
      this.mask = this.validationMessages.DateMask;
      this.preInit();
    });
  }

  keyboardQuery(event: KeyboardEvent): boolean {
    return !((event.shiftKey || (event.keyCode < 48
      || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105));
  }

  forceValue() {
    const start = this.input.nativeElement.selectionStart;
    const getYear = (): any => {
      const first = this.mask.toLowerCase().indexOf('y');
      let str = '';
      for (let i = first; i < first + 4; i++) {
        str += this.input.nativeElement.value[i];
      }
      return {Index: first, Value: parseInt(str, 0)};
    };

    const getMonth = (): any => {
      const first = this.mask.toLowerCase().indexOf('m');
      let str = '';
      for (let i = first; i < first + 2; i++) {
        str += this.input.nativeElement.value[i];
      }
      return {Index: first, Value: parseInt(str, 0)};
    };

    const getDay = (): any => {
      const first = this.mask.toLowerCase().indexOf('d');
      let str = '';
      for (let i = first; i < first + 2; i++) {
        str += this.input.nativeElement.value[i];
      }
      return {Index: first, Value: parseInt(str, 0)};
    };

    if (getYear().Value < 1001) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '1970', getYear().Index);
    } else if (getYear().Value > 3000) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value,
        new Date().getFullYear().toString(), getYear().Index);
    }

    if (getMonth().Value < 1) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '01', getMonth().Index);
    } else if (getMonth().Value > 12) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '12', getMonth().Index);
    }

    const maxDay = new Date(getYear().Value, getMonth().Value, 0).getDate();
    if (getDay().Value > maxDay) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value,
        maxDay.toString(), getDay().Index);
    } else if (getDay().Value < 1) {
      this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '01', getDay().Index);
    }

    this.input.nativeElement.selectionStart = start;
    this.input.nativeElement.selectionEnd = start;

    const date = new Date(getYear().Value, getMonth().Value - 1, getDay().Value);
    this.value = date.getTime();
    this.valueChange.emit(this.value);
  }

  findMaskSeperator(): Array<string> {
    const charArray = [];
    if (this.mask) {
      let maskChar = this.providers.String.Replace(this.mask.toLowerCase(), 'd', '');
      maskChar = this.providers.String.Replace(maskChar, 'm', '');
      const mask = this.providers.String.Replace(maskChar, 'y', '');
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
    const date = new Date(value);
    let formatted = '';
    if (this.mask && date && (date instanceof Date) && value) {
      const day = this.mask.indexOf('d');
      const month = this.mask.indexOf('m');
      const year = this.mask.indexOf('y');

      const array = [
        {Index: day, Value: date.getDate()},
        {Index: month, Value: date.getMonth() + 1},
        {Index: year, Value: date.getFullYear()}];

      let index = 0;
      while (array.length > 0) {
        const obj = array[index];
        if (array.length > 1 ? obj.Index === Math.min.apply(Math, array.map(y => y.Index)) : true) {
          formatted = this.changeWordByIndex(formatted, obj.Index !== year
            ? ('0' + obj.Value).slice(-2) : obj.Value.toString(), obj.Index);
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
      if ((this.min && (new Date(this.min))) ? (this.value <= this.min || value.length !== mask.length) : false) {
        this.addFormError('GreaterThan');
      } else {
        this.removeFormError('GreaterThan');
      }

      if ((this.max && (new Date(this.max))) ? (this.value >= this.max || value.length !== mask.length) : false) {
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
      const value = new Date(event.target.value);
      this.input.nativeElement.value = this.formatValue(value.getTime());
      this.validate();
    }
  }
}
