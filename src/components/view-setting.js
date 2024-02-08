import React, { Fragment }  from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { CellType, COLUMNS_ICON_CONFIG } from 'dtable-utils';
import { FieldDisplaySetting, DTableSelect } from 'dtable-ui-component';
import { CALENDAR_VIEWS, SETTING_KEY, SETTING_VALUE, TITLE_COLUMN_TYPES } from '../constants';
import '../locale';

import '../css/view-setting.css';

const propTypes = {
  tables: PropTypes.array,
  views: PropTypes.array,
  columns: PropTypes.array,
  settings: PropTypes.object,
  selectedGridView: PropTypes.string,
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
      updated = { [setting_key]: value };  // Need init settings after select new table.
    } else {
      updated = Object.assign({}, settings, { [setting_key]: value });
    }
    this.setState(({ settings: updated }));
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.props.onModifyViewSettings(updated);
        clearTimeout(this.timer);
        this.timer = null;
      }, 0);
    }
  };

  getSelectorColumns = () => {
    const { columns } = this.props;
    let dateColumns = [],
      endDateColumns = [],
      colorColumns = [],
      titleColumns = [];
    columns && columns.forEach((c) => {
      const { type, name } = c;
      const columnOption = {
        name,
        value: name,
        iconClass: COLUMNS_ICON_CONFIG[type],
      };
      if (
        type === CellType.DATE ||
        type === CellType.CTIME ||
        type === CellType.MTIME ||
        (type === CellType.FORMULA && c.data.result_type === 'date')) {
        dateColumns.push(columnOption);
        endDateColumns.push(columnOption);
      } else if (type === CellType.DURATION) {
        endDateColumns.push(columnOption);
      } else if (type === CellType.SINGLE_SELECT) {
        colorColumns.push(columnOption);
      }
      if (TITLE_COLUMN_TYPES.includes(type)) {
        titleColumns.push(columnOption);
      }
    });
    return { dateColumns, endDateColumns, colorColumns, titleColumns };
  };

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

    let weekStartOptions = [{ name: intl.get('Sunday'), value: 0 }, { name: intl.get('Monday'), value: 1 }];
    weekStartOptions = this.createOptions(weekStartOptions, SETTING_KEY.WEEK_START, 'value');
    let startYearFirstWeekOptions = [
      { name: intl.get('First_day_of_the_year'), value: SETTING_VALUE.YEAR_FIRST_DAY },
      { name: intl.get('First_full_week_of_the_year'), value: SETTING_VALUE.YEAR_FIRST_FULL_WEEK },
    ];
    startYearFirstWeekOptions = this.createOptions(startYearFirstWeekOptions, SETTING_KEY.START_YEAR_FIRST_WEEK, 'value');
    return {
      tableOptions, viewOptions,
      titleColumnOptions, dateColumnOptions, endDateColumnOptions,
      colorFieldOptions, weekStartOptions, startYearFirstWeekOptions,
    };
  };

  renderSelector = (options, settingKey) => {
    let { settings } = this.state;
    let selectedOption = options.find(item => item.value === settings[settingKey]);
    if (!selectedOption && (
      settingKey === SETTING_KEY.TABLE_NAME ||
      settingKey === SETTING_KEY.VIEW_NAME ||
      settingKey === SETTING_KEY.WEEK_START ||
      settingKey === SETTING_KEY.COLUMN_TITLE ||
      settingKey === SETTING_KEY.START_YEAR_FIRST_WEEK
    )) {
      selectedOption = options[0] || undefined;
    }
    return (
      <DTableSelect
        classNamePrefix={'calendar-view-setting-selector'}
        value={selectedOption}
        options={options}
        onChange={this.onModifySettings}
      />
    );
  };

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
      <DTableSelect
        classNamePrefix={'calendar-view-setting-selector'}
        value={selectedOption}
        options={options}
        onChange={this.onSelectColoredBy}
      />
    );
  };

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
  };

  updateColumn = (targetColumnKey, targetShown) => {
    const { settings } = this.props;
    settings.columns = this.configuredColumns.map(item => {
      if (item.key == targetColumnKey) {
        item.shown = targetShown;
      }
      return item;
    });
    this.props.onModifyViewSettings(settings);
  };

  moveColumn = (targetColumnKey, targetIndexColumnKey) => {
    const { settings } = this.props;
    const configuredColumns = this.configuredColumns;
    const targetColumn = configuredColumns.filter(column => column.key == targetColumnKey)[0];
    const originalIndex = configuredColumns.indexOf(targetColumn);
    const targetIndexColumn = configuredColumns.filter(column => column.key == targetIndexColumnKey)[0];
    const targetIndex = configuredColumns.indexOf(targetIndexColumn);
    configuredColumns.splice(originalIndex, 1);
    configuredColumns.splice(targetIndex, 0, targetColumn);
    settings.columns = configuredColumns;
    this.props.onModifyViewSettings(settings);
  };

  onToggleColumnsVisibility = (columns, fieldAllShown) => {
    const { settings } = this.props;
    const updatedColumns = columns.map(column => ({
      ...column,
      shown: !fieldAllShown,
    }));
    settings.columns = updatedColumns;
    this.props.onModifyViewSettings(settings);
  };

  getCurrentConfiguredColumns = () => {
    const { columns, settings } = this.props;

    let titleColumnName = settings[SETTING_KEY.COLUMN_TITLE];
    const startDateColumnName = settings[SETTING_KEY.COLUMN_START_DATE];
    const endDateColumnName = settings[SETTING_KEY.COLUMN_END_DATE];
    const { titleColumns } = this.getSelectorColumns();

    if (titleColumnName == undefined && titleColumns.length) {
      titleColumnName = titleColumns[0].name;
    }

    const initialConfiguredColumns = columns.filter((item) => {
      return item.name != titleColumnName &&
        item.name != startDateColumnName &&
        item.name != endDateColumnName;
    })
      .map((item, index) => {
        return {
          key: item.key,
          shown: false
        };
      });

    let configuredColumns = initialConfiguredColumns;
    if (settings.columns) {
      const baseConfiguredColumns = settings.columns.filter(item => {
        return initialConfiguredColumns.some(c => item.key == c.key);
      });
      const addedColumns = initialConfiguredColumns
        .filter(item => !baseConfiguredColumns.some(c => item.key == c.key))
        .map(item => ({ key: item.key, shown: false }));
      configuredColumns = baseConfiguredColumns.concat(addedColumns);
    }

    return configuredColumns;
  };

  render() {
    const {
      tableOptions, viewOptions,
      titleColumnOptions, dateColumnOptions, endDateColumnOptions,
      colorFieldOptions, weekStartOptions, startYearFirstWeekOptions
    } = this.getSelectorOptions(this.getSelectorColumns());

    const { columns, selectedGridView } = this.props;
    this.configuredColumns = this.getCurrentConfiguredColumns();
    const configuredColumns = this.configuredColumns.map((item, index) => {
      const targetItem = columns.filter(c => c.key == item.key)[0];
      return Object.assign({}, targetItem, item);
    });
    const fieldAllShown = configuredColumns.every(column => column.shown);
    const textProperties = {
      titleValue: intl.get('Other_fields_shown_in_agenda'),
      bannerValue: intl.get('Fields'),
      hideValue: intl.get('Hide_all'),
      showValue: intl.get('Show_all'),
    };

    return (
      <div className="plugin-view-setting position-absolute d-flex flex-column mt-7" style={{ zIndex: 4 }} ref={ref => this.ViewSetting = ref}>
        <div className="setting-header-container d-flex justify-content-between align-items-center">
          <h3 className="h5 m-0">{intl.get('Settings')}</h3>
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
            <div className="split-line"></div>
            <div className="setting-item view-setting">
              <div className="title">{intl.get('Title')}</div>
              {this.renderSelector(titleColumnOptions, SETTING_KEY.COLUMN_TITLE)}
            </div>
            <div className="split-line"></div>
            <div className="setting-item">
              <div className="title">{intl.get('Start_Date')}</div>
              {this.renderSelector(dateColumnOptions, SETTING_KEY.COLUMN_START_DATE)}
            </div>
            <div className="setting-item">
              <div className="title">{intl.get('End_Date_Optional')}</div>
              {this.renderSelector(endDateColumnOptions, SETTING_KEY.COLUMN_END_DATE)}
            </div>
            <div className="split-line"></div>
            <div className="setting-item">
              <div className="title">{intl.get('Color_From')}</div>
              {this.renderColorSelector(colorFieldOptions)}
            </div>
            <div className="split-line"></div>
            <div className="setting-item">
              <div className="title">{intl.get('Week_start')}</div>
              {this.renderSelector(weekStartOptions, SETTING_KEY.WEEK_START)}
            </div>
            {selectedGridView === CALENDAR_VIEWS.WEEK &&
              <div className="setting-item">
                <div className="title">{intl.get('Start_the_first_week_of_the_year_on')}</div>
                {this.renderSelector(startYearFirstWeekOptions, SETTING_KEY.START_YEAR_FIRST_WEEK)}
              </div>
            }
            <div className="split-line"></div>
            <div className="setting-item">
              <FieldDisplaySetting
                fields={configuredColumns}
                textProperties={textProperties}
                fieldAllShown={fieldAllShown}
                onClickField={this.updateColumn}
                onMoveField={this.moveColumn}
                onToggleFieldsVisibility={() => this.onToggleColumnsVisibility(configuredColumns, fieldAllShown)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ViewSetting.propTypes = propTypes;

export default ViewSetting;
