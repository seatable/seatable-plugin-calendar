import intl from 'react-intl-universal';
import momentLocalizer from './moment';
import * as dates from '../dates';

// import locale files
import 'moment/locale/de';
import 'moment/locale/en-gb';
import 'moment/locale/fr';
import 'moment/locale/zh-cn';

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
  const intlFormat = (format) => {
    subject.formats[format] = (date, _culture, _localizer) => mergeWithDefaultsFormat(
      date, intl.get(`.rbc.localizer.moment.${format}`).d(_formats[format])
    );
  };
  intlFormat('dayHeaderFormat');
  intlFormat('yearHeaderFormat');

  subject.formats.weekdayShortFormat = 'dd'; // e.g. 'Su'
  subject.formats.weekdayFormat = 'ddd'; // e.g. 'Sun'

  subject.format = (value, format) => {
    return _format(value, format, intlLocaleCulture());
  };

  return subject;
};

export default function (moment) {
  return intlDayHeaderFormatDecorator(momentLocalizer(moment), moment);
}
