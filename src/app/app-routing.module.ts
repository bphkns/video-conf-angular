import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { ViewClassComponent } from './view-class/view-class.component';
import { TeacherComponent } from './view-class/teacher/teacher.component';
import { StudentComponent } from './view-class/student/student.component';
import { AdminGuard } from './auth/admin.guard';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(mod => mod.DashboardModule),
    canLoad: [
      AuthGuard
    ]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(mod => mod.AdminModule),
    canLoad: [
      AdminGuard
    ]
  },
  {
    path: 'lecturer/:id',
    component: TeacherComponent
  },
  {
    path: 'student/:id',
    component: StudentComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { // <-- debugging purposes only
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
