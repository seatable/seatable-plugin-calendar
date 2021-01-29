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

  constructor(props) {
    super(props);
    this.state = {
      settings: props.settings || {},
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.settings !== this.props.settings) {
      this.setState({settings: nextProps.settings});
    }
  }

  onModifySettings = (selectedOption) => {
    let { settings } = this.state;
    let { setting_key, value } = selectedOption;
    let updated;
    if (setting_key === SETTING_KEY.TABLE_NAME) {
      updated = {[setting_key]: value};  // Need init settings after select new table.
    } else {
      updated = Object.assign({}, settings, {[setting_key]: value});
    }
    this.setState(({settings: updated}));
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.props.onModifyViewSettings(updated);
        clearTimeout(this.timer);
        this.timer = null;
      }, 0);
    }
  };

  getSelectorColumns = () => {
    const { columns, CellType } = this.props;
    let dateColumns = [],
      colorColumns = [],
      titleColumns = [];
    const titleColumnTypes = [
      CellType.TEXT, CellType.SINGLE_SELECT, CellType.FORMULA,
      CellType.COLLABORATOR, CellType.CREATOR, CellType.LAST_MODIFIER];
    columns && columns.forEach((c) => {
      const { type } = c;
      if (type === CellType.DATE) {
        dateColumns.push(c);
      } else if (type === CellType.FORMULA && c.data.result_type === 'date') {
        dateColumns.push(c);
      } else if (type === CellType.SINGLE_SELECT) {
        colorColumns.push(c);
      }
      if (titleColumnTypes.indexOf(type) !== -1) {
        titleColumns.push(c);
      }
    });
    return { dateColumns, colorColumns, titleColumns };
  }

  renderSelector = (source, settingKey, valueKey, labelKey) => {
    let { settings } = this.state;
    let options = source.map((item) => {
      let value = item[valueKey];
      let label = item[labelKey];
      return {value, label, setting_key: settingKey};
    });
    let selectedOption = options.find(item => item.value === settings[settingKey]);
    if (!selectedOption && (
      settingKey === SETTING_KEY.TABLE_NAME ||
      settingKey === SETTING_KEY.VIEW_NAME ||
      settingKey === SETTING_KEY.COLUMN_TITLE)) {
      selectedOption = options[0];
    }
    return <PluginSelect
      value={selectedOption}
      options={options}
      onChange={this.onModifySettings}
    />;
  }

  render() {
    const { tables, views } = this.props;
    const { dateColumns, colorColumns, titleColumns } = this.getSelectorColumns();

    return (
      <div className="plugin-view-setting position-absolute d-flex flex-column" style={{zIndex: 4}} ref={ref => this.ViewSetting = ref}>
        <div className="setting-header-container d-flex justify-content-between align-items-center">
          <h3 className="setting-header-title m-0">{intl.get('Settings')}</h3>
          <button className="close op-icon" onClick={this.props.toggleViewSettingPanel}>
            <i className="dtable-font dtable-icon-x"></i>
          </button>
        </div>
        <div className="setting-body o-auto">
          <div className="setting-list">
            <div className="setting-item table-setting">
              <div className="title">{intl.get('Table')}</div>
              {this.renderSelector(tables, SETTING_KEY.TABLE_NAME, 'name', 'name')}
            </div>
            <div className="setting-item view-setting">
              <div className="title">{intl.get('View')}</div>
              {this.renderSelector(views, SETTING_KEY.VIEW_NAME, 'name', 'name')}
            </div>
            <div className="setting-item view-setting">
              <div className="title">{intl.get('Title')}</div>
              {this.renderSelector(titleColumns, SETTING_KEY.COLUMN_TITLE, 'name', 'name')}
            </div>
            <div className="setting-item">
              <div className="title">{intl.get('Start_Date')}</div>
              {this.renderSelector(dateColumns, SETTING_KEY.COLUMN_START_DATE, 'name', 'name')}
            </div>
            <div className="setting-item">
              <div className="title">{intl.get('End_Date_Optional')}</div>
              {this.renderSelector(dateColumns, SETTING_KEY.COLUMN_END_DATE, 'name', 'name')}
            </div>
            <div className="setting-item">
              <div className="title">{intl.get('Color_From')}</div>
              {this.renderSelector(colorColumns, SETTING_KEY.COLUMN_COLOR, 'name', 'name')}
            </div>
            <p className="small text-muted">{intl.get('Calendar_Select_Description')}</p>
          </div>
        </div>
      </div>
    );
  }
}

ViewSetting.propTypes = propTypes;

export default ViewSetting;
