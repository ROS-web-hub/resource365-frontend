import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getResources() {
    return this.http.get("/api/resources_lookup");
  }

  getLocations() {
    return this.http.get("/api/resources-location");
  }

  fetchEvents(params: any) {
    return this.http.get("/api/dashboard/events", {
      params,
    });
  }

  getOneRequest(id: any) {
    return this.http.get("/api/requests/one", {
      params: {
        id,
      },
    });
  }
}
