import {
  CdkStepper,
  CdkStepperNext,
  StepperSelectionEvent,
} from "@angular/cdk/stepper";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  ChangeDetectorRef,
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
import { DataService } from "../core/_services/data.service";
import { RequestService } from "./request.service";
import * as moment from "moment";
import { ToastrService } from "ngx-toastr";
import { NgxSpinnerService } from "ngx-spinner";
import { ActivatedRoute, Router } from "@angular/router";
import { NgStepperComponent } from "angular-ng-stepper";
import { NgbDate, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ViewRequestComponent } from "./view-request/view-request.component";
// @ts-ignore
import { v4 as uuid } from "uuid";
import { AdminService } from "../admin/admin.service";

@Component({
  selector: "app-request",
  templateUrl: "./request.component.html",
  styleUrls: ["./request.component.scss"],
})
export class RequestComponent implements OnInit, AfterViewInit {
  @ViewChild("cdkStepper") stepper!: NgStepperComponent;
  @ViewChild("formRef") formRef!: FormGroupDirective;
  processing: boolean = false;
  monthDays = Array(31)
    .fill(0)
    .map((x, i) => i);
  pattern = "";

  resourceTypes: any[] = [];
  resourceNames: any;
  /**
   * this denotes the days of week if pattern is week or dates of a month if pattern is month
   * or dates of a year if pattern selected as yearly
   * It is ignored for daily occurence as it will use the start and end times
   */
  recurrenceValue: Array<any> = [];
  isRecurringCollapsed = true;

  /**
   * In case the slot(s) is/are unavailable, the slots are tracked with this variable
   * The response of request slot availability are stored here
   */
  requestTimeSlots: any = [];
  allSlotsAvailable: boolean = false; // this denotes the availability of all slots in the recurring request

  /**
   * Shows if the requests slots had un available time slots in between
   * and then edited by user and set to custom slots in that day
   */
  requestSlotsEdited: boolean = false;

  requestDates: Array<any> = [];

  studios$!: Observable<any>;
  controlRooms$!: Observable<any>;
  channels$!: Observable<any>;
  shootTypes$!: Observable<any>;

  gShootTypes!: Array<any>;
  gChannels!: Array<any>;
  gStudios!: Array<any>;
  gControlRooms!: Array<any>;

  availableRequests: Array<any> = [];
  availableSchedules: Array<any> = [];

  requestType = "live";
  requestTypeGroupName = "requestType";

  liveresourcename = " ";
  liveresourcetype = " ";

  prerecordname = " ";
  prerecordtype = " ";

  cameramanname = " ";
  cameramantype = " ";

  liveguests: Array<any> = [];
  preguests: Array<any> = [];
  livetext: Array<any> = [];
  pretext: Array<any> = [];

  prelimitplaceflg = false;
  // liveglimit = 1;
  // preglimit = 1;
  liveGuest = false;
  preGuest = false;

  previospage = "live";
  studioflg = false;
  glimitplaceflg = false;
  dateValidationMsg = "";

  // gGuestLimit: number = 1;
  retainFormControls = ["requestDateTime", "startDateTime", "endDateTime"];

  selectedRequest!: any;
  requestObject!: any;
  requestForm!: FormGroup;
  // This is used to flag that the request is checked with the backend and no conflicting slots are available
  requestOk = false;

  dateParam: any = ""; // date passed as a parameter to the component;
  timeParam: any = ""; // time calculated from date parameter passed to the component;
  resourceParam: any = ""; // resource passed as a parameter to the component
  resourceTypeParam: any = ""; // Type of the resource passed as a param, either STUDIO or CONTROL_ROOM

  // if set, requests for only available slots will be saved
  saveOnlyAvailable: boolean = false;
  rangeLimit = 48;

  resources$!: Observable<any>;
  resources: any[] = [];

  // isAddGuestLimitArrived: boolean = false;

