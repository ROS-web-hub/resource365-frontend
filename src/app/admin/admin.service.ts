import { HttpClient, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AdminService {
  private baseUrl = "/api";

  constructor(private http: HttpClient) { }

  getResourceList(page: number, limit: number) {
    return this.http.get(
      `${this.baseUrl}/resources/list?page=${page}&size=${limit}`
    );
  }

  getFilteredResourceList(
    page: number,
    limit: number,
    filterData: any,
    sortBy: string
  ) {
    return this.http.post(`${this.baseUrl}/resources/filtered-list`, {
      filterData,
      page,
      size: limit,
      sortBy,
    });
  }

  getAllResources(filterData: any, sortBy: string) {
    return this.http.post(`${this.baseUrl}/resources/all`, {
      filterData,
      sortBy,
    });
  }

  updateResourceOrders(orders: any[]) {
    return this.http.post(`${this.baseUrl}/resources/update-order`, orders);
  }

  createResource(data: any, preferences = "") {
    return this.http.post(`${this.baseUrl}/resources/new`, data);
  }

  createResourceType(data: { resourceType: string; recordingType: string }) {
    return this.http.post(`${this.baseUrl}/resource-type/new`, data);
  }

  getResourceType(recordingType?: string) {
    return this.http.get(
      `${this.baseUrl}/resource-type?recordingType=${recordingType}`
    );
  }

  updateResourceType(id: any, data: any) {
    return this.http.post(`${this.baseUrl}/resource-types/${id}`, data);
  }

  getResourceTypes(page: number, limit: number) {
    return this.http.get(
      `${this.baseUrl}/resource-types?page=${page}&size=${limit}`
    );
  }

  deletedReourcetype(id: any) {
    return this.http.delete(`${this.baseUrl}/resource-type/${id}`);
  }

  ActiveResourceType(id: any) {
    return this.http.get(`${this.baseUrl}/resource-type_active/${id}`);
  }

  getResources() {
    return this.http.get(`${this.baseUrl}/resources_lookup`);
  }

  getRecordType(_id?: string) {
    return this.http.get(`${this.baseUrl}/recording-type?_id=${_id ?? ""}`);
  }

  updateRecordingType(obj: any) {
    return this.http.put(`${this.baseUrl}/recording-type`, obj);
  }

  getResourceByType(type: string) {
    return this.http.get(`${this.baseUrl}/resources-by-type?type=${type}`);
  }

  getResourceById(id: any) {
    return this.http.get(`${this.baseUrl}/resources/${id}`);
  }

  updateResource(id: any, data: any) {
    return this.http.post(`${this.baseUrl}/resources/${id}`, data);
  }

  deleteResource(id: any) {
    return this.http.delete(`${this.baseUrl}/resources/${id}`);
  }

  ActiveResource(id: any) {
    return this.http.get(`${this.baseUrl}/resources_active/${id}`);
  }

  getChannelList(page: number, limit: number) {
    return this.http.get(
      `${this.baseUrl}/channels/list?page=${page}&size=${limit}`
    );
  }

  createChannel(data: any) {
    return this.http.put(`${this.baseUrl}/channels`, data);
  }

  getChannelById(id: any) {
    return this.http.get(`${this.baseUrl}/channels/${id}`);
  }

  updateChannel(id: any, data: any) {
    return this.http.post(`${this.baseUrl}/channels/${id}`, data);
  }

  deleteChannel(id: any) {
    return this.http.delete(`${this.baseUrl}/channels/${id}`);
  }

  ActiveChannel(id: any) {
    return this.http.get(`${this.baseUrl}/channels_active/${id}`);
  }

  getUserList(page: number, limit: number) {
    return this.http.get(
      `${this.baseUrl}/users/list?page=${page}&size=${limit}`
    );
  }

  getUserListAll() {
    return this.http.get(`${this.baseUrl}/users/all`);
  }

  getUserById(id: any) {
    return this.http.get(`${this.baseUrl}/users/${id}`);
  }

  updateUser(id: any, data: any) {
    return this.http.post(`${this.baseUrl}/users/${id}`, data);
  }

  getUserAllPermissions() {
    return this.http.get(`${this.baseUrl}/users/permissions`);
  }

  getScheduleTypes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/schedule-types`);
  }

  getScheduleTypeList(page: number, limit: number) {
    return this.http.get(
      `${this.baseUrl}/schedule-type/list?page=${page}&size=${limit}`
    );
  }

  getUsedScheduleTypes() {
    return this.http.get(`${this.baseUrl}/schedule-type-used`);
  }

  createScheduleType(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/schedule-type`, data);
  }

  updateScheduleType(id: any, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/schedule-type/${id}`, data);
  }

  deleteScheduleType(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/schedule-type/${id}`);
  }

  ActiveScheduleType(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/schedule-type_active/${id}`);
  }

  getShootTypes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/shoot-types`);
  }

  getShootTypeList(page: number, limit: number) {
    return this.http.get(
      `${this.baseUrl}/shoot-type/list?page=${page}&size=${limit}`
    );
  }

  getUsedShootTypes() {
    return this.http.get(`${this.baseUrl}/shoot-type-used`);
  }

  createShootType(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/shoot-type`, data);
  }

  updateShootType(id: any, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/shoot-type/${id}`, data);
  }

  deleteShootType(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/shoot-type/${id}`);
  }

  ActiveShootType(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/shoot-type_active/${id}`);
  }

  updateCalendarType(viewType: any, filterData: any) {
    return this.http.post(`${this.baseUrl}/update_calendar_type`, { viewType, filterData });
  }

  getCalendarType() {
    return this.http.get(`${this.baseUrl}/get_calendar_type`);
  }
  updateTimeSlot(timeslot: any) {
    return this.http.post(`${this.baseUrl}/update_timeslot`, { timeslot });
  }
  getTimeSlot() {
    return this.http.get(`${this.baseUrl}/get_timeslot`);
  }
  setAllResourcesToggle(flag: any) {
    return this.http.post(`${this.baseUrl}/set_allresources_toggle`, { flag });
  }
  getDefaultResourcesToggles() {
    return this.http.get(`${this.baseUrl}/getDefaultToggle`);
  }
}
