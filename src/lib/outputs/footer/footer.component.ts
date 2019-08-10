import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'lim-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  constructor() { }

  @Input() copyright = 'Copyright ©';
  @Input() author: string;
  @Input() link: string;
  @Input() year: number = new Date().getFullYear();

  ngOnInit() {
  }

}
