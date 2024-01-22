import intl from 'react-intl-universal';
import momentLocalizer from './moment';
import * as dates from '../dates';

// 'de' week-range-format decoration
let weekRangeFormatDe = ({start, end}, culture, local) =>
  local.format(start, dates.eq(start, end, 'month') ? 'DD.' : 'DD. MMMM', culture) +
  ' – ' +
  local.format(end, 'DD. MMMM', culture);

/**
 * localizer decorator
 *
 * decorates RBC localizer with intl.
 *
 * formats can be decorated with keys from intl translations, like `.rbc.localizer.moment.dayHeaderFormat`.
 * @see subject.formats.dayHeaderFormat
 *
 * functional formats can be wrapped an offered an implementation per culture
 * @see weekRangeFormatDe
 * @see subject.formats.dayRangeHeaderFormat
 *
 * @param {DateLocalizer} subject
 * @param moment (from moment.js)
 */
const intlDayHeaderFormatDecorator = (subject, moment) => {
  const _formats = {...subject.formats};
  const _format = subject.format;
  const intlLocaleCulture = () => {
    let culture = intl.options.currentLocale;
    switch (culture) {
      case 'en':
        return 'en-gb';
      default:
        return culture;
    }
  };
  const mergeWithDefaultsFormat = (value, format) => _format(value, _formats[format] || format, intlLocaleCulture());

  subject.formats.dayRangeHeaderFormat = (range, _culture, _localizer) => {
    switch (_culture) {
      case 'de':
        return weekRangeFormatDe(range, _culture, _localizer);
      default:
        return _formats.dayRangeHeaderFormat(range, _culture, _localizer);
    }
  };

  // use keys for localizer formats like .rbc.localizer.moment.dayHeaderFormat for dayHeaderFormat
  const intlFormat = (format, fallBackFormat = undefined) => {
    _formats[format] || (_formats[format] = fallBackFormat);
    subject.formats[format] = (date, _culture, _localizer) => mergeWithDefaultsFormat(
      date, intl.get(`.rbc.localizer.moment.${format}`).d(_formats[format])
    );
  };
  /* in moment.js order */
  intlFormat('dateFormat');
  intlFormat('dayFormat');
  intlFormat('weekdayFormat');
  intlFormat('monthFormat');

  intlFormat('yearHeaderFormat');
  intlFormat('dayHeaderFormat');

  intlFormat('agendaDateFormat', 'ddd MMM Do');

  /* additional decorator formats */
  intlFormat('yearMonthWeekdayFormat', 'dd');
  intlFormat('yearMonthDateFormat', 'DD');
  intlFormat('weekOfYearFormat', 'WW');

  subject.format = (value, format) => {
    return _format(value, format, intlLocaleCulture());
  };

  return subject;
};

export default function localizer(moment, configuredWeekStart, startYearFirstWeek) {
  return intlDayHeaderFormatDecorator(momentLocalizer(moment, configuredWeekStart, startYearFirstWeek), moment);
}
