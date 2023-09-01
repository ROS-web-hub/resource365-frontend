import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
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
import { map, Observable } from "rxjs";
import { RequestService } from "src/app/request/request.service";
import { ViewRequestComponent } from "src/app/request/view-request/view-request.component";

@Component({
  selector: "app-edit-schedule",
  templateUrl: "./edit-schedule.component.html",
  styleUrls: ["./edit-schedule.component.scss"],
})
export class EditScheduleComponent implements OnInit {
  moment: any = moment;

  @Output() response: EventEmitter<any> = new EventEmitter();
  @Input() data: any;
  editForm!: FormGroup;

  postData: any = {};

  dateValidationMsg = "";
  showInvalidMsg = false;

  resources$: any = [];
  scheduleTypes$!: Observable<any>;
  newScheduleType: boolean = false;
  availableSchedules = [];
  availableRequests = [];
  rangeLimit = 24;

  selectedRequest!: any;
  modaleRef!: NgbModalRef;

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

  constructor(
    private activeModal: NgbActiveModal,
    // private spinner: NgxSpinnerService,
    private requestService: RequestService,
    private modal: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private baseService: BaseService,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit(): void {
    this.getScheduleTypes();
    this.initializeForm();
    this.fetchEssentialData();
  }

  getScheduleTypes() {
    this.scheduleTypes$ = this.baseService.getScheduleTypes();
  }

  addNewScheduleType() {
    this.editForm.controls["type"].setValue(null);
    this.newScheduleType = !this.newScheduleType;
  }

  initializeForm() {
    const date1 = new Date(this.data.startDateTime);
    const date2 = new Date(this.data.endDateTime);
    const ngbDate1 = {
      year: date1.getFullYear(),
      month: date1.getMonth() + 1,
      day: date1.getDate(),
    };
    const ngbDate2 = {
      year: date2.getFullYear(),
      month: date2.getMonth() + 1,
      day: date2.getDate(),
    };

    this.editForm = this.fb.group(
      {
        resourceId: [this.data.resourceId?._id, [Validators.required]],
        type: [this.data.type?._id, [Validators.required]],
        details: [this.data.details, [Validators.required]],
        fromDate: [ngbDate1, [Validators.required]],
        toDate: [ngbDate2, [Validators.required]],
        // date: [moment(this.data.date).format("DD/MM/YYYY"), [Validators.required]],
        startDateTime: [
          moment(this.data.startDateTime).format("HH:mm"),
          [Validators.required],
        ],
        endDateTime: [
          moment(this.data.endDateTime).format("HH:mm"),
          [Validators.required],
        ],
      },
      { validator: this.validateDate.bind(this) }
    );
    this.editForm.get("fromDate")?.valueChanges.subscribe((value) => {
      this.editForm.get("toDate")?.setValue(value);
    });
  }

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

  fetchEssentialData() {}

  closeModal() {
    this.activeModal.close();
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.showInvalidMsg = true;
      const msg = "Invalid Form";
      const header = "Please fill the required fields...";
      this.toastr.error(header, msg, {
        positionClass: "toast-top-right",
      });
      document.getElementById("editForm")?.classList.add("input-error");
    } else {
      this.showInvalidMsg = false;
      this.checkScheduleAvailability();
    }
  }

  checkScheduleAvailability() {
    this.postData = {};

    let obj = JSON.parse(JSON.stringify(this.editForm.getRawValue()));
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
      scheduleId: this.data._id,
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
    // this.spinner.show();
    this.scheduleService
      .updateSchedule(this.data.scheduleId, this.postData)
      .subscribe(
        (res: any) => {
          this.response.emit(res);
          // this.spinner.hide();
          const msg = "Record successfully updated";
          const header = "Success";
          this.toastr.success(header, msg, {
            positionClass: "toast-top-right",
          });
          this.closeModal();
        },
        (err: any) => {
          // this.spinner.hide();
          const msg = "Failed";
          const header = "Please try again...";
          this.toastr.error(header, msg, {
            positionClass: "toast-top-right",
          });
        }
      );
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
