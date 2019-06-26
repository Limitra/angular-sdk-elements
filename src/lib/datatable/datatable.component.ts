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

  private initTexts() {
    for(const text in this.settings.TextSource) {
      this.settings.Texts[text] = this.settings.TextSource[text]
        .replace('[$DataLength]', ((this.settings && this.settings.Response) ? this.settings.Response.Data.Length.toLocaleString() : 0))
        .replace('[$PageLength]', ((this.settings && this.settings.Response) ? this.settings.Response.Page.Length.toLocaleString() : 0));
    }
  }

  private validatePage() {
    const len = parseInt(this.settings.Params.Page, 0);
    if (!this.settings.Params.Page || this.settings.Params.Page < 0 || !len) {
      this.settings.Params.Page = 1;
    }

    this.initTable();
  }

  private validateLength() {
    const len = parseInt(this.settings.Params.Length, 0);
    if (!this.settings.Params.Length || this.settings.Params.Length < 0 || !len) {
      this.settings.Params.Length = 1;
    }

    this.initTable();
  }

  private initTable() {
    if (this.settings && this.settings.Params && this.settings.Columns) {
      this.resetColumns();
      const params: any = {};
      params.length = this.settings.Params.Length || 10;
      params.page = this.settings.Params.Page || 1;
      this.settings.Params.Page = params.page;

      const qs = '?' + this.providers.Url.Serialize(params);
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
        this.initPages();
        this.initTexts();
      });
    }
  }

  private valOfObj(obj: any, column: any): any {
    const field = column.Field || '';
    if (field.includes('.')) {
      const partials = field.split('.');
      partials.forEach(partial => {
        obj = obj[partial];
      });
    } else {
      obj = obj[field];
    }
    this.pushColumnLen(column, obj.toString().length);
    return obj;
  }

  private goToPage(page: number) {
    this.settings.Params.Page = page;
    this.initTable();
  }

  private nextPage() {
    if (this.settings.Response.Page.Number < this.settings.Response.Page.Count) {
      this.goToPage(this.settings.Response.Page.Number + 1);
    }
  }

  private privPage() {
    if (this.settings.Response.Page.Number > 1) {
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

  private initPages() {
    this.settings.Pages = [];
    if (this.settings.Response.Page.Number !== 2 ? true : this.settings.Response.Page.Number === this.settings.Response.Page.Count) {
      this.addPage(1, 1, this.settings.Response.Page.Number);
    }

    if (this.settings.Response.Page.Number - 1 > 2) {
      this.addPage(this.settings.Response.Page.Number - 2, 1, this.settings.Response.Page.Number, '...');
    }

    if (this.settings.Response.Page.Number > 1 && this.settings.Response.Page.Number < this.settings.Response.Page.Count - 1) {
      this.addPage(this.settings.Response.Page.Number - 1, 3, this.settings.Response.Page.Number);
    } else if (this.settings.Response.Page.Number > 0 && this.settings.Response.Page.Number < 3 && this.settings.Response.Page.Count > 3) {
      this.addPage(this.settings.Response.Page.Number + 1, 1, this.settings.Response.Page.Number);
    } else if (this.settings.Response.Page.Count > 3) {
      this.addPage(this.settings.Response.Page.Number - 1, 2, this.settings.Response.Page.Number);
    }

    if (this.settings.Response.Page.Number + 1 < this.settings.Response.Page.Count - 1) {
      this.addPage(this.settings.Response.Page.Number + 2, 1, this.settings.Response.Page.Number, '...');
    }

    if (this.settings.Response.Page.Count === 3) {
      if (this.settings.Response.Page.Number > 1) {
        this.addPage(this.settings.Response.Page.Number - 1, 2, this.settings.Response.Page.Number);
      } else {
        this.addPage(this.settings.Response.Page.Number + 1, 1, this.settings.Response.Page.Number);
      }
    }

    if (this.settings.Response.Page.Number !== this.settings.Response.Page.Count
      || (this.settings.Response.Page.Count < 3 && this.settings.Response.Page.Count !== 1)) {
      this.addPage(this.settings.Response.Page.Count, 1, this.settings.Response.Page.Number);
    }
  }

  private addPage(num: number, length: number, page: number, text: string = null) {
    for (let p = num; p <= num + (length - 1); p++) {
      this.settings.Pages.push({Text: text || p, Number: p, Active: p === page});
    }
  }
}
