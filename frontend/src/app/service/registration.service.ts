// src/app/services/reservation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Course, TeeTime } from '../model/models';
import {TeesnapModalComponent} from "../components/model/teesnap-modal/teesnap-modal.component";

export interface ReservationResponse {
  success: boolean;
  loginData?: any;
  reservationQuote?: any;
  error?: string;
  responseData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  /**
   * Opens a dialog to book a Teesnap tee time
   */
  openTeesnapReservationDialog(course: Course, teeTime: TeeTime, date: string): Observable<any> {
    const dialogRef = this.dialog.open(TeesnapModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        course,
        teeTime,
        date,
        domain: this.extractDomain(course.booking_url || ''),
        playerCount: 2 // Default player count
      }
    });

    return dialogRef.afterClosed();
  }

  /**
   * Extracts the domain from a booking URL
   */
  private extractDomain(url: string): string {
    try {
      if (!url) return '';

      // Try to extract domain using URL parsing
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      // Return just the domain part
      const domainMatch = hostname.match(/(?:www\.)?(.*)/);
      return domainMatch ? domainMatch[1] : hostname;
    } catch (e) {
      console.error('Error extracting domain:', e);
      return '';
    }
  }
}
