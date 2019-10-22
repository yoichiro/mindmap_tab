"use strict";

export default class Work {

  constructor(created, content, updated) {
    this.created = created;
    this.content = content;
    this.updated = updated;
    this.isSave = true;
  }

  static newInstance() {
    let now = Date.now();
    return new Work(now, "", now);
  }

  get firstLine() {
    let lines = this.content.split(/\r\n|\r|\n/);
    if (lines && lines.length > 0) {
      return lines[0];
    } else {
      return "";
    }
  }

  hasContent() {
    return this.content && this.content.trim().length > 0;
  }

}
