import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ViewClassService {


    constructor(private socket: Socket, private authService: AuthService, private http: HttpClient) { }

    getRoomOwner(id: string) {
        this.socket.emit('get-owner', id);
        return this.socket.fromEvent('owner-details');
    }

    getCapabilities() {
        this.socket.emit('get-capabilities', {});
        return this.socket.fromEvent('receive-capabilities');
    }

    createProducerTransport({ rtpCapabilities }) {
        this.socket.emit('create-producer-transport', { rtpCapabilities });

        return this.socket.fromEvent('producer-transport-created');
    }

    connectProducerTransport({ dtlsParameters, userId, classId }) {
        this.socket.emit('connect-producer-transport', { dtlsParameters, userId, classId });

        return this.socket.fromEvent('producer-transport-connected');
    }

    produce({ userId, classId, kind, rtpParameters }) {
        this.socket.emit('produce', { userId, classId, kind, rtpParameters });

        return this.socket.fromEvent('produced');
    }

    createConsumerTransport({ classId, userId }) {
        this.socket.emit('create-consumer-transport', { classId, userId });

        return this.socket.fromEvent('consumer-transport-created');
    }

    connectConsumerTransport({ dtlsParameters, classId, userId }) {
        this.socket.emit('connect-consumer-transport', { dtlsParameters, classId, userId });

        return this.socket.fromEvent('consumer-transport-connected');
    }

    consume({ rtpCapabilities, classId, userId, remoteUserId }) {
        this.socket.emit('consume', { rtpCapabilities, classId, userId, remoteUserId });
        return this.socket.fromEvent('consumed');
    }

    teacherVideoPaused() {
        return this.socket.fromEvent('teacher-video-paused');
    }

    waitForStudentTransport() {
        return this.socket.fromEvent('new-student-joined');
    }

    resume({ classId, userId, remoteUserId }) {
        this.socket.emit('resume', { classId, userId, remoteUserId });
        return this.socket.fromEvent('resumed');
    }

    getClassDetail(id: string) {
        return this.http.get(`${environment.url}/classes/${id}`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }

    getClassState(id: string) {
        this.socket.emit('get-class-state', { id });
        return this.socket.fromEvent('class-state-received');
    }

    startClass(userId, classId, rtpCapabilities) {
        this.socket.emit('start-class', { userId, classId, rtpCapabilities });
        return this.socket.fromEvent('class-started');
    }

    startStudentStream(userId, classId, rtpCapabilities) {
        this.socket.emit('start-student-video', { userId, classId, rtpCapabilities });
        return this.socket.fromEvent('student-producer-transport-started');
    }

    studentDisconnected() {
        return this.socket.fromEvent('student-disconnected');
    }

    otherStudentJoined() {
        return this.socket.fromEvent('new-other-student');
    }

    consumeOtherStudent({ rtpCapabilities, classId, userId, remoteUserId }) {
        this.socket.emit('consume-other-student', { rtpCapabilities, classId, userId, remoteUserId });
        return this.socket.fromEvent('other-student-consumed');
    }

    resumeOtherStudent(arg0: { classId: any; userId: any; remoteUserId: any; }) {
        this.socket.emit('resume-other-student', arg0);
        return this.socket.fromEvent('other-student-consumed');
    }

}
