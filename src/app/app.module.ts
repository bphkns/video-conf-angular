import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ColorPickerModule } from 'ngx-color-picker';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StudentComponent } from './view-class/student/student.component';
import { StudentService } from './view-class/student/student.service';
import { TeacherComponent } from './view-class/teacher/teacher.component';
import { TeacherService } from './view-class/teacher/teacher.service';
import { ViewClassComponent } from './view-class/view-class.component';
import { ViewClassService } from './view-class/view-class.service';
import { TextboxComponent } from './view-class/textbox/textbox.component';
import { FormsModule } from '@angular/forms';
import {TextFieldModule} from '@angular/cdk/text-field';
import { OverlayModule } from '@angular/cdk/overlay';
import { ControlsComponent } from './view-class/controls/controls.component';
import { FabricShapeService } from './view-class/teacher/shape.service';
import { EventHandlerService } from './view-class/teacher/event-handler.service';

const config: SocketIoConfig = { url: environment.socketUrl, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    ViewClassComponent,
    TeacherComponent,
    StudentComponent,
    TextboxComponent,
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
    DragDropModule,
    TextFieldModule,
    OverlayModule
  ],
  providers: [AppService, ViewClassService, TeacherService, StudentService, FabricShapeService, EventHandlerService],
  bootstrap: [AppComponent],
  entryComponents: [TextboxComponent, ControlsComponent]
})
export class AppModule { }
