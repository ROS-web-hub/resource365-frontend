import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { DashboardService } from "src/app/dashboard/dashboard.service";
import { AdminService } from "../../admin.service";

@Component({
  selector: "app-edit-user",
  templateUrl: "./edit-user.component.html",
  styleUrls: ["./edit-user.component.scss"],
})
export class EditUserComponent implements OnInit {
  @Output() response: EventEmitter<any> = new EventEmitter();
  @Input() data: any;
  @Input() allPermissions: any = [];

  editForm!: FormGroup;

  allResources: any = [];
  enableFlag: Boolean = false;
  constructor(
    private activeModal: NgbActiveModal,
    // private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private dashboardService: DashboardService,
    private fb: FormBuilder,
    private adminService: AdminService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.fetchEssentialData();
    if (this.data.permissions.includes('APPROVE_REJECT_REQUEST') || this.data.permissions.includes('CANCEL_APPROVED_REQUEST')) {
      this.enableFlag = true;
    } else {
      this.enableFlag = false;
      this.editForm.controls['resources'].setValue([]);
    }
  }

  initializeForm() {
    this.editForm = this.fb.group({
      permissions: [this.data.permissions],
      resources: [this.data.resources],
    });
  }

  onSelectPermission(selectedItem: any) {
    this.data.permissions = selectedItem;
    if (this.data.permissions.includes('APPROVE_REJECT_REQUEST') || this.data.permissions.includes('CANCEL_APPROVED_REQUEST')) {
      this.enableFlag = true;
    } else {
      this.enableFlag = false;
      this.editForm.controls['resources'].setValue([]);
    }
    
  }

  onRemovePermission(removedItem: any) {
    this.data.permissions.map((r: any, index: Number) => {
      if (r == removedItem.value) {
        this.data.permissions.splice(index, 1);
      }
    });

    if (this.data.permissions.includes('APPROVE_REJECT_REQUEST') || this.data.permissions.includes('CANCEL_APPROVED_REQUEST')) {
      this.enableFlag = true;
    } else {
      this.enableFlag = false;
      this.editForm.controls['resources'].setValue([]);
    }
  }

  fetchEssentialData() {
    this.dashboardService.getResources().subscribe((rs) => {
      this.allResources = rs;
    });
  }

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
    this.adminService.updateUser(this.data._id, obj).subscribe(
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
