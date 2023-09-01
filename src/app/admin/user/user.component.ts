import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../admin.service";
import { EditUserComponent } from "./edit-user/edit-user.component";
import { ViewUserComponent } from "./view-user/view-user.component";
import * as moment from "moment";
import { DashboardService } from "src/app/dashboard/dashboard.service";

@Component({
  selector: "app-user",
  templateUrl: "./user.component.html",
  styleUrls: ["./user.component.scss"],
})
export class UserComponent implements OnInit {
  moment: any = moment;

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

  allPermissions: any = [];
  allResources: any = [];

  constructor(
    private cdref: ChangeDetectorRef,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    // private spinner: NgxSpinnerService,
    public translate: TranslateService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private adminService: AdminService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.fetchEssentialData();
    this.renderData();

    this.route.queryParams.subscribe((params: any) => {
      if (params.action && params.id) {
        this.processAction(params.action, params.id);
      }
    });
  }

  refresh() {
    this.renderData();
  }

  fetchEssentialData() {
    this.adminService.getUserAllPermissions().subscribe((data: any) => {
      this.allPermissions = data;
    });
    this.dashboardService.getResources().subscribe((rs) => {
      this.allResources = rs;
    });
  }

  processAction(action: string, id: any) {
    this.adminService.getUserById(id).subscribe((data) => {
      if (action == "edit") {
        this.editRecord(data);
      }
    });
  }

  getUserOwnedResources(rowIndex: number) {
    return this.allResources
      .filter((item: any) => this.rows[rowIndex].resources.includes(item._id))
      .map((item: any) => item.name);
  }

  renderData() {
    // this.spinner.show();
    this.adminService
      .getUserList(this.filters.page, this.filters.limit)
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

  createRecord() {
    this.router.navigate(["/clinic/patients/register"]);
  }

  viewRecord(data: any) {
    const modalRef = this.modalService.open(ViewUserComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });

    modalRef.componentInstance.data = data;
  }

  editRecord(data: any) {
    const modalRef = this.modalService.open(EditUserComponent, {
      centered: true,
      size: "md",
      backdrop: "static",
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
    modalRef.componentInstance.allPermissions = this.allPermissions;
    modalRef.componentInstance.response.subscribe((res: any) => {
      this.refresh();
    });
  }
}
