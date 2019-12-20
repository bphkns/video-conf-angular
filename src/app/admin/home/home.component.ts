import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  totalClasses = 0;
  totalStudents = 0;
  totalteachers = 0;

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.adminService.getStastics().subscribe((data: any) => {
      const { classes, teachers, students } = data;
      this.totalClasses = classes;
      this.totalStudents = students;
      this.totalteachers = teachers;
    });
  }

}
