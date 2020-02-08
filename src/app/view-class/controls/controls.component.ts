import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss']
})
export class ControlsComponent implements OnInit {

  muted = false;
  muteSub = new Subject();
  mute$ = this.muteSub.asObservable();

  constructor() { }

  ngOnInit() {
  }

  mute() {
    this.muted = !this.muted;
    this.muteSub.next(this.muted);
  }

}
