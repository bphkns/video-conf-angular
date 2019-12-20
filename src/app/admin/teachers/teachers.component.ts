import { Component, OnInit, ViewChild } from '@angular/core';
import { ClrWizard, ClrDatagridSortOrder } from '@clr/angular';
import { EmailFilter } from '../students/email.filter';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-teachers',
  templateUrl: './teachers.component.html',
  styleUrls: ['./teachers.component.scss']
})
export class TeachersComponent implements OnInit {

  @ViewChild('wizardlg', { static: false }) wizardMedium: ClrWizard;
  teacherCreated = false;
  emailFilter = new EmailFilter();
  teachers: any[] = [];
  descSort = ClrDatagridSortOrder.DESC;
  descSortCreatedAt = ClrDatagridSortOrder.DESC;
  addingTeacher = false;
  deletingTeacher: any;
  teacherDeleted = false;
  form = {
    type: 'teacher',
    email: '',
    password: '',
    name: ''
  };

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.adminService.getTeachers().subscribe((teachers: any[]) => {
      this.teachers = teachers;
    });
  }

  addTeacher() {
    this.addingTeacher = true;
  }

  createTeacher() {
    this.adminService.register(this.form).subscribe((data) => {
      this.teachers.unshift(data);
      this.wizardMedium.reset();
      this.addingTeacher = false;
      this.teacherCreated = true;
      setTimeout(() => {
        this.teacherCreated = false;
      }, 3000);
    });
  }

  onDelete(teacher) {
    this.deletingTeacher = teacher;
  }

  deleteTeacher() {
    this.adminService.deleteTeacher({ id: this.deletingTeacher.id }).subscribe(() => {
      this.teachers = this.teachers.filter(teacher => teacher.id !== this.deletingTeacher.id);
      this.teacherDeleted = true;
      this.deletingTeacher = undefined;
      setTimeout(() => {
        this.teacherDeleted = false;
      }, 3000);
    });
  }

}
