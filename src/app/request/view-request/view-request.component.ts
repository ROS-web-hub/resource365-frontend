import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormArray, FormBuilder, FormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";
import { ToastrService } from "ngx-toastr";
import { Globals } from "src/app/core/_helper/globals";
import { Utils } from "src/app/core/_services/util.service";
import { environment } from "src/environments/environment";
import { RequestService } from "../request.service";
import { AdminService } from "../../admin/admin.service";

import * as _ from "lodash";
import { NoPreloading } from "@angular/router";
@Component({
  selector: "app-view-request",
  templateUrl: "./view-request.component.html",
  styleUrls: ["./view-request.component.scss"],
})
export class ViewRequestComponent implements OnInit {
  constructor(
    public activeModal: NgbActiveModal,
    private requestService: RequestService,
    private utils: Utils,
    private fb: FormBuilder,
    private globals: Globals,
    private toastr: ToastrService,
    private adminService: AdminService
  ) { }

  @Input() request: any = {};
  serverUrl = environment.serverUrl;
  @Input() showActions = false; // show request actions
  @Output() requestStatus: EventEmitter<any> = new EventEmitter();
  userId!: any;
  resourceOwners!: Array<any>;
  userApprovalType = "";
  approvalType = "";
  isRejected = false; // this denotes that the request is rejected by at least resource owner
  isUserTheOwner = false;
  userHasApproved = false;
  markForReject = false;
  note: string = "";
  showDetails = false;
  isExpired = true;

  rejectButtonShow: Boolean = false;
  approveButtonShow: Boolean = false;
  userResources: any = [];
  resourcesForm!: FormGroup;
  users: any[] = [];
  showMoreDetail: boolean = false;

  requestApprovals: Array<any> = [];
  ngOnInit(): void {
    this.resourcesForm = this.fb.group({
      resources: this.fb.array([]),
    });
    this.request.timeSlot = `${moment(this.request.startDateTime).format(
      "hh:mm A"
    )} to ${moment(this.request.endDateTime).format("hh:mm A")}`;

    this.userId = this.globals.principal.credentials.id;

    if (this.userId == this.request.requestedBy.id) {
      // Show details to the requester of the request
      this.showDetails = true;
    }

    // See if request is isExpired
    const requestDateTime = moment(this.request.endDateTime);
    this.isExpired = requestDateTime.diff(moment()) < 0;

    this.setResourcesForm();
    this.getResourceOwners();
    this.setRequestApprovals();
    this.userList();
  }

  setResourcesForm() {
    (this.resourcesForm.get("resources") as FormArray).clear();


    const authorizedApprovals = this.request.approvals?.filter(
      (item: any) => item?.user.id == this.userId
    );

    const authorizedResources = authorizedApprovals?.map(
      (item: any) => item.resource.id
    );
    const allApprovals = _.uniqBy(this.request.approvals, "resource.id");
    let isIn;
    let noRepeatParticipants: any[] = [];
    const participantsArray = this.request.participants?.map((item: any) => item?.studio?._id);


    let resourceMain = { status: "", studio: {} };

    Object.assign(resourceMain,
      {
        status: this.request.status,
        studio: {
          _id: this.request?.controlRoom?._id ?? this.request?.resourceId?._id,
          name: this.request?.controlRoom?.name ?? this.request?.resourceId?.name
        }
      });

    noRepeatParticipants.push(resourceMain);

    let noRepeatFlag;;
    this.request.participants.map((appr: any) => {
      noRepeatFlag = false;
      for (let i = 0; i < noRepeatParticipants.length; i++) {
        if (appr.studio?._id == noRepeatParticipants[i]?.studio?._id) {
          noRepeatFlag = true;
          break;
        }
      }

      if (!noRepeatFlag) {
        noRepeatParticipants.push(appr);
      }
    })


    noRepeatParticipants.map((appr: any) => {
      const isEnable = authorizedResources?.includes(appr?.studio?._id);
      (this.resourcesForm.get("resources") as FormArray).push(
        this.getFormGroup(appr, !isEnable)
      );
    });


  }

  get resourceFormArray() {
    return this.resourcesForm.get("resources") as FormArray;
  }

  getFormGroup(data: any, disabled: boolean) {
    return this.fb.group({
      checked: [{ value: false, disabled: disabled }],
      status: data.status,
      id: data.studio?._id,
      name: data.studio?.name,
    });
  }

  approveRequest(id: any) {
    const resources = this.resourcesForm.value.resources;

    if (resources.filter((r: any) => r.checked).length == 0) {
      this.toastr.info("Please select at least one resource");
      return;
    }

    const resourceIds = resources
      .filter((r: any) => r.checked)
      .map((r: any) => r.id)
      .join(",");
    this.requestService
      .changeRequestStatus(id, "approved", this.userId, resourceIds)
      .subscribe((req: any) => {
        this.request.status = req.status;
        this.request.approvals = req.approvals;
        this.requestStatus.emit({ status: req.status });
        this.processUserApprovalState();
        this.setRequestApprovals();
        this.setResourcesForm();
      });

  }

