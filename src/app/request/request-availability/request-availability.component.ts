import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";
import { NgxSpinnerService } from "ngx-spinner";
import { RequestService } from "../request.service";
import { ViewRequestComponent } from "../view-request/view-request.component";
@Component({
  selector: "app-request-availability",
  templateUrl: "./request-availability.component.html",
  styleUrls: ["./request-availability.component.scss"],
})
export class RequestAvailabilityComponent implements OnInit {
  @Input() request: any;
  @Input() eventType!: any;
  initialRequest!: any;
  start!: string;
  end!: string;
  newTimeSlotAvailable: any = null;
  validTimeslot = true;
  selectedRequest!: any;
  modaleRef!: NgbModalRef;
  @Output() timeSlotChanged: EventEmitter<any> = new EventEmitter();
  constructor(
    private requestService: RequestService,
    private spinner: NgxSpinnerService,
    private modal: NgbModal
  ) {}

  ngOnInit(): void {
    this.initialRequest = JSON.parse(JSON.stringify(this.request));
  }

  viewRequestDetails(requestId: any) {
    this.requestService.findOne(requestId).subscribe((data: any) => {
      this.selectedRequest = data.request;
      this.openRequestViewModal();
    });
  }

  openRequestViewModal() {
    this.modaleRef = this.modal.open(ViewRequestComponent, { size: "lg" });
    this.modaleRef.componentInstance.request = this.selectedRequest;
    this.modaleRef.componentInstance.showActions = false;
  }

  resetRequest() {
    if (this.request.edited) {
      this.request = this.request.initialState;
      this.timeSlotChanged.emit(this.request);
    }
  }

  validateTimslots() {
    if (this.start && this.end) {
      const startTime = moment(this.start, "hh:mm");
      const endTime = moment(this.end, "hh:mm");
      this.validTimeslot = endTime.isAfter(startTime);
    }
  }

  updateTimeSlot() {
    if (this.start && this.end) {
      const startTime = this.start.split(":");
      const endTime = this.end.split(":");

      const startDateTime = moment(this.request.request.startDateTime)
        .hours(Number(startTime[0]))
        .minutes(Number(startTime[1]));
      const endDateTime = moment(this.request.request.endDateTime)
        .hours(Number(endTime[0]))
        .minutes(Number(endTime[1]));

      const params = {
        resourceIds: this.request.resourceIds,
      };

      const data = [
        {
          startDateTime: startDateTime.toDate(),
          endDateTime: endDateTime.toDate(),
        },
      ];

      this.spinner.show(this.request.id);
      this.requestService.checkSlotAvailability(params, data).subscribe({
        next: (res: any) => {
          this.spinner.hide(this.request.id);
          if (!res[0].isAvailable) {
            this.newTimeSlotAvailable = false;
            // this.request = res[0];
          } else {
            this.newTimeSlotAvailable = true;
            const initialState = JSON.parse(JSON.stringify(this.request));
            // For single requests it is always of size 1
            this.request = res[0];
            this.request.id = initialState.id;
            this.request.edited = true;
            this.request.initialState = initialState;

            this.timeSlotChanged.emit(this.request);
          }
        },
        error: (err) => {
          this.spinner.hide(this.request.id);
          console.log("Error occured: ", err);
        },
      });
    }
  }
}
