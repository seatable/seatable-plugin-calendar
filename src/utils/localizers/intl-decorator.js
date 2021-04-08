import intl from 'react-intl-universal';
import momentLocalizer from './moment';

/**
 * localizer decorator
 *
 * decorates RBC localizer.formats.dayHeaderFormat with the intl.get('xxx_Month_xxx_Date_xxx_Week') implementation
 * named getHeaderFormat() from Popup.js moved herein.
 *
 * this is the first and only intl key in the earlier getHeaderFormat() stand-in for localizer.format(date, 'dayHeaderFormat')
 * and takes care that the expected formats within this implementation are the vanilla ones from moment.js to which the
 * getHeaderFormat() implementation was originally coupled (but it was not part of its closure).
 *
 * @param {DateLocalizer} subject
 */
const intlDayHeaderFormatDecorator = (subject) => {
  const _formats = {...subject.formats};
  const _format = subject.format;
  const culture = undefined;
  const mergeWithDefaultsFormat = (value, format) => _format(value, _formats[format] || format, culture);

  /**
   * dayHeaderFormat (xxx_Month_xxx_Date_xxx_Week) :: '{weekDay} {month} {date}', '{month}{date}日 星期{weekDay}'
   *                   {month}   -> monthFormat:   MMM - Month (Jan Feb ... Nov Dec)
   *                   {date}    -> dateFormat:    DD - Day of Month (01 02 ... 30 31)
   *                   {weekDay} -> weekdayFormat: ddd - Day of Week (Sun Mon ... Fri Sat)
   *
   * dayHeaderFormat (vanilla) :: 'MM-dd-DD'
   *
   * @param {Date} slotStart
   * @param {?string} culture
   * @param {DateLocalizer} local
   * @return {string}
   */
  subject.formats.dayHeaderFormat = (slotStart, culture, local) => {
    const localizer = {format: mergeWithDefaultsFormat};
    const getHeaderFormat = () => {
      let month = localizer.format(slotStart, 'monthFormat');
      let date = Number(localizer.format(slotStart, 'dateFormat'));
      let week_day = localizer.format(slotStart, 'weekdayFormat');
      return intl.get('xxx_Month_xxx_Date_xxx_Week', {month: intl.get(month), date, weekDay: intl.get(week_day)});
    };
    return getHeaderFormat();
  };

  return subject;
};

export default function(moment) {
  return intlDayHeaderFormatDecorator(momentLocalizer(moment));
}
