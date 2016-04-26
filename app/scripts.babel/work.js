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

  save(callback) {
    if (this.isSave && this.content.trim().length > 0) {
      Work._getAll(contentMap => {
        // TODO: Should check exists and updated
        this.updated = Date.now();
        contentMap[this.created] = {
          created: this.created,
          content: this.content,
          updated: this.updated
        };
        chrome.storage.local.set(
          {
            contentMap: contentMap
          }, () => {
            if (callback) {
              callback();
            }
          }
        );
      });
    } else {
      if (callback) {
        callback();
      }
    }
  }

  get firstLine() {
    let lines = this.content.split(/\r\n|\r|\n/);
    if (lines && lines.length > 0) {
      return lines[0];
    } else {
      return "";
    }
  }

  static _getAll(callback) {
    chrome.storage.local.get("contentMap", item => {
      callback(item.contentMap || {});
    });
  }

  static getAll(callback) {
    Work._getAll(contentMap => {
      Work.getAllKeys(keys => {
        callback(keys.map(key => {
          let data = contentMap[key];
          return new Work(data.created, data.content, data.updated);
        }));
      });
    });
  }

  static getLast(callback) {
    Work._getAll(contentMap => {
      let keys = Object.keys(contentMap);
      if (keys && keys.length > 0) {
        let max = keys.reduce((p, c) => {
          return Math.max(p, c);
        });
        let data = contentMap[max];
        callback(new Work(data.created, data.content, data.updated));
      } else {
        callback(null);
      }
    });
  }

  static getAllKeys(callback) {
    Work._getAll(contentMap => {
      let keys = Object.keys(contentMap);
      callback(keys.sort((a, b) => {
        return b - a;
      }));
    });
  }

  static removeAll(callback) {
    chrome.storage.local.set({
      contentMap: {}
    }, () => {
      callback();
    });
  }

  static remove(work, callback) {
    Work._getAll(contentMap => {
      console.log(work);
      delete contentMap[work.created];
      console.log(contentMap);
      chrome.storage.local.set({
        contentMap: contentMap
      }, () => {
        callback();
      });
    });
  }

}
