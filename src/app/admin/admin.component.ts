import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  activeRoute = 'overview';
  user: any;

  constructor(private router: Router, private location: Location, private adminService: AdminService) { }

  ngOnInit() {
    if (this.location.path().includes('classes')) {
      this.activeRoute = 'classes';
    }

    if (this.location.path().includes('students')) {
      this.activeRoute = 'students';
    }

    if (this.location.path().includes('teachers')) {
      this.activeRoute = 'teachers';
    }

    this.user = this.adminService.retrieveUser();
  }

  routeChange(route: string) {
    this.activeRoute = route;
  }

  logout() {
    this.adminService.logout();
    this.router.navigate(['/login']);
  }
}
