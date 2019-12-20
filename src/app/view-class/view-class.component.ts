import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AppService } from '../app.service';
import { AuthService } from '../auth/auth.service';
import { ViewClassService } from './view-class.service';
import { ActivatedRoute } from '@angular/router';
import { Device } from 'mediasoup-client';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
enum ClassState {
  STARTED,
  PAUSED,
  ENDED
}

@Component({
  selector: 'app-view-class',
  templateUrl: './view-class.component.html',
  styleUrls: ['./view-class.component.scss']
})
export class ViewClassComponent implements OnInit {

  @ViewChild('teacherVideo', { static: false }) teacherVideo: ElementRef;
  @ViewChild('videos', { static: false }) videos: ElementRef;

  classDetails: any;

  playDisbaled = false;
  remoteVideoElems = new Map();
  roomOwner = false;
  user: any;
  device: any;
  sendTransport: any;
  produce: any;
  producer: any;
  recvTransport: any;
  classState: string;
  enablePlayBtn: boolean;
  studentConsumersList = new Map<string, { consumer?: any, elem?: any }>();

  constructor(
    private authService: AuthService,
    private renderer: Renderer2,
    private viewService: ViewClassService,
    private route: ActivatedRoute) {
    this.device = new Device();
  }



  ngOnInit() {
    const id = this.route.snapshot.params.id;
    this.user = this.authService.retrieveUser();
    this.viewService.getRoomOwner(id).subscribe((data: any) => {
      if (this.user.id === data.id) {
        this.roomOwner = true;
      }
      this.loadDevice();
    });

    this.viewService.teacherVideoPaused().subscribe(async () => {
      this.classState = 'paused';
    });
  }

  loadDevice() {
    this.viewService.getCapabilities().pipe(switchMap(async data => {
      return from(this.device.load({ routerRtpCapabilities: data }));
    }), switchMap(async => {
      return this.viewService.getClassDetail(this.route.snapshot.params.id);
    }), switchMap((classDetails: any) => {
      this.classDetails = classDetails;
      this.enablePlayBtn = true;
      return this.viewService.getClassState(this.classDetails.id);
    }))
      .subscribe(async (state: string) => {
        this.classState = state;
        if (this.classState === 'started' && !this.roomOwner) {
          await this.recieveTeacherVideo();
        }
      });
  }


