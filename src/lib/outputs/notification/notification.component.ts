import {Component, Input, OnInit} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';

declare let $: any;

@Component({
  selector: 'lim-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  @Input() autohide = false;
  @Input() delay = 5000;

  @Input() top: number;
  @Input() right: number;
  @Input() bottom: number;
  @Input() left: number;

  notification: any;
  name: string;
  icon: string;
  texts: any;

  constructor(private providers: SdkProviders) { }

  ngOnInit() {
    const lang = this.providers.Storage.Get('Localization_Lang');

    if (lang) {
      this.providers.Http.Get('assets/limitra/interface.' + lang + '.json').subscribe(response => {
        this.texts = response;
        this.init();
      });
    } else {
      this.texts = {
        NotifyDefaultTitle: 'Push Notification'
      };
      this.init();
    }

    this.name = this.providers.String.Generate(11);
  }

  push(notification: any = null) {
    this.notification = notification || this.notification;
    if (this.notification) {
      this.notification.Title = this.notification.Title || this.texts.NotifyDefaultTitle;
    }
    this.autohide = notification ? notification.AutoHide ||  this.autohide : this.autohide;
    this.delay = notification ? notification.Delay || this.delay : this.delay;
    this.top  = notification ? notification.Top || this.top : this.top;
    this.right  = notification ? notification.Right || this.right : this.right;
    this.bottom  = notification ? notification.Bottom || this.bottom : this.bottom;
    this.left  = notification ? notification.Left || this.left : this.left;
    this.init();
    if (this.notification) {
      $('.toast_' + this.name).toast('dispose');
      setTimeout(() => { $('.toast_' + this.name).toast('show'); });
    }
  }

  private init() {
    if (this.notification) {
      switch (this.notification.Status) {
        case 'info':
          this.icon = 'info-circle';
          break;
        case 'success':
          this.icon = 'check-circle';
          break;
        case 'danger':
          this.icon = 'exclamation-circle';
          break;
        case 'warning':
          this.icon = 'exclamation-triangle';
          break;
        default :
          this.icon = 'scroll';
          this.notification.Status = 'normal';
          break;
      }
    }
  }
}
