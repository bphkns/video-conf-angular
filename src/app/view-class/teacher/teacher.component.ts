import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { TeacherService } from './teacher.service';
import { switchMap, switchMapTo, map } from 'rxjs/operators';
import { from, of, Observable } from 'rxjs';
import { Device } from 'mediasoup-client';
@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.scss']
})
export class TeacherComponent implements OnInit {

  @ViewChild('teacherVideo', { static: false }) teacherVideo: ElementRef;
  @ViewChild('videos', { static: false }) videos: ElementRef;


  user: any;
  classId: any;
  device: any;
  classDetails: any;
  enablePlayBtn = false;
  sendTransport: any;
  rcvTransport: any;
  producer: any;
  studentsList = new Map<string, any>();
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private renderer: Renderer2
  ) {
    this.device = new Device();
  }

  ngOnInit() {
    this.classId = this.route.snapshot.params.id;
    this.user = this.authService.retrieveUser();
    this.loadDevice();
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

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const track = stream.getVideoTracks()[0];
        const params = { track };
        this.classDetails.state = 'started';
        this.teacherVideo.nativeElement.srcObject = stream;
        this.producer = await this.sendTransport.produce(params);
        await this.addStudentVideos();
      });
  }

  async addStudentVideos() {

    this.teacherService.studentDisconnected().subscribe((data: any) => {
      const { studentId } = data;
      if (this.studentsList.has(studentId)) {
        this.renderer.removeChild(this.videos.nativeElement, this.studentsList.get(studentId));
      }
    });

    this.teacherService.newStudentJoined()
      .subscribe(async (data: any) => {
        const { studentId } = data;
        if (!this.rcvTransport) {
          this.teacherService.createConsumerTransportForTeacher(
            { classId: this.classId }
          ).subscribe((transportData: any) => {
            this.rcvTransport = this.device.createRecvTransport(transportData);
            this.rcvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
              this.teacherService.connectStudentTeacherConsumerTransport(
                {
                  dtlsParameters,
                  classId: this.classDetails.id,
                  userId: this.user.id,
                }).subscribe(async () => {
                  callback();
                });
            });

            this.rcvTransport.on('connectionstatechange', (state) => {
              console.log(`Student rcv transport state:${state}`);
            });
          });

          const { rtpCapabilities } = this.device;
          this.teacherService.consumeStudentVideo({
            rtpCapabilities,
            classId: this.classDetails.id,
            userId: this.user.id,
            otherStudentId: studentId
          }).subscribe(async (dataConsumer: any) => {
            const {
              producerId,
              id,
              kind,
              rtpParameters,
              otherStudentId
            } = dataConsumer;
            const codecOptions = {};
            const consumer = await this.rcvTransport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
              codecOptions
            });
            const stream = new MediaStream();
            stream.addTrack(consumer.track);
            const video: HTMLVideoElement = this.renderer.createElement('video');
            video.autoplay = true;
            video.classList.add('student-video');
            this.renderer.appendChild(this.videos.nativeElement, video);
            this.studentsList.set(otherStudentId, video);
            video.srcObject = stream;

            this.teacherService.resumeStudentVideo({
              classId: this.classId,
              studentId: otherStudentId
            }).subscribe(() => {
              console.log(`Student Added`);
            });
          });
        }

        if (this.rcvTransport) {
          const { rtpCapabilities } = this.device;
          this.teacherService.consumeStudentVideoAfter({
            rtpCapabilities,
            classId: this.classDetails.id,
            userId: this.user.id,
            otherStudentId: studentId
          });
        }
      });
  }

  async endClass() { }
}
