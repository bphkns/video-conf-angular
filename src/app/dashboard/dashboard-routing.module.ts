import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActiveClassesComponent } from './active-classes/active-classes.component';
import { DashboardHomeComponent } from './container/home.component';
import { CreateClassComponent } from './create-class/create-class.component';
import { TeacherGuard } from './teacher.guard';


const routes: Routes = [
    {
        path: '',
        component: DashboardHomeComponent,
        children: [
            {
                path: '',
                redirectTo: 'active-classes',
                pathMatch: 'full'
            },
            {
                path: 'active-classes',
                component: ActiveClassesComponent
            },
            {
                path: 'create-class',
                component: CreateClassComponent,
                canActivate: [TeacherGuard]
            },

        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
