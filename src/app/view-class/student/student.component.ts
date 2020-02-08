import { AfterViewInit, Component, ComponentFactoryResolver, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Device } from 'mediasoup-client';
import { Socket } from 'ngx-socket-io';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { StudentService } from './student.service';
@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit, AfterViewInit {

  @ViewChild('teacherVideo', { static: false }) teacherVideo: ElementRef;
  @ViewChild('videos', { static: false }) videos: ElementRef;
  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  @ViewChild('canvasParent', { static: false }) canvasParent: ElementRef;

  user: any;
  classId: any;
  device: any;
  classDetails: any;
  rcvTransport: any;
  sendTransport: any;
  producer: any;
  enablePlayBtn = false;
  otherStudentsList = new Map();
  context: CanvasRenderingContext2D;
  audioProducer: any;
  selfVideoStarted = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private studentService: StudentService,
    private renderer: Renderer2,
    private socket: Socket,
    private resolver: ComponentFactoryResolver
  ) {
    this.device = new Device();
  }

  ngOnInit() {
    this.classId = this.route.snapshot.params.id;
    this.user = this.authService.retrieveUser();
    this.loadDevice();

    this.socket.on('teacher-started-class', () => {
      if (!this.enablePlayBtn) {
        this.enablePlayBtn = true;
        this.classDetails.state = 'started';
      }
    });
  }

  ngAfterViewInit() {
  }


  loadDevice() {
    this.studentService.getCapabilities()
      .pipe(
        switchMap(data => {
          return from(this.device.load({ routerRtpCapabilities: data }));
        }),
        switchMap(() => {
          if (!this.device.canProduce('video')) {
            console.log(`Device cannot run video`);
          }
          return this.studentService.getClassDetail(this.route.snapshot.params.id);
        })
      ).subscribe(async (data: any) => {
        this.classDetails = data.classDetails;
        this.classDetails.state = data.state;
        if (data.state === 'started') {
          this.enablePlayBtn = true;
        }

        if (data.state === 'ended') {
          this.router.navigate(['/dashboard']);
        }

        if (data.state !== 'started') {
          this.socket.emit('listenting-teacher', { classId: this.classId });
        }
      });
  }

  async rcvTeacherVideo() {
    this.enablePlayBtn = false;

    this.socket.once('class-ended', () => {
      this.router.navigate(['/dashboard']);
    });

    this.studentService.createStudentConsumer({ classId: this.classId, userId: this.user.id })
      .subscribe(data => {
        this.rcvTransport = this.device.createRecvTransport(data);
        this.rcvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          this.studentService.connectStudentConsumerTransport(
            {
              dtlsParameters,
              classId: this.classDetails.id,
              userId: this.user.id
            }).subscribe(async () => {
              callback();
            });
        });

        this.rcvTransport.on('connectionstatechange', (state) => {
          console.log(`Student rcv transport state:${state}`);
        });

        const { rtpCapabilities } = this.device;
        this.studentService.consumeTeacherVideo({
          rtpCapabilities,
          classId: this.classDetails.id,
          userId: this.user.id
        }).subscribe(async (dataConsumer: any) => {
          const {
            producerId,
            id,
            kind,
            rtpParameters,
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
          this.teacherVideo.nativeElement.srcObject = stream;
          this.studentService.resumeTeacherVideo(
            {
              classId: this.classId,
              userId: this.user.id
            }
          ).subscribe(async () => {
            if (!this.selfVideoStarted) {
              this.selfVideoStarted = true;
              await this.startSelfVideo();
            }
          });
        });
      });

    this.socket.on('teacher-temporary-disconnected', () => {
      this.teacherVideo.nativeElement.srcObject = null;
      this.classDetails.state = 'paused';
    });

    this.socket.on('teacher-connect-again', () => {
      this.classDetails.state = 'started';
      this.studentService.consumeTeacherVideo({
        rtpCapabilities: this.device.rtpCapabilities,
        classId: this.classDetails.id,
        userId: this.user.id
      });
    });

  }

  startSelfVideo() {
    this.studentService.startSelfVideo(this.classDetails.id, this.user.id, this.device.rtpCapabilities)
      .subscribe(async data => {
        this.sendTransport = await this.device.createSendTransport(data);

        // Connect teacher transport
        this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          this.studentService.connectProducerTransport(
            { dtlsParameters, classId: this.classDetails.id, userId: this.user.id }
          ).subscribe(() => {
            callback();
          });
        });

        // Produce Student transport
        this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          this.studentService.produceStudentvideo({
            classId: this.classId,
            kind,
            rtpParameters,
            userId: this.user.id
          }).subscribe(({ id }) => {
            callback(id);
          });
        });

        this.sendTransport.on('connectionstatechange', (state) => {
          console.log(`Student producer connection state ${state}`);
        });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const track = stream.getVideoTracks()[0];
        const params = { track };
        const audioTrack = stream.getAudioTracks()[0];
        const audioParams = { track: audioTrack };
        const video: HTMLVideoElement = this.renderer.createElement('video');
        video.autoplay = true;
        video.style.width = '100%';
        video.classList.add('student-video');
        video.muted = true;
        this.renderer.appendChild(this.videos.nativeElement, video);
        video.srcObject = stream;
        this.producer = await this.sendTransport.produce(params);
        this.audioProducer = await this.sendTransport.produce(audioParams);
        await this.getAlreadyJoinedStudents();
        await this.newOtherStudent();
      });
  }

  async getAlreadyJoinedStudents() {

    this.studentService.studentDisconnected().subscribe((data: any) => {
      const { studentId } = data;
      const video = this.otherStudentsList.get(studentId);
      if (video) {
        this.renderer.removeChild(this.videos.nativeElement, video);
      }
    });

    this.socket.emit('get-already-joined-students', { classId: this.classId, userId: this.user.id });

    this.socket.on('got-already-joined-students', studentIds => {
      studentIds.forEach(studentId => {
        this.socket.emit('consume-other-student-video', {
          classId: this.classId,
          userId: this.user.id,
          otherStudentId: studentId,
          rtpCapabilities: this.device.rtpCapabilities
        });
      });
    });

    this.socket.on('other-student-video-consumed', async (dataConsumer: any) => {
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
      this.renderer.appendChild(this.videos.nativeElement, video);
      this.otherStudentsList.set(otherStudentId, video);
      video.srcObject = stream;

      this.socket.emit('resume-other-student-video', { classId: this.classId, userId: this.user.id, otherStudentId });
    });

  }


  async newOtherStudent() {
    this.socket.on('new-other-student', (data: any) => {
      const { studentId } = data;
      this.socket.emit('consume-other-student-video', {
        classId: this.classId,
        userId: this.user.id,
        otherStudentId: studentId,
        rtpCapabilities: this.device.rtpCapabilities
      });
    });
  }
}
