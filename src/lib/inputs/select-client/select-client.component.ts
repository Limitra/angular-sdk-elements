import {AfterViewInit, Component, Input} from '@angular/core';
import {InputExtend} from '../../extends/InputExtend';
import {SdkProviders} from '../../../../../sdk-core/src/lib/providers';

@Component({
  selector: 'lim-select-client',
  templateUrl: './select-client.component.html',
  styleUrls: ['./select-client.component.css']
})
export class SelectClientComponent extends InputExtend implements AfterViewInit {
  constructor(protected providers: SdkProviders) { super(providers); }

  @Input() source: Array<any>;

  private selected: any;

  ngAfterViewInit() {
    this.init();
  }

  forceValue() {
    if (this.input.nativeElement.value) {
      this.value = this.input.nativeElement.value;
      this.valueChange.emit(this.value);
    }
  }

  removeValue() {
    this.input.nativeElement.value = '';
    this.selected = undefined;
    this.validate();
  }

  checkOption(option: any) {
    if (option && option.Value) {
      this.selected = option;
      this.input.nativeElement.value = option.Value;
      this.validate();
    }
  }
}
