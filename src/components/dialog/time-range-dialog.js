import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import 'moment/min/locales.min';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Alert } from 'reactstrap';
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
      dateRange: [now, now],
      outOfRange: false
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
        showOk={true}
      />
    );
  }

  onOpenChange = (open) => {
    if (!open) {
      const { dateRange } = this.state;
      const diffs = dateRange[1].diff(dateRange[0], DATE_UNIT.MONTH);
      if (diffs < 0) {
        return;
      }
      if (diffs > 11) {
        this.setState({
          outOfRange: true
        });
        return;
      }
    }
  }

  onDatePickerChange = (dates) => {
    this.setState({
      dateRange: dates,
      outOfRange: false
    });
  }

  onChangeSelectedRangeDates = (dates) => {
    this.setState({
      dateRange: dates,
      outOfRange: false
    });
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
    const { outOfRange } = this.state;
    return (
      <Modal isOpen={true} toggle={this.toggle} autoFocus={false}>
        <ModalHeader toggle={this.toggle}>{intl.get('Choose_the_time_range')}</ModalHeader>
        <ModalBody>
          {this.renderPicker()}
          {outOfRange && <Alert color="danger" className="mt-2">{intl.get('Out_of_range')}</Alert>}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle} disabled={isExporting}>{intl.get('Cancel')}</Button>
          <Button color="primary" onClick={this.handleSubmit} disabled={outOfRange || isExporting} className={isExporting ? 'btn-loading' : ''}>{intl.get('Submit')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

SelectExportTimeRangeDialog.propTypes = propTypes;

export default SelectExportTimeRangeDialog;
