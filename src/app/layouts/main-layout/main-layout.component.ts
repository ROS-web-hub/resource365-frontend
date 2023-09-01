// for the local demo main-layout.component
import { ChangeDetectorRef, Component, Inject, OnInit } from "@angular/core";
import { OKTA_AUTH } from "@okta/okta-angular";
import OktaAuth from "@okta/okta-auth-js";
import { AuthService } from "src/app/core/_services/auth.service";

@Component({
  selector: "app-main-layout",
  templateUrl: "./main-layout.component.html",
  styleUrls: ["./main-layout.component.scss"],
})
export class MainLayoutComponent implements OnInit {
  render = true;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(OKTA_AUTH) private _oktaAuth: OktaAuth
  ) {}

  ngOnInit(): void {
    // const auths: any =  this.authService.getAuthorities();
    // if (!auths || auths?.length==0) {
    // 	this.getConfig();
    // }
  }

  async getConfig() {
    this.render = false;

    const user: any = await this._oktaAuth.getUser();
    this.authService.setOktaUserInfo(user);

    this.authService.getConfig().subscribe({
      next: (res: any) => {
        this.render = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
      },
    });
  }
}
