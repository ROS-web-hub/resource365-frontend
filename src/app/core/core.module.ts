import { NgModule } from "@angular/core";
import { AgePipe } from "./_pipe/age.pipe";
import { AuthorityPipe } from "./_pipe/authority.pipe";

@NgModule({
    declarations: [ AuthorityPipe ],
    imports: [],
    providers: [],
    exports: [ AuthorityPipe ]
})
export class CoreModule { }