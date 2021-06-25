/**
 * TableEventRowTypedef
 *
 * @typedef  {Object.<string, string|object>|{}} TableEventRowTypedef
 * @property {string} _id of table row, e.g. "ECh6pHYlTmusfVdbCvfsQg"
 * @property {array} _participants e.g. []
 * @property {string} _creator e.g. "bad4755091934d0ea34d5e3c313ef7d9@auth.local"
 * @property {string} _ctime e.g. "2021-02-15T09:18:31.250+00:00"
 * @property {string} _last_modifier e.g. "aaac4eb68f294f0ba61bbb764c23c48a@auth.local"
 * @property {string} _mtime e.g. "2021-02-23T16:04:25.310+00:00"
 * @property {string|object} 0000 default column (string for the default "Name" column in a just created table)
 *
 * dynamic properties: multiple for each other column in the row, examples
 *          Y316 = "2021-01-01"
 *          41my = null
 *          GsGz = "787316"
 *          04n7 = "text..."
 *          U41U = Object {text: "abc... .\n\n\n",
 *                         preview: "abc... . ",
 *                         images: Array(0),
 *                         links: Array(0),
 *                         checklist: Object}
 *          31A0 = "2021-02-24"
 *
 */
/**
 * TableEventDTableColumnDefinitionTypedef
 *
 * @typedef {Object.<string, string|object>|{}} TableEventDTableColumnDefinitionTypedef
 * @property {string} key
 * @property {string} type
 * @property {string} name
 * @property {bool} editable
 * @property {string} width
 * @property {bool} resizable
 * @property {bool} draggable
 * @property {*} data (depends on type)
 * @property {string} permission_type
 * @property {Array} permitted_users
 *
 * Example:
 *
 * {
 *     "key": "nYvV",
 *     "type": "single-select",
 *     "name": "Category",
 *     "editable": true,
 *     "width": 200,
 *     "resizable": true,
 *     "draggable": true,
 *     "data": {
 *         "options": [
 *             {
 *                 "name": "Fun",
 *                 "color": "#FFDDE5",
 *                 "textColor": "#202428",
 *                 "id": "482632"
 *             },
 *             {
 *                 "name": "Leisure",
 *                 "color": "#F4667C",
 *                 "textColor": "#FFFFFF",
 *                 "id": "323575"
 *             },
 *             {
 *                 "name": "Obligatory",
 *                 "color": "#46A1FD",
 *                 "textColor": "#FFFFFF",
 *                 "id": "55022"
 *             }
 *         ]
 *     },
 *     "permission_type": "",
 *     "permitted_users": []
 * }
 */

/**
 * event.allDay mapping of SeaTable TableEvent
 *
 * given the date-in-row is without minute precision, when representing
 * the start date of an event, then the event all-day is true.
 *
 * given the date-in-row is with minute precision, when representing the
 * start date of an event and there is no end-date-in-row, then the
 * event all-day is true, as well.
 *
 * otherwise all-day is false
 *
 * @see TableEvent.constructor()
 *
 * @param {Date|undefined} eventStart
 * @param {string|undefined} rowDate
 * @param {string|undefined} rowEndDate
 */
const allDayImplementation = (eventStart, rowDate, rowEndDate) => {
  // rowDate is DATE, not DATETIME
  if (eventStart && rowDate && (eventStart.toISOString().slice(0, 10) === rowDate)) {
    return true;
  }
  // rowDate is DATETIME, not DATE
  if (eventStart && rowDate && !rowEndDate) {
    return false;
  }
  return false;
};

/**
 * event.end mapping of SeaTable TableEvent
 *
 * given the dates-in-row for start and end are with or w/o minute precision,
 * when the end is undefined, the same as -or- before the start and the event
 * is strictly not truly all-day, the events end date is the start date plus
 * a minimum, fixed period of time (e.g. one hour).
 *
 * @see TableEvent.constructor()
 *
 * @param {Date|undefined} eventStart
 * @param {boolean|undefined} eventAllDay
 * @param {string|undefined} rowDate
 * @return {Date|undefined}
 */
