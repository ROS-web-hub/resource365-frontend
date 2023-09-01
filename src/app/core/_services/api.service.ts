import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
    constructor(private http: HttpClient) {}

    login(username: string, password: string) {
        return this.http.post(environment.apiUrl + '/api/users/login', { username, password });
    }

}