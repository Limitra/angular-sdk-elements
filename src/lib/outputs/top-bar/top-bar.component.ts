import {Component, Input, OnInit} from '@angular/core';
import { SdkProviders } from '@limitra/sdk-core';

declare const $: any;

@Component({
  selector: 'lim-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {
  constructor(private providers: SdkProviders) { }

  @Input() profile: string;

  myProfile: any = {};
  texts: any = {};

  document: any = {};
  ngOnInit() {
    this.document = document;
    this.myProfile.Path = this.providers.Storage.Get('Authentication_Settings', 'Profile');

    const api = this.providers.Storage.Get('API_Settings');
    const lang = this.providers.Storage.Get('Localization_Settings', 'Language');

    if (lang) {
      this.providers.Http.Get('assets/locale/interface/' + lang + '.json').subscribe(response => {
        this.texts = response;
      });
    } else {
      this.texts = {
        LogOut: 'Log Out',
        Profile: 'Profile'
      };
    }

    if (this.profile && api && api.Domain) {
      this.providers.Http.Get(api.Domain + '/' + this.profile).subscribe(response => {
        this.myProfile.FullName = response.FullName;
        this.myProfile.Image = response.Image;
      });
    }
  }

  logOut() {
    const login = this.providers.Storage.Get('Authentication_Settings', 'Login');
    this.providers.Storage.Set('Authentication_Settings', undefined, 'Token');

    if (login) {
      this.providers.Router.Navigate(login);
    }
  }

  setToggle() {
    $('body').toggleClass('sidebar-toggled');
    $('.sidebar').toggleClass('toggled');
    if ($('.sidebar').hasClass('toggled')) {
      $('.sidebar .collapse').collapse('hide');
    }
  }
}
