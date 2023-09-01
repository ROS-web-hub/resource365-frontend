import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'booking_mis_web';

  ngOnInit(): void {
      Date.prototype.toString = function(){
        return this.toISOString();
      }
  }
}
