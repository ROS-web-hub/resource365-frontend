import { ChangeDetectorRef, Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { AdminService } from "../../admin.service";

@Component({
  selector: "app-view-resource",
  templateUrl: "./view-resource.component.html",
  styleUrls: ["./view-resource.component.scss"],
})
export class ViewResourceComponent implements OnInit {
  // @Input() resourceId: any;
  data: any = {};
  dataLoadingFlag = true;

  constructor(
    private cdref: ChangeDetectorRef,
    private route: ActivatedRoute,
    public translate: TranslateService,
    // private spinner: NgxSpinnerService,
    public adminService: AdminService,
    public dialogRef: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.getRecord(this.data._id);
  }

  getRecord(id: any) {
    this.dataLoadingFlag = true;
    // this.spinner.show();
    this.adminService.getResourceById(id).subscribe(
      (res: any) => {
        // this.spinner.hide();
        this.data = res;
        this.dataLoadingFlag = false;
        this.cdref.detectChanges();
      },
      (err) => {
        // this.spinner.hide();
        this.dataLoadingFlag = false;
        this.cdref.detectChanges();
      }
    );
  }

  closeModal() {
    this.dialogRef.close();
  }
}
