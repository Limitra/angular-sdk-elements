import {Component, Input, OnInit} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @Input() model: any = {};
  @Input() source: string;
  @Input() background: string;
  @Input() icon: string;
  @Input() brand: string;
  @Input() copyright = 'Copyright ©';
  @Input() author: string;
  @Input() link: string;
  @Input() year: number = new Date().getFullYear();

  public textSource: any = {};

  constructor(private providers: SdkProviders) { }

  ngOnInit() {
    const lang = this.providers.Storage.Get('Localization_Lang');
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
}
