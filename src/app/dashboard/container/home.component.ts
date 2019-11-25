import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-dashboard-home',
    templateUrl: 'home.component.html',
    styleUrls: ['./home.component.scss']
})
export class DashboardHomeComponent implements OnInit {

    isTeacher$: Observable<boolean>;
    showCreateClass = false;
    activeClass = '';
    user: any;
    constructor(private router: Router, private authService: AuthService, private location: Location) { }

    ngOnInit() {
        this.authService.isTeacherVerify();
        this.isTeacher$ = this.authService.isTeacher.asObservable();
        this.isTeacher$.subscribe(isTeacher => {
            this.showCreateClass = isTeacher;
        });
        if (this.location.path().includes('active-classes')) { this.activeClass = 'active-classes'; }
        if (this.location.path().includes('create-class')) { this.activeClass = 'create-class'; }
        this.user = this.authService.retrieveUser();
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    routeChange(name) {
        this.activeClass = name;
    }
}
