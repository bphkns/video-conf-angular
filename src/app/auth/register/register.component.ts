import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form = {
    type: 'student',
    email: '',
    password: '',
    rememberMe: false
  };
  showError = '';
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
  }


  signup() {
    this.showError = '';
    if (this.form.email.length < 6 || this.form.password.length < 6) {
      console.log(this.form);
      this.showError = 'Please put more than 6 characters in both username and password';
      return;
    }

    this.authService.signUp(this.form).subscribe(user => {
      this.router.navigate(['/login'], { queryParams: { userRegisterSuccess: true } });
    }, error => {
      this.showError = error.error.message;
    });
  }

}
