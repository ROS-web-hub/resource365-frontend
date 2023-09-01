import {
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../admin.service";
import { AddResourceTypeComponent } from "./add-resource-type/add-resource-type.component";
import { EditResourceTypeComponent } from "./edit-resource-type/edit-resource-type.component";
import { ViewResourceTypeComponent } from "./view-resource-type/view-resource-type.component";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { map } from "rxjs";

@Component({
  selector: "app-resource-type",
  templateUrl: "./resource-type.component.html",
  styleUrls: ["./resource-type.component.scss"],
})
export class ResourceTypeComponent implements OnInit {
  @ViewChild("linkFormModal") linkFormModal!: TemplateRef<any>;
  @ViewChild("confirmModalContent") confirmModalContent!: TemplateRef<any>;

  rows: any[] = [];
  filters = {
    limit: 10, // records per page
    page: 0,
    searchTerm: "",
  };
  pageList: number[] = [];
  totalRecords: number = 0;
  totalPages: number = 0;
  dataLoadingFlag: boolean = false;
  resources: any[] = [];
  recordingTypes: any[] = [];
  resourceTypes: any[] = [];
  modaleRef!: NgbModalRef;
  linkForm!: FormGroup;
  deletionRecordId: string = "";

  constructor(
    private cdref: ChangeDetectorRef,
    private fb: FormBuilder,
    private router: Router,
    // private spinner: NgxSpinnerService,
    public translate: TranslateService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.getRecordingType();
    this.getResourceTypes();
    this.renderData();
    this.initializeForm();
  }

  refresh() {
    this.getRecordingType();
    this.getResourceTypes();
    this.renderData();
    this.initializeForm();
  }

  renderData() {
    // this.spinner.show();
    this.adminService
      .getResourceTypes(this.filters.page, this.filters.limit)
      .subscribe({
        next: (data: any) => {
          if (data == null) {
            this.rows = [];
            this.totalRecords = 0;
            this.totalPages = 0;
          } else {
            this.rows = data.docs;
            this.totalRecords = data.totalDocs;
            this.totalPages = data.totalPages;
          }
          this.pageList = [...Array(this.totalPages).keys()];
          // this.spinner.hide();
          this.cdref.detectChanges();
          this.dataLoadingFlag = false;
        },
        error: (err: any) => {
          // this.spinner.hide();
          console.log("data error: ", err);
          // this.cdref.detectChanges();
        },
      });
  }

  linkResourceTypes2RecordingType() {
    this.modaleRef = this.modalService.open(this.linkFormModal, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
  }

  initializeForm() {
    this.linkForm = this.fb.group({
      recordingTypes: [this.recordingTypes, [Validators.required]],
      resourceTypes: [],
    });
    this.linkForm.get("recordingTypes")?.valueChanges.subscribe((value) => {
      this.adminService.getRecordType(value).subscribe({
        next: (res: any) => {
          this.linkForm.get("resourceTypes")?.setValue(res.resourceTypes ?? []);
        },
        error: (err: any) => {
          console.log({ err });
        },
      });
    });
  }
  getResourceTypes() {
    const response = this.adminService.getResourceType("all").subscribe({
      next: (res: any) => {
        this.resourceTypes = res;
      },
      error: (err: any) => {
        console.log({ err });
      },
    });
  }
  getRecordingType() {
    this.adminService
      .getRecordType()
      .pipe(
        map((data: any) => {
          return data.map((d: any) => {
            d.text = this.getCapitalized(
              d.type === "prerecorded" ? "Pre-record" : d.type
            );
            return d;
          });
        })
      )
      .subscribe({
        next: (res: any) => {
          this.recordingTypes = res;
        },
        error: (err: any) => {
          console.log({ err });
        },
      });
  }

  getCapitalized(value: string) {
    if (value) {
      return `${value[0].toUpperCase()}${value.slice(1)}`;
    } else {
      return "";
    }
  }

  search(val: string) {
    this.filters.searchTerm = val;
    this.renderData();
  }

  setPage(page: number) {
    this.filters.page = page;
    this.renderData();
  }

  addRecord() {
    const modalRef = this.modalService.open(AddResourceTypeComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.response.subscribe((res: any) => {
      this.refresh();
    });
  }

  viewRecord(data: any) {
    const modalRef = this.modalService.open(ViewResourceTypeComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
  }

  editRecord(data: any) {
    const modalRef = this.modalService.open(EditResourceTypeComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
    modalRef.componentInstance.recordingTypes = this.recordingTypes;
    modalRef.componentInstance.response.subscribe((res: any) => {
      this.refresh();
    });
  }

  onSubmit() {
    if (this.linkForm.invalid) {
      const msg = "Invalid Form";
      const header = "Please fill the required fields...";
      this.toastr.error(header, msg, {
        positionClass: "toast-top-right",
      });
      document.getElementById("linkForm")?.classList.add("input-error");
    } else {
      this.submit();
    }
  }

  submit() {
    let obj = this.linkForm.value;
    // this.spinner.show();
    this.adminService.updateRecordingType(obj).subscribe(
      (res: any) => {
        // this.response.emit(res)
        // this.spinner.hide();
        const msg = "Record successfully updated";
        const header = "Success";
        this.toastr.success(header, msg, {
          positionClass: "toast-top-right",
        });
        this.closeModal();
        this.refresh();
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
  closeModal() {
    this.modaleRef.close();
  }

  deleteResourceTypeConfirm(value: string) {
    this.deletionRecordId = value;
    this.modaleRef = this.modalService.open(this.confirmModalContent, {
      backdrop: "static",
      size: "sm",
      keyboard: false,
    });
  }

  getRecordingTypes(_id: string) {
    const recordingTypes = this.recordingTypes
      .filter((item) => item.resourceTypes.includes(_id))
      .map((item) =>
        this.getCapitalized(
          item.type === "prerecorded" ? "Pre-Record" : item.type
        )
      );
    return recordingTypes.join(", ");
  }

  deleteRecord() {
    // this.adminService.deletedReourcetype(this.deletionRecordId).subscribe(
    //   (res: any) => {
    //     this.modaleRef.close();
    //     this.refresh();
    //     // this.spinner.hide();
    //   },
    //   (err: any) => {
    //     // this.spinner.hide();
    //     const msg = "Failed";
    //     const header = "Please try again...";
    //     this.toastr.error(header, msg, {
    //       positionClass: "toast-top-right",
    //     });
    //   }
    // );

    this.adminService.ActiveResourceType(this.deletionRecordId).subscribe(
      (res: any) => {
        this.refresh();
        this.modaleRef.close();
      },
      (err: any) => {
        const msg = "Failed";
        const header = "Please try again...";
        this.toastr.error(header, msg, {
          positionClass: "toast-top-right",
        });
        this.modaleRef.close();
      }
    );
  }
}
