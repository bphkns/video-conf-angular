import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from '../../auth/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class StudentService {

    constructor(private socket: Socket, private authService: AuthService, private http: HttpClient) { }

    getCapabilities() {
        this.socket.emit('get-capabilities', {});
        return this.socket.fromEvent('receive-capabilities');
    }

    getClassDetail(classId: string) {
        this.socket.emit('get-class-details', { classId });
        return this.socket.fromEvent('take-class-details');
    }

    createStudentConsumer({ classId, userId }) {
        this.socket.emit('create-consumer-transport-student', { classId, userId });
        return this.socket.fromEvent('student-consumer-transport-created');
    }

    connectStudentConsumerTransport({ dtlsParameters, classId, userId }) {
        this.socket.emit('connect-consumer-transport-student', { dtlsParameters, classId, userId });
        return this.socket.fromEvent('student-consumer-transport-connected');
    }

    consumeTeacherVideo({ rtpCapabilities, classId, userId }) {
        this.socket.emit('consume-teacher-video', { rtpCapabilities, classId, userId });
        return this.socket.fromEvent('consumed-teacher');
    }

    resumeTeacherVideo({ classId, userId }) {
        this.socket.emit('resume-teacher', { classId, userId });
        return this.socket.fromEvent('teacher-resumed');
    }

    startSelfVideo(classId, userId, rtpCapabilities) {
        this.socket.emit('start-student-video', { classId, userId, rtpCapabilities });
        return this.socket.fromEvent('started-student-video');
    }

    connectProducerTransport({ dtlsParameters, classId, userId }) {
        this.socket.emit('connect-producer-transport-student', { dtlsParameters, classId, userId });
        return this.socket.fromEvent('student-producer-transport-connected');
    }

    produceStudentvideo({ classId, kind, rtpParameters, userId }) {
        this.socket.emit('student-produce', { classId, kind, rtpParameters, userId });
        return this.socket.fromEvent('student-produced');
    }

    newOtherStudentJoined() {
        return this.socket.fromEvent('new-other-student');
    }

    consumeOtherStudentVideo({ classId, userId, otherStudentId, rtpCapabilities }) {
        this.socket.emit('consume-other-student-video', { classId, userId, otherStudentId, rtpCapabilities });

        return this.socket.fromEvent('other-student-video-consumed');
    }

    resumeOtherStudentVideo({ classId, userId, otherStudentId }) {
        this.socket.emit('resume-other-student-video', { classId, userId, otherStudentId });

        return this.socket.fromEvent('other-student-video-resumed');
    }

}
