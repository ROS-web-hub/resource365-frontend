import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UserComponent } from './user/user.component'
import { ResourceComponent } from './resource/resource.component'
import { ChannelComponent } from './channel/channel.component'
import { RouterModule, Routes } from '@angular/router'
import { AddResourceComponent } from './resource/add-resource/add-resource.component'
import { EditResourceComponent } from './resource/edit-resource/edit-resource.component'
import { ViewResourceComponent } from './resource/view-resource/view-resource.component'
import { AddChannelComponent } from './channel/add-channel/add-channel.component'
import { EditChannelComponent } from './channel/edit-channel/edit-channel.component'
import { ViewChannelComponent } from './channel/view-channel/view-channel.component'
import { ReactiveFormsModule } from '@angular/forms'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgSelectModule } from '@ng-select/ng-select'
import { ViewUserComponent } from './user/view-user/view-user.component'
import { EditUserComponent } from './user/edit-user/edit-user.component'
import { ScheduleTypeComponent } from './schedule-type/schedule-type.component'
import { AddScheduleTypeComponent } from './schedule-type/add-schedule-type/add-schedule-type.component'
import { ViewScheduleTypeComponent } from './schedule-type/view-schedule-type/view-schedule-type.component'
import { EditScheduleTypeComponent } from './schedule-type/edit-schedule-type/edit-schedule-type.component'
import { ShootTypeComponent } from './shoot-type/shoot-type.component'
import { AddShootTypeComponent } from './shoot-type/add-shoot-type/add-shoot-type.component'
import { ViewShootTypeComponent } from './shoot-type/view-shoot-type/view-shoot-type.component'
import { EditShootTypeComponent } from './shoot-type/edit-shoot-type/edit-shoot-type.component'
import { ResourceTypeComponent } from './resource-type/resource-type.component'
import { EditResourceTypeComponent } from './resource-type/edit-resource-type/edit-resource-type.component'
import { ViewResourceTypeComponent } from './resource-type/view-resource-type/view-resource-type.component'
import { AddResourceTypeComponent } from './resource-type/add-resource-type/add-resource-type.component'
import { DragDropModule } from '@angular/cdk/drag-drop'

const routes: Routes = [
  {
    path: 'users',
    component: UserComponent,
    pathMatch: 'full',
  },
  {
    path: 'resources',
    component: ResourceComponent,
    pathMatch: 'full',
  },
  {
    path: 'channels',
    component: ChannelComponent,
    pathMatch: 'full',
  },
  {
    path: 'schedule-types',
    component: ScheduleTypeComponent,
    pathMatch: 'full',
  },
  {
    path: 'shoot-types',
    component: ShootTypeComponent,
    pathMatch: 'full',
  },
  {
    path: 'resource-types',
    component: ResourceTypeComponent,
    pathMatch: 'full',
  },
]

@NgModule({
  declarations: [
    UserComponent,
    ResourceComponent,
    ChannelComponent,
    AddResourceComponent,
    EditResourceComponent,
    ViewResourceComponent,
    AddChannelComponent,
    EditChannelComponent,
    ViewChannelComponent,
    ViewUserComponent,
    EditUserComponent,
    AddResourceTypeComponent,
    ScheduleTypeComponent,
    AddScheduleTypeComponent,
    ViewScheduleTypeComponent,
    EditScheduleTypeComponent,
    ShootTypeComponent,
    AddShootTypeComponent,
    ViewShootTypeComponent,
    EditShootTypeComponent,
    ResourceTypeComponent,
    EditResourceTypeComponent,
    ViewResourceTypeComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgbModule,
    ReactiveFormsModule,
    NgSelectModule,
    DragDropModule,
  ],
})
export class AdminModule {}
