import { Component, ElementRef, OnInit, Renderer2, ViewChild, AfterViewInit, HostListener, ViewContainerRef, ComponentFactoryResolver, ComponentRef, NgZone, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Device } from 'mediasoup-client';
import { from, fromEvent, BehaviorSubject } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { TeacherService } from './teacher.service';
import { Socket } from 'ngx-socket-io';
import * as AwaitQueue from 'awaitqueue';
import { TextboxComponent } from '../textbox/textbox.component';
import { CdkOverlayOrigin, OverlayRef, Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ControlsComponent } from '../controls/controls.component';
import { fabric } from 'fabric';
import { EventHandlerService } from './event-handler.service';
import { CustomFabricObject } from './models';

@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.scss'],
})
export class TeacherComponent implements OnInit, AfterViewInit {

  @ViewChild('teacherVideo', { static: false }) teacherVideo: ElementRef;
  @ViewChild('videos', { static: false }) videos: ElementRef;
  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  @ViewChild('canvasParent', { static: false }) canvasParent: ElementRef;
  @ViewChild('textboxContainer', { read: ViewContainerRef, static: false }) textBoxParent: ViewContainerRef;
  // canvas: any;
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
  textBoxMap = new Map<string, ComponentRef<TextboxComponent>>();
  textBoxCurrX = 0;
  textBoxCurrY = 0;
  overlayRef: OverlayRef;
  @ViewChild(CdkOverlayOrigin, { static: false }) overlayOrigin: CdkOverlayOrigin;