  async start() {
    this.viewService.studentDisconnected().subscribe(async (dataStudent: any) => {
      const { studentId } = dataStudent;
      const student = this.studentConsumersList.get(studentId);

      if (student) {
        this.renderer.removeChild(this.videos.nativeElement, student.elem);
        this.studentConsumersList.delete(studentId);
      }
    });
    this.playDisbaled = true;
    this.viewService.startClass(this.user.id, this.classDetails.id, this.device.rtpCapabilities).subscribe(async data => {
      this.sendTransport = await this.device.createSendTransport(data);
      this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        this.viewService.connectProducerTransport({ dtlsParameters, userId: this.user.id, classId: this.classDetails.id }).subscribe(d => {
          callback();
        });
      });

      this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        this.viewService.produce({
          userId: this.user.id,
          classId: this.classDetails.id,
          kind,
          rtpParameters,
        }).subscribe(({ id }) => {
          callback(id);
        });

      });

      if (!this.device.canProduce('video')) {
        console.log(`Device cannot run video`);
      }

      this.sendTransport.on('connectionstatechange', (state) => {
        console.log(state);
      });

      this.classState = 'started';
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const params = { track };
      if (this.roomOwner) {
        this.teacherVideo.nativeElement.srcObject = stream;
      }

      if (!this.roomOwner) {
        const video: HTMLVideoElement = this.renderer.createElement('video');
        video.muted = true;
        video.autoplay = true;
        this.renderer.appendChild(this.videos.nativeElement, video);
        video.srcObject = stream;
      }
      this.producer = await this.sendTransport.produce(params);
      await this.waitForStudents();
    });
  }

  async waitForStudents() {
    this.viewService.waitForStudentTransport().subscribe(async (data: any) => {
      const { userId } = data;
      if (!this.recvTransport) {
        this.viewService.createConsumerTransport({ classId: this.classDetails.id, userId: this.user.id }).subscribe(async transportData => {
          this.recvTransport = this.device.createRecvTransport(transportData);
          this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            this.viewService.connectConsumerTransport(
              {
                dtlsParameters,
                classId: this.classDetails.id,
                userId: this.user.id
              }).subscribe(async () => {
                callback();
              });
          });
          this.recvTransport.on('connectionstatechange', (state) => {
            console.log(`Student consumer:` + state);
          });
          const { rtpCapabilities } = this.device;
          this.viewService.consume({
            rtpCapabilities,
            classId: this.classDetails.id,
            userId: this.user.id,
            remoteUserId: userId
          }).subscribe(async (dataConsumer: any) => {
            const {
              producerId,
              id,
              kind,
              rtpParameters,
              studentId
            } = dataConsumer;
            const codecOptions = {};
            const consumer = await this.recvTransport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
              codecOptions
            });
            this.studentConsumersList.set(studentId, { consumer });
            this.viewService.resume({
              classId: this.classDetails.id,
              userId: this.user.id,
              remoteUserId: studentId
            }).subscribe(async () => {
              const stream = new MediaStream();
              const consm = this.studentConsumersList.get(studentId);
              stream.addTrack(consm.consumer.track);

              const video: HTMLVideoElement = this.renderer.createElement('video');
              video.autoplay = true;
              video.classList.add('student-video');
              this.renderer.appendChild(this.videos.nativeElement, video);
              this.studentConsumersList.get(studentId).elem = video;
              video.srcObject = stream;
            });
          });
        });

        return;
      }

      if (this.recvTransport) {
        const { rtpCapabilities } = this.device;
        console.log(userId, ':', this.user.id);
        this.viewService.consume({
          rtpCapabilities,
          classId: this.classDetails.id,
          userId: this.user.id,
          remoteUserId: userId
        });
      }

    });
  }

  async waitForOtherStudent() {
    this.viewService.otherStudentJoined().subscribe(async (data: any) => {
      const { otherStudentId } = data;
      console.log(otherStudentId);
      if (this.recvTransport) {
        const { rtpCapabilities } = this.device;
        this.viewService.consumeOtherStudent({
          rtpCapabilities,
          classId: this.classDetails.id,
          userId: this.user.id,
          remoteUserId: otherStudentId
        }).subscribe(async (consumerData: any) => {
          const {
            producerId,
            id,
            kind,
            rtpParameters,
          } = consumerData;
          const codecOptions = {};
          const consumer = await this.recvTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions
          });

          const stream = new MediaStream();
          stream.addTrack(consumer.track);

          this.viewService.resumeOtherStudent({ classId: this.classDetails.id, userId: this.user.id, remoteUserId: otherStudentId })
            .subscribe(resumeOtherStudentData => {
              const video: HTMLVideoElement = this.renderer.createElement('video');
              video.autoplay = true;
              video.style.width = '100%';
              video.classList.add('student-video');
              this.renderer.appendChild(this.videos.nativeElement, video);
              this.studentConsumersList.set(otherStudentId, { consumer, elem: video });
              video.srcObject = stream;
            });
        });
      }
    });
  }

  async recieveTeacherVideo() {
    this.viewService.createConsumerTransport({ classId: this.classDetails.id, userId: this.user.id }).subscribe(async data => {
      this.recvTransport = this.device.createRecvTransport(data);
      this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        this.viewService.connectConsumerTransport(
          {
            dtlsParameters,
            classId: this.classDetails.id,
            userId: this.user.id
          }).subscribe(async () => {
            callback();
          });
      });
      this.recvTransport.on('connectionstatechange', (state) => {
        console.log(state);
      });

      const { rtpCapabilities } = this.device;
      this.viewService.consume({
        rtpCapabilities,
        classId: this.classDetails.id,
        userId: this.user.id,
        remoteUserId: null
      }).subscribe(async (dataConsumer: any) => {
        const {
          producerId,
          id,
          kind,
          rtpParameters,
        } = dataConsumer;
        const codecOptions = {};

        const consumer = await this.recvTransport.consume({
          id,
          producerId,
          kind,
          rtpParameters,
          codecOptions
        });

        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        this.teacherVideo.nativeElement.srcObject = stream;
        this.viewService.resume({
          classId: this.classDetails.id,
          userId: this.user.id,
          remoteUserId: null
        }).subscribe(async () => {
          const video: HTMLVideoElement = this.renderer.createElement('video');
          video.autoplay = true;
          video.style.width = '100%';
          const localStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          video.classList.add('student-video');
          this.renderer.appendChild(this.videos.nativeElement, video);
          video.srcObject = localStream;
          await this.startStudentVideo(localStream);
        });
      });

    });


  }


  async startStudentVideo(stream: MediaStream) {
    this.viewService.startStudentStream(this.user.id, this.classDetails.id, this.device.rtpCapabilities).subscribe(async data => {
      this.sendTransport = await this.device.createSendTransport(data);
      const track = stream.getVideoTracks()[0];
      const params = { track };

      this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        this.viewService.connectProducerTransport({ dtlsParameters, userId: this.user.id, classId: this.classDetails.id }).subscribe(d => {
          callback();
        });
      });

      this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        this.viewService.produce({
          userId: this.user.id,
          classId: this.classDetails.id,
          kind,
          rtpParameters,
        }).subscribe(({ id }) => {
          callback(id);
        });

      });

      if (!this.device.canProduce('video')) {
        console.log(`Device cannot run video`);
      }

      this.sendTransport.on('connectionstatechange', (state) => {
        console.log(state);
      });

      this.producer = await this.sendTransport.produce(params);

      await this.waitForOtherStudent();
    });
  }

}
