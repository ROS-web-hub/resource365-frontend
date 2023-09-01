import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import {
  FormGroup,
  Validators,
  FormBuilder,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { Router } from "@angular/router";
import {
  NgbActiveModal,
  NgbDate,
  NgbModal,
  NgbModalRef,
} from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { BaseService } from "src/app/core/_services/base.service";
import { ScheduleService } from "../schedule.service";
import * as moment from "moment";
import { ViewRequestComponent } from "src/app/request/view-request/view-request.component";
import { RequestService } from "src/app/request/request.service";
import { map, Observable } from "rxjs";

@Component({
  selector: "app-add-schedule",
  templateUrl: "./add-schedule.component.html",
  styleUrls: ["./add-schedule.component.scss"],
})
export class AddScheduleComponent implements OnInit {
  moment: any = moment;

  @Output() response: EventEmitter<any> = new EventEmitter();
  resources$: any = [];
  scheduleTypes$!: Observable<any>;

  postData: any = {};

  dateValidationMsg = "";
  showInvalidMsg = false;
  availableSchedules = [];
  availableRequests = [];
  newScheduleType: boolean = false;

  selectedRequest!: any;
  modaleRef!: NgbModalRef;
  rangeLimit = 24;

  newForm: FormGroup = this.fb.group(
    {
      resourceId: [null, [Validators.required]],
      type: [null, [Validators.required]],
      details: ["", [Validators.required]],
      fromDate: ["", [Validators.required]],
      toDate: ["", [Validators.required]],
      startDateTime: ["", [Validators.required]],
      endDateTime: ["", [Validators.required]],
    },
    { validator: this.validateDate.bind(this) }
  );

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    // private spinner: NgxSpinnerService,
    private requestService: RequestService,
    private modal: NgbModal,
    private router: Router,
    private baseService: BaseService,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit(): void {
    this.getScheduleTypes();
    this.newForm.get("fromDate")?.valueChanges.subscribe((value) => {
      this.newForm.get("toDate")?.setValue(value);
    });
    this.fetchEssentialData();
  }

  addNewScheduleType() {
    this.newForm.controls["type"].setValue(null);
    this.newScheduleType = !this.newScheduleType;
  }

  getScheduleTypes() {
    this.scheduleTypes$ = this.baseService.getScheduleTypes();
  }

  // disable dates before current date
  isDisabled = (date: NgbDate) => {
    const currentDate = new Date();
    return (
      date.before({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      }) || false
    );
  };

  fetchEssentialData() {}

  validateDate(group: AbstractControl): ValidationErrors | null {
    // here we have the 'requestForm' group
    const fromDate = group.get("fromDate")?.value;
    const toDate = group.get("toDate")?.value;
    const startTime = group.get("startDateTime")?.value;
    const endTime = group.get("endDateTime")?.value;
    if (!fromDate || !toDate || !startTime || !endTime) {
      return null;
    }
    return this.validTimeSlot(fromDate, toDate, startTime, endTime)
      ? null
      : { previousDate: true };
  }

  /**
   * Form submission and validation
   */
  validTimeSlot(
    fromDateString: any,
    toDateString: any,
    startTimeString: any,
    endTimeString: any
  ) {
    let msg = "";
    let isValidFlg = true;

    const fromDate = this._date(fromDateString);
    const toDate = this._date(toDateString);
    const startTime = startTimeString.split(":");
    const endTime = endTimeString.split(":");

    const startDateTime = new Date(fromDate);
    const endDateTime = new Date(toDate);

    startDateTime.setHours(startTime[0]);
    startDateTime.setMinutes(startTime[1]);

    endDateTime.setHours(endTime[0]);
    endDateTime.setMinutes(endTime[1]);

    if (fromDateString === toDateString) {
      if (startTimeString == endTimeString) {
        this.dateValidationMsg = "Start time and end time cannot be the same";
        isValidFlg = false;
      }
    }
    // Check if the start of time slot is less then the end of time slot
    if (startDateTime > endDateTime) {
      this.dateValidationMsg = "Start time must be earlier then end time";
      isValidFlg = false;
    }
    if (startDateTime < new Date()) {
      this.dateValidationMsg =
        "Request date cannot be less then today's date and time";
      isValidFlg = false;
    }
    if (this.calcHourDiff(startDateTime, endDateTime) > this.rangeLimit) {
      this.toastr.warning(`The time range must be in ${this.rangeLimit} hours`);
      isValidFlg = false;
    }

    return isValidFlg;
  }

  calcHourDiff(date1: Date, date2: Date) {
    const diffInMs = date2.getTime() - date1.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours;
  }

  onSubmit() {
    if (this.newForm.invalid) {
      this.showInvalidMsg = true;
      const msg = "Invalid Form";
      const header = "Please fill the required fields...";
      this.toastr.warning(header, msg, {
        positionClass: "toast-top-right",
      });
      document.getElementById("newForm")?.classList.add("input-error");
    } else {
      this.showInvalidMsg = false;
      this.checkScheduleAvailability();
    }
  }

  checkScheduleAvailability() {
    this.postData = {};

    let obj = JSON.parse(JSON.stringify(this.newForm.getRawValue()));

    const startTime = obj.startDateTime.split(":");
    const endTime = obj.endDateTime.split(":");

    let sDateTime = this._date(obj.fromDate);
    sDateTime.setHours(startTime[0]);
    sDateTime.setMinutes(startTime[1]);

    let eDateTime = this._date(obj.toDate);
    eDateTime.setHours(endTime[0]);
    eDateTime.setMinutes(endTime[1]);

    this.postData = {
      resourceId: obj.resourceId,
      details: obj.details,
      type: obj.type,
      date: this._date(obj.fromDate),
      startDateTime: sDateTime,
      endDateTime: eDateTime,
      newScheduleType: this.newScheduleType,
    };

    this.scheduleService
      .checkScheduleAvailability(this.postData)
      .pipe(
        map((data: any) => {
          data.schedules = data.schedules.map((sc: any) => {
            sc.dateRange = `${moment(sc.startDateTime).format(
              "hh:mm A"
            )} to ${moment(sc.endDateTime).format("hh:mm A")}`;
            return sc;
          });

          data.resources = data.resources.map((sc: any) => {
            sc.dateRange = `${moment(sc.startDateTime).format(
              "hh:mm A"
            )} to ${moment(sc.endDateTime).format("hh:mm A")}`;
            return sc;
          });
          return data;
        })
      )
      .subscribe({
        next: (res: any) => {
          if (!res.resources.length && !res.schedules.length) {
            this.submit();
          } else {
            this.availableSchedules = res.schedules;
            this.availableRequests = res.resources;
          }
        },
        error: (err: any) => {
          // this.spinner.hide();
          const msg = "Failed";
          const header = "Please try again...";
          this.toastr.error(header, msg, {
            positionClass: "toast-top-right",
          });
        },
      });
  }

  submit() {
    // let obj = this.newForm.value;
    // let obj = this.newForm.getRawValue()
    // this.spinner.show();
    this.scheduleService.createSchedule(this.postData).subscribe({
      next: (res: any) => {
        this.response.emit(res);
        const msg = "Record created successfully";
        const header = "Success";
        this.toastr.success(header, msg, {
          positionClass: "toast-top-right",
        });
        this.closeModal();
      },
      error: (err: any) => {
        // this.spinner.hide();
        const msg = "Failed";
        const header = "Please try again...";
        this.toastr.error(header, msg, {
          positionClass: "toast-top-right",
        });
      },
    });
  }

  closeModal() {
    this.activeModal.close();
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

  _date(dateString: any) {
    return new Date(`${dateString.year}-${dateString.month}-${dateString.day}`);
  }
}
