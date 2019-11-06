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

  displayPrimaryControls = false;

  ngAfterViewInit() {
    this.primaryCam.nativeElement.style.visiblity = 'hidden';
  }

  startPrimaryCam(event) {
    navigator.mediaDevices.getUserMedia({
      video: {
        aspectRatio: 4 / 3
      }
    }).then(stream => {
      console.log(stream);
      this.appService.setupLocalStream(stream);
      this.primaryCam.nativeElement.srcObject = stream;
      this.displayPrimaryControls = true;
      this.primaryCamOverlay.nativeElement.remove();
      this.appService.remoteConnection.ontrack = track => {
        console.log(track);
      };
    });
  }
}
