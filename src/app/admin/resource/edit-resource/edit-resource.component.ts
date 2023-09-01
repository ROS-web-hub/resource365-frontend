import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Validators, FormBuilder, FormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../../admin.service";

@Component({
  selector: "app-edit-resource",
  templateUrl: "./edit-resource.component.html",
  styleUrls: ["./edit-resource.component.scss"],
})
export class EditResourceComponent implements OnInit {
  @Output() response: EventEmitter<any> = new EventEmitter();
  @Input() data: any;
  @Input() resourceTypes: any;
  editForm!: FormGroup;

  showAutoApprovalTimeslot: boolean = false;

  users$!: any;
  constructor(
    private activeModal: NgbActiveModal,
    // private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.getUsersList();
    this.initializeForm();
    this.fetchEssentialData();
  }

  initializeForm() {
    this.editForm = this.fb.group({
      name: [this.data.name, [Validators.required]],
      type: [this.data.type, [Validators.required]],
      // guestLimit:[this.data.guestLimit, [Validators.required]],
      guestLimit: [this.data.guestLimit, [Validators.required]],
      location: [this.data.location],
      autoApproval: [this.data.autoApproval || false, [Validators.required]],
      startTime: [this.data.startTime || "08:00", [Validators.required]],
      endTime: [this.data.endTime || "16:00", [Validators.required]],
      watchers: [this.data.watchers],
    });

    this.showAutoApprovalTimeslot = this.data.autoApproval || false;
  }

  autoApprovalChange(event: any) {
    this.editForm.controls["autoApproval"].setValue(event.target.checked);
    if (event.target.checked) {
      this.showAutoApprovalTimeslot = true;
    } else {
      this.showAutoApprovalTimeslot = false;
    }
  }

  getUsersList() {
    this.users$ = this.adminService.getUserListAll();
  }

  fetchEssentialData() {}

  closeModal() {
    this.activeModal.close();
  }

  onSubmit() {
    if (this.editForm.invalid) {
      const msg = "Invalid Form";
      const header = "Please fill the required fields...";
      this.toastr.error(header, msg, {
        positionClass: "toast-top-right",
      });
      document.getElementById("editForm")?.classList.add("input-error");
    } else {
      this.submit();
    }
  }

  submit() {
    let obj = this.editForm.value;
    // this.spinner.show();
    this.adminService.updateResource(this.data._id, obj).subscribe(
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
}
