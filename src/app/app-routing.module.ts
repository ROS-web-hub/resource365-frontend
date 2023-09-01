//for the local demo app-routing.module
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { OktaAuthGuard, OktaCallbackComponent } from '@okta/okta-angular'
import { AuthGuard } from './core/_guards/auth.guard'
import { HomeComponent } from './home/home.component'
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component'
import { ProfileComponent } from './profile/profile.component'
import { EditRequestComponent } from './request/edit-request/edit-request.component'
import { RequestComponent } from './request/request.component'

const routes: Routes = [
  {
    path: '',
    // canActivate: [AuthGuard],
    // canActivate: [OktaAuthGuard],
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: '/approvals',
        pathMatch: 'full',
      },
      {
        path: 'approvals',
        component: HomeComponent,
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'my-bookings',
        loadChildren: () =>
          import('./appointment/appointment.module').then(
            (m) => m.AppointmentModule
          ),
      },
      {
        path: 'schedules',
        loadChildren: () =>
          import('./schedule/schedule.module').then((m) => m.ScheduleModule),
      },
      {
        path: 'request/new',
        component: RequestComponent,
      },
      {
        path: 'request/edit/:id',
        component: EditRequestComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./admin/admin.module').then((m) => m.AdminModule),
      },
      {
        path: 'support',
        loadChildren: () =>
          import('./support/support.module').then((m) => m.SupportModule),
      },
    ],
  },
  { path: 'login/callback', component: OktaCallbackComponent },

  // {
  // 	path: '',
  // 	// component: MainLayoutComponent,
  // 	children: [
  // 		{
  // 			path: '',
  // 			loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  // 		},
  // 	],
  // },
  {
    path: '**',
    redirectTo: 'approvals',
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }

