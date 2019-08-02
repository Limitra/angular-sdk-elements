import {Component, OnInit, Input, HostListener, ViewChild, ElementRef, ViewChildren, QueryList} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';
import {CardComponent} from '../card/card.component';
import {NotificationComponent} from '../notification/notification.component';

@Component({
  selector: 'lim-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.css']
})
export class DatatableComponent implements OnInit {
  @Input() settings: any = {};
  @Input() card: CardComponent;

  @ViewChildren('row') rows: QueryList<ElementRef>;
  @ViewChild('notification', { static: false }) notification: NotificationComponent;

  private texts: any;
  private api: any;

  contextMenu: Array<any> = [];

  constructor(private providers: SdkProviders) {
  }

  ngOnInit() {
    this.api = this.providers.Storage.Get('API_Settings');
    this.settings = this.settings || {};
    this.settings.Texts = {};
    this.settings.Filters = this.settings || [];
    this.settings.RowRedirect = this.settings.RowRedirect || this.settings.RowEdit;
    const lang = this.providers.Storage.Get('Localization_Lang');

    if (lang) {
      this.providers.Http.Get('assets/locale/datatable/' + lang + '.json').subscribe(response => {
        this.settings.TextSource = response;
        this.initTexts();
        this.initIntervals();
      });
      this.providers.Http.Get('assets/locale/interface/' + lang + '.json').subscribe(response => {
        this.texts = response;
        this.initButtons();
      });
    } else {
      this.texts = {
        TableNewRow: 'Add New',
        TableRowSelect: 'Select',
        TableRowEdit: 'Edit',
        TableRowDelete: 'Delete'
      };
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
      this.initButtons();
      this.initTexts();
      this.initIntervals();
    }
    this.initTable();
  }

  public openMenu(data: any, event: any) {
    if (this.settings && this.settings.Response && this.settings.Response.Data
        && this.settings.Response.Data.Source && this.settings.Response.Data.Source.length > 0) {
      this.contextMenu = [];
      this.settings.Response.Data.Source = this.settings.Response.Data.Source.map(x => {
        x.ContextMenu = { Focus: false }
        return x;
      });

      this.contextMenu.push({
        Icon: 'fa fa-hand-pointer', Text: this.texts.TableRowSelect, Action: (data) => {
          this.settings.BulkChoice = true;
          this.selectRow(data);
        }
      });
      if (this.settings.RowEdit) {
        this.contextMenu.push({
          Icon: 'fa fa-edit',
          Text: this.texts.TableRowEdit,
          Link: this.settings.RowEdit
        });
      }

      if (this.settings.Params && this.settings.Params.Delete) {
        this.contextMenu.push({
          Icon: 'fa fa-times', Text: this.texts.TableRowDelete, Action: (data) => {
            const selecteds = this.settings.Response.Data.Source.filter(x => x.Selected).map(x => x[this.settings.PrimaryKey]);
            if (selecteds.length === 0) {
              selecteds.push(data[this.settings.PrimaryKey]);
            }
            const params: any = {
              ids: selecteds
            };
            const qs = '?' + this.providers.Url.Serialize(params);
            const source = this.settings.Params.Domain + this.providers.String.Replace('/' + this.settings.Params.Delete, '//', '/');

            const errCall = (error: any) => {
              this.settings.HasProcess = false;
              let notification: any = {};
              if (error.response && error.response.Notification) {
                notification = error.response.Notification;
              } else {
                notification = {
                  Status: 'danger',
                  Title: error.status,
                  Message: error.message
                };
              }

              this.notification.push(notification);
            };

            this.providers.Http.Delete(source + qs, errCall).subscribe(response => {
              this.settings.HasProcess = false;
              this.initTable();
              if (response.Notification) {
                this.notification.push(response.Notification);
              }
            });
          }
        });
      }

      if (this.settings && this.settings.ContextMenu && this.settings.ContextMenu.length > 0) {
        this.settings.ContextMenu.forEach(menu => {
          this.contextMenu.push(menu);
        });
      }

      data.ContextMenu = {
        Focus: true,
        PositionX: event.clientX,
        PositionY: event.clientY
      };
    }
    return false;
  }

  private getStoredParams() {
    return this.providers.Storage.Get('DT_' + this.settings.Definition) || {};
  }

