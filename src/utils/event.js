export default class TableEvent {

  constructor(object = {}) {
    this.row = object.row || {},
    this.title = object.title || null,
    this.start = object.date && new Date(object.date);
    this.end = object.endDate ? new Date(object.endDate) : this.start;
    this.bgColor = object.bgColor || null;
    this.highlightColor = object.highlightColor || null;
  }
}
