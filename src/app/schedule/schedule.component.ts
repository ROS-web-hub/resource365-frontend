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
import { AddScheduleComponent } from "./add-schedule/add-schedule.component";
import { EditScheduleComponent } from "./edit-schedule/edit-schedule.component";
import { ScheduleService } from "./schedule.service";
import { ViewScheduleComponent } from "./view-schedule/view-schedule.component";
import * as moment from "moment";
import { BaseService } from "../core/_services/base.service";

@Component({
  selector: "app-schedule",
  templateUrl: "./schedule.component.html",
  styleUrls: ["./schedule.component.scss"],
})
export class ScheduleComponent implements OnInit {
  @ViewChild("confirmModalContent") confirmModalContent!: TemplateRef<any>;
  @ViewChild("completeModalContent") CompleteModalContent!: TemplateRef<any>;
  moment: any = moment;
  modaleRef!: NgbModalRef;
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
  deletionRecordId: string = "";
  recordId: string = "";
  resources$: any = [];
  scheduleTypes$: any = [];

  constructor(
    private cdref: ChangeDetectorRef,
    private fb: FormBuilder,
    private router: Router,
    // private spinner: NgxSpinnerService,
    public translate: TranslateService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private baseService: BaseService,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit(): void {
    this.fetchEssentialData();
    this.renderData();
  }

  refresh() {
    this.renderData();
  }

  fetchEssentialData() {
    this.baseService.getResources().subscribe((data: any) => {
      this.resources$ = data;
    });

    this.baseService.getScheduleTypes().subscribe((data: any) => {
      this.scheduleTypes$ = data;
    });
  }

  renderData() {
    // this.spinner.show();
    this.scheduleService
      .getScheduleList(this.filters.page, this.filters.limit)
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
          this.cdref.detectChanges();
          this.dataLoadingFlag = false;
        },
        error: (err: any) => {
          console.log("data error: ", err);
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
    const modalRef = this.modalService.open(AddScheduleComponent, {
      centered: true,
      size: "lg",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.resources$ = this.resources$;
    modalRef.componentInstance.response.subscribe((res: any) => {
      this.refresh();
    });
  }

  viewRecord(data: any) {
    const modalRef = this.modalService.open(ViewScheduleComponent, {
      centered: true,
      size: "md",
      backdrop: "static",
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
  }

  editRecord(data: any) {
    const modalRef = this.modalService.open(EditScheduleComponent, {
      centered: true,
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
    modalRef.componentInstance.resources$ = this.resources$;
    modalRef.componentInstance.response.subscribe((res: any) => {
      this.refresh();
    });
  }

  deleteRecord() {
    this.scheduleService
      .updateScheduleStatus(this.deletionRecordId, "delete")
      .subscribe(
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

  deleteRecordConfirm(value: string) {
    this.deletionRecordId = value;
    this.modaleRef = this.modalService.open(this.confirmModalContent, {
      backdrop: "static",
      size: "sm",
      keyboard: false,
    });
  }

  completeSchedule() {
    // this.spinner.show();
    this.scheduleService
      .updateScheduleStatus(this.recordId, "Complete")
      .subscribe(
        (res: any) => {
          this.refresh();
        },
        (err: any) => {
          const msg = "Failed";
          const header = "Please try again...";
          this.toastr.error(header, msg, {
            positionClass: "toast-top-right",
          });
        }
      );
  }

  completeScheduleConfirm(value: any) {
    this.deletionRecordId = value;
    this.modaleRef = this.modalService.open(this.CompleteModalContent, {
      backdrop: "static",
      size: "sm",
      keyboard: false,
    });
  }
}
