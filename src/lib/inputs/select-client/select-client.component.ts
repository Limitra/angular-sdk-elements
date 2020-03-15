import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {InputExtend} from '../../extends/input-extend';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-select-client',
  templateUrl: './select-client.component.html',
  styleUrls: ['./select-client.component.css']
})
export class SelectClientComponent extends InputExtend implements AfterViewInit {
  constructor(public providers: SdkProviders) { super(providers); }

  @Input() source: Array<any>;
  @Input() multiple = false;
  @Input() minlength: number;
  @Input() maxlength: number;

  @Input() textkey = 'Text';
  @Input() valuekey = 'Value';

  @ViewChild('search', {static: false}) search: ElementRef;

  public selected: any;
  public selectedText: string;
  public selecteds: Array<any> = [];
  public searchText: string;
  public filteredSource: Array<any> = [];

  ngAfterViewInit() {
    this.preInit();
    this.init();
  }

  preInit() {
    this.filteredSource = this.source || [];
    if (this.multiple) {
      this.selecteds = this.filteredSource.filter(x =>
        (this.value && this.value.length > 0) ? (this.value.includes(x[this.valuekey])
          || this.value.includes(x[this.valuekey].toString)) : false).map(x => x[this.valuekey]);
    } else {
      this.selected = this.filteredSource.filter(x => this.value ? this.value == x[this.valuekey] : false).map(x => x[this.valuekey])[0];
      this.selectedText = this.filteredSource.filter(x => this.value ? this.value == x[this.valuekey] : false).map(x => x[this.textkey])[0] || '';
    }
  }

  forceValue() {
    if (this.input.nativeElement.value) {
      if (this.multiple) {
        const values: Array<any> = this.input.nativeElement.value.split(',') || [];
        this.value = values;
      } else  {
        this.value = this.input.nativeElement.value;
      }
      this.valueChange.emit(this.value);
    } else {
      this.value = (this.multiple ? [] : undefined);
      this.valueChange.emit(this.value);
    }
  }

  validation(value: any) {
    if (this.multiple) {
      const values: Array<any> = this.input.nativeElement.value.split(',') || [];
      if (this.minlength && values.length < this.minlength) {
        this.addFormError('SelectMinLength');
      } else {
        this.removeFormError('SelectMinLength');
      }

      if (this.maxlength && values.length > this.maxlength) {
        this.addFormError('SelectMaxLength');
      } else {
        this.removeFormError('SelectMaxLength');
      }
    }
  }

  removeValue() {
    this.input.nativeElement.value = '';
    this.selected = undefined;
    this.selectedText = '';
    this.selecteds = [];
    this.validate();
  }

  searchValue() {
    const search = this.searchText;
    if (this.source) {
      this.filteredSource = this.source.filter(x => (x && x[this.textkey]
        ? x[this.textkey].toLowerCase().includes((search || '').toLowerCase()) : false));
    }
  }

  checkOption(option: any) {
    this.search.nativeElement.focus();
    if (option && option[this.valuekey]) {
      if (this.multiple) {
        const selected = this.selecteds.filter(x => x == option[this.valuekey])[0];
        if (!selected) {
          this.selecteds.push(option[this.valuekey]);
        } else {
          this.selecteds.splice(this.selecteds.indexOf(selected), 1);
        }
        this.input.nativeElement.value = this.selecteds;
      } else {
        this.selected = option[this.valuekey];
        this.selectedText = option[this.textkey];
        this.input.nativeElement.value = option[this.valuekey];
      }

      this.validate();
    }
  }

  keyDown(event: any) {
    if (event.key === 'Enter') {
      if (this.filteredSource && this.filteredSource.length > 0) {
        this.checkOption(this.filteredSource[0]);
        this.focus = false;
      }
    }

    if (event.key === 'Escape') {
      this.focus = false;
    }
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$MinLength]', this.minlength ? this.minlength.toString() : '');
    message = this.providers.String.Replace(message, '[$MaxLength]', this.maxlength ? this.maxlength.toString() : '');
    return message;
  }
}
