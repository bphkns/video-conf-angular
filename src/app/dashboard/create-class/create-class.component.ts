import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClassService } from '../class.service';

@Component({
  selector: 'app-create-class',
  templateUrl: './create-class.component.html',
  styleUrls: ['./create-class.component.scss']
})
export class CreateClassComponent implements OnInit {
  form: FormGroup;

  constructor(private formBuilder: FormBuilder, private router: Router, private route: ActivatedRoute, private classService: ClassService) {
    this.form = this.formBuilder.group({
      name: this.formBuilder.group({
        subject: ['', Validators.required],
      }),
      start: this.formBuilder.group({})
    });
  }


  ngOnInit() {
  }

  submit() {
    this.classService.createClass(this.form.value).subscribe((classData: any) => {
      this.router.navigate(['view-class', classData.id]);
    });
  }
}
