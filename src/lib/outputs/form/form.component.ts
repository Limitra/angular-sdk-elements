import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {CardComponent} from '../card/card.component';
import {SdkProviders} from '@limitra/sdk-core';
import {NotificationComponent} from "../notification/notification.component";

@Component({
  selector: 'lim-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  @Input() card: CardComponent;
  @Input() domain: string;
  @Input() source: string;
  @Input() model: any;

  texts: any;
  hasProgress: boolean;
  isValid: boolean;
  errors: Array<any>;

  @ViewChild('notification', { static: false }) notification: NotificationComponent;

  constructor(private providers: SdkProviders) { }

  ngOnInit() {
    const api = this.providers.Storage.Get('API_Settings');
    const lang = this.providers.Storage.Get('Localization_Lang');
    this.domain = this.domain || (api ? api.Domain : undefined);

    this.texts = {};

    if (lang) {
      this.providers.Http.Get('assets/limitra/interface.' + lang + '.json').subscribe(response => {
        this.texts = response;
        this.initButton();
      });
    } else {
      this.texts = {
        FormSave: 'Save'
      };
      this.initButton();
    }
  }

  onFormChange() {
    this.isValid = this.errors.filter(x => !x.Solved).length === 0;
    this.initButton();
  }

  private initButton() {
    this.card.button.Primary.splice(0, 1);
    const button = {
      Icon: 'fa fa-save', Text: this.texts.FormSave || '',
      Enabled: this.isValid && !this.hasProgress, Spinner: this.hasProgress,
      Action: () => { this.post(); }
    };
    this.card.button.Primary.unshift(button);
  }

  private post() {
    if (this.isValid && !this.hasProgress) {
      const noProgress = () => {
        setTimeout(() => { this.hasProgress = false; this.initButton(); }, 500);
      };
      const errCall = (error: any) => {
        noProgress();
        let notification: any = {};
        if (error.response && error.response.Notification) {
          notification = error.response.Notification;
        } else {
          notification = {
            Status: 'danger',
            Title: error.status,
            Message: error.message
          };
        }

        this.notification.push(notification);
      }

      const source = this.domain + this.providers.String.Replace(this.source, '//', '/');
      this.hasProgress = true;
      this.initButton();
      this.providers.Http.Post(source, this.model, errCall).subscribe(response => {
        noProgress();
        if (response.Notification) {
          this.notification.push(response.Notification);
        }
      });
    }
  }
}
