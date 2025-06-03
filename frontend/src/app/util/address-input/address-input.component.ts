import {AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import PlaceResult = google.maps.places.PlaceResult;
import Autocomplete = google.maps.places.Autocomplete;

@Component({
  selector: 'app-address-input',
  templateUrl: './address-input.component.html',
  standalone: false
})
export class AddressInputComponent implements AfterViewInit {
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  @Output() placeSelected = new EventEmitter<PlaceResult>();

  ngAfterViewInit() {
    const autocomplete = new Autocomplete(this.searchInput.nativeElement, {
      types: ['geocode'],
      componentRestrictions: { country: 'us' }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address != null) {
        localStorage.setItem("selectedAddress", place.formatted_address)
      }
        this.placeSelected.emit(place);
    });
  }
}
