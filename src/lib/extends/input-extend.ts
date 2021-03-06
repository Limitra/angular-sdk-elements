import {
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';

import {SdkProviders} from '@limitra/sdk-core';
import {ScreenSize} from '@limitra/sdk-core';

export class InputExtend implements OnDestroy {
  constructor(public providers: SdkProviders) { }

  @Input() fontSize = .875;
  @Input() padding = '';

  @ViewChild('input', {static: false}) input: ElementRef;

  @Input() label: string;
  @Input() placeholder: string;

  @Input() mask: string;

  @Input() value: any;
  @Input() form: any;

  @Input() property: any;

  @Output() valueChange = new EventEmitter();

  @Input() required: boolean;

  @Input() inline = false;
  @Input() disabled: boolean;
  @Input() reset = true;

  public focus: boolean;
  public name: string;
  public errors: Array<any> = [];
  public hasError = false;
  public validationMessages: any;
  public screenSize: number;
  public screenSizes = ScreenSize;

  private preInited: boolean;
  private valueSubs;
  private modelSubs;

  preInit(changed: boolean = false) {
  }

  overrideHasValue(value: any): boolean {
    return value;
  }

  ngOnDestroy() {
    if (this.modelSubs) { this.modelSubs.unsubscribe(); }
    if (this.reset) {
      delete this.value;
      this.valueChange.emit(this.value);
    }
    if (this.valueSubs) { this.valueSubs.unsubscribe(); }

    if (this.reset) {
      this.errors = [];
      this.hasError = false;

      if (this.form) {
        this.form.errorChange.emit(this.errors);
      }
    }
  }

  init(call: () => void = null) {
    this.generateName();

    if (this.property) {
      this.value = this.readProperty(this.form.model);
    }

    const implement = () => {
      this.screenSize = this.providers.Screen.GetSize();
      const lang = this.providers.Storage.Get('Localization_Settings', 'Language');

      const maskCall = () => {
        if (this.overrideHasValue(this.value) && this.input) {
          this.input.nativeElement.value = this.formatValue(this.value);
        }
      };

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
            TimeMask: 'hh:mm',
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
    };

    if (this.form) {
      this.errors = this.form.errors.filter(x => x.Name === this.name);

      this.valueSubs = this.valueChange.subscribe(value => {
        this.value = value;
        if (this.property) {
            this.assignToForm(value);
        }
        this.form.modelChange.emit(this.form.model);
      });

      this.modelSubs = this.form.modelChange.subscribe(model => {
        let changed = false;
        if (this.property) {
          const value = this.readProperty(model);
          changed = this.value != value;
          if (changed) {
            this.value = value;
            this.valueChange.emit(this.value);
          }
        }

        if (changed || !this.preInited) {
          this.preInited = true;
          this.input.nativeElement.value = this.formatValue(this.value);
          this.preInit(true);
          this.validate(false);
        }
      });
    }

    implement();
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
    this.value = this.input.nativeElement.value.trim();
    this.valueChange.emit(this.value);
  }

  public formatValue(value: any): string {
    return value === null || value === undefined ? '' : value;
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
  public setMask(event: any) {
    if (this.mask) {
      event.stopPropagation();
      if (this.isDefaultKey(event)) {
        if ((event.keyCode === 8 || event.keyCode === 46)
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
    let value = this.input.nativeElement.value.trim() || '';
    let mask = this.mask;
    if (mask) {
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

    if (this.overrideHasValue(value)) {
      this.validation(value, mask);
    }

    if (!this.overrideHasValue(value) && !this.required) {
      this.removeFormError(null, true);
    }

    this.checkState(value);
  }

  public checkState(value: any = null) {
    if (this.form) {
      if (!value) {
        this.errors = this.errors.filter(x => !x.Solved);
      }
      this.hasError = this.errors.filter(x => !x.Solved).length > 0;
      this.form.errorChange.emit(this.errors);
    }
  }

  public validation(value: any, mask: any) {

  }

  public addFormError(key: string) {
    if (this.form) {
      const error = this.errors.filter(x => x.Key === key && !x.Solved)[0];
      if (this.form && this.validationMessages && !error) {
        const solved = this.errors.filter(x => x.Key === key)[0];
        if (solved) {
          this.errors.splice(this.errors.indexOf(solved), 1);
        }

        let message = this.validationMessages[key];
        message = this.localizeReplace(message) || message;

        this.errors.push({Name: this.name, Key: key, Message: message, Solved: false});
      }
    }
  }

  public removeFormError(key: string, remove: boolean = false) {
    if (this.form) {
      if (remove) {
        this.errors = this.errors.filter(x => x.Key !== key);
      } else {
        this.errors.filter(x => x.Key === key).forEach(error => {
          error.Solved = error.Key === key;
        });
      }
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

  protected assignToForm(value) {
    if (this.property) {
      const properties = this.property.split('.');
      if (properties.length > 1) {
        let localValue = this.form.model;
        properties.forEach((property, index) => {
          localValue = localValue[property];
        });
        localValue = value;
      } else {
        this.form.model[this.property] = value;
      }
    }
  }

  protected readProperty(model: any) {
    let localValue: any = model;
    if (this.property && model) {
      const properties = this.property.split('.');
      properties.forEach((property, index) => {
         localValue = localValue[property];
      });
    } else { localValue = this.value; }
    return localValue;
  }
}
