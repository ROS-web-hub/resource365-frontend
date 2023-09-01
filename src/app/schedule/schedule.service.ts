import { HttpClient, HttpParams, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ScheduleService {
  private baseUrl = "/api";

  constructor(private http: HttpClient) {}

  getScheduleList(page: number, limit: number) {
    return this.http.get(
      `${this.baseUrl}/schedules/list?page=${page}&size=${limit}`
    );
  }

  checkScheduleAvailability(data: any) {
    let PARAMS = new HttpParams()
      .set("startDateTime", data.startDateTime)
      .set("endDateTime", data.endDateTime)
      .set("resourceId", data.resourceId)
      .set("scheduleId", data.scheduleId);
    return this.http.get(`${this.baseUrl}/schedules/check-availability`, {
      params: PARAMS,
    });
  }

  createSchedule(data: any) {
    return this.http.post(`${this.baseUrl}/schedules/new`, data);
  }

  getScheduleById(id: any) {
    return this.http.get(`${this.baseUrl}/schedules/${id}`);
  }

  updateSchedule(id: any, data: any) {
    return this.http.post(`${this.baseUrl}/schedules/update`, data);
  }

  updateScheduleStatus(id: any, status: any) {
    let PARAMS = new HttpParams().set("id", id).set("status_to_change", status);

    return this.http.post(
      `${this.baseUrl}/schedules/update-status`,
      {},
      { params: PARAMS }
    );
  }

  // deleteSchedule(id: any) {
  // 	return this.http.delete(`${this.baseUrl}/schedules/${id}`);
  // }
}
