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

import {ForeupRoutingModule} from './foreup-routing.module';
import {ForeupLoginComponent} from './foreup-login/foreup-login.component';
import {ForeupReserveComponent} from './foreup-reserve/foreup-reserve.component';
import {MatDialogTitle} from "@angular/material/dialog";
import {SessionService} from "../../../service/session.service";

@NgModule({
  declarations: [
    ForeupLoginComponent,
    ForeupReserveComponent
  ],
  imports: [
    CommonModule,
    ForeupRoutingModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogTitle
  ],
  providers: [
    SessionService
  ]
})
export class ForeupModule {
}
