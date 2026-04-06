import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class DistanceService {

  async getDistance(from: string, to: string): Promise<string> {
    const service = new google.maps.DistanceMatrixService();
    return new Promise((resolve) => {
      service.getDistanceMatrix(
        {origins: [from], destinations: [to], travelMode: google.maps.TravelMode.DRIVING},
        (response, status) => {
          if (status !== google.maps.DistanceMatrixStatus.OK || !response) return resolve('');
          const text = response.rows?.[0]?.elements?.[0]?.duration?.text;
          resolve(text ?? '');
        }
      );
    });
  }
}
