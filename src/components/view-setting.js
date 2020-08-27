import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import PluginSelect from './plugin-select';
import { SETTING_KEY } from '../constants';
import '../locale';

import '../css/view-setting.css';

const propTypes = {
  tables: PropTypes.array,
  views: PropTypes.array,
  columns: PropTypes.array,
  CellType: PropTypes.object,
  settings: PropTypes.object,
  onModifyViewSettings: PropTypes.func,
  toggleViewSettingPanel: PropTypes.func
};

class ViewSetting extends React.Component {

  onModifySettings = (selectedOption) => {
    let { settings } = this.props;
    let { setting_key, value } = selectedOption;
    let updated;
    if (setting_key === SETTING_KEY.TABLE_NAME) {
      updated = {[setting_key]: value};  // Need init settings after select new table.
    } else {
      updated = Object.assign({}, settings, {[setting_key]: value});
    }   
    this.props.onModifyViewSettings(updated);
  };  

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

  createOptions(columns) {
    return columns && columns.map((c) => (
      {
        value: c,
        label: <span className='select-option-name'>{c.name}</span>
      }
    ));
  }

  renderSelector = (source, settingKey, valueKey, labelKey) => {
    let { settings } = this.props;
    let options = source.map((item) => {
      let value = item[valueKey];
      let label = item[labelKey];
      return {value, label, setting_key: settingKey};
    });
    let selectedOption = options.find(item => item.value === settings[settingKey]);
    if (!selectedOption && (settingKey === SETTING_KEY.TABLE_NAME || settingKey === SETTING_KEY.VIEW_NAME)) {
      selectedOption = options[0];
    }
    return <PluginSelect
      value={selectedOption}
      options={options}
      onChange={this.onModifySettings}
    />
  }

  render() {
    const { tables, views } = this.props;
    const { dateColumns, colorColumns } = this.getSelectorColumns();
    const dateOptions = this.createOptions(dateColumns);
    const colorOptions = this.createOptions(colorColumns);

    return (
      <div className="plugin-view-setting position-absolute" style={{zIndex: 4}} ref={ref => this.ViewSetting = ref}>
        <div className="setting-container">
          <div className="setting-header-container d-flex">
            <div className="setting-header-wrapper">
              <div className="setting-header-title">{intl.get('Settings')}</div>
              <div className="dtable-font dtable-icon-x op-icon" onClick={this.props.toggleViewSettingPanel}></div>
            </div>
          </div>
          <div className="setting-body">
            <div className="setting-list">
              <div className="setting-item table-setting">
                <div className="title">{intl.get('Table')}</div>
                {this.renderSelector(tables, SETTING_KEY.TABLE_NAME, 'name', 'name')}
              </div>
              <div className="setting-item view-setting">
                <div className="title">{intl.get('View')}</div>
                {this.renderSelector(views, SETTING_KEY.VIEW_NAME, 'name', 'name')}
              </div>
              <div className="setting-item">
                <div className="title">{intl.get('Start_Date')}</div>
                {this.renderSelector(dateOptions, SETTING_KEY.COLUMN_START_DATE, 'name', 'name')}
              </div>
              <div className="setting-item">
                <div className="title">{intl.get('End_Date_Optional')}</div>
                {this.renderSelector(dateOptions, SETTING_KEY.COLUMN_END_DATE, 'name', 'name')}
              </div>
              <div className="setting-item">
                <div className="title">{intl.get('Color_From')}</div>
                {this.renderSelector(colorOptions, SETTING_KEY.COLUMN_COLOR, 'name', 'name')}
              </div>
              <p className="small text-muted">{intl.get('Calendar_Select_Description')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ViewSetting.propTypes = propTypes;

export default ViewSetting;
