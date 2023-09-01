import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Utils } from "../core/_services/util.service";
import { RequestService } from "../request/request.service";
import { ViewRequestComponent } from "../request/view-request/view-request.component";
import { AppointmentService } from "./appointment.service";
import { Globals } from "../core/_helper/globals";
import { Subscription } from "rxjs";
import { environment } from "src/environments/environment";
declare const Pusher: any;
@Component({
  selector: "app-appointment",
  templateUrl: "./appointment.component.html",
  styleUrls: ["./appointment.component.scss"],
})
export class AppointmentComponent implements OnInit, OnDestroy {
  FLOAT_CLASS = "right";
  months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  DD = "1972-01-10"; // an arbitrary date to use in date comparison
  LIMIT = 10;
  H_SKIP = 0; // History skip
  U_SKIP = 0; // Upcoming skip
  INTERVAL = "upcoming";
  upcomingData: any = [];
  historyData: any = [];
  modalObject = {};
  selectedRequest: any = {};
  modaleRef!: NgbModalRef;
  user!: any;
  private subscriptions = new Subscription();
  constructor(
    private utils: Utils,
    private appointmentService: AppointmentService,
    private modal: NgbModal,
    private requestService: RequestService,
    private globals: Globals
  ) {}

  ngOnInit(): void {
    this.getAppointments();
    this.user = this.globals.principal.credentials;
    this.listenToNewRequests();
  }

  listenToNewRequests() {
    // Enable pusher logging - don't include this in production

    Pusher.logToConsole = false;
    this.H_SKIP;
    var pusher = new Pusher(environment.pusherId, {
      cluster: "ap4",
    });

    var channel = pusher.subscribe("skynews");
    channel.bind("new-booking", (data: any) => {
      if (this.INTERVAL !== "history") {
        this.upcomingData = [];
        this.U_SKIP = 0;
        this.H_SKIP = 0;
      }
      this.getAppointments();
    });
    channel.bind("update-booking", (data: any) => {
      if (this.INTERVAL !== "history") {
        this.upcomingData = [];
        this.U_SKIP = 0;
        this.H_SKIP = 0;
      }
      this.getAppointments();
    });
    this.subscriptions.add(channel);
  }
  getAppointments() {
    const SKIP = this.INTERVAL == "history" ? this.H_SKIP : this.U_SKIP;
    this.appointmentService
      .getAppointments(this.LIMIT, SKIP, this.INTERVAL)
      // @ts-ignore
      .subscribe((data: any) => {
        data = this.prepareData(data);
        

        this.INTERVAL == "upcoming"
          ? (this.upcomingData = [...this.upcomingData, ...data])
          : (this.historyData = [...this.historyData, ...data]);
        // Disable the more button if data length is less then limit
        if (data.length < this.LIMIT) {
          document
            .getElementById("get_more_" + this.INTERVAL)
            ?.setAttribute("disabled", "");
          //   @ts-ignore
          document.getElementById("get_more_" + this.INTERVAL).innerText =
            "No More Data";
        }
      });

    this.INTERVAL == "history"
      ? (this.H_SKIP += this.LIMIT)
      : (this.U_SKIP += this.LIMIT);
  }

  getStudioName = (ud: any, participant: any) => {
    const a = ud.extendedProps.request.approvals.find(
      (item: any) => item?.resource?.id == participant?.studio
    )?.resource?.name;
    return a;
  };

  prepareData(data: any) {
    for (let appointment of data) {
      let request = appointment.extendedProps.request;
      const appointmentClassList = [];
      if (!this.compareDates(this.DD, request.requestDateTime)) {
        appointment.showBefore = true;
        appointment.showAfter = true;
        appointment.showDate = true;
        this.DD = request.requestDateTime;
        const ddDate = new Date(this.DD);
        const dateContent = `${
          this.months[ddDate.getMonth()]
        } ${ddDate.getDate()}, ${ddDate.getFullYear()}`;

        appointment.dateText = dateContent;
        this.FLOAT_CLASS == "left"
          ? (this.FLOAT_CLASS = "right")
          : (this.FLOAT_CLASS = "left");
        appointmentClassList.push("date-container");
      } else {
        appointment.showBefore = false;
        appointment.showAfter = false;
        appointment.showDate = false;
      }

      appointmentClassList.push(this.FLOAT_CLASS);

      // Set start and end date times of appointment

      const startDateTime = new Date(request.startDateTime);
      const endDateTime = new Date(request.endDateTime);

      const startH = startDateTime.getHours();
      const startM = startDateTime.getMinutes();
      const endH = endDateTime.getHours();
      const endM = endDateTime.getMinutes();
      const startString = `${this.utils.getHM(startH)}${this.utils.getHM(
        startM
      )}`;
      const endString = `${this.utils.getHM(endH)}${this.utils.getHM(endM)}`;
      appointment.interval = `${startString}-${endString}`;

      appointmentClassList.push("t-container");
      appointment.classList = appointmentClassList.join(" ");
    }

    return data;
  }

  transform() {
    const toggleDiv = document.getElementById("toggle");
    toggleDiv?.classList.toggle("right");

    const element: any = toggleDiv?.querySelector("span");

    element?.classList.add("hide");
    if (toggleDiv?.classList.contains("right")) {
      this.toggleTimeLine("history", "upcoming");
      this.INTERVAL = "history";
      setTimeout(() => {
        element.innerText = "History";
      }, 300);

      // See if this is the first toggle
      if (!this.historyData.length) {
        this.getAppointments();
      }
    } else {
      this.INTERVAL = "upcoming";
      this.toggleTimeLine("upcoming", "history");
      setTimeout(() => {
        element.innerText = "Upcoming";
      }, 300);

      // See if this is the first toggle
      if (!this.upcomingData.length) {
        this.getAppointments();
      }
    }

    setTimeout(function () {
      element.classList.remove("hide");
    }, 300);
  }

  toggleTimeLine(tlShow: any, tlHide: any) {
    document.getElementById("timeline_" + tlShow)?.classList.remove("d-none");
    document.getElementById("timeline_" + tlHide)?.classList.add("d-none");

    // hide the get more buttons as well
    document.getElementById("get_more_" + tlShow)?.classList.remove("d-none");
    document.getElementById("get_more_" + tlHide)?.classList.add("d-none");
  }

  compareDates(currentDate: any, newDate: any) {
    const cDate = new Date(currentDate);
    const nDate = new Date(newDate);

    cDate.setHours(0, 0, 0, 0);
    nDate.setHours(0, 0, 0, 0);

    return cDate.getTime() == nDate.getTime();
  }

  viewRequestDetails(requestId: any) {
    this.requestService.findOne(requestId).subscribe((data: any) => {
      this.selectedRequest = data.request;
      this.openRequestViewModal();
    });
  }

  openRequestViewModal() {
    this.modaleRef = this.modal.open(ViewRequestComponent, { size: "lg" });
    this.modaleRef.componentInstance.request = this.selectedRequest;
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
