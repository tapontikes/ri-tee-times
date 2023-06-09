import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CommonModule} from "@angular/common";
import {HttpClientModule} from "@angular/common/http";
import {MatCardModule} from "@angular/material/card";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {FormsModule} from "@angular/forms";
import {MatNativeDateModule} from "@angular/material/core";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatTableModule} from "@angular/material/table";
import {MatToolbarModule} from "@angular/material/toolbar";
import {HoleFilter} from "./filter/holefilter";
import {MatRadioModule} from "@angular/material/radio";
import {MatSelectModule} from "@angular/material/select";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatButtonModule} from "@angular/material/button";
import {MatChipsModule} from "@angular/material/chips";
import {MatSliderModule} from "@angular/material/slider";
import {Datefilter} from "./filter/datefilter";
import {OwlDateTimeModule, OwlNativeDateTimeModule} from "@danielmoncada/angular-datetime-picker";

@NgModule({
  declarations: [
    AppComponent,
    HoleFilter,
    Datefilter
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    HttpClientModule,
    MatCardModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    MatNativeDateModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatToolbarModule,
    MatRadioModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatChipsModule,
    MatSliderModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
