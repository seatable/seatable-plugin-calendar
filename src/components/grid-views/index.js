import { CALENDAR_VIEWS } from '../../constants';
import Month from './Month';
import Day from './Day';
import Week from './Week';
import WorkWeek from './WorkWeek';
import Agenda from './Agenda';
import Year from './Year';

const VIEWS = {
  [CALENDAR_VIEWS.MONTH]: Month,
  [CALENDAR_VIEWS.WEEK]: Week,
  [CALENDAR_VIEWS.WORK_WEEK]: WorkWeek,
  [CALENDAR_VIEWS.DAY]: Day,
  [CALENDAR_VIEWS.AGENDA]: Agenda,
  [CALENDAR_VIEWS.YEAR]: Year
};

export default VIEWS;
