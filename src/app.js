import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { Button } from 'reactstrap';
import {
  CellType, SELECT_OPTION_COLORS, getTableByName, getViewByName,
  getNonArchiveViews, getNonPrivateViews, getViewShownColumns, COLUMNS_ICON_CONFIG
} from 'dtable-utils';
import { toaster } from 'dtable-ui-component';
import ReactBigCalendar from './ReactBigCalendar';
import { PLUGIN_NAME, SETTING_KEY, DATE_FORMAT, CALENDAR_VIEWS, KEY_SELECTED_CALENDAR_VIEW, TITLE_COLUMN_TYPES, SETTING_VALUE } from './constants';
import ViewsTabs from './components/views-tabs';
import ViewSetting from './components/view-setting';
import TimeRangeDialog from './components/dialog/time-range-dialog';
import { generatorViewId, getDtableUuid, isIOS, isMobile, isSafari } from './utils/common';
import { handleEnterKeyDown } from './utils/accessibility';
import Icon from './components/icon';
import View from './model/view';
import icon from './image/icon.png';
import './locale';

import './css/plugin-layout.css';

/**
 * the data structure of settings
 * {
 *  [table_id]: {
 *    start_date_column_key,
 *    end_date_column_key,
 *    label_column_key
 *  }
 * }
 */

const DEFAULT_PLUGIN_SETTINGS = {
  views: [
    {
      _id: '0000',
      name: `${intl.get('Default_View')}`,
      settings: {}
    }
  ]
};

const KEY_SELECTED_VIEW_IDS = `${PLUGIN_NAME}-selectedViewIds`;

