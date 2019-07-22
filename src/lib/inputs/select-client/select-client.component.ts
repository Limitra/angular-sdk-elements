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

  @ViewChild('search', {static: false}) search: ElementRef;

  public selected: any;
  public selecteds: Array<any> = [];
  public searchText: string;
  public filteredSource: Array<any> = [];

  ngAfterViewInit() {
    this.filteredSource = this.source || [];
    if (this.multiple) {
      this.selecteds = this.filteredSource.filter(x => this.value ? this.value.includes(x.Value) : false);
    } else {
      this.selected = this.filteredSource.filter(x => this.value ? this.value === x.Value : false)[0];
    }
    this.init();
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
    this.selecteds = [];
    this.validate();
  }

  searchValue() {
    const search = this.searchText;
    if (this.source) {
      this.filteredSource = this.source.filter(x => (x && x.Text ? x.Text.toLowerCase().includes(search.toLowerCase()) : false));
    }
  }

  checkOption(option: any) {
    this.search.nativeElement.focus();
    if (option && option.Value) {
      if (this.multiple) {
        const selected = this.selecteds.filter(x => x.Value === option.Value)[0];
        if (!selected) {
          this.selecteds.push(option);
        } else {
          this.selecteds.splice(this.selecteds.indexOf(selected), 1);
        }
        this.input.nativeElement.value = this.selecteds.map(x => x.Value);
      } else {
        this.selected = option;
        this.input.nativeElement.value = option.Value;
      }

      this.validate();
    }
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$MinLength]', this.minlength ? this.minlength.toString() : '');
    message = this.providers.String.Replace(message, '[$MaxLength]', this.maxlength ? this.maxlength.toString() : '');
    return message;
  }
}
