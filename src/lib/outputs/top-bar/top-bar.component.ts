import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { SdkProviders } from '@limitra/sdk-core';

declare const $: any;

@Component({
  selector: 'lim-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit, OnDestroy {
  constructor(private providers: SdkProviders) { }

  @Input() profile: string;

  profileObj: any = { Links: [] };
  links: Array<any> = [];
  texts: any = {};

  document: any = {};

  private interval: any;

  ngOnInit() {
    this.document = document;
    this.profileObj.Links = this.providers.Storage.Get('Authentication_Settings', 'Profile') || [];

    const api = this.providers.Storage.Get('API_Settings');
    const lang = this.providers.Storage.Get('Localization_Settings', 'Language');

    if (lang) {
      this.providers.Http.Get('assets/locale/interface/' + lang + '.json').subscribe(response => {
        this.texts = response;
      });
    } else {
      this.texts = {
        LogOut: 'Log Out'
      };
    }

    if (this.profile && api && api.Domain) {
      const loop = () => {
        this.providers.Http.Get(api.Domain + '/' + this.profile).subscribe(response => {
          this.profileObj.DisplayName = response.DisplayName;
          if (api.File && api.File.Download && response.Picture) {
            this.profileObj.Picture = (api.File.Domain || api.Domain) + '/' + api.File.Download + response.Picture;
          }
        });
      };
      this.interval = setInterval(() => { loop(); }, 10000);
      loop();
    }
  }

  ngOnDestroy() {
    clearInterval(this.interval);
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
