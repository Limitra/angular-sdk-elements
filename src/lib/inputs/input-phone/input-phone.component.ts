import {AfterViewInit, Component, OnInit} from '@angular/core';
import {InputExtend} from '../../extends/InputExtend';
import {SdkProviders} from '../../../../../sdk-core/src/lib/providers';

@Component({
  selector: 'lim-input-phone',
  templateUrl: './input-phone.component.html',
  styleUrls: ['./input-phone.component.css']
})
export class InputPhoneComponent extends InputExtend implements AfterViewInit {
  constructor(protected providers: SdkProviders) { super(providers); }

  ngAfterViewInit() {
    this.init();
  }

  keyboardQuery(event: KeyboardEvent): boolean {
    return !((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105));
  }
}
