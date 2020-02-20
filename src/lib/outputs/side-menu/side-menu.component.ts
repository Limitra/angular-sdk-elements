import {Component, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import { SdkProviders } from '@limitra/sdk-core';
import {SideMenuTypes} from '../../definitions/side-menu-types';

declare const $: any;

@Component({
  selector: 'lim-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {
  @Input() source: string;
  @Input() icon: string;
  @Input() brand: string;
  @Input() note: string;

  @Input() amblem: string;
  @Input() logo: string;

  @Input() color = 'dark';
  @Input() theme = 'dark';

  types = SideMenuTypes;
  menus: Array<any> = [];
  window: any;

  constructor(private providers: SdkProviders) {
    this.window = window;
  }

  ngOnInit() {
    const api = this.providers.Storage.Get('API_Settings');
    if (api && api.Domain && this.source) {
      this.providers.Http.Get(api.Domain + this.source).subscribe(response => {
        this.menus = response;
      });
    }
    this.removeToggled();
  }

  setToggle() {
    $('body').toggleClass('sidebar-toggled');
    $('.sidebar').toggleClass('toggled');
    if ($('.sidebar').hasClass('toggled')) {
      $('.sidebar .collapse').collapse('hide');
    }
  }

  setScroll(event: any) {
    if ($(window).width() > 768) {
      const e0 = event.originalEvent;
      if (e0) {
        const delta = e0.wheelDelta || -e0.detail;
        event.currentTarget.scrollTop += (delta < 0 ? 1 : -1) * 30;
      }
      event.preventDefault();
    }
  }

  goToTop(event: any) {
    const $anchor = $(event.currentTarget);
    $('html, body').stop().animate({
      scrollTop: ($($anchor.attr('href')).offset().top)
    }, 1000, 'easeInOutExpo');
    event.preventDefault();
  }

  parentIsActive(menu: any): boolean {
    if (menu && menu.Children && menu.Children.length > 0) {
      return menu.Children.filter(x => this.window.location.pathname.includes(x.Route)).length > 0;
    } else {
      return false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if ($(window).width() < 768) {
      $('.sidebar .collapse').collapse('hide');
    }
  }

  @HostListener('document:scroll', ['$event'])
  onScroll(event: any) {
    const scrollDistance = $(event.currentTarget).scrollTop();
    if (scrollDistance > 100) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }
  }

  private removeToggled() {
    if ($(window).width() < 768) {
      if (!$('.sidebar').hasClass('toggled')) {
        $('.sidebar').toggleClass('toggled');
      }
    }
  }
}
