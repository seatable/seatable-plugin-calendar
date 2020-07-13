import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import PluginSelect from '../plugin-select';

const propTypes = {
  onToggleSelectColumn: PropTypes.func,
  modifySelectedColumn: PropTypes.func,
  columns: PropTypes.array,
  startDateColumn: PropTypes.object,
  endDateColumn: PropTypes.object,
  labelColumn: PropTypes.object,
  CellType: PropTypes.object,
};

const modalClassName = 'calendatr-plugin-select-column-dialog';

class CalendarSelectColumnDialog extends React.Component {

  constructor(props) {
    super(props);
    this.selectorColumns = this.getSelectorColumns();
    this.dateOptions = this.createDateOptions(this.selectorColumns.dateColumns);
    this.colorOptions = this.createColorOptions(this.selectorColumns.colorColumns);
    this.state = {
      selectedStartDate: props.startDateColumn ? this.dateOptions.find(o => o.value.key === props.startDateColumn.key) : this.dateOptions[0],
      selectedEndDate: props.endDateColumn ? this.dateOptions.find(o => o.value.key === props.endDateColumn.key) : null,
      selectedColor: props.labelColumn ? this.colorOptions.find(o => o.value.key === props.labelColumn.key) : null,
    };
  }

  toggle = () => {
    this.props.onToggleSelectColumn();
  }

  getSelectorColumns = () => {
    const { columns, CellType } = this.props;
    let dateColumns = [], colorColumns = [];
    columns && columns.forEach((c) => {
      const { type } = c;
      if (type === CellType.DATE) {
        dateColumns.push(c);
      } else if (type === CellType.SINGLE_SELECT) {
        colorColumns.push(c);
      }
    });
    return { dateColumns, colorColumns };
  }

  onSelectDateColumn = (value) => {
    this.setState({selectedStartDate: value});
  }

  onSelectEndDateColumn = (value) => {
    this.setState({selectedEndDate: value});
  }

  onSelectColorColumn = (value) => {
    this.setState({selectedColor: value});
  }

  createDateOptions(dateColumns) {
    return dateColumns && dateColumns.map((c) => (
      {
        value: c,
        label: <span className='select-option-name'>{c.name}</span>
      }
    ));
  }

  createColorOptions(colorColumns) {
    return colorColumns && colorColumns.map((c) => (
      {
        value: c,
        label: <span className='select-option-name'>{c.name}</span>
      }
    ));
  }

  renderDateSelector = () => {
    return (
      <PluginSelect
        value={this.state.selectedStartDate}
        onChange={this.onSelectDateColumn}
        placeholder={intl.get('Select_date_column')}
        options={this.dateOptions}
        menuPortalTarget={modalClassName}
      />
    );
  }

  renderEndDateSelector = () => {
    return (
      <PluginSelect
        value={this.state.selectedEndDate}
        onChange={this.onSelectEndDateColumn}
        placeholder={intl.get('Select_an_end_date_column')}
        options={this.dateOptions}
        menuPortalTarget={modalClassName}
      />
    );
  }

  renderColorSelector = () => {
    return (
      <PluginSelect
        value={this.state.selectedColor}
        onChange={this.onSelectColorColumn}
        placeholder={intl.get('Select_color_column')}
        options={this.colorOptions}
        menuPortalTarget={modalClassName}
      />
    );
  }

  onSubmit = () => {
    let { selectedStartDate, selectedEndDate, selectedColor } = this.state;
    selectedStartDate = selectedStartDate || {};
    selectedEndDate = selectedEndDate || {};
    selectedColor = selectedColor || {};
    this.props.modifySelectedColumn(selectedStartDate.value, selectedEndDate.value, selectedColor.value);
  }

  render() {
    return (
      <Modal isOpen={true} toggle={this.toggle} modalClassName={modalClassName}>
        <ModalHeader toggle={this.toggle}>
          {intl.get('Select_Column')}
        </ModalHeader>
        <ModalBody style={{ padding: 0 }}>
          <div className="calendar-selection-title">{intl.get('Start_Date')}</div>
          <div className="calendar-select-options-container">
            {this.renderDateSelector()}
          </div>
          <div className="calendar-selection-title">{intl.get('End_Date_Optional')}</div>
          <div className="calendar-select-options-container">
            {this.renderEndDateSelector()}
          </div>
          <div className="calendar-selection-title">{intl.get('Color_From')}</div>
          <div className="calendar-select-options-container">
            {this.renderColorSelector()}
          </div>
          <div className="calendar-column-select-description">
            {intl.get('Calendar_Select_Description')}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.props.onToggleSelectColumn}>{intl.get('Cancel')}</Button>
          <Button color="primary" onClick={this.onSubmit}>{intl.get('Submit')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

CalendarSelectColumnDialog.propTypes = propTypes;

export default CalendarSelectColumnDialog;