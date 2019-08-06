import {Component, HostBinding, OnInit, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'lim-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TemplateComponent implements OnInit {
  constructor() { }

  @HostBinding('id')
  get hostId(): string {
    return 'template-origin';
  }

  ngOnInit() {
  }

}
