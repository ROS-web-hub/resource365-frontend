import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { Data, Router } from "@angular/router";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from "ngx-toastr";
import { Subscription, map } from "rxjs";
import { environment } from "src/environments/environment";
import { Globals } from "../core/_helper/globals";
import { BaseService } from "../core/_services/base.service";
import { DataService } from "../core/_services/data.service";
import { Utils } from "../core/_services/util.service";
import { RequestService } from "../request/request.service";
import { ViewRequestComponent } from "../request/view-request/view-request.component";
import { DashboardService } from "./dashboard.service";
import { AdminService } from "../admin/admin.service";
import * as _ from "lodash";

// For more info on this library, visit: https://github.com/vkurko/calendar
declare const EventCalendar: any;
declare const Pusher: any;
@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("eventMonthTemplate") eventMonthTemplate!: TemplateRef<any>;
  @ViewChild("confirmModalContent") confirmModalContent!: TemplateRef<any>;
  scrollTime = "";
  requests: any = [];
  requestStatuses = ["approved", "pending", "rejected"];
  resourcesToFilterOut: Array<any> = [];
  ec: any = {}; // calendar object,
  modalObject: any = {};
  resources: Array<any> = [];
  resources_sort_name: Array<any> = [];
  timeSlots = ["00 hr:15 min", "00 hr:30 min", "00 hr:45 min", "01 hr:00 min"];
  selectedTimeSlot = this.timeSlots[0];
  firstLoad = true;
  myRequestsOnly = false;
  viewType = "Daily";
  scrolledLength: number = 0;

  selectedRequest!: any;
  modaleRef!: NgbModalRef;
  userDetails!: any;
  allResourceToggled = true;
  controller!: AbortController;
  selectedDate!: any; // date value when a date item is clicked
  selectedEvent!: any;
  cmListener!: any;
  eventsFetchInterval!: any;
  resourceTypes: any[] = [];
  subscriptions = new Subscription();
  constructor(
    private dashboardService: DashboardService,
    private utils: Utils,
    private requestService: RequestService,
    private baseService: BaseService,
    private dataService: DataService,
    private router: Router,
    private modal: NgbModal,
    private toast: ToastrService,
    private globals: Globals,
    private spinner: NgxSpinnerService,
    private adminService: AdminService
  ) { }

  ngOnInit(): void {
    // initialize scroll time
    const d = new Date();
    this.scrollTime = `${this.utils._pad(d.getHours())}:${this.utils._pad(
      d.getMinutes()
    )}:${this.utils._pad(d.getSeconds())}`;

    this.getUserPreferences();
    this.listenToNewRequests();
    this.getResourceTypes();
  }

  ngAfterViewInit(): void {
    this.getCalendarType();
    this.getTimeSlot();
    this.initializeEvent();
    this.getTimeIndicator();
    // this.getResources();
    this.addContextMenuListeners();

    document
      ?.getElementById("ec")
      ?.addEventListener("scroll", this.onScroll.bind(this));
    //this.initializeEventAutoFetch();
  }

  getTimeSlot() {
    this.adminService.getTimeSlot().subscribe({
      next: (res: any) => {
        if (res == "none") {
          this.ec.setOption("slotDuration", this.timeSlots[0]);
          this.selectedTimeSlot = this.timeSlots[0];
        } else {
          this.ec.setOption("slotDuration", res);
          this.selectedTimeSlot = res;
        }
      },
      error: (err: any) => {
      },
    })
  }


  getCalendarType() {
    this.adminService.getCalendarType().subscribe({
      next: (res: any) => {

        const viewTypes = {
          dayGridMonth: "Monthly",
          timeGridWeek: "Weekly",
          resourceTimeGridDay: "Daily",
        };
        this.viewType = viewTypes[(res as keyof typeof viewTypes) ?? "resourceTimeGridDay"];

        setTimeout(() => {
          const ecDayElements = document.querySelectorAll(".ec-day");
          for (let i = 0; i < ecDayElements.length; i++) {
            const ecDayElement = ecDayElements[i] as HTMLElement;
            if (!this.hasDeepChildWithClass(ecDayElement, "ec-event-body"))
              ecDayElement.setAttribute(
                "title",
                "Please click to open daily view."
              );
          }
        }, 3000);

        if (res == "timeGridWeek") {
          document.getElementById("ec")?.classList.add("week-view");
        } else {
          document.getElementById("ec")?.classList.remove("week-view");
        }
        if (!res) {
          this.ec.setOption("view", "daily");
        } else {
          this.ec.setOption("view", res);
        }
      },
      error: (err: any) => {
      },
    })
  }

  hasResources(t: any) {
    return Boolean(this.resources.find((item) => item.type === t._id)?.type);
  }
  onScroll() {
    this.scrolledLength = document?.getElementById("ec")?.scrollLeft ?? 0;

    const elements = document.querySelectorAll(".ec-sidebar");
    elements.forEach((element: any) => {
      if (this.scrolledLength > 3) {
        element.style.borderLeft = "1px solid #dadce0";
        element.style.borderRight = "1px solid #dadce0";
        element.style.marginLeft = "-0.5px";
      } else {
        element.style.borderLeft = "none";
        element.style.borderRight = "none";
        element.style.marginLeft = "0px";
      }
    });

    const contentElements = document.querySelectorAll(".ec-content");
    contentElements.forEach((contentElement: any) => {
      const sidebarElements = contentElement.querySelectorAll(".ec-sidebar");
      sidebarElements.forEach((sidebarElement: any) => {
        sidebarElement.style.marginLeft = `${this.scrolledLength - 0.5}px`;
      });
    });

    // const childElements = document.querySelectorAll('.ec-sidebar-title')
    // childElements.forEach((element: any) => {
    //   element.style.marginLeft = `-${this.scrolledLength-1}px`
    // })
  }

  addContextMenuListeners() {
    this.controller = new AbortController();
    document.addEventListener(
      "click",
      (e: any) => {
        if (!e.target.classList.contains("create-request-action")) {
          this.hideMenu();
        }
      },
      false
    );

    this.cmListener = this.handleContextMenuListener.bind(this);

    document.addEventListener("contextmenu", this.cmListener, false);
  }

  handleContextMenuListener(e: any) {
    // Hide the menu on right click, wherever
    if (document.getElementById("contextMenu")?.style.display == "block") {
      e.preventDefault();
      this.hideMenu();
    }

    if (
      e.target.classList.contains("ec-extra") ||
      e.target.classList.contains("ec-day") ||
      e.target.classList.contains("ec-day-head")
    ) {
      if (this.globals.principal.hasAuthority(["CREATE_REQUEST"])) {
        const event = new Event("click");
        const ee = new MouseEvent("click", {
          clientX: e.clientX,
          clientY: e.clientY,
        });

        if (e.target.classList.contains("ec-extra")) {
          (e.target.parentNode as HTMLElement).dispatchEvent(ee);
        } else {
          e.target.dispatchEvent(event);
        }
        e.preventDefault();

        if (document.getElementById("contextMenu")?.style.display == "block")
          this.hideMenu();
        else {
          const menu = document.getElementById("contextMenu");

          // @ts-ignore
          menu.style.display = "block";
          // @ts-ignore
          menu.style.position = "absolute";
          // @ts-ignore
          menu.style.left = e.pageX + "px";
          // @ts-ignore
          menu.style.top = e.pageY + "px";
        }
      }
    }
  }

  hideMenu() {
    if (document.getElementById("contextMenu")) {
      // @ts-ignore
      document.getElementById("contextMenu").style.display = "none";
    }
  }

  addRequest() {
    if (this.globals.principal.hasAuthority(["CREATE_REQUEST"])) {
      const params: any = {};
      const date = new Date(this.selectedEvent?.date);
      if (date.getTime() < new Date().getTime()) {
        this.toast.info("Date must be greater then today's date");
        return;
      }
      params.date = this.selectedEvent?.date;
      this.hideMenu();

      // Check if the resource is also available
      const resourceId = this.selectedEvent?.resource?.id;
      let selectedResource!: any;
      if (resourceId) {
        selectedResource = this.resources.filter((rs) => rs._id == resourceId);
        if (selectedResource && selectedResource.length == 1) {
          params.resource = selectedResource[0]._id;
          params.r_type = selectedResource[0].type;
        }
      }
      this.router.navigate(["/request", "new"], {
        queryParams: params,
      });
    } else {
      this.toast.info("You do not have permission to create a request");
    }
  }

  getResourceTypes() {
    const response = this.adminService.getResourceType("all").subscribe({
      next: (res: any) => {
        this.resourceTypes = res;
      },
      error: (err: any) => {

      },
    });
  }

  getUserPreferences() {
    this.dataService.getUserPreferences().subscribe((data) => {
      this.userDetails = data || {};
      this.getResources();
    });
  }

  getResources() {
    this.dashboardService
      .getResources()
      .pipe(
        map((data: any) => {
          return data.map((d: any) => {
            if (this.userDetails.preferences?.resourceFilters?.length) {
              if (
                this.userDetails.preferences?.resourceFilters?.includes(d._id)
              ) {
                d.checked = true;
              } else {
                d.checked = false;
                // If a single resource is unchecked then the toggleAll check must be unchecked;
                this.allResourceToggled = false;
              }
            } else {
              d.checked = true;
            }
            return d;
          });
        })
      )
      .subscribe((data: any) => {
        this.resources = _.orderBy(data, ["name"], ["asc"]);
        this.resources_sort_name = _.orderBy(data, ["orderId"], ["asc"]);;
        this.resourcesToFilterOut = this.getFilteredResourcesIds();
        const rs = this.resources_sort_name
          .filter((d) => this.resourcesToFilterOut?.includes(d._id))
          .map((d) => {
            return {
              id: d._id,
              title: d.name,
              type: d.type,
            };
          });

        this.ec.setOption("resources", rs);
        this.ec.refetchEvents();
      });
  }

  initializeEvent() {
    this.ec = new EventCalendar(document.getElementById("ec"), {
      view: "resourceTimeGridDay",
      height: "74vh",
      firstDay: 1,
      flexibleSlotTimeLimits: false,
      eventStartEditable: false,
      eventDurationEditable: false,
      slotMinTime: "00:00",
      titleFormat: this.titleFormat.bind(this),
      dayHeaderFormat: this.dayHeaderFormat.bind(this),
      headerToolbar: {
        start: "prev next title today",
        center: "",
        end: "",
      },
      buttonText: function (texts: any) {
        texts.resourceTimeGridWeek = "resources";
        return texts;
      },
      scrollTime: this.scrollTime,
      slotDuration: this.timeSlots[0],
      slotHeight: 50,
      views: {
        timeGridWeek: {
          pointer: true,
        },
        resourceTimeGridWeek: {
          pointer: true,
        },
      },
      dayMaxEvents: true,
      nowIndicator: true,

      eventSources: [
        {
          events: this.fetchEvents.bind(this),
        },
      ],

      dateClick: this.clickDate.bind(this),
      datesSet: this.dateSet.bind(this),
      eventClick: this.eventClick.bind(this),
      eventContent: this.eventContent.bind(this),
      eventMouseEnter: this.onMouseEnter.bind(this),
      eventMouseLeave: this.onMouseLeave.bind(this),
      eventDidMount: this.onEventMount.bind(this),
    });
  }

  dayHeaderFormat(date: any) {
    let format = "dddd MMM DD";
    if (this.ec?.view && this.ec.view.type == "dayGridMonth") {
      format = "dddd";
    }
    return moment(new Date(date)).format(format);
  }

  titleFormat(date: any) {
    let format = "dddd DD MMM YYYY";
    if (this.ec?.view && this.ec.view == "dayGridMonth") {
    }
    return moment(new Date(date)).format(format);
  }

  /**
   * This method fetches events for the calendar, the calendar calls it internally when a change in the date
   * range occurs or if the view is changed.
   * The requests are cached and no new request for the same date range will be made
   * @param fetchInfo Details of the fetch event
   * @param successCallback Called if the events are fetched successfully
   * @param failureCallback Called in case of some error
   */
  fetchEvents(fetchInfo: any, successCallback: any, failureCallback: any) {
    const params = {
      start: moment(fetchInfo.startStr).format(), // start of the date range, calendar passess it itself
      end: moment(fetchInfo.endStr).format(), // end of the date range, calendar passess it itself
      // Passing the statuses to return the requests for those statuses only
      statuses: this.requestStatuses.join(","),
      // This set the request filters based on the ownership, i.e all requests or only user's.
      myRequestsOnly: this.myRequestsOnly,
      // Resources to filter out while fetching requests
      resources: this.resourcesToFilterOut.join(","),
    };

    // this.spinner.show();
    this.dashboardService.fetchEvents(params).subscribe({
      next: (data: any) => {
        // this.spinner.hide();
        const startRange = new Date(params.start).getTime();
        const endRange = new Date(params.end).getTime();

        const newData: any[] = [];
        for (let i = 0; i < data.length; i++) {
          const startDate = new Date(data[i].start);
          const endDate = new Date(data[i].end);
          if (
            startDate.getTime() > startRange &&
            endDate.getTime() < endRange
          ) {
            if (startDate.getDate() === endDate.getDate()) {
              newData.push({
                ...data[i],
                start: new Date(data[i].start),
                end: new Date(data[i].end),
              });
            } else {
              newData.push({
                ...data[i],
                end: new Date(this.getEndTimeOfDay(data[i].start)),
                start: new Date(data[i].start),
                extendedProps: {
                  request: {
                    ...data[i].extendedProps.request,
                    endDateTime: new Date(this.getEndTimeOfDay(data[i].start)),
                    continutaion: "from",
                  },
                },
              });
              newData.push({
                ...data[i],
                end: new Date(data[i].end),
                start: new Date(this.getStartTimeOfDay(data[i].end)),
                extendedProps: {
                  request: {
                    ...data[i].extendedProps.request,
                    startDateTime: new Date(
                      this.getStartTimeOfDay(data[i].end)
                    ),
                    continutaion: "to",
                  },
                },
              });
            }
          }
          if (
            startDate.getTime() <= startRange &&
            endDate.getTime() <= endRange
          ) {
            newData.push({
              ...data[i],
              start: new Date(startRange),
              end: new Date(data[i].end),
              extendedProps: {
                request: {
                  ...data[i].extendedProps.request,
                  startDateTime: new Date(startRange),
                  continutaion: "to",
                },
              },
            });
          }
          if (
            startDate.getTime() >= startRange &&
            endDate.getTime() >= endRange
          ) {
            newData.push({
              ...data[i],
              start: new Date(data[i].start),
              end: new Date(this.getEndTimeOfDay(data[i].start)),
              extendedProps: {
                request: {
                  ...data[i].extendedProps.request,
                  endDateTime: new Date(this.getEndTimeOfDay(data[i].start)),
                  continutaion: "from",
                },
              },
            });
          }
        }
        // data = data.map((d: any) => {
        //   //Preparing the data objects for the calendar to be able to use
        //   d.start = new Date(d.start)
        //   d.end = new Date(d.end)
        //   // d.title = 'Testing testing';
        //   return d
        // })
        this.requests = newData;
        successCallback(newData);
      },
      error: (err) => {
        // this.spinner.hide();
        failureCallback(err);
      },
    });
  }

  getStartTimeOfDay(dateString: string) {
    const date = new Date(dateString);

    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    const startOfDay = date.getTime();

    return startOfDay;
  }

  getEndTimeOfDay(dateString: string) {
    const date = new Date(dateString);

    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);
    date.setMilliseconds(999);
    const endOfDay = date.getTime();

    return endOfDay;
  }

  getTimeIndicator() {
    setInterval(() => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-US", { hour12: false });
      if (currentTime === "23:59:59") {
        this.ec.setOption("date", this.getNextDate(this.ec.getOption("date")));
        this.ec.setOption("scrollTime", {
          years: 0,
          months: 0,
          days: 0,
          seconds: 0,
          inWeeks: false,
        });
      }
    }, 1000);
  }

  getNextDate(dateString: string) {
    const date = new Date(dateString);
    const timestamp = date.getTime();
    // Increment the timestamp by one day (in milliseconds)
    const oneDayInMilliseconds = 86400000;
    const nextTimestamp = timestamp + oneDayInMilliseconds;
    // Convert the timestamp back to a Date object
    const nextDate = new Date(nextTimestamp);
    // Format the resulting date object back into the desired string format
    return nextDate;
    const nextDateString = nextDate.toString();
  }

  // https://github.com/vkurko/calendar#dateclick
  clickDate(clickEvent: any) {
    this.selectedDate = clickEvent.date;
    this.selectedEvent = clickEvent;

    const date = new Date(this.selectedDate);
    let scrollTime = `${this.utils._pad(date.getHours())}:${this.utils._pad(
      date.getMinutes()
    )}:${this.utils._pad(date.getSeconds())}`;
    if (this.ec.getOption("view")?.toLowerCase()?.includes("month")) {
      this.ec.setOption("date", date);
      this.ec.setOption("scrollTime", scrollTime);
      setTimeout(() => {
        this.ec.setOption("view", "resourceTimeGridDay");
        this.viewType = "Daily";

        setTimeout(() => {
          // const doc = document.querySelector(
          //   `[data-id='${eventObj.event.extendedProps?.request?._id}']`
          // )
          // doc?.scrollIntoView({
          //   behavior: 'smooth',
          //   block: 'center',
          // })
        }, 10);
      }, 10);
    } else {
    }
  }

  // https://github.com/vkurko/calendar#datesset
  dateSet(dateEvent: any) { }

  // https://github.com/vkurko/calendar#eventclick
  eventClick(eventObj: any) {
    const date = new Date(eventObj.event.start);
    let scrollTime = `${this.utils._pad(date.getHours())}:${this.utils._pad(
      date.getMinutes()
    )}:${this.utils._pad(date.getSeconds())}`;
    if (this.ec.getOption("view").toLowerCase().includes("month")) {
      this.ec.setOption("date", date);
      this.ec.setOption("scrollTime", scrollTime);
      setTimeout(() => {
        this.ec.setOption("view", "resourceTimeGridDay");
        this.viewType = "Daily";

        setTimeout(() => {
          const doc = document.querySelector(
            `[data-id='${eventObj.event.extendedProps?.request?._id}']`
          );
          doc?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 10);
      }, 10);
    } else {
    }
  }

  // https://github.com/vkurko/calendar#eventcontent
  eventContent(eventDetails: any) {
    
    return {
      html: this.makeEventContent(eventDetails.event, eventDetails.view),
    };
  }

  makeEventContent(event: any, view: any) {
    if (event.display == "auto" && view.type != null) {
      if (
        view.type.toLowerCase().includes("timegridday") ||
        view.type.toLowerCase().includes("timegridweek")
      ) {
        return this.getByCalenderViewType(event, "daily");
      }
      return this.getByCalenderViewType(event, "monthly");
    }
    return `<span></span>`;
  }

  onMonthEventMouseEnter(event: any) { }

  onMouseEnter(eventDetails: any) {
    const requestedBy = eventDetails.event.extendedProps.request.requestedBy;

    const requestType = eventDetails.event.extendedProps?.request?.requestType;
    if (requestType != "schedule") {
      const view = this.ec.getOption("view");
      if (
        view?.toLowerCase()?.includes("timegridday") ||
        view?.toLowerCase()?.includes("timegridweek")
      ) {
        const element = eventDetails.jsEvent.target;
        const node = document.getElementById("ec-options");
        const optionsElement = node?.cloneNode(true);

        (<Element>optionsElement)?.classList?.remove("d-none");
        (<Element>optionsElement)
          ?.querySelector("#ec-options__view")
          ?.addEventListener(
            "click",
            this.viewRequestDetails.bind(
              this,
              eventDetails.event?.extendedProps?.request?._id
            )
          );
        (<Element>optionsElement)
          ?.querySelector("#ec-options__edit")
          ?.addEventListener(
            "click",
            this.editRequest.bind(
              this,
              eventDetails.event?.extendedProps?.request?._id
            )
          );
        (<Element>optionsElement)
          ?.querySelector("#ec-options__delete")
          ?.addEventListener(
            "click",
            this.deleteRequestConfirm.bind(
              this,
              this.confirmModalContent,
              eventDetails.event?.extendedProps?.request
            )
          );

        /**
         * If the request does not belong to the current user or user is not admin then do not show these options
         */
        (<Element>optionsElement)
          ?.querySelector("#ec-options__edit")
          ?.classList.add(
            this.showRequestActions(eventDetails) ? "d-inline-block" : "d-none"
          );
        (<Element>optionsElement)
          ?.querySelector("#ec-options__delete")
          ?.classList.add(
            this.showRequestActions(eventDetails) ? "d-inline-block" : "d-none"
          );

        element.appendChild(optionsElement);
      }
    }
  }

  showRequestActions(eventDetails: any) {
    const requestedBy = eventDetails.event.extendedProps.request.requestedBy;
    const date = new Date(
      eventDetails.event.extendedProps.request.requestDateTime
    ).getTime();
    const today = new Date().getTime();
    return (
      date > today &&
      // eventDetails.event?.extendedProps?.request?.status == 'pending' &&
      (requestedBy.id == this.globals.principal.credentials.id ||
        this.globals.principal.isAdmin())
    );
  }

  onMouseLeave(eventDetails: any) {
    const view = this.ec.getOption("view");
    const requestType = eventDetails.event.extendedProps?.request?.requestType;
    if (
      view.toLowerCase().includes("timegridday") ||
      view.toLowerCase().includes("timegridweek")
    ) {
      if (requestType != "schedule") {
        const element = eventDetails.jsEvent.target;
        let elm = {};
        const elms = element.getElementsByTagName("*");
        for (var i = 0; i < elms.length; i++) {
          if (elms[i].id === "ec-options") {
            elm = elms[i];
            break;
          }
        }
        if (elm) {
          element.removeChild(elm);
        }
      }
    } else {
      // const el = eventDetails.el.querySelector('[event-view=month]');
      // el?.scrollIntoView({
      //   behavior: 'smooth',
      //   block: 'start',
      // });
    }
  }

  viewRequestDetails(requestId: any) {
    this.requestService.findOne(requestId).subscribe((data: any) => {
      this.selectedRequest = data.request;
      this.openRequestViewModal();
    });
  }

  deleteRequestConfirm(confirmModalContent: any, request: any) {
    this.selectedRequest = request;
    this.modaleRef = this.modal.open(confirmModalContent, {
      backdrop: "static",
      size: "sm",
      keyboard: false,
    });
  }

  deleteRequest() {
    const requestId = this.selectedRequest._id;
    this.requestService.deleteRequest(requestId).subscribe((req) => {
      this.modaleRef.close();
      this.ec.refetchEvents();
    });
  }

  editRequest(requestId: string) {
    this.router.navigate(["/request", "edit", requestId]);
  }

  openRequestViewModal() {
    this.modaleRef = this.modal.open(ViewRequestComponent, { size: "lg" });
    this.modaleRef.componentInstance.request = this.selectedRequest;
    this.modaleRef.componentInstance.requestStatus.subscribe((e: any) => {
      this.ec.refetchEvents();
    });
  }

  setTimeSlot(value: any) {


    this.ec.setOption("slotDuration", value);
    this.selectedTimeSlot = value;
    const dashboardFilterData = {
      timeslot: this.selectedTimeSlot
    };
    this.adminService.updateTimeSlot(this.selectedTimeSlot).subscribe({
      next: (data: any) => {
      },
      error: (err: any) => {
      },
    });
  }

  filterByStatus(event: any) {
    const value = event.target.value;
    if (event.target.checked) {
      this.requestStatuses.indexOf(value) === -1
        ? this.requestStatuses.push(value)
        : null;
    } else {
      this.requestStatuses.indexOf(value) !== -1
        ? this.requestStatuses.splice(this.requestStatuses.indexOf(value), 1)
        : null;
    }

    this.ec.refetchEvents();
  }

  setMyRequestsOnly(event: any) {
    this.myRequestsOnly = event.target.checked;
    this.ec.refetchEvents();
  }

  hasDeepChildWithClass(element: HTMLElement, className: string): boolean {
    if (element.classList.contains(className)) {
      return true;
    }
    for (let i = 0; i < element.children.length; i++) {
      const child = element.children[i] as HTMLElement;
      if (this.hasDeepChildWithClass(child, className)) {
        return true;
      }
    }
    return false;
  }

  changeView(viewType: any) {

    // width: fit-content wont go well with week view, we need to only add it to views other the week views
    const viewTypes = {
      dayGridMonth: "Monthly",
      timeGridWeek: "Weekly",
      resourceTimeGridDay: "Daily",
    };
    this.viewType = viewTypes[viewType as keyof typeof viewTypes];
    setTimeout(() => {
      const ecDayElements = document.querySelectorAll(".ec-day");
      for (let i = 0; i < ecDayElements.length; i++) {
        const ecDayElement = ecDayElements[i] as HTMLElement;
        if (!this.hasDeepChildWithClass(ecDayElement, "ec-event-body"))
          ecDayElement.setAttribute(
            "title",
            "Please click to open daily view."
          );
      }
    }, 3000);
    if (viewType == "timeGridWeek") {
      document.getElementById("ec")?.classList.add("week-view");
    } else {
      document.getElementById("ec")?.classList.remove("week-view");
    }
    this.ec.setOption("view", viewType);

    const dashboardFilterData = {
      calendarType: viewType
    };
    this.adminService
      .updateCalendarType(viewType, dashboardFilterData)
      .subscribe({
        next: (data: any) => {
        },
        error: (err: any) => {
          // this.spinner.hide();
          // this.cdref.detectChanges();
        },
      });

  }

  openFilterModal(modalId: any) {
    this.resourcesToFilterOut = this.getFilteredResourcesIds();
    this.showModal(modalId);
  }

  cancelFilterResource() {
    // Reset the resource filter state if some resources were checked/unchecked but not filtered
    this.resources.forEach((rs: any) => {
      if (this.resourcesToFilterOut.includes(rs._id)) {
        rs.checked = true;
      } else {
        rs.checked = false;
      }
    });
    this.modalObject.close();
  }

  filterSaveByResources() {
    this.resourcesToFilterOut = this.getFilteredResourcesIds();
    this.baseService
      .updateUserPreferenceFilters(this.resourcesToFilterOut)
      .subscribe({

        next: (data: any) => {

          this.filterByResources();
        },
        error: (err: any) => {
          // this.spinner.hide();
          // this.cdref.detectChanges();
        },
      });
  }
  // Any resource sent in the request will be filter by
  filterByResources() {
    this.resourcesToFilterOut = this.getFilteredResourcesIds();
    this.userDetails.preferences.resourceFilters = this.resourcesToFilterOut;
    this.getResources();
    this.ec.refetchEvents();
    this.modalObject.close();
  }

  getFilteredResourcesIds() {
    const resourceIds: Array<any> = [];
    this.resources_sort_name.forEach((rs: any) => {
      if (rs.checked) {
        resourceIds.push(rs._id);
      }
    });

    return resourceIds;
  }

  showModal(modalId: any) {
    this.modalObject = this.modal.open(modalId, { size: "lg", centered: true });
  }

  toggleResource(resource: any, event: any) {
    for (let i = 0; i < this.resources.length; i++) {
      if (this.resources[i]._id == resource._id) {
        this.resources[i].checked = event.target.checked;
      }
    }
  }

  toggleAllResources(typeid: string, event: any = { target: { checked: true } }) {
    for (let i = 0; i < this.resources.length; i++) {
      if (this.resources[i].type == typeid || typeid == "")
        this.resources[i].checked = event.target.checked;
    }
    this.allResourceToggled = event.target.checked;

  }

  allfilter() {
    this.toggleAllResources('');

    this.resourcesToFilterOut = this.getFilteredResourcesIds();

    this.baseService
      .updateUserPreferenceFilters(this.resourcesToFilterOut)
      .subscribe({
        next: (data: any) => {
          this.filterByResources();
          this.spinner.show();
        },
        error: (err: any) => {
          // this.cdref.detectChanges();
        },
      });
  }

  isAllToggled(typeid: string) {
    let checked = true;
    for (let i = 0; i < this.resources.length; i++) {
      if (this.resources[i].type == typeid || typeid == "")
        if (!this.resources[i].checked) {
          checked = false;
        }
    }
    return checked;
  }

  ngOnDestroy(): void {
    clearInterval(this.eventsFetchInterval);
    document.removeEventListener("contextmenu", this.cmListener, false);
    this.subscriptions.unsubscribe();
  }

  onEventMount(eventDetails: any) {
    //  eventDetails.el.style.height="auto";
  }

  convert2Capitalize(str: string) {
    const capitalized = String(str).charAt(0).toUpperCase() + str.slice(1);
    return capitalized;
  }

  listenToNewRequests() {
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true;

    var pusher = new Pusher(environment.pusherId, {
      cluster: "ap4",
    });

    var channel = pusher.subscribe("skynews");
    channel.bind("new-booking", (data: any) => {
      for (let d of data.data) {
        d.start = new Date(d.start);
        d.end = new Date(d.end);

        this.ec.addEvent(d);
      }
    });
    channel.bind("update-booking", (data: any) => {
      for (let d of data.data) {
        d.start = new Date(d.start);
        d.end = new Date(d.end);
        this.ec.updateEvent(d);
      }
    });

    this.subscriptions.add(channel);
  }
  getByCalenderViewType(event: any, viewType: string = "daily"): string {
    if (!event.extendedProps?.request) {
      return "";
    }

    event.extendedProps.request.requestType =
      event.extendedProps.request.requestType == "prerecorded"
        ? "REC"
        : event.extendedProps.request.requestType == "cameraman"
          ? "CREW"
          : event.extendedProps.request.requestType;
    let eventContent = "";
    switch (event.extendedProps.request.requestType) {
      case "REC": {
        eventContent = this.getPreRecordContent(event, viewType);
        break;
      }
      case "live": {
        eventContent = this.getLiveContent(event, viewType);
        break;
      }
      case "CREW": {
        eventContent = this.getCameramanContent(event, viewType);
        break;
      }
      case "schedule": {
        eventContent = this.getScheduleContent(event, viewType);
        break;
      }
      default: {
        eventContent = this.getTypeAndTimeContent(event, viewType);
        break;
      }
    }
    if (viewType == "daily") {
      return `
      <span data-id="${event.extendedProps?.request?._id}" class="ec-event-details">
        ${eventContent}
      </span>
      `;
    }

    return `
   <div class="text-capitalize" s-id="${event.extendedProps?.request?._id
      }" event-view="month" onmouseenter="${this.onMonthEventMouseEnter.bind(
        this
      )}">
      <span class="ec-dot" style="background-color: ${event.backgroundColor
      }"></span>  ${this.getTypeAndTimeContent(event, "time")}${(event.extendedProps.request?.continutaion ?? "") === "to" ? "*" : ""
      }
        ${eventContent}
    </div>
   `;
  }
  /**
   *
   * @param event
   * @param returnType string time,eventType,both
   * @returns
   */
  getTypeAndTimeContent(
    event: any,
    returnType: string = "both",
    continutaion?: string
  ) {
    const start = new Date(event.start);
    const end = new Date(event.end);

    // const startString = this.utils.getAMPMFormat(start)
    // const endString = this.utils.getAMPMFormat(end)
    const startH = start.getHours();
    const startM = start.getMinutes();
    const endH = end.getHours();
    const endM = end.getMinutes();
    const startString = `${this.utils.getHM(startH)}${this.utils.getHM(
      startM
    )}`;
    const endString = `${this.utils.getHM(endH)}${this.utils.getHM(endM)}`;
    if (returnType == "time") {
      return `${startString} - ${endString}`;
    }
    if (returnType == "eventType") {
      return event?.extendedProps?.request?.requestType?.toUpperCase();
    }
    return `
    <div class="row" style="font-size:90%">
      <div class="col-md-12">
      <b>${event?.extendedProps?.request?.requestType?.toUpperCase()}</b> <span style="font-size:8px;">|</span> ${startString} - ${endString}
      </div>
    </div>
    `;
  }
  getPreRecordContent(event: any, viewType: string): string {
    let content = "";
    const props = event.extendedProps;
    const participants = props.request.participants;
    for (let p of participants) {
      if (p.type == "host") {
        content += `
        <div class="col-12">
          H: ${p?.name}
        </div>
        `;
      } else {
        content += `
        <div class="col-12">
          G: ${p?.name}
        </div>
        `;
      }
    }
    return `
    <div class="d-flex flex-column align-items-start justify-content-start">
        <div>
          ${this.getTypeAndTimeContent(
      event,
      viewType == "monthly" ? "eventType" : "both"
    )} 
        </div>
        <div style="font-size:10px;">
          ${(
        event.extendedProps?.request?.controlRoom?.name ?? ""
      ).toUpperCase()}
        </div>
        <div class="w-100 border-top border-white border-1 my-1"></div>
        <div>
        ${props.request?.requestedBy?.name}
        </div>
        <div style="display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: horizontal;
            white-space: pre-line;
            text-overflow: ellipsis;
            max-height: 173px;
            overflow: hidden;">
        ${props.request?.details}
        </div>

    </div>
`;
    // <div class="">
    //   <strong>Participants </strong>
    //    ${content}
    // </div>
  }

  getLiveContent(event: any, viewType: string): string {
    const props = event.extendedProps;
    
    return `
    <div class="d-flex flex-column align-items-start justify-content-start">
    <div>
      ${this.getTypeAndTimeContent(
      event,
      viewType == "monthly" ? "eventType" : "both"
    )} 
    </div>
    <div style="font-size:10px;">
      ${props.request?.channel?.name?.toUpperCase()}
    </div>
    <div class="w-100 border-top border-white border-1 my-1"></div>
    <div>
    ${props.request?.requestedBy?.name}
    </div>
        <div style="display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: horizontal;
      white-space: pre-line;
      text-overflow: ellipsis;
      max-height: 173px;
      overflow: hidden;">
        ${props.request?.details}
        </div>
    </div>
    `;
  }

  getCameramanContent(event: any, viewType: string): string {
    const props = event.extendedProps;
    return `
      <div class="d-flex flex-column align-items-start justify-content-start">
      <div>
            ${this.getTypeAndTimeContent(
      event,
      viewType == "monthly" ? "eventType" : "both"
    )}${(props.request?.continutaion ?? "") === "to" ? "*" : ""}
      </div>
      <div style="font-size:10px;">
        ${props.request?.program?.toUpperCase()}
      </div>
      <div class="w-100 border-top border-white border-1 my-1"></div>
      <div>
      ${props.request?.requestedBy?.name}
      </div>
      <div style="display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: horizontal;
          white-space: pre-line;
          text-overflow: ellipsis;
          max-height: 173px;
          overflow: hidden;">
          ${props.request?.details}
          </div>
      </div>
    `;
  }

  getScheduleContent(event: any, viewType: string) {
    const props = event.extendedProps;
    return `
      <span class="me-1">
        <div class="row">
          <div class="col-md-12">
            ${this.getTypeAndTimeContent(
      event,
      viewType == "monthly" ? "eventType" : "both"
    )}${(props.request?.continutaion ?? "") === "to" ? "*" : ""}
          </div>
          <div class="col-12">
            Status:  ${props.request.status} <br>
            Details:  ${props.request.details}
            <br>
            Type:  ${props.request.type?.name}
            <br>
            Resource: ${props.request?.resourceId?.name}
          </div>
         </div>
      </span>
    `;
  }
}
