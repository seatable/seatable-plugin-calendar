import PropTypes from 'prop-types';

const localePropType = PropTypes.oneOfType([PropTypes.string, PropTypes.func]);

function _format(localizer, formatter, value, format, culture) {
  let result =
    typeof format === 'function'
      ? format(value, culture, localizer)
      : formatter.call(localizer, value, format, culture);
  return result;
}

export class DateLocalizer {
  constructor(spec) {

    this.propType = spec.propType || localePropType;
    this.startOfWeek = spec.firstOfWeek;
    this.formats = spec.formats;
    this.format = (...args) => _format(this, spec.format, ...args);
  }
}

export function mergeWithDefaults(localizer, culture, formatOverrides, messages, configuredWeekStart) {
  const formats = {
    ...localizer.formats,
    ...formatOverrides
  };

  return {
    ...localizer,
    messages,
    startOfWeek: () => {
      if (configuredWeekStart != undefined) {
        return configuredWeekStart;
      }
      return localizer.startOfWeek(culture);
    },
    format: (value, format) =>
      localizer.format(value, formats[format] || format, culture)
  };
}
