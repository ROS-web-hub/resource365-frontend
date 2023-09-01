import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { Routes, RouterModule } from '@angular/router';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CoreModule } from '../core/core.module';
import { NgxSpinnerModule } from 'ngx-spinner';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    pathMatch: 'full',
  },
]

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    NgxSpinnerModule,
    CoreModule,
    NgbModalModule,
    RouterModule.forChild(routes),
  ]
})
export class DashboardModule { }
