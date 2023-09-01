import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { AfterViewInit } from "@angular/core";
import { NgxSpinnerService } from "ngx-spinner";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { v4 as uuid } from "uuid";


import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ValidationErrors,
  Validators,
} from "@angular/forms";
@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {

  @ViewChild("submitModal") submitModal!: TemplateRef<any>;
  @ViewChild("formRef") formRef!: FormGroupDirective;
  modaleRef!: NgbModalRef;
  requestForm!: FormGroup;
  attachment!: any;
  attachmentSet = false;
  attachmentName = "Add attachment";
  uuid!: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private modal: NgbModal,
  ) { }

  updateFormControl(formControl: AbstractControl | null, required = false) {
    if (required) {
      formControl?.addValidators([Validators.required]);
    } else {
      formControl?.clearValidators();
      // formControl?.setValue(null);
    }
    formControl?.updateValueAndValidity();
    return formControl;
  }

  changeControlValidation(
    formGroup: AbstractControl,
    controlNames: string[],
    required = false
  ) {
    controlNames.forEach((controlName) => {
      /**
       * Check if the form control is form array
       * if yes the get the control names and call this function recursively for them
       */
      if (formGroup.get(controlName) instanceof FormArray) {
        const controls = (formGroup.get(controlName) as FormArray).controls;
        // controls are also new form groups
        controls.forEach((cName) => {
          const formControls = Object.keys((cName as FormGroup).controls);
          this.changeControlValidation(cName, formControls, required);
        });
      } else {
        // Skip the type formcontrol of participants array as it is readonly
        if (controlName != "type") {
          this.updateFormControl(formGroup.get(controlName), required);
        }
      }
      formGroup.get(controlName)?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    

  }

  initializeForm() {
    this.requestForm = this.fb.group(
      {
        details: ["", [Validators.required]],
        attachment: null
      }
    );
  }

  removeAttachment(event: any) {
    this.attachment = null;
    this.requestForm.get("attachment")?.setValue(null);
    this.attachmentName = "Add attachment";
    this.attachmentSet = false;
  }

  onAttachmentSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      this.attachment = event.target.files[0];
      reader.readAsDataURL(event.target.files[0]); // read file as data url
      this.attachmentName = this.attachment.name;

      reader.onload = (e) => {
        // called once readAsDataURL is completed
        this.attachmentSet = true;
      };
    } else {
      this.attachmentName = "Add attachment";
    }
  }

  formSubmit() { }

  showModal() {
    this.uuid = uuid();
    this.modaleRef = this.modal.open(this.submitModal, {
      backdrop: "static",
      size: "lg",
      keyboard: true,
    });
  }
}
