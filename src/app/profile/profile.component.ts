import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { BaseService } from "../core/_services/base.service";
import { DataService } from "../core/_services/data.service";
import { environment } from "src/environments/environment";
import { AuthService } from "../core/_services/auth.service";
import { Globals } from "../core/_helper/globals";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit {
  dataLoadingFlag: boolean = false;
  user: any = {};
  attachment!: any;
  attachmentName!: String;
  attachmentSet!: boolean;
  defaultImageUrl: any = "../assets/images/avatar.png";
  imageUrl: any = "../assets/images/avatar.png";
  supportedFileTypes: any = ["png", "jpg", "jpeg"];
  serverUrl: any = environment.serverUrl;

  constructor(
    private cdref: ChangeDetectorRef,
    private baseService: BaseService,
    private dataService: DataService,
    private globals: Globals,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchEssentialData();
  }

  fetchEssentialData() {
    this.baseService.getUserProfile().subscribe({
      next: (data: any) => {
        this.user = data;
        // this.spinner.hide();
        this.cdref.detectChanges();
        this.dataLoadingFlag = false;
        // this.imageUrl = `${this.serverUrl}/uploads/users/${data._id}/${data.image}`;
      },
      error: (err: any) => {
        // this.spinner.hide();
        console.log("data error: ", err);
        // this.cdref.detectChanges();
      },
    });
  }

  onAttachmentSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      this.attachment = event.target.files[0];
      this.attachmentName = this.attachment.name;

      const nameParts = this.attachmentName.split(".");
      const ext = nameParts[nameParts.length - 1];

      if (!this.supportedFileTypes.includes(ext)) {
        this.toastr.info(
          "Supported file types are .png, .jpg",
          "Not Supported"
        );
        return;
      }

      reader.readAsDataURL(event.target.files[0]); // read file as data url
      reader.onload = (e) => {
        // called once readAsDataURL is completed
        this.attachmentSet = true;
        this.imageUrl = e.target?.result;
      };
    } else {
      this.attachmentName = "Add attachment";
    }
  }

  cancel() {
    this.attachment = null;
    this.attachmentName = "";
    this.attachmentSet = false;
    this.imageUrl = this.defaultImageUrl;
  }

  saveImage() {
    const formData = new FormData();
    formData.set("image", this.attachment);
    this.dataService
      .updateUserProfile(this.user._id, formData)
      .subscribe((resp: any) => {
        this.toastr.success(
          "The profile image updated successfully",
          "Updated"
        );
        this.defaultImageUrl = this.imageUrl;
        this.attachmentSet = false;
        this.attachment = null;
        this.attachmentName = "";
        this.globals.principal.profileImage = resp.image;
      });
  }

  imageError(el: any) {
    el.onerror = "";
    el.src = this.defaultImageUrl;
    return true;
  }
}
