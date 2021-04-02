import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'moment/locale/en-gb';
//import 'moment/min/locales.min';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from 'reactstrap';
import intl from 'react-intl-universal';
import Picker from '@seafile/seafile-calendar/lib/Picker';
import RangeCalendar from '@seafile/seafile-calendar/lib/RangeCalendar';
import { translateCalendar } from '../../utils/seafile-calendar-translate';
import { zIndexes, DATE_UNIT, DATE_FORMAT } from '../../constants';

import '@seafile/seafile-calendar/assets/index.css';

const propTypes = {
  isExporting: PropTypes.bool,
  toggleDialog: PropTypes.func,
  onConfirmTimeRange: PropTypes.func,
};

class SelectExportTimeRangeDialog extends Component {

  constructor(props) {
    super(props);
    const lang = window.dtable ? window.dtable.lang : 'zh-cn';
    const now = moment().locale(lang);
    this.state = {
      dateRange: [now, now]
    };
  }

  renderPicker = () => {
    const { dateRange } = this.state;
    return (
      <Picker
        value={dateRange}
        calendar={this.renderRangeCalendar()}
        style={{ zIndex: zIndexes.RC_CALENDAR }}
        onOpenChange={this.onOpenChange}
        onChange={this.onDatePickerChange}
      >
        {({ value }) => {
          return (
            <Input
              readOnly={true}
              value={value && value[0] && value[1] ? `${value[0].format(DATE_FORMAT.YEAR_MONTH)} - ${value[1].format(DATE_FORMAT.YEAR_MONTH)}` : ''}
            />
          );}
        }
      </Picker>
    );
  }

  renderRangeCalendar = () => {
    const { dateRange } = this.state;
    return (
      <RangeCalendar
        locale={translateCalendar()}
        showToday={false}
        mode={[DATE_UNIT.MONTH, DATE_UNIT.MONTH]}
        format={DATE_FORMAT.YEAR_MONTH}
        defaultSelectedValue={dateRange}
        onPanelChange={this.onChangeSelectedRangeDates}
      />
    );
  }

  onOpenChange = (open) => {
    if (!open) {
      const { dateRange } = this.state;
      const { gridStartDate, gridEndDate } = this.props;

      // not changed.
      if (dateRange[0].isSame(gridStartDate) && dateRange[1].isSame(gridEndDate)) {
        return;
      }

      // not allowed date range.
      const diffs = dateRange[1].diff(dateRange[0], DATE_UNIT.DAY);
      if (diffs < 0) {
        const { gridStartDate, gridEndDate } = this.props;
        this.setState({
          dateRange: [moment(gridStartDate), moment(gridEndDate)]
        });
        return;
      }
    }
  }

  onDatePickerChange = (dates) => {
    this.setState({dateRange: dates});
  }

  onChangeSelectedRangeDates = (dates) => {
    this.setState({dateRange: dates});
  }

  toggle = () => {
    if (this.props.isExporting) {
      return;
    }
    this.props.toggleDialog();
  }

  handleSubmit = () => {
    if (this.props.isExporting) {
      return;
    }
    const { dateRange } = this.state;
    const startDate = dateRange[0].format(DATE_FORMAT.YEAR_MONTH);
    const endDate = dateRange[1].format(DATE_FORMAT.YEAR_MONTH);
    this.props.onConfirmTimeRange(startDate, endDate);
  }

  render() {
    const { isExporting } = this.props;
    return (
      <Modal isOpen={true} toggle={this.toggle} autoFocus={false}>
        <ModalHeader toggle={this.toggle}>{intl.get('Select_the_month_range')}</ModalHeader>
        <ModalBody>
          {this.renderPicker()}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle} disabled={isExporting}>{intl.get('Cancel')}</Button>
          <Button color="primary" onClick={this.handleSubmit} disabled={isExporting} className={isExporting ? 'btn-loading' : ''}>{intl.get('Submit')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

SelectExportTimeRangeDialog.propTypes = propTypes;

export default SelectExportTimeRangeDialog;
