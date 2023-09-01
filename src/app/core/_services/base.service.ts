import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class BaseService {
  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<any> {
    return this.http.get(`/api/users/profile`);
  }

  getHomeSummary(): Observable<any> {
    return this.http.get(`/api/home`);
  }

  getRequestListByStatus(page: number, limit: number, type: string) {
    return this.http.get(
      `/api/requests/pending?page=${page}&size=${limit}&type=${type}`
    );
  }

  getRequestListByFilter(
    skip: number,
    limit: number,
    search: { searchKey: string; status: boolean },
    filter: any,
    sortBy: string
  ) {
    return this.http.post("/api/requests/home", {
      skip,
      limit,
      search,
      filter,
      sortBy,
    });
  }

  getResources(): Observable<any> {
    return this.http.get(`/api/resources_lookup`);
  }

  getScheduleTypes(): Observable<any> {
    return this.http.get(`/api/schedule-types`);
  }

  createScheduleType(): Observable<any> {
    return this.http.get(`/api/schedule-type`);
  }

  updateUserPreferenceFilters(filters: any): Observable<any> {
    return this.http.post(`/api/users/preferences/filters`, filters);
  }

  updateUserProfile(id: any, data: any) {
    return this.http.post("/api/users/profile-image", data, { params: { id } });
  }
}
