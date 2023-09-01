import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
} from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../admin.service";
import { AddScheduleTypeComponent } from "./add-schedule-type/add-schedule-type.component";
import { ViewScheduleTypeComponent } from "./view-schedule-type/view-schedule-type.component";
import { EditScheduleTypeComponent } from "./edit-schedule-type/edit-schedule-type.component";

@Component({
  selector: "app-schedule-type",
  templateUrl: "./schedule-type.component.html",
  styleUrls: ["./schedule-type.component.scss"],
})
export class ScheduleTypeComponent implements OnInit {
  @ViewChild("confirmModalContent")
  confirmModalContent!: TemplateRef<any>;
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
  deleteId: string = "";
  usedScheduleTypes: string[] = [];

  modaleRef!: NgbModalRef;

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
    this.getScheduleTypeData();
  }

  refresh() {
    this.getScheduleTypeData();
  }

  getScheduleTypeData() {
    this.adminService.getUsedScheduleTypes().subscribe({
      next: (data: any) => {
        this.usedScheduleTypes = data;
        this.renderData();
      },
      error: (err: any) => {
        console.log("data error: ", err);
      },
    });
  }

  checkIsDeleteAvailability(id: string) {
    return !this.usedScheduleTypes.includes(id);
  }

  renderData() {
    // this.spinner.show();
    this.adminService
      .getScheduleTypeList(this.filters.page, this.filters.limit)
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

  search(val: string) {
    this.filters.searchTerm = val;
    this.renderData();
  }

  setPage(page: number) {
    this.filters.page = page;
    this.renderData();
  }

  addRecord() {
    const modalRef = this.modalService.open(AddScheduleTypeComponent, {
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
    const modalRef = this.modalService.open(ViewScheduleTypeComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
  }

  editRecord(data: any) {
    const modalRef = this.modalService.open(EditScheduleTypeComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
    modalRef.componentInstance.response.subscribe((res: any) => {
      this.refresh();
    });
  }
  deleteAction(recordId: any) {
    // if (!this.checkIsDeleteAvailability(recordId)) return;
    this.deleteId = recordId;
    this.modaleRef = this.modalService.open(this.confirmModalContent, {
      backdrop: "static",
      size: "sm",
      keyboard: false,
    });
  }
  deleteRecord() {
    // this.spinner.show();
    // this.adminService.deleteScheduleType(this.deleteId).subscribe(
    //   (res: any) => {
    //     this.modaleRef.close()
    //     this.refresh()
    //     // this.spinner.hide();
    //   },
    //   (err: any) => {
    //     // this.spinner.hide();
    //     this.modaleRef.close()
    //     const msg = 'Failed'
    //     const header = 'Please try again...'
    //     this.toastr.error(header, msg, {
    //       positionClass: 'toast-top-right',
    //     })
    //   }
    // )

    this.adminService.ActiveScheduleType(this.deleteId).subscribe(
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
