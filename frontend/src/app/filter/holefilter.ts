import { Pipe, PipeTransform } from '@angular/core';
import {TeeTime} from "../model/teeTime";

@Pipe({
  name: 'holeFilter'
})
export class HoleFilter implements PipeTransform {
  transform(items: TeeTime[], selectedNumber: number): any[] {
    if (!items || !selectedNumber) {
      return items;
    }

    if(selectedNumber === 0) return items;

    return items.filter(item => item.holes.includes(selectedNumber));
  }
}
