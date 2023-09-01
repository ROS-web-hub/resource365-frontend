import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { of } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    API_URL = '/api/requests/appointments';

    constructor(
        private http: HttpClient
    ) {}

    getAppointments(limit: any, skip: any, interval: any) {
        return this.http.get(`${this.API_URL}`, {
            params: {
                limit, skip, interval
            }
        });
    }

}