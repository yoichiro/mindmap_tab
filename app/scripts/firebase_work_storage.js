"use strict";

import Work from "./work.js";

export default class FirebaseWorkStorage {

  constructor(newtab) {
    this._newtab = newtab;
    this._initializeFirebase();
  }

  // Public functions

  initialize(callback) {
    let unsubscribe = firebase.auth().onAuthStateChanged(user => {
      unsubscribe();
      if (user) {
        this._startObservation();
        callback(true);
      } else {
        callback(false);
      }
    });
  }

  canProvideTopSites() {
    return false;
  }

  logout(callback) {
    this._stopObservation();
    firebase.auth().signOut()
      .then(() => {
        if (callback) {
          callback();
        }
      })
      .catch(error => {
        console.error(error);
        if (callback) {
          callback();
        }
      });
  }

  createUser(email, password, successCallback, failureCallback) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(() => {
        this._startObservation();
        if (successCallback) {
          successCallback();
        }
      })
      .catch(error => {
        if (failureCallback) {
          failureCallback(error);
        }
      });
  }

  sendPasswordResetEmail(email, successCallback, failureCallback) {
    firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        if (successCallback) {
          successCallback();
        }
      })
      .catch(error => {
        if (failureCallback) {
          failureCallback(error);
        }
      });
  }

  login(email, password, successCallback, failureCallback) {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        this._startObservation();
        if (successCallback) {
          successCallback();
        }
      })
      .catch((error) => {
        if (failureCallback) {
          failureCallback(error);
        }
      });
  }

  getCurrentUserEmail() {
    const user = firebase.auth().currentUser;
    if (user) {
      return user.email;
    } else {
      return "";
    }
  }

  save(work, callback) {
    if (work.isSave && work.hasContent()) {
      const myRootRef = this._getMyRootRef();
      myRootRef.once("value").then(snapshot => {
        let contentMap = snapshot.val() || {};
        // TODO: Should check exists and updated
        work.updated = Date.now();
        contentMap[work.created] = {
          created: work.created,
          content: work.content,
          updated: work.updated
        };
        myRootRef.set(contentMap)
          .then(() => {
            if (callback) {
              callback();
            }
          })
          .catch(error => {
            console.error(error);
            if (callback) {
              callback();
            }
          });
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
    callback();
  }

  remove(work, callback) {
    this._getAll(contentMap => {
      delete contentMap[work.created];
      this._getMyRootRef().set(contentMap)
        .then(() => {
          if (callback) {
            callback();
          }
        });
    });
  }

  // Private functions

  _getAll(callback) {
    this._getMyRootRef().once("value")
      .then(snapshot => {
        let contentMap = snapshot.val() || {};
        callback(contentMap);
      });
  }

  _getMyRootRef() {
    let user = firebase.auth().currentUser;
    let database = firebase.database();
    let myRootRef = database.ref("mindmaps/private/" + user.uid);
    return myRootRef;
  }

  _initializeFirebase() {
    const config = {
      apiKey: "AIzaSyCZDGsxx5VbFDwo9lRe2vDuWf4aS5-XmNc",
      databaseURL: "https://mindmap-tab.firebaseio.com"
    };
    firebase.initializeApp(config);
  }

  _startObservation() {
    this._getMyRootRef().on("child_added", snapshot => {
      this._newtab.onWorkAdded(snapshot.key, this._createWork(snapshot));
    });
    this._getMyRootRef().on("child_changed", snapshot => {
      this._newtab.onWorkChanged(snapshot.key, this._createWork(snapshot));
    });
    this._getMyRootRef().on("child_removed", snapshot => {
      this._newtab.onWorkRemoved(snapshot.key, this._createWork(snapshot));
    });
  }

  _createWork(snapshot) {
    const data = snapshot.val();
    return new Work(data.created, data.content, data.updated);
  }

  _stopObservation() {
    this._getMyRootRef().off();
  }

}
