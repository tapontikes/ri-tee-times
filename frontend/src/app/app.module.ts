import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

// Angular Material Imports
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatChipsModule} from '@angular/material/chips';
import {MatDividerModule} from '@angular/material/divider';
import {MatButtonToggleModule} from '@angular/material/button-toggle';

// Components
import {AppComponent} from './app.component';

// Routing
import {AppRoutingModule} from './app-routing.module';
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {MatDialogActions, MatDialogContent, MatDialogTitle} from "@angular/material/dialog";
import {DataSharingService} from "./service/data-sharing.service";
import {NavbarComponent} from "./components/main/navbar/navbar.component";
import {TeeTimeListComponent} from "./components/main/tee-time-list/tee-time-list.component";
import {CourseDetailComponent} from "./components/main/course-detail/course-detail.component";
import {AdminComponent} from "./components/main/admin/admin.component";
import {AddressInputComponent} from "./util/address-input/address-input.component";
import {FilterTeeTimePipe} from "./util/pipe/filter-tee-time-pipe";
import {FilterCoursePipe} from "./util/pipe/filter-course-pipe";


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    TeeTimeListComponent,
    CourseDetailComponent,
    AdminComponent,
    AddressInputComponent
    ],
  bootstrap: [AppComponent],
  imports: [BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,
    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatMenuTrigger,
    MatMenu,
    MatDialogContent,
    MatDialogActions,
    MatDialogTitle,
    FilterTeeTimePipe,
    FilterCoursePipe],
  providers: [
        DataSharingService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule {
}
