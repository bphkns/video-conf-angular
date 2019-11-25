import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'video-conf';

  constructor(private appService: AppService) { }

  @ViewChild('overlayPrimary', { static: false }) primaryCamOverlay: ElementRef;
  @ViewChild('primaryVideo', { static: false }) primaryCam: ElementRef;
  @ViewChild('remoteVideo', { static: false }) remoteCam: ElementRef;
  form = {
    type: 'local',
    username: '',
    password: '',
    rememberMe: false
  };
  displayPrimaryControls = false;

  ngAfterViewInit() {
  }

  startPrimaryCam(event) {
  }
}
