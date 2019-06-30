import {AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {SdkProviders} from '../../../../sdk-core/src/lib/providers';

@Component({
  selector: 'lim-input-date',
  templateUrl: './input-date.component.html',
  styleUrls: ['./input-date.component.css']
})
export class InputDateComponent implements AfterViewInit {
  @ViewChild('input', {static: false}) input: ElementRef;

  @Input() name: string;
  @Input() lang: string;
  @Input() mask: string;
  @Input() label: string;
  @Input() placeholder: string;

  @Input() value: number;
  @Input() min: number;
  @Input() max: number;

  @Input() required: boolean;

  @Input() form: any;

  @Output() valueChange = new EventEmitter();
  @Output() formChange = new EventEmitter();

  private errors: Array<any> = [];
  private hasError = false;
  private validationMessages: any;

  constructor(private providers: SdkProviders) {
  }

  ngAfterViewInit() {
    this.mask = this.mask || 'dd.mm.yyyy';

    if (this.lang) {
      this.providers.Http.Get('assets/limitra/validation.' + this.lang + '.json').subscribe(response => {
        this.validationMessages = response;
        this.validate();
      });
    } else {
      this.validationMessages = {
        InvalidTemplate: 'You have entered data in an invalid format.',
        CompleteData: 'You have entered incomplete data, please complete.',
        GreaterThan: 'You must enter a value greater than or equal to [$Min].',
        LessThan: 'You must enter a value less than or equal to [$Max].'
      };
      this.validate();
    }

    this.initValue();
  }

  @HostListener('input', ['$event'])
  @HostListener('keydown', ['$event'])
  setMask(event: any) {
    event.stopPropagation();
    if (this.isDefaultKey(event)) {
      if ((event.keyCode === 8 || event.keyCode === 46)
        && this.input.nativeElement.value[this.input.nativeElement.selectionStart] !== ' '
      && this.input.nativeElement.selectionStart === this.input.nativeElement.selectionEnd) {
        event.preventDefault();
        const start = this.input.nativeElement.selectionStart - (event.keyCode === 8 ? 1 : 0);
        this.input.nativeElement.value = this.changeCharByIndex(this.input.nativeElement.value, ' ', start);
        this.input.nativeElement.selectionStart = start;
        this.input.nativeElement.selectionEnd = start;

        this.validate();
      }
      return;
    } else {
      event.preventDefault();
      const setChar = (key: string) => {
        const start = this.input.nativeElement.selectionStart;
        const end = this.input.nativeElement.selectionEnd;
        if (start === 0 && end === this.input.nativeElement.value.length) {
          this.input.nativeElement.value = '';
        }
        this.input.nativeElement.value = this.changeCharByIndex(this.input.nativeElement.value, key, start);
        this.input.nativeElement.selectionStart = start + 1;
        this.input.nativeElement.selectionEnd = start + 1;

        if (this.input.nativeElement.value.length > this.mask.length) {
          this.input.nativeElement.value = this.input.nativeElement.value.substring(0, this.input.nativeElement.value.length - 1);
        } else if (this.input.nativeElement.value.length === this.mask.length) {
          const getYear = (): any => {
            const first = this.mask.toLowerCase().indexOf('y');
            let str = '';
            for (let i = first; i < first + 4; i++) {
              str += this.input.nativeElement.value[i];
            }
            return {Index: first, Value: parseInt(str)};
          };

          const getMonth = (): any => {
            const first = this.mask.toLowerCase().indexOf('m');
            let str = '';
            for (let i = first; i < first + 2; i++) {
              str += this.input.nativeElement.value[i];
            }
            return {Index: first, Value: parseInt(str)};
          };

          const getDay = (): any => {
            const first = this.mask.toLowerCase().indexOf('d');
            let str = '';
            for (let i = first; i < first + 2; i++) {
              str += this.input.nativeElement.value[i];
            }
            return {Index: first, Value: parseInt(str)};
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

          this.value = new Date(getYear().Value, getMonth().Value, getDay().Value).getTime();
          this.valueChange.emit(this.value);
        }
      };

      if (!((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105))) {
        const setKey = (key: string) => {
          if (!isNaN(parseInt(key))) {
            const currChar = this.mask.toLowerCase()[this.input.nativeElement.selectionStart];
            const maskChar = this.maskCharDate();
            if (this.input.nativeElement.value.length <= this.mask.length) {
              if (currChar === maskChar) {
                setChar(maskChar);
              }

              if (maskChar !== key) {
                setChar(key);
              }
            }
          }
        }

        if (event.type === 'input') {
          if (event.data) {
            this.input.nativeElement.value = '';
            for (let i = 0; i < event.data.length; i++) {
              setKey(event.data[i]);
            }
          }
        } else {
          setKey(event.key);
        }
      }
    }

    this.validate();
  }

  private isDefaultKey(event: any): boolean {
    return (
      // Allow: Delete, Backspace, Tab, Escape, Enter
      [46, 8, 9, 27, 13].indexOf(event.keyCode) !== -1 ||
      (event.keyCode === 65 && event.ctrlKey === true) || // Allow: Ctrl+A
      (event.keyCode === 67 && event.ctrlKey === true) || // Allow: Ctrl+C
      (event.keyCode === 86 && event.ctrlKey === true) || // Allow: Ctrl+V
      (event.keyCode === 88 && event.ctrlKey === true) || // Allow: Ctrl+X
      (event.keyCode === 90 && event.ctrlKey === true) || // Allow: Ctrl+Z
      (event.keyCode === 65 && event.metaKey === true) || // Cmd+A (Mac)
      (event.keyCode === 67 && event.metaKey === true) || // Cmd+C (Mac)
      (event.keyCode === 86 && event.metaKey === true) || // Cmd+V (Mac)
      (event.keyCode === 88 && event.metaKey === true) || // Cmd+X (Mac)
      (event.keyCode === 90 && event.metaKey === true) || // Cmd+Z (Mac)
      (event.keyCode >= 35 && event.keyCode <= 39) // Home, End, Left, Right
    );
  }

  private changeCharByIndex(text: string, value: string, index: number): string {
    const before = this.providers.String.Replace(text.substring(0, index) || '', ' ', '');
    const after = this.providers.String.Replace(text.length > index ? text.substring(index + 1, text.length) : '', ' ', '');
    return before + value + after;
  }

  private changeWordByIndex(text: string, value: string, index: number): string {
    let result: string = text;
    for (let i = 0; i < value.length; i++) {
      result = this.changeCharByIndex(result, value[i], index + i);
    }
    return result;
  }

  private maskCharDate(): string {
    let maskChar = this.providers.String.Replace(this.mask.toLowerCase(), 'd', '');
    maskChar = this.providers.String.Replace(maskChar, 'm', '');
    return this.providers.String.Replace(maskChar, 'y', '')[0];
  }

  private initValue() {
    if (this.value) {
      this.input.nativeElement.value = this.formatValue(this.value);
    }
  }

  private formatValue(value: number): string {
    const maskChar = this.maskCharDate();
    const date = new Date(value);

    let formatted = '';
    if (date) {
      const day = this.mask.indexOf('d');
      const month = this.mask.indexOf('m');
      const year = this.mask.indexOf('y');

      const array = [
        {Index: day, Value: date.getDate()},
        {Index: month, Value: date.getMonth() + 1 },
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
            formatted = this.changeCharByIndex(formatted,
              maskChar, formatted.length);
          }
        } else {
          index = index + 1;
        }
      }
    }
    return formatted;
  }

  private validate() {
    const maskChar = this.maskCharDate();
    const mask =  this.providers.String.Replace(this.mask, maskChar, '');
    let value: any = this.providers.String.Replace(this.input.nativeElement.value, maskChar, '');
    value = this.providers.String.Replace(value, ' ', '');

    if (value.length !== 0 || this.required) {
      if (isNaN(value) || isNaN(parseInt(value))) {
        this.addFormError(this.name, 'InvalidTemplate');
      } else {
        this.removeFormError(this.name, 'InvalidTemplate');
      }

      if (value.length !== mask.length) {
        this.addFormError(this.name, 'CompleteData');
      } else {
        this.removeFormError(this.name, 'CompleteData');
      }

      if ((this.min && new Date(this.min)) ? this.value <= this.min : false) {
        this.addFormError(this.name, 'GreaterThan');
      } else {
        this.removeFormError(this.name, 'GreaterThan');
      }

      if ((this.max && new Date(this.max)) ? this.value >= this.max : false) {
        this.addFormError(this.name, 'LessThan');
      } else {
        this.removeFormError(this.name, 'LessThan');
      }
    } else {
      this.removeFormError(this.name, null, true);
    }

    this.errors = this.form.Errors.filter(x => x.Name === this.name);
    this.hasError = this.errors.filter(x => !x.Solved).length > 0;
  }

  private addFormError(name: string, key: string) {
    const error = this.form.Errors.filter(x => x.Name === name && x.Key === key && !x.Solved)[0];
    if (this.form && this.validationMessages && !error) {
      const solved = this.form.Errors.filter(x => x.Name === name && x.Key === key)[0];
      if (solved) {
        this.form.Errors.splice(this.form.Errors.indexOf(solved), 1);
      }

      let message = this.validationMessages[key];
      message = this.providers.String.Replace(message, '[$Min]', this.formatValue(this.min));
      message = this.providers.String.Replace(message, '[$Max]', this.formatValue(this.max));

      this.form.Errors.push({ Name: name, Key: key, Message: message, Solved: false });
      this.formChange.emit(this.form);
    }
  }

  private removeFormError(name: string, key: string, remove: boolean = false) {
    if (this.form) {
      this.form.Errors.filter(x => x.Name === name && (key ? x.Key === key : true)).forEach(error => {
        if (error) {
          if (remove) {
            this.form.Errors.splice(this.form.Errors.indexOf(error), 1);
          } else {
            error.Solved = true;
          }
          this.formChange.emit(this.form);
        }
      });
    }
  }
}
