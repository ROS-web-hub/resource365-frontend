import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ChangeDetectorRef,
} from "@angular/core";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../../admin.service";

@Component({
  selector: "app-add-resource",
  templateUrl: "./add-resource.component.html",
  styleUrls: ["./add-resource.component.scss"],
})
export class AddResourceComponent implements OnInit {
  @Output() response: EventEmitter<any> = new EventEmitter();
  users$!: any;

  resourceTypes: any[] = [];

  newForm: FormGroup = this.fb.group({
    name: ["", [Validators.required]],
    type: ["CONTROL_ROOM", [Validators.required]],
    location: [""],
    guestLimit: [1, [Validators.required]],
    autoApproval: [false, [Validators.required]],
    startTime: ["08:00", [Validators.required]],
    endTime: ["16:00", [Validators.required]],
    watchers: [],
  });

  showAutoApprovalTimeslot: boolean = false;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    // private spinner: NgxSpinnerService,
    private router: Router,
    private adminService: AdminService,
    private cdref: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getUsersList();
    this.getResourceTypes();
  }

  getUsersList() {
    this.users$ = this.adminService.getUserListAll();
  }

  getResourceTypes() {
    const response = this.adminService.getResourceType("all").subscribe({
      next: (res: any) => {
        this.resourceTypes = res;
        this.cdref.detectChanges();
      },
      error: (err: any) => {
        console.log({ err });
      },
    });
  }

  getId(data: string) {
    return `${data.toUpperCase().replace(" ", "_")}`;
  }

  autoApprovalChange(event: any) {
    this.newForm.controls["autoApproval"].setValue(event.target.checked);
    if (event.target.checked) {
      this.showAutoApprovalTimeslot = true;
    } else {
      this.showAutoApprovalTimeslot = false;
    }
  }

  onSubmit() {
    if (this.newForm.invalid) {
      const msg = "Invalid Form";
      const header = "Please fill the required fields...";
      this.toastr.error(header, msg, {
        positionClass: "toast-top-right",
      });
      document.getElementById("newForm")?.classList.add("input-error");
    } else {
      this.submit();
    }
  }

  submit() {
    // let obj = this.newForm.value;
    let obj = this.newForm.getRawValue();
    // this.spinner.show();
    this.adminService.createResource(obj).subscribe({
      next: (res: any) => {
        // this.spinner.hide();
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
}
