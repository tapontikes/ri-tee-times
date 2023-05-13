import {Pipe, PipeTransform} from '@angular/core';
import {TeeTime} from "../model/models";
import * as moment from 'moment';

@Pipe({
  name: 'dateFilter'
})
export class Datefilter implements PipeTransform {
  transform(items: TeeTime[], timeRangeStart: Date, timeRangeEnd: Date, selectedDate: Date): TeeTime[] {
    const _selectedDate = moment(selectedDate);
    const _timeRangeStart = moment(timeRangeStart);
    const _timeRangeEnd = moment(timeRangeEnd);

    return items.filter(item =>
      _selectedDate.hour(moment(item.time, 'h:mm A').hour()).minute(0).isSameOrAfter(_timeRangeStart, 'minute')
      &&
      _selectedDate.hour(moment(item.time, 'h:mm A').hour()).minute(0).isSameOrBefore(_timeRangeEnd, 'minute')
    )
  }
}
