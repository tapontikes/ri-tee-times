import {Pipe, PipeTransform} from '@angular/core';
import {TeeTime} from "../model/models";
import * as moment from 'moment';

@Pipe({
  name: 'dateFilter'
})
export class Datefilter implements PipeTransform {
  transform(items: TeeTime[], dateRangeStart: number, dateRangeEnd: number, selectedDate: Date): TeeTime[] {
    return items.filter((item) =>
      moment(selectedDate).hour(moment(item.time, 'h:mm A').hour()).minute(0).isSameOrAfter(moment(selectedDate).hour(dateRangeStart), 'hour')
      &&
      moment(selectedDate).hour(moment(item.time, 'h:mm A').hour()).minute(0).isSameOrBefore(moment(selectedDate).hour(dateRangeEnd)), 'hour');
  }
}
