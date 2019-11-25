import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class ClassService {
    constructor(private socket: Socket, private http: HttpClient, private authService: AuthService) {
    }

    getLiveClasses() {
        this.socket.emit('get-active-classes', {});

        return this.socket.fromEvent('live-classes');
    }

    createClass(classDetails: { name: { subject: string }, start: {} }) {
        return this.http.post(`${environment.url}/classes/create`, { subject: classDetails.name.subject }, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }
}
