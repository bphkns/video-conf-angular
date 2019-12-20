import { Component, OnInit, ViewChild } from '@angular/core';
import { AdminService } from '../admin.service';
import { ClrDatagridSortOrder, ClrWizard } from '@clr/angular';
import { EmailFilter } from '../students/email.filter';

@Component({
  selector: 'app-clasess',
  templateUrl: './clasess.component.html',
  styleUrls: ['./clasess.component.scss']
})
export class ClasessComponent implements OnInit {

  @ViewChild('wizardlg', { static: false }) wizardMedium: ClrWizard;
  classes = [];
  descSort = ClrDatagridSortOrder.DESC;
  addingClass = false;
  teachers = [];
  selectedTeacher;
  emailFilter = new EmailFilter();
  classCreated = false;
  classDetails = {
    name: ''
  };
  deletingClass: any;
  classDeleted = false;
  editingClass: any = false;
  editClassname: string;

  editing = {
    name: false
  };

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.adminService.getClasses().subscribe((data: any[]) => this.classes = data);
  }

  addClass() {
    this.addingClass = !this.addingClass;
  }

  getTeachers() {
    this.adminService.getTeachers().subscribe((teachers: []) => this.teachers = teachers);
    console.log(this.teachers);
  }

  createClass() {
    this.adminService.createClass({ name: this.classDetails.name, teacher: this.selectedTeacher.id }).subscribe((classData: any) => {
      this.classes.unshift(classData);
      this.classCreated = true;
      this.addingClass = false;
      this.wizardMedium.reset();
      setTimeout(() => this.classCreated = false, 5000);
    });
  }

  onDelete(classDetails: any) {
    this.deletingClass = classDetails;
  }

  deleteClass() {
    this.adminService.deleteClass({ id: this.deletingClass.id }).subscribe(() => {
      this.classes = this.classes.filter(classDetails => classDetails.id !== this.deletingClass.id);
      this.classDeleted = true;
      this.deletingClass = undefined;
      setTimeout(() => {
        this.classDeleted = false;
      }, 3000);
    });
  }

  showEditPopup(classDetails) {
    this.editingClass = classDetails;
    this.editClassname = classDetails.subject.name;
  }

  startEdit(prop: string) {
    if (this.editing.hasOwnProperty(prop)) {
      this.editing[prop] = true;
    }
  }

  updateClass() {
    for (const key in this.editing) {
      if (this.editing.hasOwnProperty(key)) {
        this.editing[key] = false;
      }
    }

    this.adminService.updateClass({ id: this.editingClass.id, name: this.editClassname }).subscribe(classDetails => {
      const index = this.classes.indexOf(this.editingClass);
      this.classes[index] = classDetails;
      this.editingClass = false;
      this.editClassname = '';
    });
  }
}

