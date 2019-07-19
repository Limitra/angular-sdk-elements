import {AfterViewInit, Component, Input} from '@angular/core';
import {InputExtend} from '../../extends/input-extend';
import {SdkProviders} from '@limitra/sdk-core/lib/providers';

@Component({
  selector: 'lim-input-text',
  templateUrl: './input-text.component.html',
  styleUrls: ['./input-text.component.css']
})
export class InputTextComponent extends InputExtend implements AfterViewInit {
  constructor(public providers: SdkProviders) { super(providers); }

  @Input() minlength = 0;
  @Input() maxlength = 50;

  ngAfterViewInit() {
    this.init();
  }

  validation(value: any) {
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
