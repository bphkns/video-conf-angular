import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from '../../auth/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TeacherService {
    constructor(private socket: Socket, private authService: AuthService, private http: HttpClient) { }

    getCapabilities() {
        this.socket.emit('get-capabilities', {});
        return this.socket.fromEvent('receive-capabilities');
    }

    getClassDetail(id: string) {
        return this.http.get(`${environment.url}/classes/${id}`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }

    startClass(classId, rtpCapabilities) {
        this.socket.emit('start-class', { classId, rtpCapabilities });
        return this.socket.fromEvent('class-started');
    }

    connectProducerTransport({ dtlsParameters, classId }) {
        this.socket.emit('connect-producer-transport-teacher', { dtlsParameters, classId });
        return this.socket.fromEvent('teacher-producer-transport-connected');
    }

    produce({ classId, kind, rtpParameters }) {
        this.socket.emit('teacher-produce', { classId, kind, rtpParameters });
        return this.socket.fromEvent('teacher-produced');
    }

    newStudentJoined() {
        return this.socket.fromEvent('new-student-joined');
    }

    createConsumerTransportForTeacher({ classId }) {
        this.socket.emit('create-teacher-consumer-transport', { classId });
        return this.socket.fromEvent('teacher-consumer-transport-created');
    }

    connectStudentTeacherConsumerTransport({ dtlsParameters, classId, userId }) {
        this.socket.emit('connect-consumer-transport-teacher', { dtlsParameters, classId, userId });
        return this.socket.fromEvent('teacher-consumer-transport-connected');
    }

    consumeStudentVideo({ rtpCapabilities, classId, userId, otherStudentId }) {
        this.socket.emit('consume-student-video', { rtpCapabilities, classId, userId, otherStudentId });
        return this.socket.fromEvent('consumed-student');
    }

    consumeStudentVideoAfter({ rtpCapabilities, classId, userId, otherStudentId }) {
        this.socket.emit('consume-student-video', { rtpCapabilities, classId, userId, otherStudentId });
    }

    resumeStudentVideo({ classId, studentId }) {
        this.socket.emit('resume-student-video-for-teacher', { classId, studentId });
        return this.socket.fromEvent('student-video-resumed-for-teacher');
    }

    studentDisconnected() {
        return this.socket.fromEvent('student-disconnected');
    }

    sendDrawing({ prevPos, currentPos, classId }) {
        this.socket.emit('teacher-send-drawing', { prevPos, currentPos, classId });
    }


    clearDrawing({ classId }) {
        this.socket.emit('clear-drawing', { classId });
    }
}
