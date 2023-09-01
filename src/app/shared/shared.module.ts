import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ViewRequestComponent } from '../request/view-request/view-request.component';
import { CoreModule } from '../core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    ViewRequestComponent
  ],
  imports: [
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    NgbModule
  ],
  exports: [
    FooterComponent,
    NavbarComponent,
    ViewRequestComponent
  ]
})
export class SharedModule { }
