import * as dates from '../dates';
import { DateLocalizer } from './localizer';

let dateRangeFormat = ({ start, end }, culture, local) =>
  local.format(start, 'L', culture) + ' – ' + local.format(end, 'L', culture);

let timeRangeFormat = ({ start, end }, culture, local) =>
  local.format(start, 'LT', culture) + ' – ' + local.format(end, 'LT', culture);

let timeRangeStartFormat = ({ start }, culture, local) =>
  local.format(start, 'LT', culture) + ' – ';

let timeRangeEndFormat = ({ end }, culture, local) =>
  ' – ' + local.format(end, 'LT', culture);

let weekRangeFormat = ({ start, end }, culture, local) =>
  local.format(start, 'MMMM DD', culture) +
  ' – ' +
  local.format(end, dates.eq(start, end, 'month') ? 'DD' : 'MMMM DD', culture);

export let formats = {
  dateFormat: 'DD',
  dayFormat: 'DD ddd',
  weekdayFormat: 'ddd',
  monthFormat: 'MMM',

  selectRangeFormat: timeRangeFormat,
  eventTimeRangeFormat: timeRangeFormat,
  eventTimeRangeStartFormat: timeRangeStartFormat,
  eventTimeRangeEndFormat: timeRangeEndFormat,

  timeGutterFormat: 'LT',

  yearHeaderFormat: 'YYYY',
  monthHeaderFormat: 'YYYY-MM',
  dayHeaderFormat: 'MM-dd-DD',
  dayRangeHeaderFormat: weekRangeFormat,
  agendaHeaderFormat: dateRangeFormat,

  agendaDateFormat: 'ddd MMM DD',
  agendaTimeFormat: 'LT',
  agendaTimeRangeFormat: timeRangeFormat
};

export default function(moment, configuredWeekStart) {
  let locale = (m, c) => (c ? m.locale(c) : m);

  return new DateLocalizer({
    formats,
    firstOfWeek(culture) {
      // let data = culture ? moment.localeData(culture) : moment.localeData();
      // return data ? data.firstDayOfWeek() : 0;
      if (configuredWeekStart != undefined) {
        return configuredWeekStart;
      }
      return 0; // set first of week is sunday.
    },

    format(value, format, culture) {
      return locale(moment(value), culture).format(format);
    }
  });
}