  markRequestForRejction() {
    const resources = this.resourcesForm.value.resources;

    if (resources.filter((r: any) => r.checked).length == 0) {
      this.toastr.info("Please select at least one resource");
      return;
    }

    this.markForReject = true;
  }

  unmarkForRejection() {
    this.markForReject = false;
  }

  rejectRequest(id: any) {
    const resources = this.resourcesForm.value.resources;

    if (resources.filter((r: any) => r.checked).length == 0) {
      this.toastr.info("Please select at least one resource");
      return;
    }

    const resourceIds = resources
      .filter((r: any) => r.checked)
      .map((r: any) => r.id)
      .join(",");
    this.userHasApproved = false;
    this.requestService
      .changeRequestStatus(id, "rejected", this.userId, resourceIds, this.note)
      .subscribe((req: any) => {
        this.request.status = req.status;
        this.request.approvals = req.approvals;
        this.requestStatus.emit({ status: req.status });
        this.processUserApprovalState();
        this.setRequestApprovals();
        this.setResourcesForm();
      });
  }

  getResourceOwners() {
    this.requestService
      .getResourceOwnersOfRequest(this.request._id)
      .subscribe((rsOwners: any) => {
        this.resourceOwners = rsOwners;
        this.processUserApprovalState();
        // this.setRequestApprovals();
      });
  }

  handleShowMoreClick() {
    this.showMoreDetail = !this.showMoreDetail;
  }

  userList() {
    // this.spinner.show();
    this.adminService.getUserListAll()
      .subscribe({
        next: (data: any) => {
          this.users = data;
          const requestUser = this.users.filter((user) => user._id == this.request.requestedBy.id)[0];
          if (this.request.status == "approved") {
            if (requestUser.permissions.includes('CANCEL_APPROVED_REQUEST')) {
              this.rejectButtonShow = true;
              this.approveButtonShow = false;
            } else {
              this.rejectButtonShow = false;
              this.approveButtonShow = false;
            }
          } else if (this.request.status == "pending") {
            if (requestUser.permissions.includes('APPROVE_REJECT_REQUEST')) {
              this.approveButtonShow = true;
              this.rejectButtonShow = true;
            } else {
              this.rejectButtonShow = false;
              this.approveButtonShow = false;
            }
          }
        },
        error: (err: any) => {

        },
      });
  }

  setRequestApprovals() {
    this.requestApprovals = [];


    this.request.approvals.forEach((element: any) => {
      let existFlag = false;
      for (let ap of this.requestApprovals) {
        if (ap.id == element.user.id) {
          ap.resources.push({
            resourceId: element.resource.id,
            resourceName: element.resource.name,
            status: element.status,
          });
          existFlag = true;
          break;
        }
      }
      if (!existFlag) {
        const approval = {
          name: element.user.name,
          id: element.user.id,
          resources: [
            {
              resourceId: element.resource.id,
              resourceName: element.resource.name,
              status: element.status,
            },
          ],
          status: element.status,
          approvalTimestamp: element.approvalTimestamp,
          note: element.note,
        };
        this.requestApprovals.push(approval);
      }
    });

  }

  processUserApprovalState() {
    if (this.userId == this.request.requestedBy._id) {
      this.showDetails = true;
    }

    // Check if the user is among the resource owner related to this request
    this.resourceOwners.forEach((rsOwner) => {
      if (rsOwner._id == this.userId) {
        // Check if the user was the resource owner, at the time when this request was created
        for (let i = 0; i < this.request.approvals?.length; i++) {
          if (this.userId == this.request.approvals[i].user.id) {
            this.isUserTheOwner = true;
          }
        }
      }
    });

    if (this.isUserTheOwner) {
      this.showDetails = true; // show the request details only to the resource owner or the creator it self.
      // Check if at least one user has not rejected the request
      for (let i = 0; i < this.request.approvals?.length; i++) {
        if (this.request.approvals[i].status == "rejected") {
          this.isRejected = true;
        }
      }

      // Check if the user has approved or rejected the request previously or not.
      for (let i = 0; i < this.request.approvals?.length; i++) {
        if (
          this.userId == this.request.approvals[i].user.id &&
          this.request.approvals[i].status == "approved"
        ) {
          this.userHasApproved = true;
          this.userApprovalType = this.request.approvals[i].status;
          this.approvalType = this.request.approvals[i].approvalType;
          break;
        }
      }
    }

    // This is to hide the options incase an error occure in this function
    this.showActions = true;
  }

  downloadFile(fileName: string) {
    this.requestService.downloadFile(fileName).subscribe(
      (response: any) => {
        let dataType = response.type;
        let binaryData = [];
        binaryData.push(response);
        let downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(
          new Blob(binaryData, { type: dataType })
        );
        if (fileName) downloadLink.setAttribute("download", fileName);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        this.toastr.success("File downloaded");
      },
      (error: any) => {
        this.toastr.error("Can not download the file");
      }
    );
  }


}
