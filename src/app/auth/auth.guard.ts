
import { Injectable } from '@angular/core';
import { CanLoad, Route, Router } from '@angular/router';
import { AuthService } from './auth.service';

const USER_DB = 'USER_DB';

@Injectable()
export class AuthGuard implements CanLoad {
    constructor(public authService: AuthService, public router: Router) { }

    canLoad(route: Route): boolean {
        if (!localStorage.getItem(USER_DB)) {
            this.router.navigate(['login']);
            return false;
        }
        return true;
    }
}
