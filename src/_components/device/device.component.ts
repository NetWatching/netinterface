import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceAndAppManagementRoleAssignment } from '@microsoft/microsoft-graph-types';
import { Device } from 'src/_interfaces/device';
import { DeviceData } from 'src/_interfaces/device-data';
import { CentralApiService } from '../../_services/central-api.service';
import { Category } from 'src/_interfaces/category';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss']
})
export class DeviceComponent implements OnInit {

  firstCall: Boolean | undefined = false;
  devices!: Array < Device > ;
  deviceData!: DeviceData;
  errorMessage: string | undefined;

  categoryForm: FormGroup;
  categories!: any;

  pageCount: number | undefined = 1;
  totalPages: number | undefined = 0;
  devicesPerPage: number | undefined = 9;
  selectedCategories: string | undefined;

  showAddDeviceDialog = false;
  addDeviceForm: FormGroup;
  addDeviceDialogIsOpened = false;
  showAddDeviceSuccessDialog = false;
  showAddDeviceErrorDialog = false;
  device: string;
  category: string;
  ip: string;
  hostname: string;
  newDeviceName: string;

  showAddCategoryDialog = false;
  addCategoryForm: FormGroup;
  addCategoryDialogIsOpened = false;
  showAddCategorySuccessDialog = false;
  showAddCategoryErrorDialog = false;
  categoryname: string;

  showDeleteCategoryDialog = false;
  showDeleteCategorySuccessDialog = false;
  showDeleteCategoryErrorDialog = false;
  showDeleteDeviceDialog = false;
  showDeleteDeviceSuccessDialog = false;
  showDeleteDeviceErrorDialog = false;
  categoryName: string;
  categoryId: string;
  deviceName: string;
  deviceId: string;

  // icons
  faTrash = faTrash;
  faPlus = faPlus;

  constructor(
    private central: CentralApiService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.categoryForm = this.formBuilder.group({
      checkArray: this.formBuilder.array([])
    })
  }

  ngOnInit() {
    this.getCategories();
    this.getDevices(1, this.devicesPerPage);
    this.firstCall = true;
  }

  refresh(){
    window.location.reload();
  }

  refreshData(){
    this.getCategories();
    this.getDevices(1, this.devicesPerPage);
    this.firstCall = true;
  }

  // API requests

  getDevices(page: number, amount: number) {
    this.central.getDevices(page, amount).subscribe((deviceData) => {
        this.deviceData = deviceData;
        this.devices = deviceData.devices;
        if (this.firstCall == true) {
          this.calcPageAmount(this.devicesPerPage)
          this.firstCall = false;
        }
      },
      (error) => {
        if (error.status == 404) {
          this.router.navigate(['']);
        }
        this.errorMessage = error.message;
      }
    );
  }

  getDevicesByCategory(page: number, amount: number, category: string) {
    this.central.getDevicesByCategory(page, amount, category).subscribe((deviceData) => {
        this.deviceData = deviceData;
        this.devices = deviceData.devices;
        this.calcPageAmount(this.devicesPerPage)
      },
      (error) => {
        if (error.status == 404) {
          this.router.navigate(['']);
        }
        this.errorMessage = error.message;
      }
    );
  }

  getCategories() {
    this.central.getCategories().subscribe((categories) => {
        this.categories = categories.categories;
      },
      (error) => {
        if (error.status == 404) {
          this.router.navigate(['']);
        }
        this.errorMessage = error.message;
      }
    );
  }

  addDevice(body) {
    this.central.addDevice(body).then(() => {
        this.closeAddDeviceDialog();
        this.openAddDeviceSuccessDialog();
        this.refreshData()
      },
      err => {
        this.closeAddDeviceDialog();
        this.openAddDeviceErrorDialog(err.status);
      });
  }

  addCategory(body) {
    this.central.addCategory(body).then(() => {
      this.closeAddCategoryDialog();
      this.openAddCategorySuccessDialog();
      this.refreshData()
    },
    err => {
      this.closeAddCategoryDialog();
      this.openAddCategoryErrorDialog(err.status);
    });
  }

  deleteCategory(id){
    this.central.deleteCategoryById(id).then(() => {
      this.closeDeleteCategoryDialog();
      this.openDeleteCategorySuccessDialog();
      this.refreshData()
    },
    err => {
      this.closeDeleteCategoryDialog();
      this.openDeleteCategoryErrorDialog(err.status);
    });
  }

  deleteDevice(id){
    this.central.deleteDeviceById(id).then(() => {
      this.closeDeleteDeviceDialog();
      this.openDeleteDeviceSuccessDialog();
      this.refreshData()
    },
    err => {
      this.closeDeleteDeviceDialog();
      this.openDeleteDeviceErrorDialog(err.status);
    });
  }

  // filter by category

  submitFilterForm() {
    let selectedCategories: string = "";
    this.categoryForm.value["checkArray"].forEach(function (value) {
      selectedCategories += value + "_";
    });
    this.selectedCategories = selectedCategories.substr(0, selectedCategories.length - 1);
    this.getDevicesByCategory(1, this.devicesPerPage, this.selectedCategories)
  }

