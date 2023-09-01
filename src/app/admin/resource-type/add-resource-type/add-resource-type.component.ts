import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  ChangeDetectorRef,
} from "@angular/core";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../../admin.service";
import { map } from "rxjs";

@Component({
  selector: "app-add-resource-type",
  templateUrl: "./add-resource-type.component.html",
  styleUrls: ["./add-resource-type.component.scss"],
})
export class AddResourceTypeComponent implements OnInit {
  @Output() response: EventEmitter<any> = new EventEmitter();
  recordingTypes: any[] = [];

  newForm: FormGroup = this.fb.group({
    resourceType: ["", [Validators.required]],
    recordingType: ["", [Validators.required]],
  });

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdf: ChangeDetectorRef,
    // private spinner: NgxSpinnerService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.getRecordingType();
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

  getRecordingType() {
    this.adminService
      .getRecordType()
      .pipe(
        map((data: any) => {
          return data.map((d: any) => {
            d.text = this.convert2Capitalize(d.type);
            return d;
          });
        })
      )
      .subscribe({
        next: (res: any) => {
          this.recordingTypes = res;
          this.cdf.detectChanges();
        },
        error: (err: any) => {
          console.log({ err });
        },
      });
  }

  convert2Capitalize(str: string) {
    const capitalized = String(str).charAt(0).toUpperCase() + str.slice(1);
    return capitalized;
  }

  submit() {
    // let obj = this.newForm.value;
    let obj = this.newForm.getRawValue();
    // this.spinner.show();
    this.adminService.createResourceType(obj).subscribe({
      next: (res: any) => {
        // this.spinner.hide();
        this.response.emit(res);
        const msg = "Response Type Added successfully";
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
