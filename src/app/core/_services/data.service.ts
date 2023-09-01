import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class DataService {
  constructor(private http: HttpClient) {}

  getStudios() {
    return this.http.get(`/api/resources_lookup`, {
      params: { type: "STUDIO" },
    });
  }

  getControlRooms() {
    return this.http.get(`/api/resources_lookup`, {
      params: { type: "CONTROL_ROOM" },
    });
  }

  getChannels() {
    return this.http.get(`/api/channels_lookup`);
  }

  getShootTypes() {
    return this.http.get(`/api/shoot-types`);
  }

  getUserPreferences() {
    return this.http.get(`/api/users/one`);
  }

  upu(data: any, updateField: string) {
    return this.http.post("/api/users/update/preferences", {
      data,
      updateField,
    });
  }

  updateUserProfile(id: any, data: any) {
    return this.http.post("/api/users/profile-image", data, { params: { id } });
  }
}
