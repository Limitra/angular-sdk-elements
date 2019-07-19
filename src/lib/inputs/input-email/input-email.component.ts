import {AfterViewInit, Component, Input} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core/lib/providers';
import {InputExtend} from '../../extends/input-extend';

@Component({
  selector: 'lim-input-email',
  templateUrl: './input-email.component.html',
  styleUrls: ['./input-email.component.css']
})
export class InputEmailComponent extends InputExtend implements AfterViewInit {
  constructor(public providers: SdkProviders) { super(providers); }

  @Input() minlength = 0;
  @Input() maxlength = 100;

  ngAfterViewInit() {
    this.init();
  }

  validation(value: any) {
    const regex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/i;

    if (!regex.test(value)) {
      this.addFormError('ValidError');
    } else {
      this.removeFormError('ValidError');
    }

    if (value.length < this.minlength) {
      this.addFormError('MinLength');
    } else {
      this.removeFormError('MinLength');
    }

    if (value.length > this.maxlength) {
      this.addFormError('MaxLength');

      if (value.length - this.maxlength > 1) {
        this.input.nativeElement.value = this.input.nativeElement.value.substring(0, this.maxlength + 1);
        this.value = this.input.nativeElement.value;
        this.valueChange.emit(this.value);
      }
    } else {
      this.removeFormError('MaxLength');
    }
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$MinLength]', this.minlength ? this.minlength.toString() : '');
    message = this.providers.String.Replace(message, '[$MaxLength]', this.maxlength ? this.maxlength.toString() : '');
    return message;
  }
}
