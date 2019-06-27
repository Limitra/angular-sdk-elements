import {Component, OnInit, Input, HostListener, ViewChild, ElementRef} from '@angular/core';
import {SdkProviders} from '../../../../sdk-core/src/lib/providers';


@Component({
  selector: 'lim-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.css']
})
export class DatatableComponent implements OnInit {
  @Input() settings: any = {};

  constructor(private providers: SdkProviders) {
  }

  ngOnInit() {
    this.settings.Texts = {};

    if (this.settings.Params.Lang) {
      this.providers.Http.Get('assets/limitra/datatable.' + this.settings.Params.Lang + '.json').subscribe(response => {
        this.settings.TextSource = response;
        this.initTexts();
      });
    } else {
      this.settings.TextSource = {
        SearchPlaceHolder: 'Type to search from [$DataLength] data..',
        SearchButton: 'Search..'
      };
    }
    this.initTexts();
    this.initTable();
  }

  @HostListener('window:keyup', ['$event'])
  private keyEvent(event: KeyboardEvent) {
    if (!this.settings.HasProcess) {
      switch (event.keyCode) {
        case 37: this.privPage(); break;
        case 38: this.settings.Params.Length++; this.validateLength(); break;
        case 39: this.nextPage(); break;
        case 40: this.settings.Params.Length--; this.validateLength(); break;
      }
    }
  }

  private initTexts() {
    for(const text in this.settings.TextSource) {
      this.settings.Texts[text] = this.settings.TextSource[text]
        .replace('[$DataLength]', ((this.settings && this.settings.Response) ? this.settings.Response.Data.Length.toLocaleString() : 0))
        .replace('[$PageLength]', ((this.settings && this.settings.Response) ? this.settings.Response.Page.Length.toLocaleString() : 0));
    }
  }

  private validateSearch() {
    if (!this.settings.HasProcess) {
      if (this.settings && this.settings.Params) { this.settings.Params.Page = 1; }
      this.initTable();
    }
  }

  private validatePage() {
    if (!this.settings.HasProcess) {
      const len = parseInt(this.settings.Params.Page, 0);
      if (!this.settings.Params.Page || this.settings.Params.Page < 0 || !len) {
        this.settings.Params.Page = 1;
      }

      this.initTable();
    }
  }

  private validateLength() {
    if (this.settings && !this.settings.HasProcess) {
      const len = parseInt(this.settings.Params.Length, 0);
      if (!this.settings.Params.Length || this.settings.Params.Length < 0 || !len) {
        this.settings.Params.Length = 1;
      }

      if (this.settings.Params.MaxLength <= this.settings.Params.Length) {
        this.settings.Params.Length = this.settings.Params.MaxLength;
      }

      this.initTable();
    }
  }

  private initTable() {
    if (this.settings && this.settings.Params && this.settings.Columns) {
      this.settings.Params.MaxLength = this.settings.Params.MaxLength || 500;

      this.resetColumns();
      const params: any = {};
      params.length = this.settings.Params.Length || 10;
      params.page = this.settings.Params.Page || 1;
      params.sort = this.settings.Params.Sort || [];
      params.search = this.settings.Params.Search || '';
      this.settings.Params.Page = params.page;

      const qs = '?' + this.providers.Url.Serialize(params);
      this.settings.HasProcess = true;
      this.providers.Http.Get(this.settings.Params.Source + qs).subscribe(response => {
        this.settings.Response = response;
        this.settings.Response.Data.Source = this.settings.Response.Data.Source.map(data => {
          data.Columns = [];
          this.settings.Columns.forEach(column => {
            this.pushColumnLen(column, column.Title.toString().length);
            data.Columns.push(this.valOfObj(data, column));
          });

          return data;
        });
        this.resizeColumns();
        this.initTexts();

        this.settings.HasProcess = false;
        this.reCalcPage();
      }, () => { this.settings.HasProcess = false; });
    }
  }

  private valOfObj(obj: any, column: any): any {
    const field = column.Field || '';
    if (field.includes('.')) {
      const partials = field.split('.');
      partials.forEach(partial => {
        if (obj) {
          obj = obj[partial];
        }
      });
    } else {
      obj = obj[field];
    }
    this.pushColumnLen(column, (obj ? obj.toString().length : 0));
    return obj;
  }

  private goToPage(page: number) {
    if (!this.settings.HasProcess) {
      this.settings.Params.Page = page;
      this.initTable();
    }
  }

  private nextPage() {
    if (!this.settings.HasProcess && this.settings.Response.Page.Number < this.settings.Response.Page.Count) {
      this.goToPage(this.settings.Response.Page.Number + 1);
    }
  }

  private privPage() {
    if (!this.settings.HasProcess && this.settings.Response.Page.Number > 1) {
      this.goToPage(this.settings.Response.Page.Number - 1);
    }
  }

  private setChecked(obj: any, $event) {
    $event.stopPropagation();
    obj.Checked = !obj.Checked;
  }

  private pushColumnLen(column: any, len: number) {
    if (!column.MaxChar || column.MaxChar < len) {
      column.MaxChar = len;
    }
  }

  private resetColumns() {
    if (this.settings && this.settings.Columns) {
      this.settings.Columns = this.settings.Columns.map(column => {
        const nwCol = column;
        nwCol.MaxChar = undefined;
        nwCol.Width = undefined;
        return nwCol;
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  private resizeColumns() {
    if (this.settings && this.settings.Columns) {
      const totalChar = this.settings.Columns.reduce((sum, current) => sum + current.MaxChar, 0);
      this.settings.Columns.forEach(col => {
        const width = col.MaxChar * 100 / totalChar;
        if (width < 3) {
          col.Width = 3;
        } else if (this.settings.Columns.length >= 4 && width > 50) {
          col.Width = 50;
        } else if (this.settings.Columns.length === 3 && width > 65) {
          col.Width = 65;
        } else if (this.settings.Columns.length === 2 && width > 80) {
          col.Width = 80;
        } else {
          col.Width = width;
        }
      });
    }
  }

  private reCalcPage() {
    if (this.settings && this.settings.Response && this.settings.Params) {
      if (this.settings.Response.Page.Length === 0 && this.settings.Params.Page > 1) {
        this.settings.Params.Page--;
        this.validatePage();
      }
    }
  }

  private addPage(num: number, length: number, page: number, text: string = null) {
    for (let p = num; p <= num + (length - 1); p++) {
      this.settings.Pages.push({Text: text || p, Number: p, Active: p === page});
    }
  }
}
