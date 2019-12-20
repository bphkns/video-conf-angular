import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';


const USER_DB = 'USER_DB';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    constructor(private socket: Socket, private http: HttpClient, private authService: AuthService) {
    }


    retrieveUser() {
        return JSON.parse(localStorage.getItem(USER_DB));
    }

    getClasses() {
        return this.http.get(`${environment.url}/classes/all-classes`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.retrieveUser().accessToken}` })
        });
    }

    logout() {
        localStorage.removeItem(USER_DB);
    }

    getStudents() {
        return this.http.get(`${environment.url}/users/all-students`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.retrieveUser().accessToken}` })
        });
    }

    getTeachers() {
        return this.http.get(`${environment.url}/users/teachers`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.retrieveUser().accessToken}` })
        });
    }

    createClass({ name, teacher }) {
        return this.http.post(`${environment.url}/classes/create`, { subject: name, teacher }, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }

    register({ type, email, password, name }) {
        return this.authService.signUp({ type, email, password, name });
    }

    deleteStudent({ id }) {
        return this.http.post(`${environment.url}/users/students/delete`, { id }, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }

    deleteClass({ id }) {
        return this.http.post(`${environment.url}/classes/delete`, { id }, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }

    deleteTeacher({ id }) {
        return this.http.post(`${environment.url}/users/teachers/delete`, { id }, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }

    getStastics() {
        return this.http.get(`${environment.url}/stastics`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }

    updateClass({ id, name }) {
        return this.http.post(`${environment.url}/classes/update`, { id, name }, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.retrieveUser().accessToken}` })
        });
    }
}
