import React, { Fragment }  from 'react';
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
  columnIconConfig: PropTypes.object,
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

  createOptions(source, settingKey, valueKey) {
    if (!Array.isArray(source)) {
      return [];
    }
    return source.map((item) => ({
      value: item[valueKey],
      setting_key: settingKey,
      label: (
        <Fragment>
          {item.iconClass && <span className="header-icon"><i className={item.iconClass}></i></span>}
          <span className='select-module select-module-name'>{item.name}</span>
        </Fragment>
      ),
    }));
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
    const { columns, CellType, columnIconConfig } = this.props;
    let dateColumns = [],
      endDateColumns = [],
      colorColumns = [],
      titleColumns = [];
    const titleColumnTypes = [
      CellType.TEXT, CellType.SINGLE_SELECT, CellType.FORMULA,
      CellType.COLLABORATOR, CellType.CREATOR, CellType.LAST_MODIFIER];
    columns && columns.forEach((c) => {
      const { type, name } = c;
      const columnOption = {
        name,
        value: name,
        iconClass: columnIconConfig[type],
      };
      if (type === CellType.DATE || (type === CellType.FORMULA && c.data.result_type === 'date')) {
        dateColumns.push(columnOption);
        endDateColumns.push(columnOption);
      } else if (type === CellType.DURATION) {
        endDateColumns.push(columnOption);
      } else if (type === CellType.SINGLE_SELECT) {
        colorColumns.push(columnOption);
      }
      if (titleColumnTypes.includes(type)) {
        titleColumns.push(columnOption);
      }
    });
    return { dateColumns, endDateColumns, colorColumns, titleColumns };
  }

  getSelectorOptions = ({ dateColumns, endDateColumns, colorColumns, titleColumns }) => {
    const { tables, views } = this.props;
    const tableOptions = this.createOptions(tables, SETTING_KEY.TABLE_NAME, 'name');
    const viewOptions = this.createOptions(views, SETTING_KEY.VIEW_NAME, 'name');
    const titleColumnOptions = this.createOptions(titleColumns, SETTING_KEY.COLUMN_TITLE, 'value');
    const dateColumnOptions = this.createOptions(dateColumns, SETTING_KEY.COLUMN_START_DATE, 'value');
    const endDateColumnOptions = this.createOptions(endDateColumns, SETTING_KEY.COLUMN_END_DATE, 'value');
    if (endDateColumnOptions.length) {
      endDateColumnOptions.unshift(
        {
          value: '',
          setting_key: SETTING_KEY.COLUMN_END_DATE,
          label: <span className={'select-module select-module-name null-option-name'}>{intl.get('Not_used')}</span>,
        }
      );
    }

    const colorFieldOptions = this.createOptions(colorColumns, SETTING_KEY.COLUMN_COLOR, 'value');
    colorFieldOptions.unshift(
      {
        value: '',
        setting_key: SETTING_KEY.COLUMN_COLOR,
        label: <span className={'select-module select-module-name null-option-name'}>{intl.get('Not_used')}</span>
      },
      {
        value: 'row_color',
        setting_key: SETTING_KEY.COLORED_BY_ROW_COLOR,
        label: <span className={'select-module select-module-name'}>{intl.get('Row_color')}</span>
      }
    );

    let weekStartOptions = [{name: intl.get('Sunday'), value: 0}, {name: intl.get('Monday'), value: 1}];
    weekStartOptions = this.createOptions(weekStartOptions, SETTING_KEY.WEEK_START, 'value');

    return {
      tableOptions, viewOptions,
      titleColumnOptions, dateColumnOptions, endDateColumnOptions,
      colorFieldOptions, weekStartOptions
    };
  }

  renderSelector = (options, settingKey) => {
    let { settings } = this.state;
    let selectedOption = options.find(item => item.value === settings[settingKey]);
    if (!selectedOption && (
      settingKey === SETTING_KEY.TABLE_NAME ||
      settingKey === SETTING_KEY.VIEW_NAME ||
      settingKey === SETTING_KEY.WEEK_START ||
      settingKey === SETTING_KEY.COLUMN_TITLE)) {
      selectedOption = options[0] || undefined;
    }
    return <PluginSelect
      classNamePrefix={'calendar-view-setting-selector'}
      value={selectedOption}
      options={options}
      onChange={this.onModifySettings}
    />;
  }

  renderColorSelector = (options) => {
    const { settings } = this.props;
    let selectedOption;
    if (settings[SETTING_KEY.COLORED_BY_ROW_COLOR]) {
      selectedOption = options.find((option) => option.setting_key === SETTING_KEY.COLORED_BY_ROW_COLOR);
    } else {
      selectedOption = options.find((option) => option.value === settings[SETTING_KEY.COLUMN_COLOR]);
    }
    if (!selectedOption) {
      selectedOption = options[0];
    }
    return (
      <PluginSelect
        classNamePrefix={'calendar-view-setting-selector'}
        value={selectedOption}
        options={options}
        onChange={this.onSelectColoredBy}
      />
    );
  }

  onSelectColoredBy = (selectedOption) => {
    const { setting_key, value } = selectedOption;
    let update = {};
    if (setting_key === SETTING_KEY.COLORED_BY_ROW_COLOR) {
      update[SETTING_KEY.COLORED_BY_ROW_COLOR] = true;
      update[SETTING_KEY.COLUMN_COLOR] = null;
    } else {
      update[SETTING_KEY.COLORED_BY_ROW_COLOR] = false;
      update[SETTING_KEY.COLUMN_COLOR] = value;
    }
    const newSettings = Object.assign({}, this.props.settings, update);
    this.props.onModifyViewSettings(newSettings);
  }

  render() {
    const {
      tableOptions, viewOptions,
      titleColumnOptions, dateColumnOptions, endDateColumnOptions, 
      colorFieldOptions, weekStartOptions
    } = this.getSelectorOptions(this.getSelectorColumns());

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
              {this.renderSelector(tableOptions, SETTING_KEY.TABLE_NAME)}
            </div>
            <div className="setting-item view-setting">
              <div className="title">{intl.get('View')}</div>
              {this.renderSelector(viewOptions, SETTING_KEY.VIEW_NAME)}
            </div>
            <div className="setting-item view-setting">
              <div className="title">{intl.get('Title')}</div>
              {this.renderSelector(titleColumnOptions, SETTING_KEY.COLUMN_TITLE)}
            </div>
            <div className="setting-item">
              <div className="title">{intl.get('Start_Date')}</div>
              {this.renderSelector(dateColumnOptions, SETTING_KEY.COLUMN_START_DATE)}
            </div>
            <div className="setting-item">
              <div className="title">{intl.get('End_Date_Optional')}</div>
              {this.renderSelector(endDateColumnOptions, SETTING_KEY.COLUMN_END_DATE)}
            </div>
            <div className="setting-item">
              <div className="title">{intl.get('Color_From')}</div>
              {this.renderColorSelector(colorFieldOptions)}
            </div>
            <div className="setting-item">
              <div className="title">{intl.get('Week_start')}</div>
              {this.renderSelector(weekStartOptions, SETTING_KEY.WEEK_START)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ViewSetting.propTypes = propTypes;

export default ViewSetting;
