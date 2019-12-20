import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClassService } from '../class.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-create-class',
  templateUrl: './create-class.component.html',
  styleUrls: ['./create-class.component.scss']
})
export class CreateClassComponent implements OnInit {
  form: FormGroup;
  user: any;

  constructor(
    private formBuilder: FormBuilder, private router: Router, private route: ActivatedRoute,
    private classService: ClassService, private authService: AuthService) {
    this.form = this.formBuilder.group({
      name: this.formBuilder.group({
        subject: ['', Validators.required],
      }),
      start: this.formBuilder.group({})
    });
  }


  ngOnInit() {
    this.user = this.authService.retrieveUser();
  }

  submit() {
    this.classService.createClass(this.form.value).subscribe((classData: any) => {
      this.router.navigate(['view-class', classData.id]);
      if (classData.teacher.id === this.user.id) {
        this.router.navigate(['/lecturer', classData.id]);
        return;
      }

      this.router.navigate(['/student', classData.id]);
      return;
    });
  }
}
