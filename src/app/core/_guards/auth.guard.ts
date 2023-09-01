import { Injectable } from "@angular/core";
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  ActivatedRoute,
} from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "../_services/auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> {
    if (this.authService.isLoggedIn()) {
      // We have to fetch the authorities on load
      if (
        this.authService.getAuthorities() &&
        this.authService.getAuthorities().length
      ) {
        return true;
      }

      return this.authService.getConfig().pipe(
        map((conf) => {
          this.authService.saveConfig(conf);
          return true;
        })
      );
    } else {
      // Store the attempted URL for redirecting
      if (state.url != "/login") {
        this.authService.redirectUrl = state.url;
      }

      // Navigate to the login page with extras
      this.router.navigate(["/login"], {
        queryParams: {
          redirectUrl: this.authService.redirectUrl,
        },
      });
      return false;
    }
  }
}
