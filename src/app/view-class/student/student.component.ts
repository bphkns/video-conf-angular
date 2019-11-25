import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService } from './student.service';
import { Device } from 'mediasoup-client';
import { switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit {

  @ViewChild('teacherVideo', { static: false }) teacherVideo: ElementRef;
  @ViewChild('videos', { static: false }) videos: ElementRef;

  user: any;
  classId: any;
  device: any;
  classDetails: any;
  rcvTransport: any;
  sendTransport: any;
  producer: any;
  enablePlayBtn = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private studentService: StudentService,
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
      });
  }

  async rcvTeacherVideo() {
    this.enablePlayBtn = false;
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
          this.teacherVideo.nativeElement.srcObject = stream;
          this.studentService.resumeTeacherVideo(
            {
              classId: this.classId,
              userId: this.user.id
            }
          ).subscribe(async () => {
            // this.teacherVideo.nativeElement.play();
            await this.startSelfVideo();
          });
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

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const track = stream.getVideoTracks()[0];
        const params = { track };
        const video: HTMLVideoElement = this.renderer.createElement('video');
        video.autoplay = true;
        video.style.width = '100%';
        video.classList.add('student-video');
        this.renderer.appendChild(this.videos.nativeElement, video);
        video.srcObject = stream;
        this.producer = await this.sendTransport.produce(params);

        await this.newOtherStudent();
      });
  }

  async newOtherStudent() {
    this.studentService.newOtherStudentJoined().subscribe((data: any) => {
      const { studentId } = data;
      this.studentService.consumeOtherStudentVideo(
        { classId: this.classId, userId: this.user.id, otherStudentId: studentId, rtpCapabilities: this.device.rtpCapabilities })
        .subscribe(async (dataConsumer: any) => {
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
          // this.studentsList.set(otherStudentId, video);
          video.srcObject = stream;

          this.studentService.resumeOtherStudentVideo({ classId: this.classId, userId: this.user.id, otherStudentId: studentId })
            .subscribe(() => {
              console.log(`Other Student added`);
            });
        });
    });
  }
}
