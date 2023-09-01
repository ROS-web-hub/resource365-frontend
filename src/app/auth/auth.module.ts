import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSpinnerModule } from 'ngx-spinner';

const routes: Routes = [
	{
		path: 'login',
		component: LoginComponent,
		pathMatch:  'full'
	},
	// {
	// 	path: 'register',
	// 	component: RegisterComponent,
	// 	pathMatch:  'full'
	// },
];

@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
	RouterModule.forChild(routes),
	FormsModule,
	NgxSpinnerModule,
	TranslateModule.forChild(),
    ReactiveFormsModule,
  ]
})
export class AuthModule { }
