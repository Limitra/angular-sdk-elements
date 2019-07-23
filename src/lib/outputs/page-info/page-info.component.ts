import {Component, Input, OnInit} from '@angular/core';
import {NavigationEnd, NavigationError, NavigationStart, Router, Routes} from '@angular/router';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-page-info',
  templateUrl: './page-info.component.html',
  styleUrls: ['./page-info.component.css']
})
export class PageInfoComponent implements OnInit {
  routes: Array<any> = [];
  history: Array<any> = [];
  page: any = {};
  document: any = {};
  historyFocus: boolean;

  @Input() pattern = ':id:param:path';
  @Input() prefix: string;

  constructor(private router: Router, private providers: SdkProviders) {
    this.document = document;
    router.events.subscribe((route: any) => {
      if (route instanceof NavigationStart) {
      }
      if (route instanceof NavigationEnd) {
        this.pushCurrentToHistory(this.routes);
        this.routes = [];
        this.detectRoutes(this.providers.Router.Get.config, route.urlAfterRedirects || route.url);
        this.setPageTitle(this.page);
      }
      if (route instanceof NavigationError) {
      }
    });
  }

  private setPageTitle(page: any) {
    if (page) {
      const settings = this.providers.Storage.Get('Page_Settings');
      let title = '';
      const recursive = (route: any) => {
        if (route.title) {
          title = route.title;
        } else if (route.parent) {
          recursive(route.parent);
        }
      };
      recursive(page);
      document.title = settings.Prefix ? (settings.Prefix + ' © ' + title) : title;
    }
  }

  private pushCurrentToHistory(routes: Array<any>) {
    const history: any = { name: '' };
    routes.forEach((route, index) => {
      history.name += route.name;
      history.path = route.path;
      if (index < this.routes.length - 1) {
        history.name += ' ▸ ';
      }
    });
    if (history.name && history.path) {
      history.name = (history.name.length > 30
          ? (history.name.substring(0, 15) + '...' + history.name.substring(history.name.length - 16, history.name.length))
          : history.name);

      this.history.unshift(history);
    }
  }

  private detectRoutes(routes: Routes, url: string, ownerId: number = null, parentTitle: string = null) {
    url = url && url[0] === '/' ? url.substring(1, url.length) : url;
    const partials = url.split('/');
    partials.push('');
    partials.forEach(partial => {
      let current = routes.filter(x => x.path === partial)[0];
      const parameters = this.pattern ? this.pattern.split(':') : [];
      parameters.forEach(parameter => {
        if (!current) {
          current = routes.filter(x => x.path === partial + '/:' + parameter)[0];
        }
      });
      if (current) {
        const currentId = current.path ? this.routes.length + 1 : null;
        if (currentId) {
          const page: any = {
            id: currentId, name: current.data ? current.data.name : '',
            title: current.data && current.data.title ? current.data.title : parentTitle, path: current.path, parentId: ownerId
          };
          this.routes.push(page);
          page.path = this.parentPathMap(currentId);
          page.parent = this.routes.filter(x => x.id === page.parentId)[0];
          this.page = page;
        }
        if (current.children && current.children.length > 0) {
          this.detectRoutes(current.children, url.replace(partial, ''), currentId, (current.data ? current.data.title : parentTitle));
        }
      }
    });
  }

  private parentPathMap(routeId: number): string {
    let path = '';
    const recursive = (recursiveId: number) => {
      const route = this.routes.filter(x => x.id === recursiveId)[0];
      if (route) {
        path = '/' + route.path + path;
        if (route.parentId) {
          recursive(route.parentId);
        }
      }
    };
    recursive(routeId);
    return path;
  }

  ngOnInit() {
  }
}
