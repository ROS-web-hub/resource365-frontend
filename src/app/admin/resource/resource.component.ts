import {
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { ToastrService } from "ngx-toastr";
import { AdminService } from "../admin.service";
import { AddResourceComponent } from "./add-resource/add-resource.component";
import { EditResourceComponent } from "./edit-resource/edit-resource.component";
import { ViewResourceComponent } from "./view-resource/view-resource.component";
import { DashboardService } from "src/app/dashboard/dashboard.service";
import { DataService } from "src/app/core/_services/data.service";
import { map } from "rxjs";
import * as _ from "lodash";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";

@Component({
  selector: "app-resource",
  templateUrl: "./resource.component.html",
  styleUrls: ["./resource.component.scss"],
})
export class ResourceComponent implements OnInit {
  @ViewChild("resourceFilter") resourceFilter!: TemplateRef<any>;
  @ViewChild("confirmModalContent") confirmModalContent!: TemplateRef<any>;
  @ViewChild("linkFormModal") linkFormModal!: TemplateRef<any>;
  rows: any[] = [];
  filters = {
    limit: 10, // records per page
    page: 0,
    searchTerm: "",
    filter: {
      resources: [] as string[],
      resourceTypes: [] as string[],
      locations: [] as string[],
    },
  };
  pageList: number[] = [];
  totalRecords: number = 0;
  totalPages: number = 0;
  dataLoadingFlag: boolean = false;
  modaleRef!: NgbModalRef;
  allResourceTypesToggles: any = true;
  resourceTypes: any[] = [];
  allFilterResourcesToggled: any = true;
  resources: any[] = [];
  showMoreArr: any[] = [];
  userDetails: any;
  blank = false;
  allLocationToggles = true;
  locations: any[] = [];
  sortBy: string = "none";
  originRows: any[] = [];
  deleteResourceId: string = "";
  toolTipText = "This is can not be deleted because it is already used";
  recordingTypes: any[] = [];
  linkForm!: FormGroup;
  connectedDropLists = [];
  users = [];
  flg = false;

  constructor(
    private cdref: ChangeDetectorRef,
    private fb: FormBuilder,
    private router: Router,
    // private spinner: NgxSpinnerService,
    public translate: TranslateService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private adminService: AdminService,
    private dashboardService: DashboardService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.getUserPreferences();
    this.getUserList();
  }

  refresh() {
    this.getUserPreferences();
  }

  renderData() {
    // this.spinner.show();
    // this.adminService
    //   .getFilteredResourceList(
    //     this.filters.page,
    //     this.filters.limit,
    //     this.filters.filter,
    //     this.sortBy
    //   )
    this.adminService
      .getAllResources(this.filters.filter, this.sortBy)
      .subscribe({
        next: (data: any) => {
          if (data == null) {
            this.rows = [];
            this.totalRecords = 0;
            this.totalPages = 0;
          } else {
            // this.rows = data.docs
            // this.originRows = data.docs
            // this.totalRecords = data.totalDocs
            // this.totalPages = data.totalPages
            const orderedData = _.orderBy(data, ["orderId"], ["asc"]);
            this.rows = orderedData;
            this.rows.map((r, index) => {
              if (r.watchers.length) {
                r._watchers = [];
                r.watchers?.map((w: any) => {
                  const userExistWatcher = this.users.filter((user) => user["_id"] == w);
                  if (userExistWatcher.length) {
                    r._watchers.push(userExistWatcher[0]["name"]);
                  }
                })
                r._watchersSomeString = "";
                r._watchersAllString = "";
                r._watchersAllString += r._watchers?.join(", ");
                r.countWatcher = 0;
                for (let i = 0; i < r._watchers.length; i++) {

                  r._watchersSomeString += r._watchers[i];
                  r.countWatcher++;
                  if (r._watchersSomeString.length >= 30 && (i == (r._watchers.length - 1))) {
                    return;
                  } else if (r._watchersSomeString.length >= 30 && (i != (r._watchers.length - 1))) {
                    r._watchersSomeString += "...";
                    return;
                  }
                  if (i != (r._watchers.length - 1)) {
                    r._watchersSomeString += ", ";
                  }
                }
              }
            });
            this.originRows = orderedData;

          }
          // this.pageList = [...Array(this.totalPages).keys()]
          // this.spinner.hide();
          this.cdref.detectChanges();
          this.dataLoadingFlag = false;
        },
        error: (err: any) => {
          // this.spinner.hide();

          // this.cdref.detectChanges();
        },
      });
  }

  handleShowMoreClick(rowId: string) {
    const index = this.showMoreArr.findIndex((item) => item === rowId);
    if (index > -1) {
      this.showMoreArr.splice(index, 1);
    } else {
      this.showMoreArr.push(rowId);
    }
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

        },
      });
    });
  }

  getUserList() {
    // this.spinner.show();
    console.log("%c Line:188 🥪 this.filters.page", "color:#ed9ec7", this.filters.page);
    console.log("%c Line:189 🍓 this.filters.limit", "color:#33a5ff", this.filters.limit);
    this.adminService
      .getUserList(this.filters.page, this.filters.limit)
      .subscribe({
        next: (data: any) => {
          this.users = data.docs;
          console.log("%c Line:193 🍩 this.users", "color:#fca650", this.users);
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

  handleOpenFilterModal() {
    this.modaleRef = this.modalService.open(this.resourceFilter, {
      backdrop: "static",
      size: "lg",
      keyboard: false,
    });
  }

  drop(event: any) {
    moveItemInArray(this.rows, event.previousIndex, event.currentIndex);
    const orders = this.rows.map((item, itemIndex) => ({
      id: item._id,
      itemIndex,
    }));
    this.adminService.updateResourceOrders(orders).subscribe({
      next: (data: any) => { },
      error: (err: any) => {
        // this.spinner.hide();

        // this.cdref.detectChanges();
      },
    });
  }

  toggleAllLocations(event: any) {
    if (event == "All") {
      this.allLocationToggles = true;
      for (let i = 0; i < this.locations.length; i++)
        this.locations[i].checked = true;
    } else {
      this.allLocationToggles = event.target.checked;
      for (let i = 0; i < this.locations.length; i++)
        this.locations[i].checked = event.target.checked;
    }
  }
  toggleLocation(r: any, event: any) {
    const index = this.locations.findIndex((item) => item._id === r._id);
    this.locations[index].checked = event.target.checked;
    this.allLocationToggles = !(
      this.locations.findIndex((item) => item.checked === false) > -1
    );
  }

  toggleAllResourceTypes(event: any) {
    if (event == "All") {
      this.allResourceTypesToggles = true;
      for (let i = 0; i < this.resourceTypes.length; i++)
        this.resourceTypes[i].checked = true;
    } else {
      this.allResourceTypesToggles = event.target.checked;
      for (let i = 0; i < this.resourceTypes.length; i++)
        this.resourceTypes[i].checked = event.target.checked;
    }
  }
  toggleResourceTypes(r: any, event: any) {
    const index = this.resourceTypes.findIndex((item) => item._id === r._id);
    this.resourceTypes[index].checked = event.target.checked;
    this.allResourceTypesToggles = !(
      this.resourceTypes.findIndex((item) => item.checked === false) > -1
    );
  }
  toggleAllResourceFilter(event: any) {
    if (event === "All") {
      this.allFilterResourcesToggled = true;
      for (let i = 0; i < this.resources.length; i++)
        this.resources[i].checked = true;
    } else {
      this.allFilterResourcesToggled = event.target.checked;
      for (let i = 0; i < this.resources.length; i++)
        this.resources[i].checked = event.target.checked;
    }
  }
  toggleResourceFilter(r: any, event: any) {
    const index = this.resources.findIndex((item) => item._id === r._id);
    this.resources[index].checked = event.target.checked;
    this.allFilterResourcesToggled = !(
      this.resources.findIndex((item) => item.checked === false) > -1
    );
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
          this.initializeForm();
          this.cdref.detectChanges();
        },
        error: (err: any) => {

        },
      });
  }
  handleAllFilter() {
    this.toggleAllLocations("All");
    this.toggleAllResourceTypes("All");
    this.toggleAllResourceFilter("All");
    this.handleFilter();
  }

  convert2Capitalize(str: string) {
    const capitalized = String(str).charAt(0).toUpperCase() + str.slice(1);
    return capitalized;
  }

  closeModal() {
    this.modaleRef.close();
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




  getUserPreferences() {
    this.dataService.getUserPreferences().subscribe((data) => {
      this.userDetails = data;
      const adminResourcesFilter =
        this.userDetails.preferences?.adminResourcesFilter ?? {};
      if ((adminResourcesFilter?.resourceTypes?.length ?? 0) > 0) {
        this.filters.filter.resourceTypes = adminResourcesFilter?.resourceTypes;
      } else {
        this.filters.filter.resourceTypes = [];
      }

      if ((adminResourcesFilter?.resources?.length ?? 0) > 0) {
        this.filters.filter.resources = adminResourcesFilter?.resources;
      } else {
        this.filters.filter.resources = [];
      }

      if ((adminResourcesFilter?.locations?.length ?? 0) > 0) {
        this.filters.filter.locations = adminResourcesFilter?.locations;
      } else {
        this.filters.filter.locations = [];
      }

      this.renderData();
      this.getResourceTypes();
      this.getResources();
      this.getLocations();
    });
  }

  updateUserReferences() {
    this.filters.filter.resourceTypes = this.resourceTypes
      .filter((item) => item.checked)
      .map((item) => item._id);
    this.filters.filter.resources = this.resources
      .filter((item) => item.checked)
      .map((item) => item._id);

    this.filters.filter.locations = this.locations
      .filter((item) => item.checked)
      .map((item) => item.location);

    const data = this.filters.filter;
    this.dataService.upu(data, "adminResourcesFilter").subscribe(() => {
      this.getUserPreferences();
    });
  }

  getLocations() {
    this.dashboardService
      .getLocations()
      .pipe(
        map((data: any) => {
          data.push({ location: " ", checked: false });
          return data.map((d: any) => {
            if (this.filters.filter.locations.length > 0) {
              if (this.filters.filter.locations.includes(d.location)) {
                d.checked = true;
                d._id = this.getId(d.location);
                if (!this.allLocationToggles) this.allLocationToggles = false;
                else this.allLocationToggles = true;
              } else {
                d.checked = false;
                d._id = this.getId(d.location);
                // If a single resource is unchecked then the toggleAll check must be unchecked;
                this.allLocationToggles = false;
              }
            } else {
              d.checked = false;
              d._id = this.getId(d.location);
              this.allLocationToggles = false;
            }
            return d;
          });
        })
      )
      .subscribe((data: any[]) => {
        this.locations = data;
      });
  }

  getResources() {
    this.dashboardService
      .getResources()
      .pipe(
        map((data: any) => {
          return data.map((d: any) => {
            if (this.filters.filter.resources.length > 0) {
              if (this.filters.filter.resources.includes(d._id)) {
                d.checked = true;
                if (!this.allFilterResourcesToggled)
                  this.allFilterResourcesToggled = false;
                else this.allFilterResourcesToggled = true;
              } else {
                d.checked = false;
                // If a single resource is unchecked then the toggleAll check must be unchecked;
                this.allFilterResourcesToggled = false;
              }
            } else {
              d.checked = false;
              this.allFilterResourcesToggled = false;
            }
            return d;
          });
        })
      )
      .subscribe((data: any) => {
        this.resources = data;
        this.allFilterResourcesToggled = !(
          this.resources.findIndex((item: any) => item.checked === false) > -1
        );
        // this.cdref.detectChanges()
      });
  }

  // getblankResources() {
  //   let blank = this.blank;
  //   this.dashboardService
  //     .getblankResources().subscribe((data: any))
  //   
  //   // this.getblankResources().subscribe((data: any) => {
  //   //   // this.resources = { ...this.resources, data };
  //   // });
  // }


  getResourceTypes() {
    const response = this.adminService
      .getResourceType("all")
      .pipe(
        map((data: any) => {
          return data.map((d: any) => {
            if (this.filters.filter.resourceTypes.length > 0) {
              if (this.filters.filter.resourceTypes.includes(d._id)) {
                d.checked = true;
                if (!this.allResourceTypesToggles)
                  this.allResourceTypesToggles = false;
                else this.allResourceTypesToggles = true;
              } else {
                d.checked = false;
                this.allResourceTypesToggles = false;
              }
            } else {
              d.checked = false;
              this.allResourceTypesToggles = false;
            }
            return d;
          });
        })
      )
      .subscribe({
        next: (res: any) => {
          this.resourceTypes = res;
          this.getRecordingType();
          this.cdref.detectChanges();
        },
        error: (err: any) => {

        },
      });
  }

  getResourceTypeName(_id: string) {
    const resourceType = this.resourceTypes.find((item) => item._id === _id);
    return resourceType.name;
  }

  getId(data: string) {
    return `${data.toLowerCase().replace(" ", "_")}`;
  }

  handleRosourceSort() {
    if (this.sortBy === "desc") {
      this.sortBy = "none";
      this.renderData();
      return;
    }
    if (this.sortBy === "asc") {
      this.sortBy = "desc";
      this.renderData();
      return;
    }
    if (this.sortBy === "none") {
      this.sortBy = "asc";
      this.renderData();
      return;
    }
  }

  handleFilter() {
    this.updateUserReferences();
    this.modaleRef.close();
  }

  setPage(page: number) {
    this.filters.page = page;
    this.renderData();
  }

  addRecord() {
    const modalRef = this.modalService.open(AddResourceComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.response.subscribe((res: any) => {
      this.refresh();
    });
  }

  // addResourceType() {
  //   const modalRef = this.modalService.open(AddResourceTypeComponent, {
  //     centered: true,
  //     size: 'md',
  //     backdrop: true,
  //     keyboard: false,
  //   })
  //   modalRef.componentInstance.response.subscribe((res: any) => {
  //     this.refresh()
  //   })
  // }

  linkResourceTypes2RecordingType() {
    this.modaleRef = this.modalService.open(this.linkFormModal, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
  }

  viewRecord(data: any) {
    const modalRef = this.modalService.open(ViewResourceComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
  }

  editRecord(data: any) {
    const modalRef = this.modalService.open(EditResourceComponent, {
      centered: true,
      size: "md",
      backdrop: true,
      keyboard: false,
    });
    modalRef.componentInstance.data = data;
    modalRef.componentInstance.resourceTypes = this.resourceTypes;
    modalRef.componentInstance.response.subscribe((res: any) => {
      this.refresh();
    });
  }

  deleteConfirm(recordId: any) {
    this.deleteResourceId = recordId;
    this.modaleRef = this.modalService.open(this.confirmModalContent, {
      backdrop: "static",
      size: "sm",
      keyboard: false,
    });
  }

  deleteRecord() {
    // this.spinner.show();
    // this.adminService.deleteResource(this.deleteResourceId).subscribe(
    //   (res: any) => {
    //     this.refresh();
    //     this.modaleRef.close();
    //     // this.spinner.hide();
    //   },
    //   (err: any) => {
    //     // this.spinner.hide();
    //     const msg = "Failed";
    //     const header = "Please try again...";
    //     this.toastr.error(header, msg, {
    //       positionClass: "toast-top-right",
    //     });
    //     this.modaleRef.close();
    //   }
    // );

    this.adminService.ActiveResource(this.deleteResourceId).subscribe(
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
