import { Component, OnInit } from '@angular/core';

declare const $: any;

@Component({
  selector: 'lim-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {
  constructor() { }

  document: any = {};
  ngOnInit() {
    this.document = document;
  }

  setToggle() {
    $('body').toggleClass('sidebar-toggled');
    $('.sidebar').toggleClass('toggled');
    if ($('.sidebar').hasClass('toggled')) {
      $('.sidebar .collapse').collapse('hide');
    }
  }
}