  private setStoredParams(key: string, value: string) {
    const stored = this.getStoredParams();
    stored[key] = value;
    this.providers.Storage.Set('DT_' + this.settings.Definition, stored);
  }

  private initTable() {
    if (this.settings && this.settings.Params && this.settings.Columns) {
      const stored = this.getStoredParams();
      this.settings.Params.MaxLength = this.settings.Params.MaxLength || 500;
      this.settings.Params.Length = stored.Length || (this.settings.Params.Length || 10);
      this.settings.Params.Page = stored.Page || (this.settings.Params.Page || 1);
      this.settings.Params.Sort = stored.Sort || (this.settings.Params.Sort || []);
      this.settings.Params.Search = stored.Search || this.settings.Params.Search;
      this.settings.Params.Domain = this.settings.Params.Domain || (this.api ? this.api.Domain : undefined);

      this.resetColumns();
      const params: any = {};
      params.sort = this.settings.Params.Sort;
      params.length = this.settings.Params.Length;
      params.page = this.settings.Params.Page;
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
            const nowValue = this.valOfObj(data, column);
            colObj.Position = column.Position;
            if (column.Render) {
              colObj.Value = column.Render(nowValue);
            } else {
              colObj.Value = nowValue;
            }
            if (column.Badge) {
              const badge = column.Badge(colObj.Value);
              colObj.Badge = {
                Status: badge.Status === 'auto' ? (colObj.Value === true ? 'success'
                  : (colObj.Value !== false ? 'warning' : 'danger')) : badge.Status,
                Value: badge.Value,
                Icon: badge.Icon
              };
            }

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

  private initButtons() {
    this.card.button.Primary = [];
    const buttons = this.settings.NewButtons || [
      { Icon: 'fa fa-plus', Text: this.texts.TableNewRow, Link: this.settings.NewRow }
    ];
    buttons.forEach(button => {
      this.card.button.Primary.push(button);
    });
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
        this.setStoredParams('Page', this.settings.Params.Page);
        this.setStoredParams('Search', this.settings.Params.Search);
      }
      this.initTable();
    }
  }

  public validatePage() {
    if (!this.settings.HasProcess) {
      const len = parseInt(this.settings.Params.Page, 0);
      if (!this.settings.Params.Page || this.settings.Params.Page < 0 || !len) {
        this.settings.Params.Page = 1;
        this.setStoredParams('Page', this.settings.Params.Page);
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

      if (this.settings.Params.Length) {
        this.setStoredParams('Length', this.settings.Params.Length);
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
      this.setStoredParams('Page', this.settings.Params.Page);
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
      const stored = this.getStoredParams();
      this.settings.Columns = this.settings.Columns.map(column => {
        const strCol = stored && stored.Sort ? (stored.Sort.filter(x => x.split(',')[0] === column.Field)[0]) : undefined;
        const nwCol = column;
        nwCol.MaxChar = undefined;
        nwCol.Width = undefined;
        nwCol.Direction = strCol ? strCol.split(',')[1] : undefined;
        return nwCol;
      });
    }
  }

  public sortColumn(column: any) {
    if (this.settings && this.settings.Params && column) {
      column.Direction = column.Direction || '';
      column.Direction = column.Direction === 'asc' ? 'desc' : (column.Direction === 'desc' ? '' : 'asc');

      const current = this.settings.Params.Sort.filter(x => x.split(',')[0] === column.Field)[0];
      if (current) {
        const index = this.settings.Params.Sort.indexOf(current);
        this.settings.Params.Sort.splice(index, 1);
      }

      if (column.Direction === 'asc' || column.Direction === 'desc') {
        this.settings.Params.Sort.push(column.Field + ',' + column.Direction);
      }

      if (this.settings.Params.Sort) {
        this.setStoredParams('Sort', this.settings.Params.Sort);
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
      if (this.settings.Response && this.settings.Response.Data && this.settings.Response.Data.Source) {
        setTimeout(() => {
          this.rows.forEach((row: any, index: number) => {
            this.settings.Response.Data.Source[index].Width = row.nativeElement.offsetWidth;
            this.settings.Response.Data.Source[index].Height = row.nativeElement.offsetHeight;
          });
        });
      }
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
          this.setBulkChoice(false);
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
