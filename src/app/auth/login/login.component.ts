import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
    selector: 'app-auth-login',
    styleUrls: ['login.component.scss'],
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    form = {
        username: '',
        password: '',
        rememberMe: false
    };

    showError = '';
    showSuccess = '';
    constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) { }

    ngOnInit() {
        if (
            this.route.snapshot.queryParamMap.has('userRegisterSuccess')
            &&
            this.route.snapshot.queryParamMap.get('userRegisterSuccess') === 'true'
        ) {
            this.showSuccess = 'You have registered successfully. Now Login with your credentials.';
        }
    }

    submit() {
        this.showError = '';
        this.showSuccess = '';
        if (this.form.username.length < 6 || this.form.password.length < 6) {
            this.showError = 'Enter valid username or password';
            return;
        }

        this.authService.login(this.form).subscribe((data: any) => {
            const helper = new JwtHelperService();
            const user = helper.decodeToken(data.accessToken);
            const expirationDate = helper.getTokenExpirationDate(data.accessToken);
            this.authService.saveUser({ ...user, expirationDate, accessToken: data.accessToken });
            this.router.navigate(['/dashboard']);
        }, error => {
            this.showError = error.error.message;
        });
    }
}
