import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Routes } from '@angular/router'
import { ReactiveFormsModule } from '@angular/forms'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgSelectModule } from '@ng-select/ng-select'
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FaqComponent } from './faq/faq.component';
import { CreateSupportCaseComponent } from "./create-support-case/create-support-case.component";

const routes: Routes = [
    {
        path: 'faq',
        component: FaqComponent,
        pathMatch: 'full',
    },
    {
        path: 'create-support-case',
        component: CreateSupportCaseComponent,
        pathMatch: 'full',
    }
]

@NgModule({
    declarations: [
        FaqComponent,
        CreateSupportCaseComponent
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
export class SupportModule { }
