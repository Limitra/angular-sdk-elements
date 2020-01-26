import {ElementRef, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';
import {ScreenSize} from '@limitra/sdk-core';

export class InputExtend {
  constructor(public providers: SdkProviders) {
  }

  @ViewChild('input', {static: false}) input: ElementRef;

  @Input() label: string;
  @Input() placeholder: string;

  @Input() mask: string;

  @Input() value: any;
  @Input() form: any;

  @Input() property: any;

  @Output() valueChange = new EventEmitter();
  @Output() formChange = new EventEmitter();

  @Input() required: boolean;

  @Input() inline = false;
  @Input() disabled: boolean;

  public focus: boolean;
  public name: string;
  public errors: Array<any> = [];
  public hasError = false;
  public validationMessages: any;
  public screenSize: number;
  public screenSizes = ScreenSize;

  preInit(changed: boolean = false) {

  }

  init(call: () => void = null) {
    if (this.form) {
      this.form.errors = this.form.errors || [];
      this.form.modelChange.subscribe(model => {
        if (this.property) {
          let changed = false;
          if (this.value !== model[this.property]) {
            this.value = model[this.property];
            this.valueChange.emit(this.value);
            changed = true;
          }
          this.input.nativeElement.value = this.formatValue(this.value);
          this.preInit(changed);
          this.validate(false);
        }
      });

      this.valueChange.subscribe(value => {
        if (this.property) {
          if (value !== this.form.model[this.property]) {
            this.form.model[this.property] = value;
            this.form.modelChange.emit(this.form.model);
          }
        }
      });
    }

    this.screenSize = this.providers.Screen.GetSize();
    const lang = this.providers.Storage.Get('Localization_Settings', 'Language');

    this.generateName();

    const maskCall = () => {
      if (this.value && this.input) {
        this.input.nativeElement.value = this.formatValue(this.value);
      }
    }

    if (lang) {
      this.providers.Http.Get('assets/locale/validation/' + lang + '.json').subscribe(response => {
        this.validationMessages = response;
        if (call) {
          call();
        }
        maskCall();
        this.validate();
      });
    } else {
      setTimeout(() => {
        this.validationMessages = {
          Required: 'You must fill in this field.',
          ValidError: 'You must enter data in a valid format.',
          RegExpError: 'You must enter data in a valid format. [$DataFormat]',
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
          ImageMaxLength: 'Image files must be less than or equal to [$ImageMaxLength].',
          AudioMaxLength: 'Audio files must be less than or equal to [$AudioMaxLength].',
          VideoMaxLength: 'Video files must be less than or equal to [$VideoMaxLength].',
          DocumentMaxLength: 'Document files must be less than or equal to [$DocumentMaxLength].',
          FileMinLength: 'You must select at least [$MinLength] file.',
          FileMaxLength: 'You can select up to [$MaxLength] file.',
          FileTypeError: 'You must remove unsupported file types.',
          FileReadyError: 'Your upload process not completed yet.',
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
        if (call) {
          call();
        }
        maskCall();
        this.validate();
      });
    }
  }

  public keyboardQuery(event: KeyboardEvent): boolean {
    return false;
  }

  public findMaskSeperator(): Array<string> {
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
  public forceValue() {
    this.value = this.input.nativeElement.value;
    this.valueChange.emit(this.value);
  }

  public formatValue(value: any): string {
    return this.value === undefined ? '' : this.value;
  }

  public localizeReplace(message: string): string {
    return '';
  }

  public isDefaultKey(event: any): boolean {
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

  public changeCharByIndex(text: string, value: string, index: number): string {
    const before = text.substring(0, index) || '';
    const after = text.length > index ? text.substring(index + 1, text.length) : '';
    return before + value + after;
  }

  public changeWordByIndex(text: string, value: string, index: number): string {
    let result: string = text;
    for (let i = 0; i < value.length; i++) {
      result = this.changeCharByIndex(result, value[i], index + i);
    }
    return result;
  }

  @HostListener('input', ['$event'])
  @HostListener('keydown', ['$event'])
  public setMask(event: any) {
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

  public validate(forceValue: boolean = true) {
    let value = this.input.nativeElement.value || '';
    let mask = this.mask;
    if (this.mask) {
      this.findMaskSeperator().forEach(maskChar => {
        mask = this.providers.String.Replace(mask, maskChar, '');
        value = this.providers.String.Replace(value, maskChar, '');
        value = this.providers.String.Replace(value, ' ', '');
      });

      if (forceValue) {
        if (value.length === mask.length) {
          this.forceValue();
        }
      }
    } else {
      if (forceValue) {
        this.forceValue();
      }
    }

    if ((!value || this.isEmpty() || (mask ? value.length !== mask.length : false)) && this.required) {
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

    this.checkState(value);
  }

  public checkState(value: any = null) {
    if (this.form) {
      if (!value) {
        this.form.errors.filter(x => x.Name === this.name && x.Solved).forEach(error => {
          this.form.errors.splice(this.form.errors.indexOf(error), 1);
        });
      }

      this.errors = this.form.errors.filter(x => x.Name === this.name);
      this.hasError = this.errors.filter(x => !x.Solved).length > 0;
      this.form.onFormChange();
    }
  }

  public validation(value: any, mask: any) {

  }

  public addFormError(key: string) {
    if (this.form) {
      const error = this.form.errors.filter(x => x.Name === this.name && x.Key === key && !x.Solved)[0];
      if (this.form && this.validationMessages && !error) {
        const solved = this.form.errors.filter(x => x.Name === this.name && x.Key === key)[0];
        if (solved) {
          this.form.errors.splice(this.form.errors.indexOf(solved), 1);
        }

        let message = this.validationMessages[key];
        message = this.localizeReplace(message) || message;

        this.form.errors.push({Name: this.name, Key: key, Message: message, Solved: false});
        this.formChange.emit(this.form);
      }
    }
  }

  public removeFormError(key: string, remove: boolean = false) {
    if (this.form) {
      this.form.errors.filter(x => x.Name === this.name && (key ? x.Key === key : true)).forEach(error => {
        if (error) {
          if (remove) {
            this.form.errors.splice(this.form.errors.indexOf(error), 1);
          } else {
            error.Solved = true;
          }
          this.formChange.emit(this.form);
        }
      });
    }
  }

  private generateName() {
    this.name = this.providers.String.Generate(11);
  }

  private isEmpty() {
    return (this.value
      || this.value === 0
      || this.value === false) ? this.value.toString().length === 0 || !this.value.toString().trim() : true;
  }
}
