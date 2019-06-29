import {AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild} from '@angular/core';
import {SdkProviders} from '../../../../sdk-core/src/lib/providers';

@Component({
  selector: 'lim-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent implements AfterViewInit {
  @ViewChild('input', {static: false}) input: ElementRef;

  @Input() type: string;
  @Input() mask: string;
  @Input() label: string;
  @Input() placeholder: string;
  @Input() value: any;

  @Output() valueChange = new EventEmitter();

  constructor(private providers: SdkProviders) {
  }

  ngAfterViewInit() {
    this.type = this.type || 'text';
    switch (this.type) {
      case 'date':
        this.mask = this.mask || 'dd.mm.yyyy';
        this.initDate();
        break;
    }
  }

  validate() {
    switch (this.type) {
      case 'date':
        this.validateDate();
        break;
    }
  }

  @HostListener('keydown', ['$event'])
  setMask(event: KeyboardEvent) {
    event.stopPropagation();
    switch (this.type) {
      case 'date':
        this.maskDate(event);
        break;
    }
  }

  private isDefaultKey(event: KeyboardEvent): boolean {
    return (
      // Allow: Delete, Backspace, Tab, Escape, Enter
      [46, 8, 9, 27, 13].indexOf(event.keyCode) !== -1 ||
      (event.keyCode === 65 && event.ctrlKey === true) || // Allow: Ctrl+A
      (event.keyCode === 67 && event.ctrlKey === true) || // Allow: Ctrl+C
      (event.keyCode === 88 && event.ctrlKey === true) || // Allow: Ctrl+X
      (event.keyCode === 65 && event.metaKey === true) || // Cmd+A (Mac)
      (event.keyCode === 67 && event.metaKey === true) || // Cmd+C (Mac)
      (event.keyCode === 88 && event.metaKey === true) || // Cmd+X (Mac)
      (event.keyCode >= 35 && event.keyCode <= 39) // Home, End, Left, Right
    );
  }

  private changeCharByIndex(text: string, value: string, index: number): string {
    const before = text.substring(0, index) || '';
    const after = text.length > index ? text.substring(index + 1, text.length) : '';
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

  private initDate() {
    if (this.value) {
      const maskChar = this.maskCharDate();

      const date = new Date(this.value);
      if (date) {
        const day = this.mask.indexOf('d');
        const month = this.mask.indexOf('m');
        const year = this.mask.indexOf('y');

        const array = [
          {Index: day, Value: date.getDate()},
          {Index: month, Value: date.getMonth()},
          {Index: year, Value: date.getFullYear()}];

        let index = 0;
        while (array.length > 0) {
          const obj = array[index];
          if (array.length > 1 ? obj.Index === Math.min.apply(Math, array.map(y => y.Index)) : true) {
            this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, obj.Index !== year
              ? ('0' + obj.Value).slice(-2) : obj.Value.toString(), obj.Index);
            index = 0;
            array.splice(array.indexOf(obj), 1);

            if (array.length > 0) {
              this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value,
                maskChar, this.input.nativeElement.value - 1);
            }
          } else {
            index = index + 1;
          }
        }
      }
    }
  }

  private maskDate(event: KeyboardEvent) {
    if (this.isDefaultKey(event)) {
      return;
    }
    event.preventDefault();
    const maskChar = this.maskCharDate();

    const getYear = (value: string): any => {
      const first = this.mask.toLowerCase().indexOf('y');
      let str = '';
      for (let i = first; i < first + 4; i++) {
        str += this.input.nativeElement.value[i];
      }
      return {Index: first, Value: parseInt(str)};
    };

    const getMonth = (value: string): any => {
      const first = this.mask.toLowerCase().indexOf('m');
      let str = '';
      for (let i = first; i < first + 2; i++) {
        str += this.input.nativeElement.value[i];
      }
      return {Index: first, Value: parseInt(str)};
    };

    const getDay = (value: string): any => {
      const first = this.mask.toLowerCase().indexOf('d');
      let str = '';
      for (let i = first; i < first + 2; i++) {
        str += this.input.nativeElement.value[i];
      }
      return {Index: first, Value: parseInt(str)};
    };

    const setDate = (key: string) => {
      const start = this.input.nativeElement.selectionStart;
      this.input.nativeElement.value = this.changeCharByIndex(this.input.nativeElement.value, key, start);
      this.input.nativeElement.selectionStart = start + 1;
      this.input.nativeElement.selectionEnd = start + 1;

      if (this.mask.length === this.input.nativeElement.value.length) {
        const year = (): any => {
          return getYear(this.input.nativeElement.value);
        };
        const month = (): any => {
          return getMonth(this.input.nativeElement.value);
        };
        const day = (): any => {
          return getDay(this.input.nativeElement.value);
        };

        if (year().Value < 1500) {
          this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '1970', year().Index);
        } else if (year().Value > 3000) {
          this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value,
            new Date().getFullYear().toString(), year().Index);
        }

        if (month().Value < 1) {
          this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '01', month().Index);
        } else if (month().Value > 12) {
          this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '12', month().Index);
        }

        const maxDay = new Date(year().Value, month().Value, 0).getDate();
        if (day().Value > maxDay) {
          this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, maxDay.toString(), day().Index);
        } else if (day().Value < 1) {
          this.input.nativeElement.value = this.changeWordByIndex(this.input.nativeElement.value, '01', day().Index);
        }

        this.valueChange.emit(new Date(year().Value, month().Value, day().Value).getTime());
      }
    };

    if (!((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105))) {
      const currChar = this.mask.toLowerCase()[this.input.nativeElement.selectionStart];
      if (this.input.nativeElement.value.length <= this.mask.length) {
        if (currChar === maskChar) {
          setDate(maskChar);
        }
        setDate(event.key);

        if (this.input.nativeElement.value.length > this.mask.length) {
          this.input.nativeElement.value = this.input.nativeElement.value.substring(0, this.input.nativeElement.value.length - 1);
        }
      }
    }
  }

  private validateDate() {
    const maskChar = this.maskCharDate();
    const value = this.providers.String.Replace(this.input.nativeElement.value, maskChar, '');
    const mask = this.providers.String.Replace(this.mask, maskChar, '');

    const hasError = value.length !== mask.length || !parseInt(value);

    if (hasError) {
      this.input.nativeElement.value = '';
    }
  }
}
