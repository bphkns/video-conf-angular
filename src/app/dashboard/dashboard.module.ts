import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { SocketIoModule } from 'ngx-socket-io';
import { TimeAgoPipe } from 'time-ago-pipe';
import { AuthModule } from '../auth/auth.module';
import { ActiveClassesComponent } from './active-classes/active-classes.component';
import { ClassService } from './class.service';
import { DashboardHomeComponent } from './container/home.component';
import { CreateClassComponent } from './create-class/create-class.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TeacherGuard } from './teacher.guard';

@NgModule({
    imports: [
        CommonModule,
        DashboardRoutingModule,
        ClarityModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        AuthModule,
        SocketIoModule,
        HttpClientModule
    ],
    declarations: [DashboardHomeComponent, ActiveClassesComponent, CreateClassComponent, TimeAgoPipe],
    providers: [TeacherGuard, ClassService]
})
export class DashboardModule { }
