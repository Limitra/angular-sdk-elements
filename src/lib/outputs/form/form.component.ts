import {Component, Input, OnInit, OnDestroy, Output, ViewChild, EventEmitter} from '@angular/core';
import {CardComponent} from '../card/card.component';
import {SdkProviders} from '@limitra/sdk-core';
import {NotificationComponent} from '../notification/notification.component';
import {ActivatedRoute} from '@angular/router';

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

  @Input() get: any = 'get';
  @Input() put: any = 'put';
  @Input() post: any = 'post';

  @Output() modelChange = new EventEmitter();
  @Output() modelLoad = new EventEmitter();
  @Output() stateChange = new EventEmitter();
  @Output() modelInit = new EventEmitter();

  @Output() postCompleted = new EventEmitter();
  @Output() putCompleted = new EventEmitter();

  @Output() change = new EventEmitter();

  public response: any;

  modelLoaded = false;

  texts: any;
  hasProgress: boolean;
  isValid: boolean;
  errors: Array<any>;

  @ViewChild('notification', {static: false}) notification: NotificationComponent;

  private subscribe: any;
  private changeSub: any;
  private changeTimeout: any;

  constructor(private route: ActivatedRoute, private providers: SdkProviders) {
  }

  ngOnDestroy() {
    this.subscribe.unsubscribe();
    this.changeSub.unsubscribe();
  }

  ngOnInit() {
    this.changeSub = this.change.subscribe(form => {
      clearTimeout(this.changeTimeout);

      this.errors = form.errors;
      this.isValid = this.errors.filter(x => !x.Solved).length === 0;

      if (this.isValid) {
        this.changeTimeout = setTimeout(() => {
          this.initButton();
        }, 500);
      } else {
        this.initButton();
      }
    });

    if (this.route && this.model) {
      this.subscribe = this.route.params.subscribe(param => {
        if (param.id) {
          this.model.ID = param.id;
        }
      });
    }

    // This storage keys is pinned for all elements.
    const api = this.providers.Storage.Get('API_Settings');
    const lang = this.providers.Storage.Get('Localization_Settings', 'Language');
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

  private init() {
    this.initButton();
    if (this.get) {
      this.getAction();
    }
  }

  private initButton() {
    const state: any = {
      Enabled: this.isValid && !this.hasProgress, Spinner: this.hasProgress,
      Action: () => {
        if (this.model.ID || this.model.ID === 0) {
          this.putAction();
        } else {
          this.postAction();
        }
      }
    };
    if (this.card) {
      state.Icon = 'fa fa-save';
      state.Text = this.texts.FormSave || '',
      this.card.button.Primary.splice(0, 1);
      this.card.button.Primary.unshift(state);
    } else {
      this.stateChange.emit({ State: state, Response: this.response });
    }
  }

  private noProgress = () => {
    setTimeout(() => {
      this.hasProgress = false;
      this.initButton();
    }, 500);
  };

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
  };

  private getAction() {
    if (this.model && this.source && (this.model.ID || this.model.ID === 0)) {
      const source = this.domain + this.providers.String.Replace(this.source
        + (this.get ? '/' + this.get + '/' + this.model.ID : ''), '//', '/');
      this.hasProgress = true;
      this.initButton();
      this.providers.Http.Get(source, this.errCall).subscribe(response => {
        for (let prop in response) {
          this.model[prop] = response[prop];
        }

        this.noProgress();
        if (response.Notification) {
          this.notification.push(response.Notification);
        }
        setTimeout(() => {
          this.modelLoaded = true;
          this.modelChange.emit(this.model);
          this.modelLoad.emit(this.model);
          this.modelInit.emit(true);
        }, 500);
      });
    } else {
      this.modelInit.emit(true);
      this.modelLoaded = true;
    }
  }

  private putAction() {
    if (this.isValid && !this.hasProgress) {
      const source = this.domain + this.providers.String.Replace(this.source
        + (this.put ? '/' + this.put : ''), '//', '/');
      this.hasProgress = true;
      this.initButton();
      this.providers.Http.Put(source, this.model, this.errCall).subscribe(response => {
        this.noProgress();
        this.response = response;
        if (response.Notification) {
          this.notification.push(response.Notification);
        }
        this.putCompleted.emit(response);
      });
    }
  }

  private postAction() {
    if (this.isValid && !this.hasProgress) {
      const source = this.domain + this.providers.String.Replace(this.source
        + (this.post ? '/' + this.post : ''), '//', '/');
      this.hasProgress = true;
      this.initButton();
      this.providers.Http.Post(source, this.model, this.errCall).subscribe(response => {
        this.noProgress();
        this.response = response;
        if (response.Notification) {
          this.notification.push(response.Notification);
        }
        this.postCompleted.emit(response);
      });
    }
  }
}
