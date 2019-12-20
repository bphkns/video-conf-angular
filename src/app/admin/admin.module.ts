import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin.component';
import { ClasessComponent } from './clasess/clasess.component';
import { TeachersComponent } from './teachers/teachers.component';
import { StudentsComponent } from './students/students.component';
import { HomeComponent } from './home/home.component';
import { Routes, RouterModule } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { SocketIoModule } from 'ngx-socket-io';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        component: HomeComponent
      },
      {
        path: 'classes',
        component: ClasessComponent
      },
      {
        path: 'students',
        component: StudentsComponent
      },
      {
        path: 'teachers',
        component: TeachersComponent
      }
    ]
  }
];


@NgModule({
  declarations: [AdminComponent, ClasessComponent, TeachersComponent, StudentsComponent, HomeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ClarityModule,
    HttpClientModule,
    SocketIoModule,
    FormsModule
  ],
  providers: [AdminService]
})
export class AdminModule { }
