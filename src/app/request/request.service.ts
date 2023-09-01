import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  constructor(private http: HttpClient) {}

  checkSlotAvailability(params: any, data: any = null) {
    return this.http.post(`/api/requests/check-availability`, data, {
      params,
    })
  }

  findOne(requestId: any) {
    return this.http.get(`/api/requests/_one`, {
      params: {
        id: requestId,
      },
    })
  }

  saveRequest(data: any, eventType: any) {
    return this.http.post(`/api/requests/new`, data, {
      params: {
        type: eventType,
      },
    })
  }

  updateRequest(requestId: any, data: any) {
    return this.http.post(`/api/requests/update`, data, {
      params: { requestId: requestId },
    })
  }

  approveRequest(requestId: any) {
    return this.http.put('/api/requests/approve', null, {
      params: {
        request_id: requestId,
      },
    })
  }

  deleteRequest(requestId: any) {
    return this.http.put('/api/requests/delete', null, {
      params: {
        request_id: requestId,
      },
    })
  }

  rejectMultiRequest(requestIds: string[]) {
    return this.http.put('/api/requests/mass-delete', requestIds)
  }

  changeRequestStatus(
    requestId: any,
    requestStatus: any,
    userId: any,
    resourceIds: any,
    note = ''
  ) {
    return this.http.put('/api/requests/change-status', null, {
      params: {
        request_id: requestId,
        status_to_change: requestStatus,
        user_id: userId,
        resource_ids: resourceIds,
        note: note,
      },
    })
  }

  changeMultiRequestStatus(requestIds: string[], requestedStatusChange: any) {
    return this.http.put('/api/requests/multi-change-status', {
      requestIds,
      requestedStatusChange,
    })
  }

  getResourceOwnersOfRequest(requestId: any) {
    return this.http.get('/api/requests/resource-owners', {
      params: {
        request_id: requestId,
      },
    })
  }
  downloadFile(filename: string) {
    return this.http.get('/api/downloadFile', {
      responseType: 'blob' as 'json',
      params: {
        name: filename,
      },
    })
  }
}
