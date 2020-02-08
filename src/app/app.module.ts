import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { Ng5SliderModule } from 'ng5-slider';
import { ColorPickerModule } from 'ngx-color-picker';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ControlsComponent } from './view-class/controls/controls.component';
import { StudentComponent } from './view-class/student/student.component';
import { StudentService } from './view-class/student/student.service';
import { TeacherComponent } from './view-class/teacher/teacher.component';
import { TeacherService } from './view-class/teacher/teacher.service';
import { ViewClassComponent } from './view-class/view-class.component';
import { ViewClassService } from './view-class/view-class.service';

const config: SocketIoConfig = { url: environment.socketUrl, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    ViewClassComponent,
    TeacherComponent,
    StudentComponent,
    ControlsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AuthModule,
    ClarityModule,
    SocketIoModule.forRoot(config),
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    ColorPickerModule,
    HttpClientModule,
    OverlayModule,
    Ng5SliderModule
  ],
  providers: [AppService, ViewClassService, TeacherService, StudentService],
  bootstrap: [AppComponent],
  entryComponents: [ ControlsComponent]
})
export class AppModule { }
