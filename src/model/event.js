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
 */

const FIXED_PERIOD_OF_TIME_IN_HOURS = 1;

/**
 * event.allDay mapping of SeaTable TableEvent
 *
 * given the date-in-row is without minute precision, when representing
 * the start date of an event, then the event all-day is true.
 *
 * otherwise all-day is the defined-all-day.
 *
 * @see TableEvent.constructor()
 *
 * @param {Date|undefined} eventStart
 * @param {string|undefined} rowDate
 * @param {boolean|undefined} defAllDay
 */
const allDayImplementation = (eventStart, rowDate) => {
  if (eventStart && rowDate && (eventStart.toISOString().slice(0, 10) === rowDate)) {
    return true;
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
 */
const endImplementation = (eventStart, eventAllDay, rowDate) => {
  let end = rowDate ? new Date(rowDate) : eventStart;
  if (eventAllDay !== true && !rowDate) {
    end = new Date(+eventStart);
    const hours = Math.max(1, Math.abs(parseInt(FIXED_PERIOD_OF_TIME_IN_HOURS.toFixed(0), 10)));
    end.setHours(eventStart.getHours() + hours);
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
 * @property {string} title
 * @property {Date} start
 * @property {Date} end
 * @property {boolean|undefined} allDay
 * @property {any|undefined} resource
 */
export default class TableEvent {

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
    this.title = object.title || null;
    this.start = object.date && new Date(object.date);
    this.allDay = allDayImplementation(this.start, object.date);
    this.end = endImplementation(this.start, this.allDay, object.endDate);
  }
}
