import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { OktaAuthStateService, OKTA_AUTH } from '@okta/okta-angular';
import OktaAuth, { AuthState } from '@okta/okta-auth-js';
import { filter, map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { Globals } from 'src/app/core/_helper/globals';
import { AuthService } from 'src/app/core/_services/auth.service';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
	userName = '';

	public name$!: Observable<string>;

	constructor(private authService: AuthService, private globals: Globals,
		private _oktaAuthStateService: OktaAuthStateService,
		@Inject(OKTA_AUTH) private _oktaAuth: OktaAuth) { }

	ngOnInit(): void {
		this.name$ = this._oktaAuthStateService.authState$.pipe(
			filter((authState: AuthState) => !!authState && !!authState.isAuthenticated),
			map((authState: AuthState) => authState.idToken?.claims.name ?? '')
		);

		this.authService.userCredentials$.subscribe(data => {
			if(data) {
				this.userName = data.credentials?.firstName + ' ' + data.credentials?.lastName;
			} else {
				this.userName = '';
			}
		})

		
	}

	logout() {
		this.authService.logout();
	}

	public async signOut(): Promise<void> {
		await this._oktaAuth.signOut();
	}

}
