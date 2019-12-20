import { Component, OnInit, ViewChild } from '@angular/core';
import { AdminService } from '../admin.service';
import { EmailFilter } from './email.filter';
import { ClrWizard, ClrDatagridSortOrder } from '@clr/angular';

@Component({
  selector: 'app-students',
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss']
})
export class StudentsComponent implements OnInit {
  @ViewChild('wizardlg', { static: false }) wizardMedium: ClrWizard;
  studentCreated = false;
  studentDeleted = false;
  emailFilter = new EmailFilter();
  students: any[] = [];
  descSort = ClrDatagridSortOrder.DESC;
  descSortCreatedAt = ClrDatagridSortOrder.DESC;
  addingStudent = false;
  form = {
    type: 'student',
    email: '',
    password: '',
    name: ''
  };
  deletingStudent:any;

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.adminService.getStudents().subscribe((students: any[]) => {
      this.students = students;
    });
  }

  addStudent() {
    this.addingStudent = true;
  }

  createStudent() {
    this.adminService.register(this.form).subscribe((data) => {
      this.students.unshift(data);
      this.wizardMedium.reset();
      this.addingStudent = false;
      this.studentCreated = true;
      setTimeout(() => {
        this.studentCreated = false;
      }, 3000);
    });
  }

  onDelete(student) {
    this.deletingStudent = student;
    console.log(this.deletingStudent);
  }

  deleteStudent() {
    this.adminService.deleteStudent({ id: this.deletingStudent.id }).subscribe(() => {
      this.students = this.students.filter(student => student.id !== this.deletingStudent.id);
      this.studentDeleted = true;
      this.deletingStudent = undefined;
      setTimeout(() => {
        this.studentDeleted = false;
      }, 3000);
    });
  }
}