const propTypes = {
  isDevelopment: PropTypes.bool,
  showDialog: PropTypes.bool,
};

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      showDialog: props.showDialog || false,
      plugin_settings: {},
      selectedViewIdx: 0,
      isViewSettingPanelOpen: false,
      rows: [],
      rowsColor: {},
      isTimeRangeDialogOpen: false,
      exportedMonths: [],
    };
    this.isMobile = isMobile;
    this.isIosMobile = isMobile && isIOS;
    this.isSafari = isSafari;
    this.initCalendarViews();
  }

  componentDidMount() {
    this.initPluginDTableData();
  }

  componentDidUpdate(prevProps, prevState) {
    const { isViewSettingPanelOpen } = this.state;
    const { isViewSettingPanelOpen: prevSetting } = prevState;

    const closeBtn = document.querySelector('#calendar-setting-close-btn');
    const toggleBtn = document.querySelector('#calendar-setting-toggle-btn');

    if (isViewSettingPanelOpen && !prevSetting) {
      closeBtn && closeBtn.focus();
    }

    if (!isViewSettingPanelOpen && prevSetting) {
      toggleBtn && toggleBtn.focus();
    }

  }

  componentWillUnmount() {
    this.unsubscribeLocalDtableChanged();
    this.unsubscribeRemoteDtableChanged();
  }

  async initPluginDTableData() {
    if (this.props.isDevelopment) {
      // local develop
      window.dtableSDK.subscribe('dtable-connect', () => {
        this.onDTableConnect();
      });
    }
    this.unsubscribeLocalDtableChanged = window.dtableSDK.subscribe('local-dtable-changed', () => {
      this.onDTableChanged();
    });
    this.unsubscribeRemoteDtableChanged = window.dtableSDK.subscribe('remote-dtable-changed', () => {
      this.onDTableChanged();
    });
    this.resetData(true);
  }

  onDTableConnect = () => {
    this.resetData();
  };

  onDTableChanged = () => {
    this.resetData();
  };

  resetData = (init = false) => {
    let { isViewSettingPanelOpen } = this.state;
    let plugin_settings = window.dtableSDK.getPluginSettings(PLUGIN_NAME) || {};
    if (!plugin_settings || Object.keys(plugin_settings).length === 0 || !plugin_settings.views) {
      plugin_settings = DEFAULT_PLUGIN_SETTINGS;
    }
    let { views } = plugin_settings;
    let dtableUuid = getDtableUuid();
    let selectedViewIds = this.getSelectedViewIds(KEY_SELECTED_VIEW_IDS) || {};
    let selectedViewId = selectedViewIds[dtableUuid];
    let selectedViewIdx = Array.isArray(views) && views.findIndex(v => v._id === selectedViewId);
    selectedViewIdx = selectedViewIdx > 0 ? selectedViewIdx : 0;
    if (init) {
      isViewSettingPanelOpen = !this.isValidViewSettings(views[selectedViewIdx].settings);
    }

    let rowColorsMap = {};
    SELECT_OPTION_COLORS.forEach((optionColor) => {
      rowColorsMap[optionColor.COLOR] = optionColor.TEXT_COLOR;
    });
    this.rowColorsMap = rowColorsMap;

    const selectedPluginView = views[selectedViewIdx];
    const rows = selectedPluginView ? this.getPluginViewRows(selectedPluginView.settings) : [];
    const rowsColor = this.getRowsColor(selectedPluginView.settings);
    this.setState({
      isLoading: false,
      plugin_settings,
      selectedViewIdx,
      isViewSettingPanelOpen,
      rows,
      rowsColor
    });
  };

  initCalendarViews = () => {
    if (this.isMobile) {
      this.calendarViews = [
        CALENDAR_VIEWS.YEAR, CALENDAR_VIEWS.MONTH, CALENDAR_VIEWS.AGENDA,
      ];
    } else {
      this.calendarViews = [
        CALENDAR_VIEWS.YEAR, CALENDAR_VIEWS.MONTH, CALENDAR_VIEWS.WEEK,
        CALENDAR_VIEWS.DAY, CALENDAR_VIEWS.AGENDA,
      ];
    }
  };

  getPluginViewRows = (settings) => {
    const selectedTable = this.getSelectedTable(settings);
    const selectedTableView = this.getSelectedView(selectedTable, settings);
    return this.getRows(selectedTable, selectedTableView);
  };

  getSelectedViewIds = (key) => {
    const selectedViewIds = window.localStorage.getItem(key);
    return selectedViewIds ? JSON.parse(selectedViewIds) : {};
  };

  onPluginToggle = () => {
    this.setState({ showDialog: false });
    window.app.onClosePlugin && window.app.onClosePlugin();
  };

  getRows = (table, view) => {
    const { name: tableName } = table;
    const { name: viewName } = view;
    let rows = [];
    window.dtableSDK.forEachRow(tableName, viewName, (row) => {
      rows.push(row);
    }, { convertLinkID: true });
    return rows;
  };

  updateSettings = (table, start_date_column_key, label_column_key, end_date_column_key) => {
    const { _id } = table;
    let { plugin_settings } = this.state;
    plugin_settings[_id] = { start_date_column_key, end_date_column_key, label_column_key };
    this.setState({ plugin_settings }, () => {
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  };

  handleRowExpand = (rowId, table) => {
    if (window.app.expandRow) {
      const row = table.rows.find(row => row._id === rowId);
      window.app.expandRow(row, table);
    }
  };

  onInsertRow = (rowData, activeTable, activeView, rowId) => {
    const { columns } = activeTable;
    const firstColumn = columns.find(column => column.key === '0000');
    const name = firstColumn.name;
    if (!rowData[name]) {
      rowData[name] = intl.get('New_record');
    }
    const initData = window.dtableSDK.getInsertedRowInitData(activeView, activeTable, rowId);
    const newRowData = Object.assign({}, initData, rowData);
    window.dtableSDK.appendRow(activeTable, newRowData, activeView);
    const viewRows = window.dtableSDK.getViewRows(activeView, activeTable);
    const insertedRow = viewRows[viewRows.length - 1];
    if (insertedRow && window.app.expandRow) {
      window.app.expandRow(insertedRow, activeTable);
    }
  };

  toggleViewSettingPanel = () => {
    this.setState({ isViewSettingPanelOpen: !this.state.isViewSettingPanelOpen });
  };

  hideViewSettingPanel = () => {
    if (this.state.isViewSettingPanelOpen) {
      this.setState({ isViewSettingPanelOpen: false });
    }
  };

  toggleTimeRangeDialog = () => {
    this.setState({ isTimeRangeDialogOpen: !this.state.isTimeRangeDialogOpen });
  };

  exportSelectedMonths = (start, end) => {
    let exportedMonths = [];
    const startMonth = dayjs(start, DATE_FORMAT.YEAR_MONTH);
    const endMonth = dayjs(end, DATE_FORMAT.YEAR_MONTH);
    const diffMonthAmount = endMonth.diff(startMonth, 'months');
    for (let i = 0; i < diffMonthAmount + 1; i++) {
      // `push` the 1st day of each month, in the native Date object
      exportedMonths.push(dayjs(startMonth).add(i, 'months').date(1).toDate());
    }

    this.setState({
      isExporting: true,
      exportedMonths: exportedMonths
    }, () => {
      const prtContent = document.getElementById('exported-months');
      if (!prtContent?.innerHTML) {
        toaster.danger(intl.get('Exporting_failed'));
        this.setState({
          isExporting: false,
          exportedMonths: [],
        });
        return;
      }
      const iframeID = 'iframe-for-print';
      const printIframe = document.getElementById(iframeID) || document.body.appendChild(document.createElement('iframe'));
      const printWindow = printIframe.contentWindow;
      const removeIframe = function () {
        printWindow.document.open();
        printWindow.document.close();
      };
      printIframe.id = iframeID;
      printIframe.className = 'invisible w-0 h-0 border-0 position-fixed fixed-bottom';
      printWindow.document.open();
      printWindow.document.write('<!DOCTYPE html><html><head>' + document.head.innerHTML + '</head><body>' + prtContent.innerHTML + '</body></html>');
      printWindow.document.title = `${intl.get('Calendar')}–${start}${start === end ? '' : '–' + end}.pdf`;
      printWindow.document.close();
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
      };
      printWindow.onafterprint = removeIframe;
      setTimeout(() => {
        this.setState({
          isExporting: false,
          exportedMonths: []
        });
        this.toggleTimeRangeDialog();
      });
    });
  };

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

  getSelectorColumns = (columns) => {
    let dateColumns = [];
    let endDateColumns = [];
    let colorColumns = [];
    let titleColumns = [];
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
    const { plugin_settings } = this.state;
    const { views } = plugin_settings;
    const tables = window.dtableSDK.getTables();
    const tableOptions = this.createOptions(tables, SETTING_KEY.TABLE_NAME, 'name');
    const viewOptions = this.createOptions(views, SETTING_KEY.VIEW_NAME, 'name');
    const titleColumnOptions = this.createOptions(titleColumns, SETTING_KEY.COLUMN_TITLE, 'value');
    const dateColumnOptions = this.createOptions(dateColumns, SETTING_KEY.COLUMN_START_DATE, 'value');
    const endDateColumnOptions = this.createOptions(endDateColumns, SETTING_KEY.COLUMN_END_DATE, 'value');
    const colorFieldOptions = this.createOptions(colorColumns, SETTING_KEY.COLUMN_COLOR, 'value');
    colorFieldOptions.unshift(
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

  getOptionalViewName = (view_Name, selectTableViews) => {
    let columnName;
    let max_number = 0;
    const regexp = /^[0-9]\d*$/;

    let repeatNameColumns = selectTableViews.filter(opt => {
      let name = opt.name;
      if (name === view_Name) return opt;
      let spaceIndex = name.lastIndexOf(' ');
      let firstPartName = name.slice(0, spaceIndex);
      let secondPartName = name.slice(spaceIndex + 1);
      let isPositiveInteger = regexp.test(secondPartName);
      if (firstPartName === view_Name && isPositiveInteger) {
        let current_number = parseInt(secondPartName);
        if (current_number > max_number) {
          max_number = current_number;
        }
      }
      return firstPartName && firstPartName === view_Name && isPositiveInteger;
    });

    if (repeatNameColumns.length === 0) {
      columnName = view_Name;
    } else {
      columnName = `${view_Name} ${max_number + 1}`;
    }

    return columnName;
  };

  migratePluginView = async () => {
    const { plugin_settings } = this.state;
    const { views } = plugin_settings;
    if (!views || views.length == 0) return;

    toaster.notify(intl.get('Starting_migration'));
    try {
      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        const { settings } = view;

        const selectedTable = this.getSelectedTable(settings);
        const { columns } = this.getProcessedTableView(selectedTable, settings);
        const { tableOptions, titleColumnOptions } = this.getSelectorOptions(this.getSelectorColumns(columns));
        const defaultTableName = tableOptions.length > 0 ? tableOptions[0].value : '';
        const defaultColumnTitle = titleColumnOptions.length > 0 ? titleColumnOptions[0].value : '';
        const { table_name = defaultTableName, column_title = defaultColumnTitle, column_start_date = '', column_end_date = '', week_start = 0, start_year_first_week = 'year_first_day', column_color = '', columns: agenda_columns = [], colored_by_row_color } = settings;

        const title_column = columns.filter(col => col.name === column_title);
        const title_column_key = title_column[0]?.key || '';
        const start_date_column = columns.filter(col => col.name === column_start_date);
        const start_date_column_key = start_date_column[0]?.key || '';
        const end_date_column = columns.filter(col => col.name === column_end_date);
        const end_date_column_key = end_date_column[0]?.key || '';

        const selectTableViews = window.dtableSDK.getViews(selectedTable);
        const view_Name = this.getOptionalViewName(view.name, selectTableViews);
        const view_Data = {
          type: 'calendar',
          name: view_Name,
          custom_settings: {
            title_column_key,
            start_date_column_key,
            end_date_column_key,
            week_start,
            start_year_first_week,
            agenda_columns,
          },
        };

        let column_color_by_key = '';
        if (!colored_by_row_color){
          const column_color_by = columns.filter(col => col.name === column_color);
          column_color_by_key = column_color_by[0]?.key || '';
          const colorbys = {
            type: 'by_column',
            color_by_column: column_color_by_key
          };
          if (colorbys){
            view_Data.colorbys = colorbys;
          }
        }

        await new Promise((resolve, reject) => {
          try {
            window.dtableSDK.migratePluginView(table_name, view_Data);
            setTimeout(resolve, 500);
          } catch (error) {
            reject(error);
          }
        });
      }
      toaster.success(intl.get('Migrate_to_views_successfully'));
    } catch (error) {
      console.error('Migration error:', error);
      toaster.danger(intl.get('Migration_failed'));
    }
  };

  renderBtnGroups = () => {
    return (
      <div className="d-flex align-items-center plugin-calendar-operators">
        <Button className="mr-4 migrateToView-button" onClick={this.migratePluginView} color="secondary">
          <Icon symbol='move-to' className='mr-2' />
          <span>{intl.get('Migrate_to_view')}</span>
        </Button>
        {!this.isMobile &&
          <span
            className="mr-1 op-icon"
            onClick={this.toggleTimeRangeDialog}
            onKeyDown={handleEnterKeyDown(this.toggleTimeRangeDialog)}
            aria-label={intl.get('Choose_time_range')}
            tabIndex={0}
          >
            <i className="dtable-font dtable-icon-print" ></i>
          </span>
        }
        <span
          className="mr-1 op-icon"
          id='calendar-setting-toggle-btn'
          onClick={this.toggleViewSettingPanel}
          onKeyDown={handleEnterKeyDown(this.toggleViewSettingPanel)}
          aria-label={intl.get('Settings')}
          tabIndex={0}
        >
          <i className="dtable-font dtable-icon-set-up"></i>
        </span>
        <span
          className="dtable-font dtable-icon-x op-icon"
          onClick={this.onPluginToggle}
          onKeyDown={handleEnterKeyDown(this.onPluginToggle)}
          aria-label={intl.get('Close_plugin')}
          tabIndex={0}
        >
        </span>
      </div>
    );
  };

  onAddView = (viewName) => {
    let { plugin_settings } = this.state;
    let { views: updatedViews } = plugin_settings;
    let selectedViewIdx = updatedViews.length;
    let _id = generatorViewId(updatedViews);
    let newView = new View({ _id, name: viewName });
    updatedViews.push(newView);
    let { settings } = updatedViews[selectedViewIdx];
    let isViewSettingPanelOpen = !this.isValidViewSettings(settings);
    plugin_settings.views = updatedViews;
    this.setState({
      plugin_settings,
      selectedViewIdx,
      isViewSettingPanelOpen
    }, () => {
      this.storeSelectedViewId(updatedViews[selectedViewIdx]._id);
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
      this.viewsTabs && this.viewsTabs.setViewsTabsScroll();
    });
  };

  onRenameView = (viewName) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let updatedView = plugin_settings.views[selectedViewIdx];
    updatedView = Object.assign({}, updatedView, { name: viewName });
    plugin_settings.views[selectedViewIdx] = updatedView;
    this.setState({
      plugin_settings
    }, () => {
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  };

  onDeleteView = (viewId) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let { views: updatedViews } = plugin_settings;
    let viewIdx = updatedViews.findIndex(v => v._id === viewId);
    selectedViewIdx = updatedViews.length - 1 === viewIdx ? viewIdx - 1 : selectedViewIdx;
    if (viewIdx > -1) {
      updatedViews.splice(viewIdx, 1);
      let { settings } = updatedViews[selectedViewIdx];
      let isViewSettingPanelOpen = !this.isValidViewSettings(settings);
      plugin_settings.views = updatedViews;
      this.setState({
        plugin_settings,
        selectedViewIdx,
        isViewSettingPanelOpen
      }, () => {
        this.storeSelectedViewId(updatedViews[selectedViewIdx]._id);
        window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
      });
    }
  };

  // move view, update `selectedViewIdx`
  onMoveView = (targetViewID, targetIndexViewID, relativePosition) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let { views: updatedViews } = plugin_settings;

    let viewIDMap = {};
    updatedViews.forEach((view, index) => {
      viewIDMap[view._id] = view;
    });
    const targetView = viewIDMap[targetViewID];
    const targetIndexView = viewIDMap[targetIndexViewID];
    const selectedView = updatedViews[selectedViewIdx];

    const originalIndex = updatedViews.indexOf(targetView);
    let targetIndex = updatedViews.indexOf(targetIndexView);
    // `relativePosition`: 'before'|'after'
    targetIndex += relativePosition == 'before' ? 0 : 1;

    if (originalIndex < targetIndex) {
      if (targetIndex < updatedViews.length) {
        updatedViews.splice(targetIndex, 0, targetView);
      } else {
        // drag it to the end
        updatedViews.push(targetView);
      }
      updatedViews.splice(originalIndex, 1);
    } else {
      updatedViews.splice(originalIndex, 1);
      updatedViews.splice(targetIndex, 0, targetView);
    }

    const newSelectedViewIndex = updatedViews.indexOf(selectedView);

    plugin_settings.views = updatedViews;
    this.setState({
      plugin_settings,
      selectedViewIdx: newSelectedViewIndex
    }, () => {
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  };

  onSelectView = (viewId) => {
    let { plugin_settings } = this.state;
    let { views: updatedViews } = plugin_settings;
    let viewIdx = updatedViews.findIndex(v => v._id === viewId);
    if (viewIdx > -1) {
      let { settings } = updatedViews[viewIdx];
      const isViewSettingPanelOpen = !this.isValidViewSettings(settings);
      const rows = this.getPluginViewRows(settings);
      const rowsColor = this.getRowsColor(settings);
      this.setState({ selectedViewIdx: viewIdx, isViewSettingPanelOpen, rows, rowsColor });
      this.storeSelectedViewId(viewId);
    }
  };

  storeSelectedViewId = (viewId) => {
    let dtableUuid = getDtableUuid();
    let selectedViewIds = this.getSelectedViewIds(KEY_SELECTED_VIEW_IDS);
    selectedViewIds[dtableUuid] = viewId;
    window.localStorage.setItem(KEY_SELECTED_VIEW_IDS, JSON.stringify(selectedViewIds));
  };

  isValidViewSettings = (settings) => {
    return settings && Object.keys(settings).length > 0;
  };

  getSelectedTable = (settings = {}) => {
    const tables = window.dtableSDK.getTables();
    return getTableByName(tables, settings[SETTING_KEY.TABLE_NAME]) || tables[0];
  };

  onModifyViewSettings = (updated) => {
    let { plugin_settings, selectedViewIdx } = this.state;
    let { views: updatedViews } = plugin_settings;
    let updatedView = plugin_settings.views[selectedViewIdx];
    updatedView.settings = updated;
    updatedViews[selectedViewIdx] = updatedView;
    plugin_settings.views = updatedViews;
    this.setState({ plugin_settings }, () => {
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, plugin_settings);
    });
  };

  getSelectedView = (table, settings = {}) => {
    const selectedView = getViewByName(table.views, settings[SETTING_KEY.VIEW_NAME]);
    if (!selectedView) {
      const tableViews = getNonPrivateViews(getNonArchiveViews(table.views));
      return tableViews[0];
    }
    return selectedView;
  };

  modifyRow = (table, row, updated) => {
    window.dtableSDK.modifyRow(table, row, updated);
  };

  appendRow = (table, rowData) => {
    window.dtableSDK.appendRow(table, rowData);
  };

  getRowsColor = (settings) => {
    const configuredUseRowColor = settings[SETTING_KEY.COLORED_BY_ROW_COLOR];
    if (!configuredUseRowColor) {
      return {};
    }
    const selectedTable = this.getSelectedTable(settings);
    const selectedTableView = this.getSelectedView(selectedTable, settings);
    const viewRows = window.dtableSDK.getViewRows(selectedTableView, selectedTable);
    return window.dtableSDK.getViewRowsColor(viewRows, selectedTableView, selectedTable);
  };

  getRelatedUsersFromLocal = () => {
    let { collaborators, state } = window.app;
    if (!collaborators) {
      // dtable app
      return state && state.collaborators;
    }
    return collaborators; // local develop
  };

  getSelectedGridView = (table, view) => {
    if (!table || !view) {
      return CALENDAR_VIEWS.MONTH;
    }
    const keySelectedCalendarView = JSON.parse(localStorage.getItem(KEY_SELECTED_CALENDAR_VIEW)) || {};
    const dtableUuid = getDtableUuid();
    const key = `${dtableUuid}_${table._id}_${view._id}`;
    const calendarView = keySelectedCalendarView[key];
    return this.calendarViews.indexOf(calendarView) < 0 ? CALENDAR_VIEWS.MONTH : calendarView;
  };

  getTableFormulaRows = (table, view) => {
    const rows = window.dtableSDK.getViewRows(view, table);
    return window.dtableSDK.getTableFormulaResults(table, rows);
  };

  getProcessedTableView = (selectedTable, settings) => {
    let selectedTableView = this.getSelectedView(selectedTable, settings);
    const formulaRows = this.getTableFormulaRows(selectedTable, selectedTableView);
    selectedTableView = Object.assign({}, selectedTableView, { formula_rows: formulaRows });
    const columns = getViewShownColumns(selectedTableView, selectedTable.columns);
    return { selectedTableView, columns };
  };

  render() {
    const {
      isLoading, showDialog, plugin_settings, selectedViewIdx,
      rows, rowsColor, isViewSettingPanelOpen, isTimeRangeDialogOpen,
    } = this.state;
    if (isLoading || !showDialog) {
      return '';
    }

    const { views } = plugin_settings;
    const selectedPluginView = views[selectedViewIdx];
    const { settings } = selectedPluginView || { settings: {} };
    const tables = window.dtableSDK.getTables();
    const selectedTable = this.getSelectedTable(settings);
    const tableViews = getNonPrivateViews(getNonArchiveViews(selectedTable.views));
    const { selectedTableView, columns } = this.getProcessedTableView(selectedTable, settings);
    const modalClassNames = classnames(
      'dtable-plugin',
      'calendar-plugin-container',
      {
        'plugin-calendar-mobile': this.isMobile
      }
    );
    const ViewsTabsEl = (
      <ViewsTabs
        ref={ref => this.viewsTabs = ref}
        views={views}
        selectedViewIdx={selectedViewIdx}
        isMobile={this.isMobile}
        onAddView={this.onAddView}
        onRenameView={this.onRenameView}
        onDeleteView={this.onDeleteView}
        onSelectView={this.onSelectView}
        onMoveView={this.onMoveView}
      />
    );

    // set default value for 'color field' in settings
    const singleSelectColumn = columns.filter(item => item.type == CellType.SINGLE_SELECT)[0];
    if (singleSelectColumn) {
      if (!settings[SETTING_KEY.COLORED_BY_ROW_COLOR] && settings[SETTING_KEY.COLUMN_COLOR] == undefined) {
        settings[SETTING_KEY.COLUMN_COLOR] = singleSelectColumn.name;
      }
    }

    return (
      <div className={modalClassNames} ref={ref => this.plugin = ref}>
        <div className={`d-flex plugin-header flex-shrink-0 h-7 ${this.isMobile ? 'justify-content-between' : ''}`}>
          <div className="logo-title d-flex align-items-center">
            <img className="mr-2 plugin-logo" src={icon} alt="" width="24" />
            <span className="plugin-title">{intl.get('Calendar')}</span>
          </div>
          {!this.isMobile && ViewsTabsEl}
          {this.renderBtnGroups()}
        </div>
        {this.isMobile && <div className="flex-shrink-0 pl-4 pr-4 h-7 d-flex border-bottom">{ViewsTabsEl}</div>}
        <div className="calendar-plugin-content">
          <ReactBigCalendar
            ref={ref => this.calendar = ref}
            activeTable={selectedTable}
            activeView={selectedTableView}
            selectedViewIdx={selectedViewIdx}
            columns={columns}
            rows={rows}
            rowsColor={rowsColor}
            calendarViews={this.calendarViews}
            appendRow={this.appendRow}
            modifyRow={this.modifyRow}
            settings={settings}
            collaborators={this.getRelatedUsersFromLocal()}
            formulaRows={selectedTableView.formula_rows}
            rowColorsMap={this.rowColorsMap}
            getSelectedGridView={this.getSelectedGridView}
            handleRowExpand={this.handleRowExpand}
            onInsertRow={this.onInsertRow}
            hideViewSettingPanel={this.hideViewSettingPanel}
            isExporting={this.state.isExporting}
            exportedMonths={this.state.exportedMonths}
            isMobile={this.isMobile}
            isIosMobile={this.isIosMobile}
            isSafari={this.isSafari}
          />
          {isTimeRangeDialogOpen &&
            <TimeRangeDialog
              isExporting={this.state.isExporting}
              onConfirmTimeRange={this.exportSelectedMonths}
              toggleDialog={this.toggleTimeRangeDialog}
            />
          }
        </div>
        {isViewSettingPanelOpen &&
          <ViewSetting
            createOptions={this.createOptions}
            getSelectorColumns={this.getSelectorColumns}
            getSelectorOptions={this.getSelectorOptions}
            tables={tables}
            views={tableViews}
            settings={settings}
            columns={columns}
            selectedGridView={this.getSelectedGridView(selectedTable, selectedTableView)}
            onModifyViewSettings={this.onModifyViewSettings}
            toggleViewSettingPanel={this.toggleViewSettingPanel}
          />
        }
      </div>
    );
  }
}

App.propTypes = propTypes;

export default App;
