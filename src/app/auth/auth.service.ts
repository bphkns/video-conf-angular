import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

const USER_DB = 'USER_DB';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    isTeacher = new BehaviorSubject<boolean>(false);
    constructor(private httpClient: HttpClient) { }

    signUp(userInfo: { email: string, password: string, type: string, rememberMe: boolean }) {
        const { email, password, type, rememberMe } = userInfo;
        return this.httpClient.post(`${environment.url}/users`, { email, password, type });
    }

    login(userInfo: { username: string, password: string, rememberMe: boolean }) {
        const { username, password } = userInfo;
        return this.httpClient.post(`${environment.url}/auth/login`, { username, password, });
    }

    saveUser(userDetails: any) {
        localStorage.setItem(USER_DB, JSON.stringify(userDetails));
    }

    retrieveUser() {
        return JSON.parse(localStorage.getItem(USER_DB));
    }

    saveAsTeacher() {
        const user = this.retrieveUser();
        user.type = 'teacher';
        localStorage.removeItem(USER_DB);
        this.saveUser(user);
    }

    saveAsStudent() {
        const user = this.retrieveUser();
        user.type = 'student';
        localStorage.removeItem(USER_DB);
        this.saveUser(user);
    }

    logout() {
        localStorage.removeItem(USER_DB);
    }

    isTeacherVerify() {
        const user = this.retrieveUser();
        if (user && !user.type) {
            this.httpClient.get(`${environment.url}/auth/is-teacher`, {
                headers: new HttpHeaders({ Authorization: `Bearer ${this.retrieveUser().accessToken}` })
            }).subscribe(data => {
                this.isTeacher.next(true);
                this.saveAsTeacher();
            }, error => {
                this.isTeacher.next(false);
                this.saveAsStudent();
            });

            return;
        }

        if (user.type === 'teacher') {
            this.isTeacher.next(true);
            return;
        }

        this.isTeacher.next(false);
        return;
    }
}
