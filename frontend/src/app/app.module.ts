import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
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
import {NavbarComponent} from './components/navbar/navbar.component';
import {TeeTimeListComponent} from './components/tee-time-list/tee-time-list.component';
import {AdminComponent} from './components/admin/admin.component';

// Routing
import {AppRoutingModule} from './app-routing.module';
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {CourseDetailComponent} from "./components/course-detail/course-detail.component";
import {TeesnapModalComponent} from "./components/model/teesnap-modal/teesnap-modal.component";
import {MatDialogActions, MatDialogContent} from "@angular/material/dialog";

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    TeeTimeListComponent,
    CourseDetailComponent,
    AdminComponent,
    TeesnapModalComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,

    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
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
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
