import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';
import {FormComponent} from '../form/form.component';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'lim-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit, AfterViewInit {
  @Input() model: any = {};
  @Input() email: boolean;
  @Input() source: string;
  @Input() background: string;
  @Input() icon: string;
  @Input() brand: string;
  @Input() copyright = 'Copyright ©';
  @Input() author: string;
  @Input() link: string;
  @Input() logo: string;
  @Input() year: number = new Date().getFullYear();
  @Input() theme = 'light';
  @Input() bgform = '#fff';
  @Input() bglayer: string;

  @Input() type = 'login';

  @Input() register: string;
  @Input() forgot: string;
  @Input() login: string;

  @Input() inputs: Array<any> = [];
  @Input() endpoint: string;

  public height: number;
  public state: any;
  public textSource: any = {};

  @ViewChild('form', {static: false}) form: FormComponent;
  @ViewChild('loginCard', {static: false}) loginCard: ElementRef;
  @ViewChild('submit', {static: false}) submit: ElementRef;

  public registerLink: string;
  public forgotLink: string;
  public loginLink: string;

  constructor(private providers: SdkProviders, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.initLinks();
    const lang = this.providers.Storage.Get('Localization_Settings', 'Language');
    if (lang) {
      this.providers.Http.Get('assets/locale/interface/' + lang + '.json').subscribe(response => {
        this.textSource = response;
        this.ngAfterViewInit();
      });
    } else {
      this.textSource = {
        UserName: 'Username',
        Password: 'Password',
        NewPassword: 'New Password',
        KeepSession: 'Keep it',
        LogIn: 'Log In',
        Register: 'Register',
        Forgot: 'Forgot',
        Recover: 'Recover',
        LogInTitle: 'Account Log In',
        RegisterTitle: 'Account Register',
        ForgotTitle: 'Forgot Password',
        RecoverTitle: 'Account Recover',
        LoginLink: 'Want to login ?',
        AlreadyLink: 'Already have an account ?',
        RegisterLink: 'Don\'t have an account yet ?',
        ForgotLink: 'Having access problems ?'
      };
      this.ngAfterViewInit();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.onResize();
    });
    if (this.endpoint) {
      this.route.queryParams.subscribe(params => {
        const key = params.key;
        this.model.Token = key;
        const api = this.providers.Storage.Get('API_Settings');
        const jwt = this.providers.Storage.Get('Authentication_Settings');
        if (jwt) {
          const domain = (api ? api.Domain : undefined);
          if (domain) {
            this.providers.Http.Post(domain + this.endpoint, {Token: key}).subscribe(response => {
              this.form.notification.push({
                Status: response.Status,
                Title: response.Title,
                Message: response.Message
              });
            }, () => {
              this.providers.Router.Navigate(jwt.Login);
            });
          }
        }
      });
    }
  }

  onStateChange(event: any) {
    const jwt = this.providers.Storage.Get('Authentication_Settings');
    if (event) {
      this.state = event.State;
      if (event.Response && event.Response.Status === 200 && event.Response.Text) {
        if (this.type === 'login') {
          const expire = new Date().getTime() + (((jwt ? jwt.TimeOut : undefined) || 15) * 60 * 1000);
          this.providers.Storage.Set('Authentication_Settings', event.Response.Text, 'Token');
          this.providers.Storage.Set('Authentication_Settings', jwt ? jwt.TimeOut : undefined, 'TimeOut');
          this.providers.Storage.Set('Authentication_Settings', this.model.KeepSession, 'KeepSession');
          this.providers.Storage.Set('Authentication_Settings', expire, 'Expire');

          setTimeout(() => {
            if (jwt && jwt.Home) {
              this.providers.Router.Navigate(jwt.Home);
            }
          }, (jwt ? jwt.Delay : undefined) || 2000);
        }

        this.state.Enabled = false;
        this.state.Spinner = true;
      }
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  onSubmit(event: KeyboardEvent) {
    this.submit.nativeElement.click();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any = null) {
    const cardHeight = this.loginCard.nativeElement.offsetHeight;
    let elmHeight = window.innerHeight - cardHeight;
    const range = 20;
    if (elmHeight < range) {
      elmHeight = range;
    }

    if (cardHeight + range > window.innerHeight) {
      this.height = cardHeight + range;
    } else {
      this.height = window.innerHeight;
    }
    this.loginCard.nativeElement.style.cssText = 'margin-top: ' + (elmHeight) / 2 + 'px !important;' + 'margin-bottom: ' + (elmHeight) / 2 + 'px !important';
  }

  initLinks() {
    if (this.register && this.register.includes('http')) {
      this.registerLink = this.register;
    }

    if (this.forgot && this.forgot.includes('http')) {
      this.forgotLink = this.forgot;
    }

    if (this.login && this.login.includes('http')) {
      this.loginLink = this.login;
    }
  }
}
