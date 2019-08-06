import {Component, HostBinding, OnInit} from '@angular/core';

@Component({
  selector: 'lim-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.css']
})
export class WrapperComponent implements OnInit {
  constructor() { }

  @HostBinding('class')
  get hostClasses(): string {
    return [
      'd-flex',
      'flex-column'
    ].join(' ');
  }

  ngOnInit() {
  }

}
