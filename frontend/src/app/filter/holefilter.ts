import {Pipe, PipeTransform} from '@angular/core';
import {TeeTime} from "../model/models";

@Pipe({
  name: 'holeFilter'
})
export class HoleFilter implements PipeTransform {
  transform(items: TeeTime[], selectedNumber: number): any[] {
    if (!items || !selectedNumber) {
      return items;
    }
    if (selectedNumber === 1) return items;

    return items.filter(item => item.holes.includes(selectedNumber));
  }
}
