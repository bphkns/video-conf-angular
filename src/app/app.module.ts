import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ViewClassComponent } from './view-class/view-class.component';
import { ViewClassService } from './view-class/view-class.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TeacherComponent } from './view-class/teacher/teacher.component';
import { StudentComponent } from './view-class/student/student.component';
import { TeacherService } from './view-class/teacher/teacher.service';
import { StudentService } from './view-class/student/student.service';

const config: SocketIoConfig = { url: environment.socketUrl, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    ViewClassComponent,
    TeacherComponent,
    StudentComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AuthModule,
    ClarityModule,
    SocketIoModule.forRoot(config),
    CommonModule,
    FlexLayoutModule,
    HttpClientModule
  ],
  providers: [AppService, ViewClassService, TeacherService, StudentService],
  bootstrap: [AppComponent]
})
export class AppModule { }
