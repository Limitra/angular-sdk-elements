import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {InputExtend} from '../../extends/input-extend';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-select-server',
  templateUrl: './select-server.component.html',
  styleUrls: ['./select-server.component.css']
})
export class SelectServerComponent extends InputExtend implements AfterViewInit {
  constructor(public providers: SdkProviders) { super(providers); }

  @Input() domain: string;
  @Input() source: string;
  @Input() multiple = false;
  @Input() minlength: number;
  @Input() maxlength: number;

  @Input() length: number = 10;

  @Input() textkey: string = 'Text';
  @Input() valuekey: string = 'Value';

  @ViewChild('search', {static: false}) search: ElementRef;

  private api: any;
  private page = 1;
  public searchText: string;
  public filteredSource: Array<any> = [];

  public selected: any;
  public selecteds: Array<any> = [];

  ngAfterViewInit() {
    this.api = this.providers.Storage.Get('API_Settings');
    this.init();
    this.initSource(true);
  }

  preInit() {
    const value = this.multiple ? (this.value || []) : this.value;

    if (this.multiple) {
      this.selecteds = value;
    } else {
      this.selected = value;
    }
  }

  initSource(reset: boolean) {
    this.page = reset ? 1 : this.page;
    const params: any = { page: this.page };
    if (this.length) { params.length = this.length; }
    if (this.searchText) { params.search = this.searchText.toLowerCase(); }
    if (this.value) { params.values = this.value; }
    const domain = this.domain || (this.api ? this.api.Domain : '');
    const source = domain + this.source + (this.source.includes('?') ? '&' : '?') + this.providers.Url.Serialize(params);
    this.providers.Http.Get(source).subscribe(response => {
      if (reset) {
        this.filteredSource = response.Data.Source;
      } else {
        this.filteredSource = this.filteredSource.concat(response.Data.Source);
      }
      this.preInit();
    }, () => {
      if (this.multiple) {
        this.selecteds = this.value;
      } else {
        this.selected = this.value;
      }
    });
  }

  scroll(event) {
    const scrollMax = event.target.scrollHeight - event.target.offsetHeight;
    if (event.target.scrollTop === scrollMax) {
      this.page++;
      this.initSource(false);
    }
  }

  forceValue() {
    if (this.input.nativeElement.value) {
      if (this.multiple) {
        const values: Array<any> = this.input.nativeElement.value.split(',') || [];
        this.value = values;
      } else {
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
    if (this.source) {
      this.page = 1;
      this.initSource(true);
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
        this.input.nativeElement.value = option[this.valuekey];
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
