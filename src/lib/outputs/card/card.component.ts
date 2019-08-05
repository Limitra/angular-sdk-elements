import {Component, Input, OnInit} from '@angular/core';
import {SdkProviders} from '@limitra/sdk-core';

@Component({
  selector: 'lim-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  @Input() icon: string;
  @Input() title: string;
  @Input() button: any = { Primary: [], Secondary: [] };

  texts: any;
  collapsed: boolean;

  private lang: string;

  constructor(private providers: SdkProviders) {
  }

  ngOnInit() {
    this.lang = this.lang || this.providers.Storage.Get('Localization_Lang');
    this.button = this.button || {};

    this.texts = {};

    if (this.lang) {
      this.providers.Http.Get('assets/locale/interface/' + this.lang + '.json').subscribe(response => {
        this.texts = response;
      });
    } else {
      this.texts = {
        CardOptions: 'Card Options',
        CardCollapse: 'Collapse Card',
        CardExpand: 'Expand Card'
      };
    }
  }
}
