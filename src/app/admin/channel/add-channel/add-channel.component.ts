import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../../admin.service";

@Component({
  selector: "app-add-channel",
  templateUrl: "./add-channel.component.html",
  styleUrls: ["./add-channel.component.scss"],
})
export class AddChannelComponent implements OnInit {
  @Output() response: EventEmitter<any> = new EventEmitter();

  newForm: FormGroup = this.fb.group({
    name: ["", [Validators.required]],
  });

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    // private spinner: NgxSpinnerService,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {}

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
    this.adminService.createChannel(obj).subscribe({
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
