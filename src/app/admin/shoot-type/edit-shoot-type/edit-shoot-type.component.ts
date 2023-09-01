import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../../admin.service";

@Component({
  selector: "app-edit-shoot-type",
  templateUrl: "./edit-shoot-type.component.html",
  styleUrls: ["./edit-shoot-type.component.scss"],
})
export class EditShootTypeComponent implements OnInit {
  @Output() response: EventEmitter<any> = new EventEmitter();
  @Input() data: any;
  editForm!: FormGroup;

  constructor(
    private activeModal: NgbActiveModal,
    // private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchEssentialData();
  }

  initializeForm() {
    this.editForm = this.fb.group({
      name: [this.data.name, [Validators.required]],
    });
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
    this.adminService.updateShootType(this.data._id, obj).subscribe(
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
