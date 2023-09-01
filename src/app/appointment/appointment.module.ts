import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentComponent } from './appointment.component';
import { Routes, RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  {
    path: '',
    component: AppointmentComponent,
    pathMatch: 'full',
  },
]

@NgModule({
  declarations: [
    AppointmentComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule.forChild(routes),
  ]
})
export class AppointmentModule { }
