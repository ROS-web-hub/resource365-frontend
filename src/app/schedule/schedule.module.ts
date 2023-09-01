import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ScheduleComponent } from './schedule.component'
import { Routes, RouterModule } from '@angular/router'
import { ViewScheduleComponent } from './view-schedule/view-schedule.component'
import { AddScheduleComponent } from './add-schedule/add-schedule.component'
import { EditScheduleComponent } from './edit-schedule/edit-schedule.component'
import { ReactiveFormsModule } from '@angular/forms'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgSelectModule } from '@ng-select/ng-select'

const routes: Routes = [
  {
    path: '',
    component: ScheduleComponent,
    pathMatch: 'full',
  },
]

@NgModule({
  declarations: [
    ScheduleComponent,
    ViewScheduleComponent,
    AddScheduleComponent,
    EditScheduleComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgbModule,
    ReactiveFormsModule,
    NgSelectModule,
  ],
})
export class ScheduleModule {}
