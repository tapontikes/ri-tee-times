import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {TeesnapRoutingModule} from './teesnap-routing.module';
import {TeesnapLoginComponent} from './teesnap-login/teesnap-login.component';
import {TeesnapReserveComponent} from './teesnap-reserve/teesnap-reserve.component';
import {MatDialogTitle} from "@angular/material/dialog";

@NgModule({
  declarations: [
    TeesnapLoginComponent,
    TeesnapReserveComponent
  ],
  imports: [
    CommonModule,
    TeesnapRoutingModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogTitle
  ]
})
export class TeesnapModule {
}
