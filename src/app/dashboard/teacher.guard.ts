
import { Injectable } from '@angular/core';
import { CanActivate, Route, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

const USER_DB = 'USER_DB';

@Injectable()
export class TeacherGuard implements CanActivate {

    constructor(public authService: AuthService, public router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!localStorage.getItem(USER_DB)) {
            this.router.navigate(['login']);
            return false;
        }

        try {
            const user = JSON.parse(localStorage.getItem(USER_DB));
            if (!user.type || user.type !== 'teacher') {
                return false;
            }
        } catch (err) {
            this.router.navigate(['login']);
            return false;
        }

        return true;
    }

}
