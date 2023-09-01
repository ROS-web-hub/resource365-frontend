import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../admin.service';

@Component({
  selector: 'app-view-channel',
  templateUrl: './view-channel.component.html',
  styleUrls: ['./view-channel.component.scss']
})
export class ViewChannelComponent implements OnInit {
	data: any = {};
	dataLoadingFlag = true;

	constructor(private cdref: ChangeDetectorRef,
		private route: ActivatedRoute,
        public translate: TranslateService,
        // private spinner: NgxSpinnerService,
		public adminService:AdminService,
		public dialogRef: NgbActiveModal,) { }

	ngOnInit(): void {
		// this.getRecord(this.resourceId);
	}

	closeModal() {
        this.dialogRef.close();
    }

}
