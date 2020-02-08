import { CdkOverlayOrigin, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as AwaitQueue from 'awaitqueue';
import { Device } from 'mediasoup-client';
import { Socket } from 'ngx-socket-io';
import { from, fromEvent } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { ControlsComponent } from '../controls/controls.component';
import { TeacherService } from './teacher.service';
import { fabric } from 'fabric';
import { Options } from 'ng5-slider';

@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.scss'],
})
export class TeacherComponent implements OnInit, AfterViewInit {


  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private renderer: Renderer2,
    private socket: Socket,
    public overlay: Overlay,
  ) {
    this.device = new Device();
  }

  @ViewChild('teacherVideo', { static: false }) teacherVideo: ElementRef;
  @ViewChild('videos', { static: false }) videos: ElementRef;
  @ViewChild('canvas', { static: false }) canvasDiv: ElementRef;
  @ViewChild('canvasParent', { static: false }) canvasParent: ElementRef;
  canvas: fabric.Canvas;
  user: any;
  classId: any;
  device: any;
  classDetails: any;
  enablePlayBtn = false;
  sendTransport: any;
  rcvTransport: any;
  producer: any;
  audioProducer: any;
  studentsList = new Map<string, any>();
  context: CanvasRenderingContext2D;
  canvasPairs = [];
  studentQueue = new AwaitQueue();
  pencilColor = '#000';
  canvasBackgroundColor = 'white';
  imageFile: File = null;
  mode = 'draw';
  lineSize = 2;
  textBoxCurrX = 0;
  textBoxCurrY = 0;
  overlayRef: OverlayRef;
  @ViewChild(CdkOverlayOrigin, { static: false }) overlayOrigin: CdkOverlayOrigin;

  /**
   *Canvas Customizeation methods start
   */

  value = 1;
  options: Options = {
    floor: 1,
    ceil: 4
  };

  ngOnInit() {
    this.classId = this.route.snapshot.params.id;
    this.user = this.authService.retrieveUser();
    this.loadDevice();

  }

  ngAfterViewInit() {

    const canvasParentDiv = this.canvasParent.nativeElement as HTMLDivElement;
    this.canvasDiv.nativeElement.width = canvasParentDiv.offsetWidth;
    this.canvasDiv.nativeElement.height = canvasParentDiv.offsetHeight;
    this.canvas = new fabric.Canvas('canvas', {
      isDrawingMode: true,
      backgroundColor: this.canvasBackgroundColor
    });
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.width = this.value * 5;
    this.canvas.freeDrawingBrush.color = this.pencilColor;

    // this.setCanvasResize({ width: canvasParentDiv.offsetWidth.toString(), height: canvasParentDiv.offsetHeight.toString() });

    const strategy = this.overlay.position().flexibleConnectedTo(
      this.overlayOrigin.elementRef.nativeElement
    ).withPositions([{
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'bottom',
    }]).withPush(false);

    const config = new OverlayConfig({
      positionStrategy: strategy
    });
    this.overlayRef = this.overlay.create(config);

    fromEvent(
      (this.teacherVideo.nativeElement as HTMLVideoElement), 'mouseleave')
      .pipe(
        delay(3000)
      ).subscribe(event => {
        this.overlayRef.detach();
      });
  }

  // @HostListener('window:resize', ['$event'])
  // onResize(event) {
  //   const canvasParentDiv = this.canvasParent.nativeElement as HTMLDivElement;
  //   this.canvasDiv.nativeElement.width = canvasParentDiv.offsetWidth;
  //   this.canvasDiv.nativeElement.height = canvasParentDiv.offsetHeight;
  //   this.setCanvasResize({ width: canvasParentDiv.offsetWidth.toString(), height: canvasParentDiv.offsetHeight.toString() });
  // }


  private setCanvasResize({ width, height }: { width: string, height: string }) {
    console.log(width, height);
    if (this.canvas) {
      this.canvas.setDimensions({ width, height });
      this.canvas.renderAll();
    }
  }

  clearCanvas() {
    if (this.canvas) {
      this.canvas.clear();
      this.canvas.backgroundColor = this.canvasBackgroundColor;
      this.canvas.off('mouse:down');
      this.canvas.isDrawingMode = true;
    }
  }

  enterDrawingMode() {
    this.canvas.isDrawingMode = true;
    this.canvas.off('mouse:down');
  }

  canvasSetPencilSize() {
    this.canvas.freeDrawingBrush.width = this.value * 5;
  }

  addText() {
    this.canvas.isDrawingMode = false;
    this.canvas.on('mouse:down', (options) => {
      if (options.target == null) {
        const customText = new fabric.IText('', {
          top: options.e.offsetY,
          left: options.e.offsetX,
          fill: this.canvas.freeDrawingBrush.color
        });
        this.canvas.add(customText).setActiveObject(customText);
        customText.enterEditing();
      }
    });
  }

  changeTextColor() {
    this.canvas.freeDrawingBrush.color = this.pencilColor;
  }

  changeBackgroundColor() {
    this.canvas.backgroundColor = this.canvasBackgroundColor;
  }

  handleFileInput(files: FileList) {
    this.canvas.isDrawingMode = false;
    this.imageFile = files.item(0);
    fabric.Image.fromURL(URL.createObjectURL(this.imageFile), (img) => {
      this.canvas.add(img).setActiveObject(img);
    });
  }

  /**
   * Canvas Customizeation methods end
   */

  loadDevice() {
    this.teacherService.getCapabilities()
      .pipe(
        switchMap(data => {
          return from(this.device.load({ routerRtpCapabilities: data }));
        }),
        switchMap(() => {
          if (!this.device.canProduce('video')) {
            console.log(`Device cannot run video`);
          }
          return this.teacherService.getClassDetail(this.route.snapshot.params.id);
        })
      ).subscribe((classDetails: any) => {
        classDetails.state = 'paused';
        this.classDetails = classDetails;
        this.enablePlayBtn = true;
      });
  }

  async start() {
    this.enablePlayBtn = false;

    this.socket.emit('set-drawing-config', {
      classId: this.classId,
      lineSize: this.lineSize,
      pencilColor: this.pencilColor,
      canvasBackgroundColor: this.canvasBackgroundColor,
      mode: this.mode
    });

    this.teacherService.startClass(this.classDetails.id, this.device.rtpCapabilities)
      .subscribe(async data => {
        this.sendTransport = await this.device.createSendTransport(data);

        // Connect teacher transport
        this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          this.teacherService.connectProducerTransport(
            { dtlsParameters, classId: this.classDetails.id }
          ).subscribe(() => {
            callback();
          });
        });

        // Produce teacher transport
        this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          this.teacherService.produce({
            classId: this.classId,
            kind,
            rtpParameters,
          }).subscribe(({ id }) => {
            callback(id);
          });
        });

        this.sendTransport.on('connectionstatechange', (state) => {
          console.log(`Teacher producer connection state ${state}`);
        });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const track = stream.getVideoTracks()[0];
        const params = { track };
        this.classDetails.state = 'started';
        this.teacherVideo.nativeElement.srcObject = stream;
        this.teacherVideo.nativeElement.muted = true;
        this.producer = await this.sendTransport.produce(params);
        const audioTrack = stream.getAudioTracks()[0];

        const audioParams = { track: audioTrack };
        this.audioProducer = await this.sendTransport.produce(audioParams);
        this.studentQueue.push(async () => {
          await this.addStudentVideos();
        });
        this.studentQueue.push(() => {
          this.socket.emit('teacher-connect-with-exisisting-students', { classId: this.classId });
        });
      });
  }

  async addStudentVideos() {

    this.teacherService.studentDisconnected().subscribe((data: any) => {
      const { studentId } = data;
      if (this.studentsList.has(studentId)) {
        this.renderer.removeChild(this.videos.nativeElement, this.studentsList.get(studentId));
      }
    });
    this.socket.on('new-student-joined', async  data => {
      const { rtpCapabilities } = this.device;
      const { studentId } = data;
      this.studentQueue.push(() => {
        if (!this.rcvTransport) {
          this.socket.emit('create-teacher-consumer-transport', { classId: this.classId });
          this.socket.on('teacher-consumer-transport-created', transportData => {
            this.rcvTransport = this.device.createRecvTransport(transportData);
            this.rcvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
              this.socket.emit('connect-consumer-transport-teacher',
                {
                  dtlsParameters,
                  classId: this.classDetails.id,
                  userId: this.user.id,
                });

              this.socket.on('teacher-consumer-transport-connected', () => {
                callback();
              });
            });

            this.rcvTransport.on('connectionstatechange', (state) => {
              console.log(`Student rcv transport state:${state}`);
            });

            this.socket.emit('consume-student-video', {
              rtpCapabilities,
              classId: this.classDetails.id,
              userId: this.user.id,
              otherStudentId: studentId
            });
          });
        } else {
          this.socket.emit('consume-student-video', {
            rtpCapabilities,
            classId: this.classDetails.id,
            userId: this.user.id,
            otherStudentId: studentId
          });
        }
      });
    });

    this.socket.on('consumed-student', async (dataConsumer: any) => {
      const {
        producerId,
        id,
        kind,
        rtpParameters,
        otherStudentId,
        audioProducerId,
        audioId,
        audioKind,
        auidoRtpParameters
      } = dataConsumer;
      const codecOptions = {};

      const consumer = await this.rcvTransport.consume({
        id,
        producerId,
        kind,
        rtpParameters,
        codecOptions
      });
      const audioConsumer = await this.rcvTransport.consume({
        id: audioId,
        producerId: audioProducerId,
        kind: audioKind,
        rtpParameters: auidoRtpParameters,
        codecOptions
      });
      const stream = new MediaStream();
      stream.addTrack(consumer.track);
      stream.addTrack(audioConsumer.track);
      const video: HTMLVideoElement = this.renderer.createElement('video');
      video.autoplay = true;
      video.classList.add('student-video');
      if (this.studentsList.has(otherStudentId)) {
        const oldVid = this.studentsList.get(otherStudentId);
        this.renderer.removeChild(this.videos.nativeElement, oldVid);
        this.studentsList.delete(otherStudentId);
      }
      this.renderer.appendChild(this.videos.nativeElement, video);
      this.studentsList.set(otherStudentId, video);
      video.srcObject = stream;

      this.socket.emit('resume-student-video-for-teacher', {
        classId: this.classId,
        studentId: otherStudentId
      });
    });

  }


  showControls() {

    // this.overlayRef.detach();

    if (this.overlayRef.hasAttached()) {
      return;
    }

    const overlayInstance = this.overlayRef.attach(
      new ComponentPortal(ControlsComponent)
    );

    overlayInstance.instance.mute$.subscribe((muted: boolean) => {
      console.log(muted);
      (this.teacherVideo.nativeElement as HTMLVideoElement).muted = muted;
    });


    // this.overlayRef.backdropClick().subscribe(() => this.overlayRef.detach()); // Allows to close overlay by clicking around it
  }



  async endClass() {
    this.socket.emit('end-class', { classId: this.classId });
    this.socket.on('class-ended', () => {
      this.router.navigate(['/dashboard']);
    });
  }

}
