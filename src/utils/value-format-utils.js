import { CELL_TYPE } from 'dtable-sdk';
import { DATE_FORMAT_MAP } from '../constants';
import { getFormulaArrayValue, isArrayFormalColumn } from './common';

export const getCollaboratorsName = (collaborators, cellVal) => {
  if (cellVal) {
    let collaboratorsName = [];
    cellVal.forEach((v) => {
      let collaborator = collaborators.find(c => c.email === v);
      if (collaborator) {
        collaboratorsName.push(collaborator.name);
      }
    });
    if (collaboratorsName.length === 0) {
      return null;
    }
    return collaboratorsName.join(',');
  }
  return null;
};

export function getLinkDisplayValue (dtable, {column, value, collaborators}) {
  const { data } = column;
  if (!Array.isArray(value) || value.length === 0) return '';
  let { display_column: displayColumn, array_type } = data || {};

  const { type: displayColumnType, data: displayColumnData } = displayColumn;
  const cellValue = getFormulaArrayValue(value, !isArrayFormalColumn(array_type));
  if (!Array.isArray(cellValue) || cellValue.length === 0) return '';
  const newCellValue = cellValue.map(value => {
    switch (displayColumnType) {
      case CELL_TYPE.TEXT:
      case CELL_TYPE.URL:
      case CELL_TYPE.EMAIL:
      case CELL_TYPE.RATE:{
        return value;
      }
      case CELL_TYPE.NUMBER: {
        return dtable.getNumberDisplayString(value, data);
      }
      case CELL_TYPE.CHECKBOX: {
        return value === true ? 'true' : 'false';
      }
      case CELL_TYPE.SINGLE_SELECT: {
        let options = displayColumnData.options || [];
        return dtable.getOptionName(options, value);
      }
      case CELL_TYPE.MULTIPLE_SELECT: {
        let options = displayColumnData.options || [];
        return dtable.getMultipleOptionName(options, value);
      }
      case CELL_TYPE.FILE:
      case CELL_TYPE.IMAGE: {
        return null;
      }
      case CELL_TYPE.LONG_TEXT: {
        return dtable.getLongtextDisplayString(value);
      }
      case CELL_TYPE.DATE: {
        return dtable.getDateDisplayString(value, displayColumnData.format);
      }
      case CELL_TYPE.CTIME:
      case CELL_TYPE.MTIME: {
        let format = DATE_FORMAT_MAP.YYYY_MM_DD_HH_MM_SS;
        return dtable.getDateDisplayString(value, format);
      }
      case CELL_TYPE.DURATION: {
        return dtable.getDurationDisplayString(value, data);
      }
      case CELL_TYPE.COLLABORATOR:
      case CELL_TYPE.CREATOR:
      case CELL_TYPE.LAST_MODIFIER: {
        return value;
      }
      case CELL_TYPE.FORMULA:
      case CELL_TYPE.LINK_FORMULA: {
        return null;
      }
      case CELL_TYPE.GEOLOCATION: {
        return dtable.getGeolocationDisplayString(value, data);
      }
      case CELL_TYPE.AUTO_NUMBER: {
        return value;
      }
      case CELL_TYPE.BUTTON: {
        return null;
      }
      default:
        return value;
    }
  });
  return newCellValue.join(', ');
}
