import {
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../admin.service";
import { AddChannelComponent } from "./add-channel/add-channel.component";
import { EditChannelComponent } from "./edit-channel/edit-channel.component";
import { ViewChannelComponent } from "./view-channel/view-channel.component";

@Component({
  selector: "app-channel",
  templateUrl: "./channel.component.html",
  styleUrls: ["./channel.component.scss"],
})
export class ChannelComponent implements OnInit {
  @ViewChild("confirmModalContent") confirmModalContent!: TemplateRef<any>;

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
    this.renderData();
  }

  refresh() {
    this.renderData();
  }

  renderData() {
    // this.spinner.show();
    this.adminService
      .getChannelList(this.filters.page, this.filters.limit)
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
    const modalRef = this.modalService.open(AddChannelComponent, {
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
    const modalRef = this.modalService.open(ViewChannelComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
  }

  editRecord(data: any) {
    const modalRef = this.modalService.open(EditChannelComponent, {
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

  deleteRecord() {
    // this.spinner.show();
    // this.adminService.deleteChannel(this.deletionRecordId).subscribe(
    //   (res: any) => {
    //     this.modaleRef.close()
    //     this.refresh()
    //     // this.spinner.hide();
    //   },
    //   (err: any) => {
    //     // this.spinner.hide();
    //     const msg = 'Failed'
    //     const header = 'Please try again...'
    //     this.toastr.error(header, msg, {
    //       positionClass: 'toast-top-right',
    //     })
    //   }
    // )

    this.adminService.ActiveChannel(this.deletionRecordId).subscribe(
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

  deleteResourceTypeConfirm(value: string) {
    this.deletionRecordId = value;
    this.modaleRef = this.modalService.open(this.confirmModalContent, {
      backdrop: "static",
      size: "sm",
      keyboard: false,
    });
  }
}