  onCheckboxChange(e) {
    const checkArray: FormArray = this.categoryForm.get('checkArray') as FormArray;
    if (e.target.checked) {
      checkArray.push(new FormControl(e.target.value));
    } else {
      let i: number = 0;
      checkArray.controls.forEach((item: FormControl) => {
        if (item.value == e.target.value) {
          checkArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  clearFilter(){
    this.gotoFirstPage();
    // this.getCategories();
    this.getDevices(1, this.devicesPerPage);
    this.firstCall = true;
  }

  // pagination

  calcPageAmount(devicesPerPage: number) {
    this.totalPages = Math.ceil(this.deviceData.total / devicesPerPage);
  }

  gotoPage(num: number) {
    this.setPage(num)
  }

  gotoFirstPage() {
    this.setPage(1)
  }

  gotoLastPage() {
    this.setPage(this.totalPages)
  }

  setPage(num: number) {
    this.pageCount = num;
    if (this.selectedCategories) {
      this.getDevicesByCategory(num, this.devicesPerPage, this.selectedCategories)
    } else {
      this.getDevices(num, this.devicesPerPage)
    }
  }

  setPageCount(num: number) {
    this.pageCount += num;
    this.setPage(this.pageCount)
  }

  // add category functions

  processAddCategoryFormProperties() {
    this.addCategoryForm = new FormGroup({
      category: new FormControl(''),
    });
  }

  openAddCategoryDialog() {
    this.processAddCategoryFormProperties()
    this.addCategoryForm.patchValue({
      category: this.categoryname
    })
    this.showAddCategoryDialog = true;
  }

  openAddCategorySuccessDialog() {
    this.showAddCategorySuccessDialog = true;
  }

  openAddCategoryErrorDialog(errorMessage) {
    this.showAddCategoryErrorDialog = true;
    this.errorMessage = errorMessage;
  }

  closeAddCategoryDialog() {
    this.showAddCategoryDialog = false;
  }

  closeAddCategorySuccessDialog() {
    this.showAddCategorySuccessDialog = false;
  }

  closeAddCategoryErrorDialog() {
    this.showAddCategoryErrorDialog = false;
  }

  submitAddCategoryForm() {
    const requestBody: any = {};
    requestBody['category'] = this.addCategoryForm.get('category').value;
    this.addCategory(requestBody);
  }

  // add device functions

  processAddDeviceFormProperties() {
    this.addDeviceForm = new FormGroup({
      device: new FormControl(''),
      ip: new FormControl(''),
      hostname: new FormControl(''),
      category: new FormControl(''),
    });
  }

  openAddDeviceDialog() {
    this.processAddDeviceFormProperties()
    this.addDeviceForm.patchValue({
      device: this.device,
      ip: this.ip,
      hostname: this.hostname,
      category: this.category,
    })
    this.showAddDeviceDialog = true;
  }

  openAddDeviceSuccessDialog() {
    this.showAddDeviceSuccessDialog = true;
  }

  openAddDeviceErrorDialog(errorMessage) {
    this.showAddDeviceErrorDialog = true;
    this.errorMessage = errorMessage;
  }

  closeAddDeviceDialog() {
    this.showAddDeviceDialog = false;
  }

  closeAddDeviceSuccessDialog() {
    this.showAddDeviceSuccessDialog = false;
  }

  closeAddDeviceErrorDialog() {
    this.showAddDeviceErrorDialog = false;
  }

  submitAddDeviceForm() {
    const requestBody: any = {};
    requestBody['device'] = this.addDeviceForm.get('device').value;
    this.newDeviceName = this.addDeviceForm.get('device').value;
    requestBody['ip'] = this.addDeviceForm.get('ip').value;
    requestBody['hostname'] = this.addDeviceForm.get('hostname').value;
    requestBody['category'] = this.addDeviceForm.get('category').value;
    this.addDevice(requestBody);
  }

  //delete category dialog

  openDeleteCategoryDialog(name, id) {
    this.categoryId = id;
    this.categoryName = name;
    this.showDeleteCategoryDialog = true;
  }

  closeDeleteCategoryDialog() {
    this.showDeleteCategoryDialog = false;
  }

  openDeleteCategoryErrorDialog(errorMessage){
    this.showDeleteCategoryErrorDialog = true;
    this.errorMessage = errorMessage;
  }

  closeDeleteCategoryErrorDialog(){
    this.showDeleteCategoryErrorDialog = false;
  }

  openDeleteCategorySuccessDialog(){
    this.showDeleteCategorySuccessDialog = true;
  }

  closeDeleteCategorySuccessDialog(){
    this.showDeleteCategorySuccessDialog = false;
  }

  //delete device dialog

  openDeleteDeviceDialog(name, id) {
    this.deviceId = id;
    this.deviceName = name;
    this.showDeleteDeviceDialog = true;
  }

  closeDeleteDeviceDialog() {
    this.showDeleteDeviceDialog = false;
  }

  openDeleteDeviceErrorDialog(errorMessage){
    this.showDeleteDeviceErrorDialog = true;
    this.errorMessage = errorMessage;
  }

  closeDeleteDeviceErrorDialog(){
    this.showDeleteDeviceErrorDialog = false;
  }

  openDeleteDeviceSuccessDialog(){
    this.showDeleteDeviceSuccessDialog = true;
  }

  closeDeleteDeviceSuccessDialog(){
    this.showDeleteDeviceSuccessDialog = false;
  }

}
