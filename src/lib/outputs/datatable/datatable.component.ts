import {Component, OnInit, Input, HostListener} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';

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
    this.settings.Filters = this.settings || [];
    const lang = this.providers.Storage.Get('Localization_Lang');

    if (lang) {
      this.providers.Http.Get('assets/limitra/datatable.' + lang + '.json').subscribe(response => {
        this.settings.TextSource = response;
        this.initTexts();
        this.initIntervals();
      });
    } else {
      this.settings.TextSource = {
        SearchPlaceHolder: 'Type to search from [$DataLength] data..',
        FilterTitle: 'Filter your data..',
        FilterAccept: 'Filter',
        FilterClose: 'Close',
        Disabled: 'Disabled',
        Seconds: 'seconds',
        Minutes: 'minutes',
        BulkChoice: 'Bulk Choice',
        AutoRefresh: 'Auto Refresh',
        FixedOperations: 'Fixed Operations'
      };
      this.initTexts();
      this.initIntervals();
    }
    this.initTable();
  }

  private initTable() {
    const api = this.providers.Storage.Get('API_Settings');
    if (this.settings && this.settings.Params && this.settings.Columns) {
      this.settings.Params.MaxLength = this.settings.Params.MaxLength || 500;
      this.settings.Params.Sort = this.settings.Params.Sort || [];
      this.settings.Params.Domain = this.settings.Params.Domain || (api ? api.Domain : undefined);

      this.resetColumns();
      const params: any = {};
      params.sort = this.settings.Params.Sort;
      params.length = this.settings.Params.Length || 10;
      params.page = this.settings.Params.Page || 1;
      if (this.settings.Params.Search) {
        params.search = this.settings.Params.Search;
      }
      this.settings.Params.Page = params.page;

      const qs = '?' + this.providers.Url.Serialize(params);
      this.settings.HasProcess = true;
      const source = this.settings.Params.Domain + this.providers.String.Replace('/' + this.settings.Params.Source, '//', '/');
      this.providers.Http.Get(source + qs).subscribe(response => {
        this.settings.Response = response;
        this.settings.Response.Data.Source = this.settings.Response.Data.Source.map(data => {
          data.PrimaryKey = this.valOfObj(data, {Field: this.settings.PrimaryKey}, false);
          data.Columns = [];
          this.settings.Columns.forEach(column => {
            const colObj: any = {Nested: []};
            this.pushColumnLen(column, column.Title.toString().length);
            colObj.Value = this.valOfObj(data, column);

            if (column.Nested) {
              column.Nested.forEach(nest => {
                const nestObj = {Title: nest.Title, Value: this.valOfObj(data, nest, false)};
                colObj.Nested.push(nestObj);
                this.pushColumnLen(column, (nest.Title.toString().length + nestObj.Value.length));
              });
            }

            data.Columns.push(colObj);
          });

          return data;
        });
        this.resizeColumns();
        this.initTexts();
        this.setBulkChoice(false);
        this.settings.HasProcess = false;
        this.reCalcPage();
      }, () => {
        this.settings.HasProcess = false;
      });
    }
  }

  private initTexts() {
    for (const text in this.settings.TextSource) {
      this.settings.Texts[text] = this.settings.TextSource[text]
        .replace('[$DataLength]', ((this.settings && this.settings.Response) ? this.settings.Response.Data.Length.toLocaleString() : 0))
        .replace('[$PageLength]', ((this.settings && this.settings.Response) ? this.settings.Response.Page.Length.toLocaleString() : 0));
    }
  }

  private initIntervals() {
    this.settings.Intervals = [
      {Interval: 0, Text: this.settings.TextSource.Disabled, Checked: true},
      {Interval: 10, Text: '10 ' + this.settings.TextSource.Seconds},
      {Interval: 30, Text: '30 ' + this.settings.TextSource.Seconds},
      {Interval: 60, Text: '60 ' + this.settings.TextSource.Seconds},
      {Interval: 300, Text: '5 ' + this.settings.TextSource.Minutes},
    ];
  }

  public validateSearch() {
    if (!this.settings.HasProcess) {
      if (this.settings && this.settings.Params) {
        this.settings.Params.Page = 1;
      }
      this.initTable();
    }
  }

  public validatePage() {
    if (!this.settings.HasProcess) {
      const len = parseInt(this.settings.Params.Page, 0);
      if (!this.settings.Params.Page || this.settings.Params.Page < 0 || !len) {
        this.settings.Params.Page = 1;
      }

      this.initTable();
    }
  }

  public validateLength() {
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

  private reCalcPage() {
    if (this.settings && this.settings.Response && this.settings.Params) {
      if (this.settings.Response.Page.Length === 0 && this.settings.Params.Page > 1) {
        this.settings.Params.Page--;
        this.validatePage();
      }
    }
  }

  private goToPage(page: number) {
    if (!this.settings.HasProcess) {
      this.settings.Params.Page = page;
      this.initTable();
    }
  }

  public nextPage() {
    if (!this.settings.HasProcess && this.settings.Response.Page.Number < this.settings.Response.Page.Count) {
      this.goToPage(this.settings.Response.Page.Number + 1);
    }
  }

  public privPage() {
    if (!this.settings.HasProcess && this.settings.Response.Page.Number > 1) {
      this.goToPage(this.settings.Response.Page.Number - 1);
    }
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

  public sortColumn(column: any) {
    if (this.settings && this.settings.Params && column) {
      column.Direction = column.Direction || '';
      column.Direction = column.Direction === 'asc' ? 'desc' : (column.Direction === 'desc' ? '' : 'asc');

      const current = this.settings.Params.Sort.filter(x => x.includes(column.Field))[0];
      if (current) {
        const index = this.settings.Params.Sort.indexOf(current);
        this.settings.Params.Sort.splice(index, 1);
      }

      if (column.Direction === 'asc' || column.Direction === 'desc') {
        this.settings.Params.Sort.push(column.Field + ',' + column.Direction);
      }
      this.initTable();
    }
  }

  @HostListener('window:resize', ['$event'])
  public resizeColumns(event: any = null) {
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

  @HostListener('window:keyup', ['$event'])
  public keyEvent(event: KeyboardEvent) {
    if (!this.settings.HasProcess) {
      switch (event.keyCode) {
        case 37:
          this.privPage();
          break;
        case 39:
          this.nextPage();
          break;
        case 107:
          this.settings.Params.Length++;
          this.validateLength();
          break;
        case 109:
          this.settings.Params.Length--;
          this.validateLength();
          break;
        case 27:
          this.setBulkChoice(null);
          break;
      }
    }
  }

  private valOfObj(obj: any, column: any, effect: boolean = true): any {
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
    if (effect) {
      this.pushColumnLen(column, (obj ? obj.toString().length : 0));
    }
    return obj;
  }

  public setToInterval(interval: any, $event: any) {
    $event.stopPropagation();
    if (this.settings && this.settings.Interval) {
      clearInterval(this.settings.Interval);
    }

    if (interval && this.settings) {
      this.settings.Intervals = this.settings.Intervals.map(x => {
        x.Checked = false;
        return x;
      });
      interval.Checked = true;
      if (interval.Interval > 0) {
        this.settings.Interval = setInterval(() => {
          this.initTable();
        }, (interval.Interval * 1000));
      }
    }
  }

  public setBulkChoice(enabled: boolean = null) {
    this.settings.BulkChoice = enabled === false ? enabled : (enabled || !this.settings.BulkChoice);
    if (this.settings && this.settings.Response && this.settings.Response.Data && this.settings.Response.Data.Source) {
      this.settings.Response.Data.Source = this.settings.Response.Data.Source.map(x => {
        x.Selected = false;
        return x;
      });
    }
  }

  public selectRow(row: any) {
    if (this.settings.BulkChoice) {
      if (row.Selected !== false && !row.Selected) {
        row.Selected = false;
      }

      row.Selected = !row.Selected;
    }
  }
}
