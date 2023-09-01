import {
  CdkStepper,
  CdkStepperNext,
  StepperSelectionEvent,
} from "@angular/cdk/stepper";

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ValidationErrors,
  Validators,
} from "@angular/forms";


import { map, Observable, of } from "rxjs";

import { v4 as uuid } from "uuid";
import * as moment from "moment";
import { ToastrService } from "ngx-toastr";
import { NgxSpinnerService } from "ngx-spinner";
import { ActivatedRoute, Router, TitleStrategy } from "@angular/router";
import { NgStepperComponent } from "angular-ng-stepper";
import { NgbDate, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { DataService } from "src/app/core/_services/data.service";
import { RequestService } from "../request.service";
import { ViewRequestComponent } from "../view-request/view-request.component";
import { Location } from "@angular/common";
import { environment } from "src/environments/environment";
import { AdminService } from "src/app/admin/admin.service";

@Component({
  selector: "app-edit-request",
  templateUrl: "./edit-request.component.html",
  styleUrls: ["./edit-request.component.scss"],
})
export class EditRequestComponent implements OnInit {
  @ViewChild("cdkStepper") stepper!: NgStepperComponent;
  @ViewChild("formRef") formRef!: FormGroupDirective;

  gRequestDetails!: any;
  monthDays = Array(31)
    .fill(0)
    .map((x, i) => i);

  // ID of the request to edit
  requestId!: string | null;
  pattern = "";

  studios$!: Observable<any>;
  controlRooms$!: Observable<any>;
  channels$!: Observable<any>;
  shootTypes$!: Observable<any>;
  resources$!: Observable<any>;
  gShootTypes!: Array<any>;
  gChannels!: Array<any>;
  gStudios!: Array<any>;
  resources!: any[];
  gControlRooms!: Array<any>;
  allSlotsAvailable: boolean = false;

  availableRequests: Array<any> = [];
  availableSchedules: Array<any> = [];
  recurrenceValue: Array<any> = [];
  requestDates: Array<any> = [];
  shootType!: any;

  // gGuestLimit: number = 0;
  requestType = "live";
  requestTypeGroupName = "requestType";
  isAddGuestLimitArrived: boolean = false;
  dateValidationMsg = "";
  liveresourcename = " ";
  liveresourcetype = " ";
  prerecordname = " ";
  prerecordtype = " ";
  cameramanname = " ";
  cameramantype = " ";
  isRecurringCollapsed = true;
  liveguests: Array<any> = [];
  preguests: Array<any> = [];
  livetext: Array<any> = [];
  pretext: Array<any> = [];
  previospage = "live";
  requestTimeSlots: any = [];
  requestSlotsEdited: boolean = false;
  saveOnlyAvailable: boolean = false;
  liveGuest = false;
  preGuest = false;
  processing: boolean = false;
  resourceTypes: any[] = [];
  retainFormControls = ["requestDateTime", "startDateTime", "endDateTime"];
  resourceType!: any;
  resourceName!: any;
  glimitplaceflg = false;
  // liveglimit = 1;
  // preglimit = 1;
  prelimitplaceflg = false;

  selectedRequest!: any;
  requestObject!: any;
  requestForm!: FormGroup;
  // This is used to flag that the request is checked with the backend and no conflicting slots are available
  requestOk = false;
  rangeLimit = 24;

  modaleRef!: NgbModalRef;
  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private requestService: RequestService,
    private router: Router,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private location: Location,
    private modal: NgbModal,
    private adminService: AdminService,
    private cdref: ChangeDetectorRef
  ) { }

  attachment!: any;
  attachmentSet = false;
  attachmentName = "Add attachment";
  fileRemoved = false;
  serverUrl = environment.serverUrl;
  downloadAttachment = false;

  requestDateTimeObj!: any;

  showInvalidMsg = false;

  ngOnInit(): void {
    this.initializeForm();


    this.requestForm.get("fromDateTime")?.valueChanges.subscribe((value) => {
      this.requestForm.get("toDateTime")?.setValue(value);
    });

    this.requestForm.get("resourceType")?.valueChanges.subscribe((value) => {

      if (!value) return;
      const selectedResourceType = this.resourceTypes.find(
        (item) => item._id === value
      );

      if (selectedResourceType?.type == "STUDIO") {
        this.resources$ = this.adminService.getResourceByType(value);
        this.studios$.subscribe((data) => (this.gStudios = data));
      } else {
        this.resources$ = this.adminService.getResourceByType(value);
      }

      this.resources$.subscribe({
        next: (res: any) => {
          this.resources = res;
          this.cdref.detectChanges();
        },
        error: (err: any) => {

        },
      });
    });
    this.route.paramMap.subscribe((params) => {
      this.requestId = params.get("id");
      if (this.requestId) {

        this.getRequiredData();
        this.getRequestDetails();
      } else {
        this.location.back();
      }
    });
  }

  ngAfterViewInit(): void {



  }

  initializeForm() {
    this.requestForm = this.fb.group(
      {
        fromDateTime: ["", [Validators.required]],
        toDateTime: ["", [Validators.required]],
        startDateTime: ["", [Validators.required]],
        endDateTime: ["", [Validators.required]],
        channel: [null, [Validators.required]],
        resourceName: [null, [Validators.required]],
        resourceType: [null, [Validators.required]],
        name: "",
        program: "",
        contactInformation: "",
        details: ["", [Validators.required]],
        attachment: null,
        participants: new FormArray([]),
        shootType: null,
      },
      { validator: this.validateDate.bind(this) }
    );

    this.addGuest("host");
    this.addGuest("guest");
  }

  addShooType(item: any) {
    const newShootType = { _id: 11111, name: item, tag: true, new: true };
    this.gShootTypes.push(newShootType);
    return newShootType;
  }

  patchForm(data: any) {
    const request = data;
    if (request.requestType == "live") {
      this.liveresourcetype = request.resourceTypeId;
      this.liveresourcename = request.resourceId?._id;


      if (request.resourceType == "studio") {
        // this.liveglimit = this.gStudios.find((item) => item._id === this.gRequestDetails.participants[0]?.studio._id)?.guestLimit ?? 1;
        this.prelimitplaceflg = false;
      } else {
        // this.liveglimit = request.guestLimit;
      }
    } else if (request.requestType == "prerecorded") {
      this.prerecordname = request.controlRoom._id;
      this.prerecordtype = request.resourceTypeId

      if (request.resourceType != "Studio") {
        // this.preglimit = this.gStudios?.find((item) => item._id === this.gRequestDetails.participants[0]?.studio._id)?.guestLimit ?? 1;
        this.prelimitplaceflg = false;
      } else {
        // this.preglimit = request.guestLimit;
      }
    } else {
      this.cameramantype = request.resourceTypeId;
      this.cameramanname = request.resourceId._id;
      this.shootType = request.shootType._id
    }


    this.requestForm.get("resourceType")?.setValue(this.cameramantype);
    this.requestForm.get("resourceName")?.setValue(this.cameramanname);
    this.requestForm.get("shootType")?.setValue(this.shootType);
    this.requestType = request.requestType;
    this.changeRequestType(request.requestType);

    const fromDate = new Date(request.startDateTime);
    const toDate = new Date(request.endDateTime);
    const fromNgbDate = {
      year: fromDate.getFullYear(),
      month: fromDate.getMonth() + 1,
      day: fromDate.getDate(),
    };
    const toNgbDate = {
      year: toDate.getFullYear(),
      month: toDate.getMonth() + 1,
      day: toDate.getDate(),
    };

    this.requestForm.patchValue({
      fromDateTime: fromNgbDate,
      toDateTime: toNgbDate,
      startDateTime: moment(request.startDateTime).format("HH:mm"),
      endDateTime: moment(request.endDateTime).format("HH:mm"),
      channel: request.channel?._id,
      resourceType: request.resourceTypeId,
      resourceName:
        this.requestType === "prerecorded"
          ? request.controlRoom?._id
          : request.resourceId?._id,
      name: request.name,
      program: request.program,
      contactInformation: request.contactInformation,
      details: request.details,
      //   attachment: request.attachment,
    });

    if (request.attachment) {
      this.attachmentName = request.attachment;
      this.attachmentSet = true;
      this.downloadAttachment = true;
    }

    if (request.participants && request.participants.length) {
      this.resetFormArray();
      request.participants.forEach((p: any) => {
        this.addGuest(p?.type, p.studio?._id, p?.name);
      });
    }
  }

  isStudio() {
    const resouceTypeId = this.requestForm.get("resourceType")?.value;
    const selectedResourceType = this.resourceTypes.find(
      (item) => item._id === resouceTypeId
    );

    if (selectedResourceType?.type === "STUDIO") {
      (this.requestForm.controls["participants"] as FormArray).value.type =
        "guest";
      return true;
    } else {
      (this.requestForm.controls["participants"] as FormArray).value.type =
        "host";
      return false;
    }
  }

  handleParticipantStudioChange(e: any, i: number) {
    if (
      !Boolean(
        (this.requestForm.get("participants") as FormArray).controls[i].value
          .studio
      )
    ) {
      (this.requestForm.get("participants") as FormArray).controls[i].setValue({
        studio: null,
        name: "",
        type: "guest",
      });
    }
  }

  validateDate(group: AbstractControl): ValidationErrors | null {
    // here we have the 'requestForm' group
    const fromDateTime = group.get("fromDateTime")?.value;
    const toDateTime = group.get("toDateTime")?.value;
    const startTime = group.get("startDateTime")?.value;
    const endTime = group.get("endDateTime")?.value;
    if (!fromDateTime || !toDateTime || !startTime || !endTime) {
      return null;
    }
    return this.validTimeSlot(fromDateTime, toDateTime, startTime, endTime)
      ? null
      : { previousDate: true };
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

  getRequestDetails() {
    this.requestService.findOne(this.requestId).subscribe((data: any) => {
      this.gRequestDetails = data.request;

      // this.gGuestLimit = data.request?.resourceId?.guestLimit ?? 0;
      this.resources$ = this.adminService.getResourceByType(
        data.request.resourceTypeId
      );

      this.patchForm(this.gRequestDetails);

      this.resources$.subscribe({
        next: (res: any) => {
          this.resources = res;
        },
        error: (err: any) => {

        },
      });
      this.getResourceTypes();
    });
  }

  getRequiredData() {
    this.studios$ = this.dataService.getStudios();
    this.studios$.subscribe((data) => (this.gStudios = data));
    this.controlRooms$ = this.dataService.getControlRooms();
    this.controlRooms$.subscribe((data) => (this.gControlRooms = data));
    this.channels$ = this.dataService.getChannels();
    this.channels$.subscribe((data) => (this.gChannels = data));
    this.shootTypes$ = this.dataService.getShootTypes();
    this.shootTypes$.subscribe((data) => (this.gShootTypes = data));
  }

  // Without this, angular will not recognize the participants formArray variable in the html *ngFor
  get participants() {

    return this.requestForm.controls["participants"] as FormArray;
  }

  addParticipant(participantType = "guest", studio = null, name = null) {
    const validators = this.requestType == "prerecorded" || "live" ? [Validators.required] : [];
    return this.fb.group({
      studio: [studio, validators],
      name: [name, validators],
      type: participantType,
    });
  }

  changeRequestType(requestType: any) {
    let requiredFields: string[] = [];
    let optionalFields: string[] = [];

    switch (requestType) {
      case "live":
        requiredFields = [
          "channel",
          "name",
          "resourceType",
          "participants[0]",
          "resourceName",
        ];
        optionalFields = [
          "program",
          "shootType",
          "participants",
          "contactInformation",
        ];
        break;
      case "prerecorded":
        requiredFields = ["participants[0]", "resourceType", "resourceName"];
        optionalFields = [
          "channel",
          "name",
          "program",
          "shootType",
          "contactInformation",
        ];
        break;
      case "remote":
        requiredFields = ["name", "resourceType", "resourceName"];
        optionalFields = [
          "channel",
          "program",
          "shootType",
          "participants",
          "contactInformation",
        ];
        break;
      case "cameraman":
        requiredFields = ["program",
          "shootType",
          "contactInformation"];
        optionalFields = [
          "channel",
          "resourceType",
          "resourceName",
          "name",
          "participants",
        ];

        break;
    }

    // Dynamically set fields validations based on the request type
    this.changeControlValidation(this.requestForm, requiredFields, true);
    this.changeControlValidation(this.requestForm, optionalFields, false);

    this.adminService.getResourceType(this.requestType).subscribe({
      next: (res: any) => {
        this.resourceTypes = res;
        this.cdref.detectChanges();
      },
      error: (err: any) => {
      },
    });

    this.requestForm.updateValueAndValidity();

    if (requestType == "live") {
      this.requestForm.get("resourceType")?.setValue(this.liveresourcetype);
      if (this.glimitplaceflg) {
        this.resources$ = this.dataService.getStudios();
      }
      this.requestForm.get("resourceName")?.setValue(this.liveresourcename);
    }
    if (requestType == "prerecorded") {
      this.requestForm.get("resourceType")?.setValue(this.prerecordtype);
      if (this.prelimitplaceflg) {
        this.resources$ = this.dataService.getStudios();
      }
      this.requestForm.get("resourceName")?.setValue(this.prerecordname);
    }
    if (requestType == "cameraman") {
      this.requestForm.get("resourceType")?.setValue(this.cameramantype);
      this.requestForm.get("resourceName")?.setValue(this.cameramanname);
    }

    let formarray = this.requestForm.get("participants") as FormArray;
    let value = "";
    let text = "";

    if (this.previospage == "live") {
      this.liveguests = [];
      this.livetext = [];
    }

    if (this.previospage == "prerecorded") {
      this.preguests = [];
      this.pretext = [];
    }

    for (let i = 0; i < formarray.length; i++) {
      value = formarray.at(i).get("studio")?.value;
      if (value == null || value == " " || value == "") {
        this.isAddGuestLimitArrived = false;
        break;
      }
      text = formarray.at(i).get("name")?.value;
      if (this.previospage == "live") {
        this.liveguests.push(value);
        this.livetext.push(text);
      }
      if (this.previospage == "prerecorded") {
        this.preguests.push(value);
        this.pretext.push(text);
      }
    }

    if (requestType == "live") {
      this.requestType = "live";
      this.getResourceTypes();
      // this.gGuestLimit = this.liveglimit;

      formarray = this.requestForm.get("participants") as FormArray;

      let array = this.liveguests.filter(
        (value) => value !== "" && value !== null
      );
      if (!this.liveguests.length) {
        let flength = formarray.length;
        for (let i = flength - 1; i > 0; i--) {
          formarray.removeAt(i);
        }
        formarray.at(0)?.get("studio")?.setValue("");
        formarray.at(0)?.get("name")?.setValue("");
        if (!this.glimitplaceflg) {
          formarray.insert(1, this.addParticipant());
        }
      } else {
        formarray = this.requestForm.get("participants") as FormArray;
        let flength = formarray.length;
        for (let i = flength - 1; i >= 0; i--) {
          (this.requestForm.get("participants") as FormArray).removeAt(i);
        }

        let i;
        for (i = 0; i < this.liveguests.length; i++) {
          formarray.insert(i, this.addParticipant("guest", this.liveguests[i], this.livetext[i]));
        }
      }

      formarray.at(0)?.get("studio")?.setValidators([Validators.required]);
      formarray.at(0)?.get("name")?.setValidators([Validators.required]);
      this.previospage = "live";
      // if (formarray.length >= this.gGuestLimit) {
      //   this.isAddGuestLimitArrived = true;
      // } else {
      //   this.isAddGuestLimitArrived = false;
      // }
      // this.isAddGuestLimitArrived = this.liveGuest;
    }


    if (requestType == "prerecorded") {

      formarray = this.requestForm.get("participants") as FormArray;
      // this.gGuestLimit = this.preglimit;
      this.getResourceTypes();

      let array = this.preguests.filter(
        (value) => value !== "" && value !== null
      );
      this.preguests = array;
      if (!this.preguests.length) {
        let flength = formarray.length;
        for (let i = flength - 1; i > 0; i--) {
          formarray.removeAt(i);
        }
        formarray.at(0)?.get("studio")?.setValue("");
        formarray.at(0)?.get("name")?.setValue("");
        if (!this.isStudio()) {
          formarray.insert(1, this.addParticipant());
        }
      } else {
        formarray = this.requestForm.get("participants") as FormArray;
        let flength = formarray.length;
        for (let i = flength - 1; i >= 0; i--) {
          (this.requestForm.get("participants") as FormArray).removeAt(i);
        }
        let i;
        for (i = 0; i < this.preguests.length; i++) {
          formarray.insert(i, this.addParticipant("guest", this.preguests[i], this.pretext[i]));
        }
      }

      formarray.at(0)?.get("studio")?.setValidators([Validators.required]);
      formarray.at(0)?.get("name")?.setValidators([Validators.required]);
      this.previospage = "prerecorded";

      // if (formarray.length >= this.gGuestLimit) {
      //   this.isAddGuestLimitArrived = true;
      // } else {
      //   this.isAddGuestLimitArrived = false;
      // }
      // this.isAddGuestLimitArrived = this.preGuest;
    }

    if (requestType == "cameraman") {
      this.requestType = "cameraman";
      this.getResourceTypes();
      this.previospage = "cameraman";
    }
  }

  resetFormArray() {
    while ((this.requestForm.get("participants") as FormArray).length !== 0) {
      (this.requestForm.get("participants") as FormArray).removeAt(0);
    }
  }

  getResourceTypes() {

    const response = this.adminService
      .getResourceType(this.requestType)
      .subscribe({
        next: (res: any) => {
          this.resourceTypes = res;
          this.cdref.detectChanges()
        },
        error: (err: any) => {
        },
      });
  }

  getId(data: string) {
    return `${data.toUpperCase().replace(" ", "_")}`;
  }

  handleHostStudioChange(e: any) {
    // const guestLimit = this.gStudios.find((item) => item._id === e._id)?.guestLimit ?? 0;

    if (this.isStudio()) {
      return;
    } else {
      // if (this.requestType == "live") {
      // this.liveglimit = guestLimit;
      // } else if (this.requestType == "prerecorded") {
      // this.preglimit = guestLimit;
      // }
      // this.gGuestLimit = guestLimit;

      // let parties = this.requestForm.get("participants") as FormArray;
      // let i = parties.length;

      // (this.requestForm.get("participants") as FormArray).controls.splice(this.gGuestLimit + 1);

      // if (parties.length >= this.gGuestLimit) {
      //   this.isAddGuestLimitArrived = true;
      // } else {
      //   this.isAddGuestLimitArrived = false;
      // }
    }
  }

  addGuest(participantType = "guest", studio = null, name = null) {
    (this.requestForm.controls["participants"] as FormArray).push(this.addParticipant(participantType, studio, name));

    // if (this.isStudio()) {
    //   if ((this.requestForm.get("participants") as FormArray).length >= this.gGuestLimit) {
    //     this.isAddGuestLimitArrived = true;
    //   } else {
    //     this.isAddGuestLimitArrived = false;
    //   }
    // } else {
    //   if ((this.requestForm.get("participants") as FormArray).length > this.gGuestLimit) {
    //     this.isAddGuestLimitArrived = true;
    //   } else {
    //     this.isAddGuestLimitArrived = false;
    //   }
    // }


  }

  removeGuest(index: any) {
    // this.isAddGuestLimitArrived = false;
    (this.requestForm.get("participants") as FormArray).removeAt(index);
  }

  onAttachmentSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      this.attachment = event.target.files[0];
      reader.readAsDataURL(event.target.files[0]); // read file as data url
      this.attachmentName = this.attachment.name;

      reader.onload = (e) => {
        // called once readAsDataURL is completed
        this.attachmentSet = true;
        this.fileRemoved = false;
      };
    } else {
      this.attachmentName = "Add attachment";
    }
  }

  removeAttachment(event: any) {
    this.fileRemoved = true;
    this.attachment = null;
    this.requestForm.get("attachment")?.setValue(null);
    this.attachmentName = "Add attachment";
    this.attachmentSet = false;
  }

  /**
   * This method dynamically applies the required validator on the controls of a form group
   * if the formcontrol is an array then it will iterate over its control and recursively set the validator on
   * the controls of that formgroup as well
   * @attention This method works on reference mode i.e. the objects passed are the actual objects and any changes
   * brought are mapped to the actual objects
   * @param formGroup AbstractFormControl passed to change its control validation
   * @param controlNames Names of the controls that are needed to be processed
   * @param required this flag determines whether to apply Required validator on the control or not
   */
  changeControlValidation(
    formGroup: AbstractControl,
    controlNames: string[],
    required = false
  ) {
    controlNames.forEach((controlName) => {
      /**
       * Check if the form control is form array
       * if yes the get the control names and call this function recursively for them
       */
      if (formGroup.get(controlName) instanceof FormArray) {
        const controls = (formGroup.get(controlName) as FormArray).controls;
        // controls are also new form groups
        controls.forEach((cName) => {
          const formControls = Object.keys((cName as FormGroup).controls);
          this.changeControlValidation(cName, formControls, required);
        });
      } else {
        // Skip the type formcontrol of participants array as it is readonly
        if (controlName != "type") {
          this.updateFormControl(formGroup.get(controlName), required);
        }
      }

      formGroup.get(controlName)?.updateValueAndValidity();
    });
  }

  updateFormControl(formControl: AbstractControl | null, required = false) {
    if (required) {
      formControl?.addValidators([Validators.required]);
    } else {
      formControl?.clearValidators();
      // formControl?.setValue(null);
    }
    formControl?.updateValueAndValidity();

    return formControl;
  }

  /**
   * Form submission and validation
   */
  validTimeSlot(
    fromDateTimeString: any,
    toDateTimeString: any,
    startTimeString: any,
    endTimeString: any
  ) {
    let msg = "";
    let isValidFlg = true;

    const fromDateTime = this._date(fromDateTimeString);
    const toDateTime = this._date(toDateTimeString);
    const startTime = startTimeString.split(":");
    const endTime = endTimeString.split(":");

    const startDateTime = new Date(fromDateTime);
    const endDateTime = new Date(toDateTime);

    startDateTime.setHours(startTime[0]);
    startDateTime.setMinutes(startTime[1]);

    endDateTime.setHours(endTime[0]);
    endDateTime.setMinutes(endTime[1]);

    if ((startTimeString == endTimeString) && (startDateTime.getDate() == endDateTime.getDate())) {
      this.dateValidationMsg = "Start time and end time cannot be the same";
      isValidFlg = false;
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

    if (
      (endDateTime.getDate() - startDateTime.getDate()) > 1) {
      this.toastr.warning(`The time range must be involved in 2 days`);
      isValidFlg = false;
    }

    if (!(fromDateTime <= toDateTime)) {
      this.dateValidationMsg =
        "Request end date cannot be less then request start date";
      isValidFlg = false;
    }

    return isValidFlg;
  }

  calcHourDiff(date1: Date, date2: Date) {
    const diffInMs = date2.getTime() - date1.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours;
  }

  _date(dateString: any) {
    return new Date(`${dateString.year}-${dateString.month}-${dateString.day}`);
  }

  selectionChanged(event: StepperSelectionEvent) {
    // Transition from first step to the next

    if (event.previouslySelectedIndex == 0 && !this.requestOk) {
      this.checkSlotAvailability();
    }
  }

  callNext() {
    this.stepper.next();
  }

  callPrevious() {
    this.stepper.steps.first.select();
  }

  formSubmit() { }

  checkSlotAvailability() {
    this.processing = true;
    const request = this.requestForm.getRawValue();
    const fromDateTime = this._date(request.fromDateTime);
    const toDateTime = this._date(request.toDateTime);
    const startTime = request.startDateTime?.split(":");
    const endTime = request.endDateTime?.split(":");

    const startDateTime = new Date(fromDateTime);
    const endDateTime = new Date(toDateTime);

    startDateTime.setHours(startTime[0]);
    startDateTime.setMinutes(startTime[1]);

    endDateTime.setHours(endTime[0]);
    endDateTime.setMinutes(endTime[1]);

    // Pass the request time, start and end to check the slots
    const params: any = {
      requestDateTime: fromDateTime,
      startDateTime,
      endDateTime,
      requestId: this.requestId,
    };

    const requestDate = [
      {
        id: this.requestId,
        startDateTime: startDateTime,
        endDateTime: endDateTime,
      },
    ];

    // Handle multiple resource Ids in case a resource selected is not available or already booked
    const resourceIds: any[] = [];

    if (this.requestType == "prerecorded" || this.requestType == "live") {
      resourceIds.push(request.resourceName);
      for (let i = 0; i < request.participants.length; i++) {
        if (request.participants[i].studoi) {
          resourceIds.push(request.participants[i].studio);
        }
      }
    }

    // if (this.requestType == 'live') {
    //   resourceIds.push(request.resourceName)
    // }

    params.resourceIds = resourceIds.join(",");

    // Only check slot availability for request types [live, prerecorded] as they have resourced id in the payload
    if (this.requestType == "live" || this.requestType == "prerecorded") {
      this.requestService
        .checkSlotAvailability(params, requestDate)
        // .pipe(
        //   map((d: any) => {
        //     const data = d[0];
        //     data.schedules = data.schedules.map((sc: any) => {
        //       sc.dateRange = `${moment(sc.startDateTime).format(
        //         "hh:mm A"
        //       )} to ${moment(sc.endDateTime).format("hh:mm A")}`;
        //       return sc;
        //     });

        //     data.requests = data.requests.map((sc: any) => {
        //       sc.dateRange = `${moment(sc.startDateTime).format(
        //         "hh:mm A"
        //       )} to ${moment(sc.endDateTime).format("hh:mm A")}`;
        //       return sc;
        //     });
        //     return data;
        //   })
        // )
        .subscribe((data) => {
          this.processing = false;
          this.allSlotsAvailable = true;

          this.requestSlotsEdited = false;

          // for (let i = 0; i < data?.length; i++) {
          //   if (!data[i].isAvailable) {
          //     this.allSlotsAvailable = false;
          //   }
          //   // Add resrouceIds to the request object for passing it to the request-availability component
          //   data[i].resourceIds = params.resourceIds;
          // }

          this.requestTimeSlots = data;

          if (this.allSlotsAvailable) {
            this.reviewRequest();

            // Disable the second [availibility] step of the wizard as there are no conflicting requests
            // @ts-ignore
            this.stepper.selected.editable = true;
            // @ts-ignore
            this.stepper.selected.completed = true;

            // this.callNext()
            // this.goToFinalStep();
          } else {
            this.callNext();
            this.requestObject = null; //used to preview and hold the new request data

            // Disable the last step of the wizard as the request should not be saved with the current values
            // @ts-ignore
            this.stepper.steps.last.interacted = true;
            this.stepper.steps.last.editable = false;
            // @ts-ignore
            this.stepper.selected.completed = false;
          }
        });
    } else {
      // this.requestOk = true;


      setTimeout(() => {
        this.requestTimeSlots = [];
        this.requestDates.forEach((rd) => {
          this.requestTimeSlots.push({
            id: rd.id,
            request: rd,
            isAvailable: true,
            schedules: [],
            requests: [],
          });
        });
        this.reviewRequest();
        // Disable the second [availibility] step of the wizard as there are no conflicting requests
        // @ts-ignore
        this.stepper.selected.editable = true;
        // @ts-ignore
        this.stepper.selected.completed = true;

        // this.callNext();
        // this.goToFinalStep();
      });
      // setTimeout(() => {
      //   this.reviewRequest();
      // });
    }
  }

  reviewRequest() {
    // To avoid copy by reference
    const data = JSON.parse(JSON.stringify(this.requestForm.value));



    const shootType = data?.shootType
      ? this.gShootTypes.filter((s) => s._id == data?.shootType)[0]?.name
      : null;

    const _resourceTypeName = this.resourceTypes ? this.resourceTypes.filter((s) => s._id == data.resourceType)[0]?.name : null;
    const gShootType = data.shootType
      ? this.gShootTypes.filter((s) => s._id == data.shootType)[0]?.name
      : null;
    const channel = data.channel
      ? this.gChannels.filter((c) => c._id == data.channel)[0]?.name
      : null;
    const studio = data.resourceName
      ? this.gStudios.filter((r) => r._id == data.resourceName)[0]?.name
      : null;
    const cRoom = data.resourceName
      ? this.gControlRooms.filter((r) => r._id == data.resourceName)[0]?.name
      : null;

    const startTime = data?.startDateTime?.toString()?.split(":");
    const endTime = data?.endDateTime?.toString()?.split(":");
    data.requestDateTime = this._date(data.fromDateTime);
    const startDateTime = new Date(this._date(data.fromDateTime));
    const endDateTime = new Date(this._date(data.toDateTime));
    startDateTime.setHours(startTime[0]);
    startDateTime.setMinutes(startTime[1]);

    endDateTime.setHours(endTime[0]);
    endDateTime.setMinutes(endTime[1]);

    data.timeSlot = `${moment(startDateTime).format("hh:mm A")} to ${moment(
      endDateTime
    ).format("hh:mm A")}`;

    if (this.requestType == "prerecorded" || this.requestType == "live") {
      let participants: any[] = [];
      for (let i = 0; i < data.participants.length; i++) {
        if (data.participants[i].studio) {
          const studioName = this.gStudios.filter(
            (r) => r._id == data.participants[i].studio
          )[0]?.name;
          participants.push({
            name: data.participants[i].name,
            studio: data.participants[i].studio,
            studioName: studioName,
            type: data.participants[i].type,
          });
        }
      }
      data.participants = participants;
    }

    data.requestId = this.requestId;
    data.shootTypeName = shootType;
    data.channelName = channel;
    data.studioName = studio;
    data.controlRoomName = cRoom;
    data.startDateTime = startDateTime;
    data.endDateTime = endDateTime;
    data.requestType = this.requestType;
    data.fileName = this.attachment
      ? this.attachment.name
      : this.gRequestDetails.attachment
        ? this.gRequestDetails.attachment
        : null;


    if (this.saveOnlyAvailable) {
      const requestTimeSlots = this.requestTimeSlots.filter(
        (rts: any) => rts.isAvailable
      );

      data.requestTimeSlots = requestTimeSlots.map((rts: any) => {
        return rts.request;
      });
    } else {
      data.requestTimeSlots = this.requestTimeSlots.map((rts: any) => {
        return rts.request;
      });
    }

    data.eventType = data.recurring ? "recurring" : "single";

    if (data.recurring) {
      const ocurrenceOptions = {
        eventType: data.recurring ? "recurring" : "single",
        pattern: data.pattern,
        patternValue: data.patternValue,
        recurrenceValue: data.recurrenceValue,
        requestEndCriteria: data.requestEndCriteria,
        occurrenceTurns: data.occurrenceTurns,
      };
      data.ocurrenceOptions = ocurrenceOptions;
    } else {
      const ocurrenceOptions = {
        eventType: data.recurring ? "recurring" : "single",
        pattern: "daily",
        patternValue: "1",
        recurrenceValue: null,
        requestEndCriteria: "date",
        occurrenceTurns: 1,
      };
      data.ocurrenceOptions = ocurrenceOptions;
    }


    data.resourceName2 = data.studioName ? data.studioName : data.controlRoomName;
    data.resourceTypeName = _resourceTypeName;
    this.requestObject = data;
    // Disable the seconde [availibility] step of the wizard as there are no conflicting requests
    // @ts-ignore
    this.stepper.selected.editable = true;
    // @ts-ignore
    this.stepper.selected.completed = true;
    this.stepper.next();
  }


  saveRequest() {
    const formData = new FormData();

    // formData.set('requestDateTime', this.requestObject.requestDateTime);
    // formData.set('startDateTime', this.requestObject.startDateTime);
    // formData.set('endDateTime', this.requestObject.endDateTime);
    formData.set("details", this.requestObject.details);
    formData.set("resourceIds", this.requestObject.resourceIds);

    if (this.requestType == "cameraman") {
      formData.set("shootType", this.requestObject.shootType);
      formData.set("shootTypeName", this.requestObject.shootTypeName);
      formData.set("contactInformation", this.requestObject.contactInformation);
      formData.set("program", this.requestObject.program);
    }

    if (this.requestType == "live" || this.requestType == "remote") {
      formData.set("name", this.requestObject.name);
    }

    if (this.requestType == "live") {
      formData.set("channel", this.requestObject.channel);
    }

    if (this.requestType == "live" || this.requestType == "cameraman") {
      formData.set("resourceId", this.requestObject.resourceName);
    }

    if (this.requestType == "prerecorded" || this.requestType == "live") {
      formData.set(
        "participants",
        JSON.stringify(this.requestObject.participants)
      );
    }
    if (this.requestType == "prerecorded") {
      formData.set("controlRoom", this.requestObject.resourceName);
    }

    formData.set("requestType", this.requestObject.requestType);
    if (this.attachment) {
      formData.set("file", this.attachment);
    }

    formData.set(
      "requestTimeSlots",
      JSON.stringify(this.requestObject.requestTimeSlots)
    );

    formData.set(
      "ocurrenceOptions",
      JSON.stringify(this.requestObject.ocurrenceOptions)
    );



    this.spinner.show();
    this.requestService
      .saveRequest(formData, this.requestObject.eventType)
      .subscribe({
        next: (data) => {
          this.spinner.hide();
          this.toastr.success("Request created");
          this.router.navigate(["/calendar"]);
        },
        error: (err) => {
          this.spinner.hide();

          if (err.status == 409) {
            this.toastr.error(
              `${moment(err.error.data.startDateTime).format(
                "MMMM Do YYYY, h:mm:ss a"
              )} - ${moment(err.error.data.endDateTime).format("h:mm:ss a")}`,
              err.error.message
            );
          } else {
            this.toastr.error("Error creating request");
          }
        },
      });
  }

  updateRequest() {
    const formData = new FormData();


    formData.set("requestId", this.requestObject.requestId);
    formData.set("requestDateTime", this.requestObject.requestDateTime);
    formData.set("startDateTime", this.requestObject.startDateTime);
    formData.set("endDateTime", this.requestObject.endDateTime);
    formData.set("details", this.requestObject.details);

    if (this.requestType == "live" || this.requestType == "remote") {
      formData.set("name", this.requestObject.name);
    }

    if (this.requestType == "cameraman") {
      formData.set("shootType", this.requestObject.shootType);
      formData.set("contactInformation", this.requestObject.contactInformation);
      formData.set("program", this.requestObject.program);
    }

    if (this.requestType == "live") {
      formData.set("channel", this.requestObject.channel);
      formData.set("resourceId", this.requestObject.resourceName);
    }

    if (this.requestType == "prerecorded" || this.requestType == "live") {
      formData.set(
        "participants",
        JSON.stringify(this.requestObject.participants)
      );
    }
    if (this.requestType == "prerecorded") {
      formData.set("controlRoom", this.requestObject.resourceName);
    }

    formData.set("requestType", this.requestType);
    if (this.attachment) {
      formData.set("file", this.attachment);
    }

    // set the remove flag for attachment if present in the database request and now removed
    if (this.gRequestDetails.attachment && this.fileRemoved) {
      formData.set("fileRemoved", "true");
    }

    this.spinner.show();
    this.requestService.updateRequest(this.requestId, formData).subscribe({
      next: (data) => {
        this.spinner.hide();
        this.toastr.success("Requets updated");
        this.router.navigate(["/approvals"]);
      },
      error: (err) => {
        this.spinner.hide();
        this.toastr.error("Error creating request");

      },
    });
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

  downloadFile(name: string) { }

  prerecordnamechange(e: any) {
    // let guestLimit;
    let _pform = this.requestForm.get("participants") as FormArray;
    // if (e == undefined) {
    //   guestLimit = 1;
    // } else {
    //   guestLimit = this.gStudios.find((item) => item._id === e._id)?.guestLimit ?? 1;
    // }

    if (this.isStudio()) {
      // this.preglimit = guestLimit;
      // this.gGuestLimit = guestLimit;
      this.prerecordname = e._id;
      // _pform.controls.splice(this.gGuestLimit);
    } else {
      this.prerecordname = e._id;
      return;
    }


    // if (_pform.length >= this.gGuestLimit) {
    //   this.isAddGuestLimitArrived = true;
    // } else {
    //   this.isAddGuestLimitArrived = false;
    // }
  }

  cameramannamechange(e: any) {
    this.cameramanname = e._id;
  }

  livenamechange(e: any) {
    let guestLimit;
    let pform = this.requestForm.get("participants") as FormArray;
    // if (e == undefined) {
    //   this.gGuestLimit = 1;
    // } else {
    //   guestLimit = this.gStudios.find((item) => item._id === e._id)?.guestLimit ?? 1;
    // }

    if (this.isStudio()) {
      // this.liveglimit = guestLimit;
      // this.gGuestLimit = guestLimit;
      this.liveresourcename = e._id;
      // pform.controls.splice(this.gGuestLimit);
    } else {
      this.liveresourcename = e._id;
      return;
    }


    // if (pform.length >= this.gGuestLimit) {
    //   this.isAddGuestLimitArrived = true;
    // } else {
    //   this.isAddGuestLimitArrived = false;
    // }
  }

  removeAll() {
    let parties = this.requestForm.get("participants") as FormArray;

    let i = parties.length;
    // if (i > this.gGuestLimit) {
    //   if (this.isStudio()) {
    //     parties.controls.splice(this.gGuestLimit);

    //   } else {
    //     parties.controls.splice(this.gGuestLimit + 1);
    //   }
    // }
  }

  eventTypeChange(e: any) {
    this.requestForm.controls["recurring"].setValue(e.target.checked);
    if (e.target.checked) {
      let fields = ["pattern", "requestEndCriteria"];
      this.changeControlValidation(this.requestForm, fields, true);
    } else {
      this.pattern = "";
      let fields = [
        "pattern",
        "requestEndCriteria",
        "recurrenceValue",
        "requestEndDateTime",
        "occurrenceTurns",
      ];
      this.recurrenceValue = [];
      this.changeControlValidation(this.requestForm, fields, false);
    }

    // Toggle the collapse
    this.isRecurringCollapsed = !e.target.checked;
  }

  onPatternChange(e: any, patternType: any) {
    this.recurrenceValue = [];
    // reset the recurrence value i.e. which days of week or month to be selected
    this.requestForm.get("recurrenceValue")?.setValue(this.recurrenceValue);
    this.pattern = patternType;

    if (this.pattern == "week" || this.pattern == "month") {
      let fields = ["patternValue", "recurrenceValue"];
      this.changeControlValidation(this.requestForm, fields, true);
    } else {
      let fields = ["recurrenceValue"];
      this.changeControlValidation(this.requestForm, fields, false);
    }
    this.requestForm.get("patternValue")?.updateValueAndValidity();
  }

  onRecurrenceValueChange(e: any) {
    if (
      e.target.checked &&
      this.recurrenceValue.find((v) => v == e.target.value) === undefined
    ) {
      this.recurrenceValue.push(e.target.value);
    } else {
      this.recurrenceValue = this.recurrenceValue.filter(
        (rv) => rv != e.target.value
      );
    }

    this.requestForm.get("recurrenceValue")?.setValue(this.recurrenceValue);
  }

  onRequestEndCrtChange(e: any) {
    if (e.target.value == "date") {
      this.changeControlValidation(
        this.requestForm,
        ["occurrenceTurns"],
        false
      );
      this.changeControlValidation(
        this.requestForm,
        ["requestEndDateTime"],
        true
      );

      this.requestForm.controls["occurrenceTurns"].disable();
      this.requestForm.controls["requestEndDateTime"].enable();
    } else if (e.target.value == "occurrence") {
      this.changeControlValidation(
        this.requestForm,
        ["requestEndDateTime"],
        false
      );
      this.changeControlValidation(this.requestForm, ["occurrenceTurns"], true);

      this.requestForm.controls["requestEndDateTime"].disable();
      this.requestForm.controls["occurrenceTurns"].enable();
    }
  }

  resourceChange($event: any) {
    if ($event._id) {
      (this.requestForm.get("participants") as FormArray).at(0)?.enable();
      (this.requestForm.get("participants") as FormArray).at(1)?.enable();
    }
    let partiform;
    if (this.requestType == "live") {
      this.liveresourcetype = $event._id;
      if ($event.name != "Studio") {
        this.glimitplaceflg = false;
      } else if ($event.name == "Studio") {
        this.glimitplaceflg = true;
      }
      partiform = this.requestForm.get("participants") as FormArray;
      this.liveresourcename = this.requestForm.get("resourceName")?.value;
      this.requestForm.get("resourceName")?.setValue("");
      this.liveresourcetype = $event._id;
    }

    if (this.requestType == "prerecorded") {
      this.prerecordtype = $event._id;
      partiform = this.requestForm.get("participants") as FormArray;
      if ($event.name != "Studio") {
        this.prelimitplaceflg = false;
      } else if ($event.name == "Studio") {
        this.prelimitplaceflg = true;
      }
      this.prerecordname = partiform.at(0).get("studio")?.value;
      this.requestForm.get("resourceName")?.setValue("");
      this.prerecordtype = $event._id;
    }

    if (this.requestType == "cameraman") {
      this.cameramantype = $event._id;
      this.requestForm.get("resourceName")?.setValue("");
    }
  }

  Handlefocus() {
    if (
      this.requestForm.get("resourceType")?.value == null ||
      this.requestForm.get("resourceType")?.value == ""
    ) {
      (this.requestForm.get("participants") as FormArray).at(0).disable();
      (this.requestForm.get("participants") as FormArray).at(1).disable();
    }
  }

  handleClickNext() {
    this.processRequestForm();
  }

  processRequestForm() {
    this.requestDates = [];
    const request = this.requestForm.value;

    const startDateTime = moment(this._date(request.fromDateTime));
    const toDateTime = moment(this._date(request.toDateTime));
    // This is the end boundary date time of the recurring event
    let endDateTime = moment(this._date(request.toDateTime));
    if (request.recurring && request.requestEndDateTime) {
      endDateTime = moment(this._date(request.requestEndDateTime));
    }

    const startTime = request.startDateTime?.toString()?.split(":");
    const endTime = request.endDateTime?.toString()?.split(":");

    // These two denotes the start and end of a single request in the same day
    const requestStartDateTime = startDateTime.clone();
    const requestEndDateTime = toDateTime.clone();

    requestStartDateTime.hours(startTime[0]).minutes(startTime[1]);
    requestEndDateTime.hours(endTime[0]).minutes(endTime[1]);

    if (request.recurring) {
      const recurrenceValue = request.recurrenceValue;
      if (this.pattern == "day") {
        this.calculateRequestDates(
          requestStartDateTime,
          requestEndDateTime,
          this.pattern,
          endDateTime,
          request.patternValue,
          request.requestEndCriteria,
          request.occurrenceTurns
        );
      } else {
        if (["week", "month"].includes(this.pattern)) {
          for (let i = 0; i < recurrenceValue.length; i++) {
            this.calculateRequestDates(
              requestStartDateTime,
              requestEndDateTime,
              this.pattern,
              endDateTime,
              request.patternValue,
              request.requestEndCriteria,
              request.occurrenceTurns,
              recurrenceValue[i]
            );
          }
        }
      }
    } else {
      const requestObj = {
        id: uuid(),
        startDateTime: requestStartDateTime.toDate().toString(),
        endDateTime: requestEndDateTime.toDate().toString(),
      };
      this.requestDates.push(requestObj);
    }

    this.requestDates.sort((a: any, b: any) => {
      return moment(a.startDateTime).isBefore(moment(b.startDateTime)) ? -1 : 1;
    });

    this.checkSlotAvailability();
  }



  calculateRequestDates(
    requestStartDatetime: any,
    requestEndDateTime: any,
    pattern: string,
    endDateTime: any,
    patternValue: string,
    requestEndCriteria: string,
    occurrenceTurns: number,
    ocValue = null
  ) {
    let sd = requestStartDatetime.clone();
    let ed = requestEndDateTime.clone();

    /**
     * The occurence value should be treated as a weekday when pattern is week and as
     * a date when pattern is day or month
     */
    if (ocValue) {
      sd[pattern == "week" ? "day" : "date"](ocValue, pattern);
      ed[pattern == "week" ? "day" : "date"](ocValue, pattern);
    }

    let sDff = sd.diff(moment());
    let eDff = ed.diff(moment());

    if (requestEndCriteria == "date") {
      //   Check if the starting request can be started from today only
      if (sDff > 0 && eDff > 0) {
        const requestObj = {
          id: uuid(),
          startDateTime: sd.clone().toDate().toString(),
          endDateTime: ed.clone().toDate().toString(),
        };
        this.requestDates.push(requestObj);
      }
      while (endDateTime.diff(ed) >= 0) {
        sd = sd.add(patternValue, pattern);
        ed = ed.add(patternValue, pattern);
        eDff = endDateTime.diff(ed);
        if (eDff >= 0) {
          const requestObj = {
            id: uuid(),
            startDateTime: sd.clone().toDate().toString(),
            endDateTime: ed.clone().toDate().toString(),
          };
          this.requestDates.push(requestObj);
        }
      }
    }

    if (requestEndCriteria == "occurrence") {
      let i = 0;
      //   Check if the starting request can be started from today only
      if (sDff > 0 && eDff > 0) {
        const requestObj = {
          id: uuid(),
          startDateTime: sd.clone().toDate().toString(),
          endDateTime: ed.clone().toDate().toString(),
        };
        this.requestDates.push(requestObj);
        i++;
      }
      while (i < occurrenceTurns) {
        sd = sd.add(patternValue, pattern);
        ed = ed.add(patternValue, pattern);
        eDff = endDateTime.diff(ed);
        if (i <= occurrenceTurns) {
          const requestObj = {
            id: uuid(),
            startDateTime: sd.clone().toDate().toString(),
            endDateTime: ed.clone().toDate().toString(),
          };
          this.requestDates.push(requestObj);
        }

        i++;
      }
    }
  }
}
