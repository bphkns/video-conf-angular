import { Component, OnInit } from '@angular/core';
import { ClassService } from '../class.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-active-classes',
  templateUrl: './active-classes.component.html',
  styleUrls: ['./active-classes.component.scss']
})
export class ActiveClassesComponent implements OnInit {

  curentLiveClasses = [];
  user: any;
  constructor(private classService: ClassService, private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.classService.getLiveClasses().subscribe((classes: any[]) => {
      this.curentLiveClasses = classes;
      this.user = this.authService.retrieveUser();
    });
  }

  viewClass(id: string) {
    const classDetails = this.curentLiveClasses.find(classInfo => classInfo.id === id);
    if (classDetails.teacher.id === this.user.id) {
      this.router.navigate(['/lecturer', id]);
      return;
    }

    this.router.navigate(['/student', id]);
    return;
  }

}