  @Input() set imageDataURL(v: string) {
    if (v) {
      this.eventHandler.imageDataUrl = v;
    }
  }


  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private renderer: Renderer2,
    private socket: Socket,
    private resolver: ComponentFactoryResolver,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    private eventHandler: EventHandlerService,
    private ngZone: NgZone
  ) {
    this.device = new Device();
  }

  ngOnInit() {
    this.classId = this.route.snapshot.params.id;
    this.user = this.authService.retrieveUser();
    this.loadDevice();
  }

  ngAfterViewInit() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;

    canvasEl.width = this.canvasParent.nativeElement.offsetWidth;
    canvasEl.height = this.canvasParent.nativeElement.offsetHeight - 10;
    canvasEl.style.background = this.canvasBackgroundColor;
    this.context = canvasEl.getContext('2d');
    this.context.lineWidth = this.lineSize;
    this.context.lineCap = 'round';
    this.context.strokeStyle = this.pencilColor;
    // this.eventHandler.addBGImageSrcToCanvas();
    // this.ngZone.runOutsideAngular(() => {
    //   if (this.eventHandler.canvas) {
    //     this.eventHandler.canvas.dispose();
    //   }
    //   this.canvas = new fabric.Canvas('canvas', {
    //     selection: false,
    //     preserveObjectStacking: true,
    //   });
    //   this.eventHandler.canvas = this.canvas;
    //   this.eventHandler.extendToObjectWithId();
    //   fabric.Object.prototype.objectCaching = false;
    //   this.addEventListeners();
    // });

  }


  changePencilSize(size) {
    this.lineSize = size;
    this.context.lineWidth = size;
    this.mode = 'draw';
    this.socket.emit('set-drawing-config', {
      classId: this.classId,
      lineSize: this.lineSize,
      pencilColor: this.pencilColor,
      canvasBackgroundColor: this.canvasBackgroundColor,
      mode: this.mode
    });
  }

  changeColor(value: string) {
    this.pencilColor = value;
    this.mode = 'draw';
    this.context.strokeStyle = this.pencilColor;
    this.socket.emit('set-drawing-config', {
      classId: this.classId,
      lineSize: this.lineSize,
      pencilColor: this.pencilColor,
      canvasBackgroundColor: this.canvasBackgroundColor,
      mode: this.mode
    });
  }

  changeBackgroundColor(value: string) {
    this.canvasBackgroundColor = value;
    this.canvas.nativeElement.style.background = this.canvasBackgroundColor;
    this.socket.emit('set-drawing-config', {
      classId: this.classId,
      lineSize: this.lineSize,
      pencilColor: this.pencilColor,
      canvasBackgroundColor: this.canvasBackgroundColor,
      mode: this.mode
    });
  }

  eraseDrawing() {
    this.mode = 'erase';
    this.socket.emit('set-drawing-config', {
      classId: this.classId,
      lineSize: this.lineSize,
      pencilColor: this.pencilColor,
      canvasBackgroundColor: this.canvasBackgroundColor,
      mode: this.mode
    });
  }

  addTextBox() {
    const textboxFactory = this.resolver.resolveComponentFactory(TextboxComponent);
    const textbox = this.textBoxParent.createComponent(textboxFactory);
    const textBoxId = Math.random().toString(36).substring(7);
    this.textBoxMap.set(textBoxId, textbox);
    textbox.instance.color = this.pencilColor;
    textbox.instance.id = textBoxId;
    textbox.instance.position = { x: this.textBoxCurrX, y: this.textBoxCurrY };
    this.socket.emit('new-textbox-created', {
      classId: this.classId, id: textBoxId,
      position: {
        x: this.textBoxCurrX,
        y: this.textBoxCurrY
      }
    });

    textbox.instance.pressedKey$.subscribe((data: { key: string, id: string }) => {
      this.socket.emit('text-entered-in-textbox', { ...data });
    });

    if (
      this.textBoxCurrX < this.canvasParent.nativeElement.offsetHeight
      && this.textBoxCurrY < this.canvasParent.nativeElement.offsetHeight - 150
    ) {
      this.textBoxCurrY += 100;
    } else if (
      this.textBoxCurrX < this.canvasParent.nativeElement.offsetHeight - 150
      &&
      this.textBoxCurrY > this.canvasParent.nativeElement.offsetHeight - 150
    ) {
      this.textBoxCurrX += 100;
      this.textBoxCurrY = 10;
    }
  }

  wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }


  handleFileInput(files: FileList) {
    this.imageFile = files.item(0);
    const image = new Image();
    image.src = URL.createObjectURL(this.imageFile);
    image.onload = () => {
      const canvas = this.context.canvas;
      image.width = this.canvasParent.nativeElement.offsetWidth;
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      // get the top left position of the image
      const x = (canvas.width / 2) - (image.width / 2) * scale;
      const y = (canvas.height / 2) - (image.height / 2) * scale;
      this.context.drawImage(image, x, y, image.width * scale, image.height * scale);
    };
  }
  private captureEvents(canvasEl: HTMLCanvasElement) {
    // this will capture all mousedown events from the canvas element
    fromEvent(canvasEl, 'mousedown')
      .pipe(
        switchMap((e) => {
          // after a mouse down, we'll record all mouse moves
          return fromEvent(canvasEl, 'mousemove')
            .pipe(
              // we'll stop (and unsubscribe) once the user releases the mouse
              // this will trigger a 'mouseup' event
              takeUntil(fromEvent(canvasEl, 'mouseup')),
              // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
              takeUntil(fromEvent(canvasEl, 'mouseleave')),
              // pairwise lets us get the previous value to draw a line from
              // the previous point to the current point
              pairwise()
            );
        })
      )
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect();

        // previous and current position with the offset
        const prevPos = {
          x: res[0].clientX - rect.left,
          y: res[0].clientY - rect.top
        };

        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top
        };

        // this method we'll implement soon to do the actual drawing
        this.drawOnCanvas(prevPos, currentPos, this.mode);
      });
  }

  // @HostListener('window:resize')
  // onWindowResize() {
  //   const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;

  //   canvasEl.width = this.canvasParent.nativeElement.offsetWidth - 40;
  //   canvasEl.height = this.canvasParent.nativeElement.offsetHeight - 40;

  //   this.canvasPairs.forEach(pair => {
  //     this.drawOnCanvas(pair.prevPos, pair.currentPos);
  //   });
  // }

  private drawOnCanvas(prevPos: { x: number, y: number }, currentPos: { x: number, y: number }, mode) {
    if (!this.context) { return; }

    this.canvasPairs.push({ prevPos, currentPos });
    this.context.beginPath();

    if (prevPos && mode === 'draw') {
      this.context.globalCompositeOperation = 'source-over';
      this.context.moveTo(prevPos.x, prevPos.y); // from
      this.context.lineTo(currentPos.x, currentPos.y);
      this.context.stroke();
    }

    if (prevPos && mode === 'erase') {
      this.context.globalCompositeOperation = 'destination-out';
      this.context.arc(prevPos.x, prevPos.y, 8, 0, Math.PI * 2, false);
      this.context.stroke();
    }

    this.teacherService.sendDrawing({ prevPos, currentPos, classId: this.classId });
  }


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
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;

    this.socket.emit('set-drawing-config', {
      classId: this.classId,
      lineSize: this.lineSize,
      pencilColor: this.pencilColor,
      canvasBackgroundColor: this.canvasBackgroundColor,
      mode: this.mode
    });

    this.captureEvents(canvasEl);

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
    console.log(this.overlayOrigin.elementRef.nativeElement);
    const strategy = this.overlay.position().flexibleConnectedTo(
      this.overlayOrigin.elementRef.nativeElement
    ).withPositions([{
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'bottom'
    }]).withPush(false);

    const config = new OverlayConfig({
      positionStrategy: strategy
    });
    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(
      new ComponentPortal(ControlsComponent)
    );

    this.overlayRef.backdropClick().subscribe(() => this.overlayRef.detach()); // Allows to close overlay by clicking around it
  }


  hideControls() {
    this.overlayRef.dispose();
  }


  async endClass() {
    console.log(`t`);
    this.socket.emit('end-class', { classId: this.classId });
    this.socket.on('class-ended', () => {
      this.router.navigate(['/dashboard']);
    });
  }

  clearDrawing() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.canvasPairs = [];
    this.context.clearRect(0, 0, canvasEl.width, canvasEl.height);
    this.teacherService.clearDrawing({ classId: this.classId });
  }


}
