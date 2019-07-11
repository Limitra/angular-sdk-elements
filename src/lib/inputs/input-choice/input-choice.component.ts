import {Component, Input, OnInit} from '@angular/core';
import {InputExtend} from '../../extends/InputExtend';
import {SdkProviders} from '../../../../../sdk-core/src/lib/providers';

@Component({
  selector: 'lim-input-choice',
  templateUrl: './input-choice.component.html',
  styleUrls: ['./input-choice.component.css']
})
export class InputChoiceComponent extends InputExtend implements OnInit {
  constructor(protected providers: SdkProviders) { super(providers); }

  @Input() box: boolean;
  @Input() multiple: boolean;
  @Input() summary: string;
  @Input() description: string;
  @Input() potential: any;

  @Input() minlength: number;
  @Input() maxlength: number;

  @Input() column = 1;

  @Input() source: Array<any>;

  private selected: any;
  private selecteds: Array<any>;

  private focus: boolean;
  private enableDesc: boolean;

  ngOnInit() {
    this.potential = this.potential || true;
    this.source = this.source || [{ Summary: this.summary, Description: this.description, Value: this.potential }];
    this.enableDesc = this.source.filter(x => x.Description).length > 0;
    if (this.multiple) {
      this.selecteds = this.value || [];
    } else {
      this.selected = this.value;
    }
    this.init();
  }

  castValue(data: any): any {
    return data === 'true' ? true : (data === 'false' ? false : data);
  }

  forceValue() {
    const value = this.input.nativeElement.value;
    if (value) {
      if (this.multiple) {
        const values: Array<any> = [];
        value.split(',').forEach(data => { values.push(this.castValue(data)); });
        this.value = values;
      } else {
        this.value = this.castValue(value);
      }
    } else {
      if (this.multiple) {
        this.value = [];
      } else {
        this.value = this.source.length === 1 && typeof this.castValue(this.potential) === 'boolean' ? false : undefined;
      }
    }
    this.valueChange.emit(this.value);
  }

  validation(value: any) {
    if (this.multiple) {
      const values: Array<any> = value.split(',') || [];
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

    if (!this.castValue(value) && this.required) {
      this.addFormError('Required');
    } else {
      this.removeFormError('Required');
    }
  }

  setChoice(choice: any) {
    this.focus = true;
    if (this.multiple) {
      this.value = this.value || [];
      if (this.selecteds.includes(choice.Value)) {
        this.selecteds.splice(this.selecteds.indexOf(choice.Value), 1);
      } else {
        this.selecteds.push(choice.Value);
      }
      this.input.nativeElement.value = this.selecteds;
    } else {
      if (choice.Value == this.selected) {
        this.selected = this.castValue(choice.Value) === true ? false : '';
      } else {
        this.selected = choice.Value;
      }
      this.input.nativeElement.value = this.selected;
    }
    this.validate();
  }

  localizeReplace(message: string): string {
    message = this.providers.String.Replace(message, '[$MinLength]', this.minlength ? this.minlength.toString() : '');
    message = this.providers.String.Replace(message, '[$MaxLength]', this.maxlength ? this.maxlength.toString() : '');
    return message;
  }
}
