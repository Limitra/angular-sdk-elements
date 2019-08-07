import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'lim-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  constructor() { }

  @Input() copyright = 'Copyright ©';
  @Input() text: string;
  @Input() link: string;
  @Input() year: number;

  ngOnInit() {
  }

}
