"use strict";

import Work from "./work.js";

export default class LocalWorkStorage {

  constructor(newtab) {
    this._newtab = newtab;
  }

  // Public functions

  initialize(callback) {
    if (callback) {
      callback();
    }
  }

  canProvideTopSites() {
    return false;
  }

  logout(callback) {
    if (callback) {
      callback();
    }
  }

  save(work, callback) {
    if (work.isSave && work.hasContent()) {
      this._getAll(contentMap => {
        // TODO: Should check exists and updated
        work.updated = Date.now();
        contentMap[work.created] = {
          created: work.created,
          content: work.content,
          updated: work.updated
        };
        localStorage.setItem("contentMap", JSON.stringify(contentMap));
        if (callback) {
          callback();
        }
      });
    } else {
      if (callback) {
        callback();
      }
    }
  }

  getAll(callback) {
    this._getAll(contentMap => {
      this.getAllKeys(keys => {
        callback(keys.map(key => {
          let data = contentMap[key];
          return new Work(data.created, data.content, data.updated);
        }));
      });
    });
  }

  getAllKeys(callback) {
    this._getAll(contentMap => {
      let keys = Object.keys(contentMap);
      callback(keys.sort((a, b) => {
        return b - a;
      }));
    });
  }

  getLast(callback) {
    this._getAll(contentMap => {
      let keys = Object.keys(contentMap);
      if (keys && keys.length > 0) {
        let max = keys.reduce((p, c) => {
          return contentMap[p].updated > contentMap[c].updated ? p : c;
        });
        let data = contentMap[max];
        callback(new Work(data.created, data.content, data.updated));
      } else {
        callback(null);
      }
    });
  }

  removeAll(callback) {
    localStorage.removeItem("contentMap");
    if (callback) {
      callback();
    }
  }

  remove(work, callback) {
    this._getAll(contentMap => {
      delete contentMap[work.created];
      localStorage.setItem("contentMap", JSON.stringify(contentMap));
      if (callback) {
        callback();
      }
    });
  }

  // Private functions

  _getAll(callback) {
    let contentMap = localStorage.getItem("contentMap");
    callback(contentMap ? JSON.parse(contentMap) : {});
  }

}