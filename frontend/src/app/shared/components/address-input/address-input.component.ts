import {AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import PlaceResult = google.maps.places.PlaceResult;
import Autocomplete = google.maps.places.Autocomplete;

@Component({
  selector: 'app-address-input',
  templateUrl: './address-input.component.html',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule]
})
export class AddressInputComponent implements AfterViewInit {
  @ViewChild('searchInput', {static: true}) searchInput!: ElementRef;
  @Output() placeSelected = new EventEmitter<PlaceResult>();

  ngAfterViewInit(): void {
    const autocomplete = new Autocomplete(this.searchInput.nativeElement, {
      types: ['geocode'],
      componentRestrictions: {country: 'us'}
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        localStorage.setItem('selectedAddress', place.formatted_address);
      }
      this.placeSelected.emit(place);
    });
  }
}
