import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';
import {FormComponent} from '../form/form.component';

@Component({
  selector: 'lim-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @Input() model: any = {};
  @Input() email: boolean;
  @Input() source: string;
  @Input() background: string;
  @Input() icon: string;
  @Input() brand: string;
  @Input() copyright = 'Copyright ©';
  @Input() author: string;
  @Input() link: string;
  @Input() year: number = new Date().getFullYear();

  public state: any;
  public textSource: any = {};

  @ViewChild('form', { static: false }) form: FormComponent;

  constructor(private providers: SdkProviders) { }

  ngOnInit() {
    const lang = this.providers.Storage.Get('Localization_Settings', 'Language');
    if (lang) {
      this.providers.Http.Get('assets/locale/interface/' + lang + '.json').subscribe(response => {
        this.textSource = response;
      });
    } else {
      this.textSource = {
        UserName: 'Username',
        Password: 'Password',
        KeepSession: 'Keep it',
        LoginAction: 'Log In'
      };
    }
  }

  onStateChange(event: any) {
    const jwt = this.providers.Storage.Get('Authentication_Settings');
    if (event) {
      this.state = event.State;
      if (event.Response && event.Response.Status === 200 && event.Response.Text) {
        const expire = new Date().getTime() + (((jwt ? jwt.TimeOut : undefined) || 15) * 60 * 1000);
        this.providers.Storage.Set('Authentication_Settings', {
          Token: event.Response.Text,
          TimeOut: jwt ? jwt.TimeOut : undefined,
          KeepSession: this.model.KeepSession,
          Expire: expire
        });
        this.state.Enabled = false;
        this.state.Spinner = true;
        setTimeout(() => {
          this.providers.Router.Navigate('/');
        }, 2000);
      }
    }
  }
}
