import {AfterViewInit, Component, OnInit} from '@angular/core';
import {InputExtend} from '../../extends/input-extend';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-input-phone',
  templateUrl: './input-phone.component.html',
  styleUrls: ['./input-phone.component.css']
})
export class InputPhoneComponent extends InputExtend implements AfterViewInit {
  constructor(public providers: SdkProviders) { super(providers); }

  ngAfterViewInit() {
    this.init(() => {
      this.mask = this.validationMessages.PhoneMask;
    });
  }

  keyboardQuery(event: KeyboardEvent): boolean {
    return !((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105));
  }
}