const endImplementation = (eventStart, eventAllDay, rowDate) => {
  let end;
  if (rowDate) {
    end = new Date(rowDate);
    // given the date-in-row is without minute precision
    if (end.toISOString().slice(0, 10) === rowDate) {
      end.setHours(12);
      end.setMinutes(0);
    }
  } else {
    end = eventStart;
  }
  if ((eventAllDay !== true) && eventStart && (rowDate === undefined || end <= eventStart)) {
    end = new Date(+eventStart);
    end.setHours(eventStart.getHours() + TableEvent.FIXED_PERIOD_OF_TIME_IN_HOURS);
  } else if (eventStart && (rowDate === undefined || end <= eventStart)) {
    end = new Date(+eventStart);
  }
  return end;
};

/**
 * TableEvent
 *
 * SeaTable TableEvent properties:
 * @property {TableEventRowTypedef|object} row [TABLE DATA] SeaTable row object
 * @property {string} bgColor [PRESENTATION] HTML/CSS color like "#RRGGBB"
 * @property {string} highlightColor [PRESENTATION] HTML/CSS color like "#RRGGBB"
 * @property {string} textColor [PRESENTATION] HTML/CSS color like "#RRGGBB"
 *
 * React Big Calendar event properties:
 * @property {object} titleColumn
 * @property {Date} start
 * @property {Date} end
 * @property {boolean|undefined} allDay
 * @property {any|undefined} resource
 */
export default class TableEvent {

  static FIXED_PERIOD_OF_TIME_IN_HOURS = 1;

  /**
   * obtain colors (background, text, highlight) for row and labelColumn
   *
   * @param {TableEventRowTypedef} row
   * @param {?TableEventDTableColumnDefinitionTypedef} colorColumn
   * @param {Array.<Object>} optionColors dtable option-colors
   * @param {Array.<string>} highlightColors dtable highlight-colors
   * @return {{highlightColor: ?string, bgColor: ?string, textColor: ?string}}
   */
  static getColors({row, colorColumn, configuredUseRowColor, optionColors, highlightColors, rowsColor, rowColorsMap}) {
    const colors = {bgColor: null, textColor: null, highlightColor: null};
    const defaultOptionColor = optionColors[2];
    if (configuredUseRowColor) {
      const bgColor = rowsColor[row._id];
      colors.bgColor = bgColor;
      colors.textColor = rowColorsMap[bgColor];
    } else if (colorColumn) {
      const { key: colorColumnKey, data } = colorColumn;
      const colorDataOptions = data && data.options;
      const colorId = row[colorColumnKey];
      const colorOption = colorDataOptions && colorDataOptions.find(o => o.id === colorId);
      colors.bgColor = colorOption && colorOption.color;
      colors.textColor = colorOption && colorOption.textColor;
    }
    if (!colors.bgColor) {
      colors.bgColor = defaultOptionColor.COLOR;
      colors.textColor = defaultOptionColor.TEXT_COLOR;
    }
    colors.highlightColor = highlightColors[colors.bgColor];
    return colors;
  }

  /**
   * @param {{row: TableEventRowTypedef}|*} object
   */
  constructor(object = {}) {
    /* 1/2: SeaTable TableEvent properties */
    this.row = object.row || {};
    this.bgColor = object.bgColor || null;
    this.highlightColor = object.highlightColor || null;
    this.textColor = object.textColor || null;
    /* 2/2: React-Big-Calendar event properties */
    this.titleColumn = object.titleColumn || null;
    this.start = object.date && new Date(object.date);
    this.allDay = allDayImplementation(this.start, object.date, object.endDate);
    this.end = endImplementation(this.start, this.allDay, object.endDate);
  }
}