  modaleRef!: NgbModalRef;
  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private requestService: RequestService,
    private adminService: AdminService,
    private router: Router,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private modal: NgbModal,
    private cdref: ChangeDetectorRef
  ) { }

  attachment!: any;
  attachmentSet = false;
  attachmentName = "Add attachment";

  requestDateTimeObj!: any;

  showInvalidMsg = false;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((queryParams) => {
      const vDateParam: any = queryParams.get("date");
      if (vDateParam) {
        const date = new Date(vDateParam);
        if (date) {
          if (date.getTime() >= new Date().getTime()) {
            this.dateParam = {
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              day: date.getDate(),
            };

            if (queryParams.get("resource")) {
              this.timeParam = `${date.getHours()}:${date.getMinutes()}`;
            }
          } else {
            this.toastr.info("Date must be greater then today's date");
          }
        }

        // Check if the resource is also passed
        this.resourceParam = queryParams.get("resource");
        this.resourceTypeParam = queryParams.get("r_type");
      }

      this.initializeForm();
      // this.changeRequestType(this.requestType);

      this.requestForm.get("fromDateTime")?.valueChanges.subscribe((value) => {
        this.requestForm.get("toDateTime")?.setValue(value);
      });

      this.requestForm.get("resourceType")?.valueChanges.subscribe((value) => {

        if (!value) return;
        const selectedResourceType = this.resourceTypes.find(
          (item) => item._id === value
        );

        if (selectedResourceType?.type == "STUDIO") {
          this.studios$.subscribe((data) => {
            this.gStudios = data
          });
        }

        this.resources$ = this.adminService.getResourceByType(value);

        this.resources$.subscribe({
          next: (res: any) => {
            this.resources = res;
            this.cdref.detectChanges();
          },
          error: (err: any) => {

          },
        });
      });
      // Change the request type to prerecorded as the control room resource type is only available there
      if (this.resourceTypeParam == "CONTROL_ROOM") {
        this.requestType = "prerecorded";
        this.changeRequestType("prerecorded");
        this.requestForm.controls["resourceName"].setValue(this.resourceParam);
      }
      this.getRequiredData();
    });
    this.getResourceTypes();
  }

  ngAfterViewInit(): void { }

  initializeForm() {
    this.requestForm = this.fb.group(
      {
        fromDateTime: [this.dateParam, [Validators.required]],
        toDateTime: [this.dateParam, [Validators.required]],
        startDateTime: [this.timeParam, [Validators.required]],
        endDateTime: ["", [Validators.required]],
        channel: [null, [Validators.required]],
        resourceType: [null, [Validators.required]],
        resourceName: [
          this.resourceTypeParam == "STUDIO" ? this.resourceParam : null,
        ],
        name: "",
        program: null,
        shootType: null,
        // denotes if the request is single or recurring
        recurring: false,
        /**
         * The frequency pattern of the recurring event
         * daily means it will happen on daily basis
         * weekly means it will occur on the weekly frequency
         * monthly means it will occur on the monthly frequency
         * yearly means it will happen once a year
         */
        pattern: null,
        /**
         * This is the amount of the pattern counted as one turn
         * We may have events that will occur every two weeks on mondays or every three months on 15th date and so on
         * this is ignored for daily pattern
         * if value of {pattern} is weekly then it means every {patternValue} week(s)
         * if value of {pattern} is monthly then it means every {patternValue} month(s)
         * if value of {pattern} is yearly then it means every {patternValue} year(s)
         */
        patternValue: [1, [Validators.pattern("^[1-9]+$")]], // set 1 as default
        /**
         * this denotes the days of week if pattern is week or dates of a month if pattern is month
         * or dates of a year if pattern selected as yearly
         * It is ignored for daily occurence as it will use the start and end times
         */
        recurrenceValue: null,
        requestEndDateTime: [{ value: null, disabled: true }],
        /**
         * occurrenceTurns is the number of turns a request will occurr before it is terminated
         * It is used when the requestEndCriteria is selected as occurrence
         */
        occurrenceTurns: [{ value: null, disabled: true }],
        /**
         * This denotes the recurring event termination criteria
         * if date selected the requestEndDateTime will be checked to denote the ending of a reccurring request
         * if occurrence is selected then the occurrenceTurns will be checked for ending of a recurring request
         */
        requestEndCriteria: null,
        contactInformation: null,
        details: ["", [Validators.required]],
        attachment: null,
        participants: new FormArray([
          this.fb.group({
            studio: [null],
            name: [""],
            type: "host",
          }),
          this.fb.group({
            studio: null,
            name: [""],
            type: "guest",
          }),
        ]),
      },
      { validator: this.validateDate.bind(this) }
    );
  }

  getResourceTypes() {
    this.adminService.getResourceType(this.requestType).subscribe({
      next: (res: any) => {
        this.resourceTypes = res;
        this.cdref.detectChanges();
      },
      error: (err: any) => {

      },
    });
  }

  getResources(type: string) {
    this.adminService.getResourceByType(type).subscribe({
      next: (res: any) => {
        this.resources = res;
        this.cdref.detectChanges();
      },
      error: (err: any) => {

      },
    });
  }

  getId(data: string) {
    return `${data.toUpperCase().replace(" ", "_")}`;
  }

  validateDate(group: AbstractControl): ValidationErrors | null {
    // here we have the 'requestForm' group
    const fromDateTime = group.get("fromDateTime")?.value;
    const toDateTime = group.get("toDateTime")?.value;
    const requestEndDateTime = group.get("requestEndDateTime")?.value;
    const startTime = group.get("startDateTime")?.value;
    const endTime = group.get("endDateTime")?.value;
    if (!fromDateTime || !toDateTime || !startTime || !endTime) {
      return null;
    }
    return this.validTimeSlot(
      fromDateTime,
      toDateTime,
      requestEndDateTime,
      startTime,
      endTime
    )
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

  getRequiredData() {
    this.studios$ = this.dataService.getStudios();
    this.studios$.subscribe((data) => (this.gStudios = data));
    this.getResourceTypes();
    this.controlRooms$ = this.dataService.getControlRooms();
    this.controlRooms$.subscribe((data) => (this.gControlRooms = data));
    this.channels$ = this.dataService.getChannels();
    this.channels$.subscribe((data) => (this.gChannels = data));
    this.shootTypes$ = this.dataService.getShootTypes();
    this.shootTypes$.subscribe((data) => (this.gShootTypes = data));
  }

  addShooType(item: any) {
    const newShootType = { _id: 11111, name: item, tag: true, new: true };
    this.gShootTypes.push(newShootType);
    return newShootType;
  }

  // Without this, angular will not recognize the participants formArray variable in the html *ngFor
  get participants() {
    return this.requestForm.controls["participants"] as FormArray;
  }

  addParticipant(studio: any = null, name: any = "") {
    return this.fb.group({
      studio: [studio],
      name: [name],
      type: "guest",
    });
  }

  changeRequestType(requestType: any) {
    let requiredFields: string[] = [];
    let optionalFields: string[] = [];

    switch (requestType) {
      case "live":
        requiredFields = [
          "channel",
          "resourceName",
          "name",
          "resourceType",
          "studio",
        ];
        optionalFields = [
          "program",
          "shootType",
          "contactInformation",
          "participants",
        ];
        break;

      case "prerecorded":
        requiredFields = [
          "resourceName",
          "participants",
          "resourceType",
          "studio",
          "name",
        ];
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
          "program",
          "channel",
          "participants",
          "contactInformation",
          "shootType",
        ];
        break;
      case "cameraman":
        requiredFields = [
          "program",
          "contactInformation",
          "resourceName",
          "resourceType",
          "shootType",
        ];
        optionalFields = ["channel", "name", "participants"];
        break;
    }
    // this.gGuestLimit = 1;

    // Dynamically set fields validations based on the request type
    this.changeControlValidation(this.requestForm, requiredFields, true);
    this.changeControlValidation(this.requestForm, optionalFields, false);

    this.getResourceTypes();

    // this.requestForm.get("resourceName")?.setValue("");
    this.resources$ = new Observable();
    if (requestType == "prerecorded") {
      const hostFormGroup = (
        this.requestForm.get("participants") as FormArray
      )?.at(0);
      hostFormGroup.get("studio")?.setValidators([Validators.required]);
      hostFormGroup.get("name")?.setValidators([Validators.required]);
    } else {
      const hostFormGroup = (
        this.requestForm.get("participants") as FormArray
      )?.at(0);
      hostFormGroup.get("studio")?.clearValidators();
      hostFormGroup.get("name")?.clearValidators();
    }

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
      let formarray = this.requestForm.get("participants") as FormArray;
      let array = this.liveguests.filter(
        (value) => value !== "" && value !== null
      );
      this.liveguests = array;

      if (!this.liveguests.length) {
        let flength = formarray.length;
        for (let i = flength - 1; i > 1; i--) {
          formarray.removeAt(i);
        }
        formarray.at(0).get("studio")?.setValue(" ");
        formarray.at(0).get("name")?.setValue(" ");
      } else {
        formarray = this.requestForm.get("participants") as FormArray;
        let flength = formarray.length;
        for (let i = flength - 1; i >= 0; i--) {
          (this.requestForm.get("participants") as FormArray).removeAt(i);
        }
        let i;
        for (i = 0; i < this.liveguests.length; i++) {
          formarray.insert(
            i,
            this.addParticipant(this.liveguests[i], this.livetext[i])
          );
        }
        // if (i == 1) {
        //   formarray.insert(i, this.addParticipant());
        // }
      }

      formarray.at(0).get("studio")?.setValidators([Validators.required]);
      formarray.at(0).get("name")?.setValidators([Validators.required]);
      this.previospage = "live";
      // this.isAddGuestLimitArrived = this.liveGuest;
    }

    if (requestType == "prerecorded") {
      // this.gGuestLimit = this.preglimit;

      let formarray = this.requestForm.get("participants") as FormArray;
      let array = this.preguests.filter(
        (value) => value !== "" && value !== null
      );
      this.preguests = array;
      if (!this.preguests.length) {
        let flength = formarray.length;
        for (let i = flength - 1; i > 0; i--) {
          formarray.removeAt(i);
        }
        formarray.at(0).get("studio")?.setValue(" ");
        formarray.at(0).get("name")?.setValue(" ");
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
          formarray.insert(
            i,
            this.addParticipant(this.preguests[i], this.pretext[i])
          );
        }
      }

      formarray.at(0).get("studio")?.setValidators([Validators.required]);
      formarray.at(0).get("name")?.setValidators([Validators.required]);
      this.previospage = "prerecorded";
      // this.isAddGuestLimitArrived = this.preGuest;
    }

    if (requestType == "cameraman") {
      this.previospage = "cameraman";
    }

    // Reset form and reset its submitted state as well
    // this.formRef.resetForm({
    //   requestDateTime: this.requestForm.get('requestDateTime')?.value,
    //   startDateTime: this.requestForm.get('startDateTime')?.value,
    //   endDateTime: this.requestForm.get('endDateTime')?.value,
    //   details: this.requestForm.get('details')?.value,
    //   attachment: this.requestForm.get('attachment')?.value,
    // });

    // Remove the extra participants fields if added when the requestType was prerecorded
    // this.resetFormArray();
  }

  resetFormArray() {
    while ((this.requestForm.get("participants") as FormArray).length !== 0) {
      (this.requestForm.get("participants") as FormArray).removeAt(0);
    }

    (this.requestForm.get("participants") as FormArray)?.push(
      this.fb.group({
        studio: null,
        name: "",
        type: "host",
      })
    );
    (this.requestForm.get("participants") as FormArray)?.push(
      this.fb.group({
        studio: null,
        name: "",
        type: "guest",
      })
    );
  }

  livenamechange(e: any) {

    // let guestLimit;
    // if (e == undefined) {
    //   this.gGuestLimit = 1;
    // } else {
    //   guestLimit =
    //     this.gStudios.find((item) => item._id === e._id)?.guestLimit ?? 1;
    //   if (this.isStudio() && this.glimitplaceflg)
    //     this.gGuestLimit = guestLimit ? guestLimit : 1;
    // }
    this.liveresourcename = e?._id;
  }

  prerecordnamechange(e: any) {
    // let guestLimit;
    // if (e == undefined) {
    //   guestLimit = 1;
    // } else {
    //   guestLimit = this.gStudios.find((item) => item._id === e._id)?.guestLimit ?? 1;
    // }
    this.prerecordname = e?._id;
    if (!this.prelimitplaceflg) return;
    // this.gGuestLimit = guestLimit;
    // this.preglimit = this.gGuestLimit;
  }

  cameramannamechange(e: any) {
    this.cameramanname = e?._id;
  }

  handleHostStudioChange(e: any) {
    if (this.glimitplaceflg && this.requestType == "live") return;
    if (this.prelimitplaceflg && this.requestType == "prerecorded") return;

    let guestLimit;
    if (e == undefined) {
    } else {
      this.glimitplaceflg = false;
    }

    const participantsArr = this.requestForm.controls[
      "participants"
    ] as FormArray;

    if (this.requestType == "prerecorded") {
      (this.requestForm.get("participants") as FormArray)
        .at(0)
        .get("studio")
        ?.setValidators([Validators.required]);
      (this.requestForm.get("participants") as FormArray)
        .at(0)
        .get("name")
        ?.setValidators([Validators.required]);
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
    } else {
      (this.requestForm.get("participants") as FormArray)
        .at(i)
        .get("name")
        ?.setValidators([Validators.required]);
    }
  }

  isStudio() {
    const resouceTypeId = this.requestForm.get("resourceType")?.value;
    const selectedResourceType = this.resourceTypes.find(
      (item) => item._id === resouceTypeId
    );
    let partValue = (this.requestForm.controls["participants"] as FormArray)
      .value[0];
    if (selectedResourceType?.type === "STUDIO") {
      if (partValue) partValue.type = "guest";
      return true;
    } else {
      if (partValue) partValue.type = "host";
      return false;
    }
  }

  resourceChange($event: any) {
    if ($event?._id) {
      (this.requestForm.get("participants") as FormArray).at(0)?.enable();
      (this.requestForm.get("participants") as FormArray).at(1)?.enable();
    }

    if (this.requestType == "live") {
      this.liveresourcetype = $event?._id;
      if ($event?.name != "Studio") {
        // if (this.glimitplaceflg) {
        //   this.glimitplaceflg = false;
        // }
        this.requestForm.get("resourceName")?.setValue("");
      } else if ($event?.name == "Studio") {
        this.requestForm.get("resourceName")?.setValue("");
        // this.glimitplaceflg = true;
      }
    }
    if (this.requestType == "prerecorded") {
      let pform = this.requestForm.get("participants") as FormArray;
      if (this.isStudio()) {
        this.requestForm.get("resourceName")?.setValue("");
        this.prelimitplaceflg = true;
      } else {
        this.requestForm.get("resourceName")?.setValue("");
        this.prelimitplaceflg = false;
      }
      this.prerecordtype = $event?._id;
      this.prerecordname = this.requestForm.get("resourceName")?.value;
    }

    if (this.requestType == "cameraman") {
      this.cameramantype = $event?._id;
      this.requestForm.get("resourceName")?.setValue("");
    }
  }

  addGuest() {
    const participantsArr = this.requestForm.controls[
      "participants"
    ] as FormArray;
    const selectedResourceId = this.requestForm.controls["resourceName"].value;
    const hostId = this.isStudio()
      ? selectedResourceId
      : (participantsArr.at(0) as FormGroup).controls["studio"].value;

    const guestLimit =
      this.gStudios.find((item) => item._id === hostId)?.guestLimit ?? 0;
    (this.requestForm.controls["participants"] as FormArray).push(
      this.addParticipant()
    );

  }

  removeGuest(index: any) {
    // this.isAddGuestLimitArrived = false;
    (this.requestForm.get("participants") as FormArray).removeAt(index);
  }

  removeAll() {
    let parties = this.requestForm.get("participants") as FormArray;
    let i = parties.length;

    // if (i > this.gGuestLimit) {
    //   for (let k = i - 1; k > this.gGuestLimit; k--) {
    //     this.removeGuest(k);
    //   }
    // }
    if (this.isStudio()) {

      // parties.at(0).get("studio")?.setValue(parties.at(1).get("studio")?.value);
      if (parties.length > 1) this.removeGuest(1);
    }
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
      };
    } else {
      this.attachmentName = "Add attachment";
    }
  }

  removeAttachment(event: any) {
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
    requestEndDateTimeString: any,
    startTimeString: any,
    endTimeString: any
  ) {
    let msg = "";
    let isValidFlg = true;

    const fromDateTime = this._date(fromDateTimeString);
    const toDateTime = this._date(toDateTimeString);
    const requestEndDateTime = this._date(requestEndDateTimeString);
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
    if (
      startDateTime > endDateTime
      // &&
      // !(startDateTime.getHours() === 23 && endDateTime.getHours() === 0)
    ) {
      this.dateValidationMsg = "Start time must be earlier then end time";
      isValidFlg = false;
    }

    if (startDateTime < new Date()) {
      this.dateValidationMsg =
        "Request date cannot be less then today's date and time";
      isValidFlg = false;
    }

    if (!(fromDateTime <= toDateTime)) {
      this.dateValidationMsg =
        "Request end date cannot be less then request start date";
      isValidFlg = false;
    }

    if (
      // this.calcHourDiff(startDateTime, endDateTime) > this.rangeLimit &&
      (endDateTime.getDate() - startDateTime.getDate()) > 1) {
      // this.toastr.warning(`The time range must be in ${this.rangeLimit} hours`);
      this.dateValidationMsg = `The time range must be involved in 2 days`;
      isValidFlg = false; ``
    }
    if (requestEndDateTime && requestEndDateTime < fromDateTime) {
      this.dateValidationMsg =
        "Request end date cannot be less then request start date";
      isValidFlg = false;
    }

    return isValidFlg;
  }

  _date(dateString: any) {
    if (dateString) {
      return new Date(
        `${dateString.year}-${dateString.month}-${dateString.day}`
      );
    }
    return dateString;
  }

  calcHourDiff(date1: Date, date2: Date) {
    const diffInMs = date2.getTime() - date1.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours;
  }

  selectionChanged(event: StepperSelectionEvent) {
    // Transition from first step to the next

    if (event.previouslySelectedIndex == 0 && !this.requestOk) {
      this.processRequestForm();
    }
  }

  callNext() {
    this.stepper.next();
  }
  handleClickNext() {
    this.processRequestForm();
  }
  callPrevious() {
    if (this.requestSlotsEdited) {
      this.stepper.previous();
    } else {
      this.stepper.steps.first.select();
    }
  }

  formSubmit() { }

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

    const startTime = request.startDateTime?.split(":");
    const endTime = request.endDateTime?.split(":");

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

  checkSlotAvailability() {
    this.processing = true;
    const request = this.requestForm.value;

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
    };

    // Handle multiple resource Ids in case a resource selected is not available or already booked
    const resourceIds = [];

    resourceIds.push(request.resourceName);
    if (request?.participants?.length)
      for (let i = 0; i < request.participants.length; i++) {
        if (request.participants[i].studio) {
          resourceIds.push(request.participants[i].studio);
        }
      }

    // if (this.requestType == 'live') {
    //   resourceIds.push(request.resourceName)
    // }

    params.resourceIds = resourceIds.join(",");

    // Only check slot availability for request types [live, prerecorded] as they have resourced id in the payload
    if (this.requestType == "live" || this.requestType == "prerecorded") {
      this.requestService
        .checkSlotAvailability(params, this.requestDates)
        // .pipe(
        //   map((data: any) => {
        //     data.schedules = data.schedules.map((sc: any) => {
        //       sc.dateRange = `${moment(sc.startDateTime).format(
        //         'hh:mm A'
        //       )} to ${moment(sc.endDateTime).format('hh:mm A')}`;
        //       return sc;
        //     });

        //     data.resources = data.resources.map((sc: any) => {
        //       sc.dateRange = `${moment(sc.startDateTime).format(
        //         'hh:mm A'
        //       )} to ${moment(sc.endDateTime).format('hh:mm A')}`;
        //       return sc;
        //     });
        //     return data;
        //   })
        // )
        .subscribe((data: any) => {
          this.processing = false;
          this.allSlotsAvailable = true;

          this.requestSlotsEdited = false;

          for (let i = 0; i < data.length; i++) {
            if (!data[i].isAvailable) {
              this.allSlotsAvailable = false;
            }
            // Add resrouceIds to the request object for passing it to the request-availability component
            data[i].resourceIds = params.resourceIds;
          }

          this.requestTimeSlots = data;

          if (this.allSlotsAvailable) {
            this.reviewRequest();

            // Disable the second [availibility] step of the wizard as there are no conflicting requests
            // @ts-ignore
            this.stepper.selected.editable = false;
            // @ts-ignore
            this.stepper.selected.completed = true;

            // this.callNext()
            this.goToFinalStep();
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
      this.processing = false;
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
        this.stepper.selected.editable = false;
        // @ts-ignore
        this.stepper.selected.completed = true;

        // this.callNext();
        this.goToFinalStep();
      });
    }
  }

  goToFirstStep() {
    if (this.requestSlotsEdited) {
      const conf = confirm("Your current changes will be lost, are you sure?");
      if (conf) {
        this.stepper.previous();
      }
    } else {
      this.stepper.previous();
    }
  }

  goToFinalStep() {
    // @ts-ignore
    this.stepper.steps.last.interacted = false;
    this.stepper.steps.last.editable = true;
    // @ts-ignore
    this.stepper.selected.completed = true;
    // @ts-ignore
    this.stepper.selected.editable = true;

    // this.requestSlotsEdited = true;
    this.reviewRequest();
    this.callNext();
  }

  saveAvailable() {
    this.saveOnlyAvailable = true;
    this.requestSlotsEdited = true;
    this.goToFinalStep();
  }

  reviewRequest() {
    // To avoid copy by reference
    const data = JSON.parse(JSON.stringify(this.requestForm.value));

    const shootType = data.resourceName
      ? this.resources.filter((s) => s._id == data.resourceName)[0]?.name
      : null;

    const _resourceType = data.resourceType
      ? this.resourceTypes.filter((s) => s._id == data.resourceType)[0]?.name
      : null;
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

    const startTime = data.startDateTime?.split(":");
    const endTime = data.endDateTime?.split(":");

    data.requestDateTime = this._date(data.fromDateTime);
    const startDateTime = new Date(data.fromDateTime);
    const endDateTime = new Date(data.toDateTime);

    startDateTime.setHours(startTime[0]);
    startDateTime.setMinutes(startTime[1]);

    endDateTime.setHours(endTime[0]);
    endDateTime.setMinutes(endTime[1]);

    data.timeSlot = `${moment(startDateTime).format("hh:mm A")} to ${moment(
      endDateTime
    ).format("hh:mm A")}`;

    if (this.requestType == "prerecorded" || this.requestType == "live") {
      let participants = [];
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

    data.shootTypeName = shootType;
    data._resourceType = _resourceType;
    data.gshootTypeName = gShootType;
    data.channelName = channel;
    data.studioName = studio;
    data.controlRoomName = cRoom;
    // data.startDateTime = startDateTime;
    // data.endDateTime = endDateTime;
    data.requestType = this.requestType;
    data.fileName = this.attachment ? this.attachment.name : null;

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

    // Add the resourceIds to the requestObject as well
    // Handle multiple resource Ids in case a resource selected is not available or already booked
    const resourceIds = [];

    if (this.requestType == "prerecorded" || this.requestType == "live") {
      resourceIds.push(data.resourceName);
      for (let i = 0; i < data.participants.length; i++) {
        if (data.participants[i].studio) {
          resourceIds.push(data.participants[i].studio);
        }
      }
    }

    // if (this.requestType == 'live') {
    //   resourceIds.push(data.resourceName)
    // }

    data.resourceIds = resourceIds;
    this.requestObject = data;
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
  onRequestTimeSlotChanged(e: any) {
    this.requestTimeSlots = this.requestTimeSlots.map((rts: any) => {
      if (rts.id == e.id) {
        rts = e;
      }

      return rts;
    });

    this.updateAllSlotsAvailableFlg();
    this.updateRequestSlotEditedFlg();
  }

  updateRequestSlotEditedFlg() {
    let isEdited = false;
    for (let i = 0; i < this.requestTimeSlots.length; i++) {
      if (this.requestTimeSlots[i].edited) {
        isEdited = true;
        break;
      }
    }

    this.requestSlotsEdited = isEdited;
  }

  updateAllSlotsAvailableFlg() {
    let isAllAvailable = true;
    for (let i = 0; i < this.requestTimeSlots.length; i++) {
      if (!this.requestTimeSlots[i].isAvailable) {
        isAllAvailable = false;
        break;
      }
    }

    this.allSlotsAvailable = isAllAvailable;
  }
}
