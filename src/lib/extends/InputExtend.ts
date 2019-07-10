import {ElementRef, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {SdkProviders} from '../../../../sdk-core/src/lib/providers';

export class InputExtend {
  constructor(protected providers: SdkProviders) {
  }

  @ViewChild('input', {static: false}) input: ElementRef;

  @Input() label: string;
  @Input() placeholder: string;

  @Input() mask: string;
  @Input() lang: string;

  @Input() value: any;
  @Input() form: any;

  @Output() valueChange = new EventEmitter();
  @Output() formChange = new EventEmitter();

  @Input() required: boolean;

  protected name: string;
  protected errors: Array<any> = [];
  protected hasError = false;
  protected validationMessages: any;

  init(call: () => void = null) {
    this.form = this.form || { };
    this.form.Errors = this.form.Errors || [];
    this.lang = this.lang || this.providers.Storage.Get('Localization_Lang');

    this.generateName();
    if (this.value && this.input) {
      this.input.nativeElement.value = this.formatValue(this.value);
    }

    if (this.lang) {
      this.providers.Http.Get('assets/limitra/validation.' + this.lang + '.json').subscribe(response => {
        this.validationMessages = response;
        if (call) { call(); }
        this.validate();
      });
    } else {
      this.validationMessages = {
        Required: 'You must fill in this field.',
        ValidError: 'You must enter data in a valid format.',
        GreaterThan: 'You must enter a value greater than or equal to [$Min].',
        LessThan: 'You must enter a value less than or equal to [$Max].',
        MinLength: 'You must enter at least [$MinLength] characters.',
        MaxLength: 'You can enter up to [$MaxLength] characters.',
        Digit: 'You must enter at least [$Digit] digits.',
        Special: 'You must enter at least [$Special] special characters.',
        UpperCase: 'You must enter at least [$Uppercase] uppercase characters.',
        LowerCase: 'You must enter at least [$Lowercase] lowercase characters.',
        DateMask: 'dd.mm.yyyy',
        PhoneMask: '+(XX) XXX XXX XX XX',
        FileMinLength: 'You must select at least [$MinLength] file.',
        FileMaxLength: 'You can select up to [$MaxLength] file.',
        FileSize: 'File size must be between [$MinSize] and [$MaxSize].',
        FileTypeError: 'You must remove unsupported file types.',
        FileReadyError: 'Your upload process not completed yet.',
        FileUploadSource: 'http://localhost',
        FileDefaultText: 'Choose File.',
        SelectDefaultText: 'Choose.',
        SelectSearchText: 'Search.',
        SelectEmptyText: 'No data found.',
        SelectMultiText: 'You have selected [$Length] data.',
        SelectMinLength: 'You must select at least [$MinLength] data.',
        SelectMaxLength: 'You can select up to [$MaxLength] data.',
        DecimalSeperator: '.',
        ThousandSeperator: ','
      };
      this.validate();
      if (call) { call(); }
    }
  }

  protected keyboardQuery(event: KeyboardEvent): boolean {
    return false;
  }

  protected findMaskSeperator(): Array<string> {
    const charArray = [];
    if (this.mask) {
      const mask = this.providers.String.Replace(this.mask.toLowerCase(), 'x', '');
      const length = mask.length;
      for (let i = 0; i < length; i++) {
        if (!charArray.includes(mask[i])) {
          charArray.push(mask[i]);
        }
      }
    }
    return charArray;
  }

  // If value masked and completed => Check, If, Rewrite
  protected forceValue() {
    this.value = this.input.nativeElement.value;
    this.valueChange.emit(this.value);
  }

  protected formatValue(value: any): string {
    return this.value;
  }

  protected localizeReplace(message: string): string {
    return '';
  }

  protected isDefaultKey(event: any): boolean {
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

  protected changeCharByIndex(text: string, value: string, index: number): string {
    const before = text.substring(0, index) || '';
    const after = text.length > index ? text.substring(index + 1, text.length) : '';
    return before + value + after;
  }

  protected changeWordByIndex(text: string, value: string, index: number): string {
    let result: string = text;
    for (let i = 0; i < value.length; i++) {
      result = this.changeCharByIndex(result, value[i], index + i);
    }
    return result;
  }

  @HostListener('input', ['$event'])
  @HostListener('keydown', ['$event'])
  protected setMask(event: any) {
    if (this.mask) {
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
          }
        };

        if (this.keyboardQuery(event)) {
          const setKey = (key: string) => {
            if (!isNaN(parseInt(key, 0))) {
              let valid = false;
              let maskInt = this.input.nativeElement.selectionStart;
              if (this.input.nativeElement.value.length <= this.mask.length) {
                while (!valid) {
                  const currChar = this.mask.toLowerCase()[maskInt];
                  if (this.findMaskSeperator().includes(currChar)) {
                    setChar(currChar);
                  } else {
                    valid = true;
                  }
                  maskInt++;
                }

                if (!this.findMaskSeperator().includes(key)) {
                  setChar(key);
                }
              }
            }
          };

          if (event.type === 'input') {
            if (event.data) {
              this.input.nativeElement.value = '';
              const length = event.data.length;
              for (let i = 0; i < length; i++) {
                setKey(event.data[i]);
              }
            }
          } else {
            setKey(event.key);
          }
        }
      }
    }
    this.validate();
  }

  protected validate() {
    let value = this.input.nativeElement.value || '';
    let mask = this.mask;
    if (this.mask) {
      this.findMaskSeperator().forEach(maskChar => {
        mask = this.providers.String.Replace(mask, maskChar, '');
        value = this.providers.String.Replace(value, maskChar, '');
        value = this.providers.String.Replace(value, ' ', '');
      });

      if (value.length === mask.length) {
        this.forceValue();
      } else {
        this.value = undefined;
        this.valueChange.emit(this.value);
      }
    } else {
      this.forceValue();
    }

    if ((!value || (mask ? value.length !== mask.length : false)) && this.required) {
      this.addFormError('Required');
    } else {
      this.removeFormError('Required');
    }

    if (value) {
      this.validation(value, mask);
    }

    if (!value && !this.required) {
      this.removeFormError(null, true);
    }

    if (this.form) {
      if (!value) {
        this.form.Errors.filter(x => x.Name === this.name && x.Solved).forEach(error => {
          this.form.Errors.splice(this.form.Errors.indexOf(error), 1);
        });
      }

      this.errors = this.form.Errors.filter(x => x.Name === this.name);
      this.hasError = this.errors.filter(x => !x.Solved).length > 0;
    }
  }

  protected validation(value: any, mask: any) {

  }

  protected addFormError(key: string) {
    if (this.form) {
      const error = this.form.Errors.filter(x => x.Name === this.name && x.Key === key && !x.Solved)[0];
      if (this.form && this.validationMessages && !error) {
        const solved = this.form.Errors.filter(x => x.Name === this.name && x.Key === key)[0];
        if (solved) {
          this.form.Errors.splice(this.form.Errors.indexOf(solved), 1);
        }

        let message = this.validationMessages[key];
        message = this.localizeReplace(message) || message;

        this.form.Errors.push({Name: this.name, Key: key, Message: message, Solved: false});
        this.formChange.emit(this.form);
      }
    }
  }

  protected removeFormError(key: string, remove: boolean = false) {
    if (this.form) {
      this.form.Errors.filter(x => x.Name === this.name && (key ? x.Key === key : true)).forEach(error => {
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

  private generateName() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 11; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    this.name = result;
  }
}
