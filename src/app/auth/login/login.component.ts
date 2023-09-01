import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from "ngx-toastr";
import { AuthService } from "src/app/core/_services/auth.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  showInvalidMsg = false;
  form = new FormGroup({
    username: new FormControl(null, Validators.required),
    password: new FormControl(null, Validators.required),
  });

  showCreateAccount = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {}

  changePage() {
    this.showCreateAccount = !this.showCreateAccount;
  }

  submitForm() {
    if (this.form.invalid) {
      this.showInvalidMsg = true;
      return;
    }

    this.spinner.show();
    this.authService
      .login(
        this.form.get("username")?.value || "",
        this.form.get("password")?.value || ""
      )
      .subscribe({
        next: (response: any) => {
          this.spinner.hide();
          this.route.queryParamMap.subscribe((queryParams) => {
            const redirectUrl = queryParams.get("redirectUrl");
            this.router.navigate([redirectUrl || "/approvals"]);
          });
        },
        error: (err: any) => {
          this.spinner.hide();
          console.log(err);
          if (err.status == 401) {
            const msg = "Failed";
            const header = err.error.message;
            this.toastr.error(header, msg, {
              positionClass: "toast-top-right",
            });
          }
        },
      });
  }
}
