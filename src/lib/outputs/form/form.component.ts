import {Component, Input, OnInit, OnDestroy, Output, ViewChild, EventEmitter} from '@angular/core';
import {CardComponent} from '../card/card.component';
import {SdkProviders} from '@limitra/sdk-core';
import {NotificationComponent} from '../notification/notification.component';

@Component({
  selector: 'lim-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit, OnDestroy {
  @Input() card: CardComponent;
  @Input() domain: string;
  @Input() source: string;
  @Input() model: any;
  @Input() route: any;

  @Input() get: any = 'get';
  @Input() put: any = 'put';
  @Input() post: any = 'post';

  @Output('') modelChange = new EventEmitter();

  texts: any;
  hasProgress: boolean;
  isValid: boolean;
  errors: Array<any>;

  @ViewChild('notification', {static: false}) notification: NotificationComponent;

  private subscribe: any;

  constructor(private providers: SdkProviders) {
  }

  ngOnDestroy() {
    this.subscribe.unsubscribe();
  }

  ngOnInit() {
    if (this.route && this.model) {
      this.subscribe = this.route.params.subscribe(param => {
        this.model.ID = param.id;
      });
    }

    // This storage keys is pinned for all elements.
    const api = this.providers.Storage.Get('API_Settings');
    const lang = this.providers.Storage.Get('Localization_Lang');
    this.domain = this.domain || (api ? api.Domain : undefined);

    this.texts = {};

    if (lang) {
      this.providers.Http.Get('assets/locale/interface/' + lang + '.json').subscribe(response => {
        this.texts = response;
        this.init();
      });
    } else {
      this.texts = {
        FormSave: 'Save'
      };
      this.init();
    }
  }

  onFormChange() {
    this.isValid = this.errors.filter(x => !x.Solved).length === 0;
    this.initButton();
  }

  private init() {
    this.initButton();
    if (this.get) {
      this.getAction();
    }
  }

  private initButton() {
    this.card.button.Primary.splice(0, 1);
    const button = {
      Icon: 'fa fa-save', Text: this.texts.FormSave || '',
      Enabled: this.isValid && !this.hasProgress, Spinner: this.hasProgress,
      Action: () => {
        if (this.model.ID) {
          this.putAction();
        } else {
          this.postAction();
        }
      }
    };
    this.card.button.Primary.unshift(button);
  }

  private noProgress = () => {
    setTimeout(() => {
      this.hasProgress = false;
      this.initButton();
    }, 500);
  }

  private errCall = (error: any) => {
    this.noProgress();
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

  private getAction() {
    if (this.model && this.model.ID) {
      const source = this.domain + this.providers.String.Replace(this.source
        + (this.get ? '/' + this.get + '/' + this.model.ID : ''), '//', '/');
      this.hasProgress = true;
      this.initButton();
      this.providers.Http.Get(source, this.errCall).subscribe(response => {
        for (let prop in response) {
          this.model[prop] = response[prop];
        }

        this.noProgress();
        this.modelChange.emit(this.model);
        if (response.Notification) {
          this.notification.push(response.Notification);
        }
      });
    }
  }

  private putAction() {
    if (this.isValid && !this.hasProgress) {
      const source = this.domain + this.providers.String.Replace(this.source
        + (this.put ? '/' + this.put + '/' + this.model.ID : ''), '//', '/');
      this.hasProgress = true;
      this.initButton();
      this.providers.Http.Put(source, this.model, this.errCall).subscribe(response => {
        this.noProgress();
        if (response.Notification) {
          this.notification.push(response.Notification);
        }
      });
    }
  }

  private postAction() {
    if (this.isValid && !this.hasProgress) {
      const source = this.domain + this.providers.String.Replace(this.source
        + (this.post ? '/' + this.post + '/' + this.model.ID : ''), '//', '/');
      this.hasProgress = true;
      this.initButton();
      this.providers.Http.Post(source, this.model, this.errCall).subscribe(response => {
        this.noProgress();
        if (response.Notification) {
          this.notification.push(response.Notification);
        }
      });
    }
  }
}
