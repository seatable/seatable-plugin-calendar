import * as dates from '../dates';
import { DateLocalizer } from './localizer';
import { SETTING_VALUE } from '../../constants';

let dateRangeFormat = ({ start, end }, culture, local) =>
  local.format(start, 'YYYY-MM-DD', culture) + ' – ' + local.format(end, 'YYYY-MM-DD', culture);

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

export default function (moment, configuredWeekStart, startYearFirstWeek) {
  let locale = (m, c) => (c ? m.locale(c) : m);

  return new DateLocalizer({
    formats,
    firstOfWeek(culture) {
      // let data = culture ? moment.localeData(culture) : moment.localeData();
      // return data ? data.firstDayOfWeek() : 0;

      return configuredWeekStart || 0; // the default first of week is sunday.
    },

    format(value, format, culture) {
      if (format === 'WW') {
        // 'WW' use to calculate ISO week number
        // 'ww' use to calculate week number
        const weekNumFormat = startYearFirstWeek === SETTING_VALUE.YEAR_FIRST_FULL_WEEK ? format : format.toLowerCase();
        return moment(value).format(weekNumFormat);
      }
      return locale(moment(value), culture).format(format);
    }
  });
}
