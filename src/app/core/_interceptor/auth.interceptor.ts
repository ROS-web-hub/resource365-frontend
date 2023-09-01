import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { map, catchError, retry } from "rxjs/operators";
import { Inject, Injectable } from "@angular/core";
import { AuthService } from "../_services/auth.service";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { OKTA_AUTH } from "@okta/okta-angular";
import OktaAuth from "@okta/okta-auth-js";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    @Inject(OKTA_AUTH) private _oktaAuth: OktaAuth,
    private authService: AuthService
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(this.addAuthHeaderToAllowedOrigins(request));
  }

  private addAuthHeaderToAllowedOrigins(
    request: HttpRequest<unknown>
  ): HttpRequest<unknown> {
    let req = request;
    const allowedOrigins = ["/api/"];
    if (!!allowedOrigins.find((origin) => request.url.includes(origin))) {
      const authToken = this._oktaAuth.getAccessToken();
      req = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`,
          "Full-Name": this.authService.oktaUserInfo?.name || "",
        },
      });
    }

    return req;
  }

  // constructor(private authService: AuthService, private router: Router,
  //     private toastrService: ToastrService) { }

  // intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
  //     console.log('Inside the interceptor', request);

  //     if (this.authService.token != null) {
  //         request = request.clone({
  //             headers: request.headers.set('Authorization', `Bearer ` + this.authService.token),
  //         });
  //     }else if (this.router.url != '/login'){
  //         this.router.navigateByUrl("/login");
  //     }

  //     return next.handle(request).pipe(
  //         map((event: HttpEvent<any>) => {
  //             return event;
  //         }),
  //         catchError((error: HttpErrorResponse) => {
  //             // console.error(error);
  //             if (error.status === 401) {
  //                 if (this.router.url != '/login') {
  //                     this.authService.redirectUrl = this.router.url;
  //                     this.router.navigate(['login'], { queryParams: { redirectUrl: this.router.url } });
  //                 }
  //             }

  //             /**
  //              * Handle the constraint voilation error messages here
  //              */
  //             else if (error.status === 500) { // INTERNA SERVER ERROR
  //                 const errorsMessages = error.error?.errors;
  //                 let msgs = '';
  //                 if (errorsMessages && errorsMessages.length) {
  //                     errorsMessages.forEach((e: any) => {
  //                         msgs += `${e.split(':')[1]} \n`;
  //                     });
  //                 }

  //                 if (error.error.message) {
  //                     msgs = error.error.message;
  //                 }

  //                 this.toastrService.error(msgs);
  //                 console.log(errorsMessages);
  //             }

  //             else if (error.status === 404) { // INTERNA SERVER ERROR
  //                 this.toastrService.error(error.error?.message || 'error occured');
  //             }

  //             else if (error.status == 504) { // Gateway timeout
  //                 let msg = error.error || 'Error occured';
  //                 this.toastrService.error(msg);
  //             }

  //             /**
  //              * Fallback to a general error message
  //              */
  //             else {
  //                 const errorsMessages = error.error?.errors;
  //                 let msgs = '';
  //                 if (errorsMessages) {
  //                     errorsMessages.forEach((e: any) => {
  //                         msgs += `${e} \n`;
  //                     });
  //                 }
  //                 msgs =  msgs || 'Error occured';
  //                 this.toastrService.error(msgs);
  //             }

  //             return throwError(error);
  //         })
  //     );
  // }
}

export const AuthInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
};
