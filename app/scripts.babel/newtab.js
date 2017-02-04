"use strict";

import MindMap from "./mindmap.js";
import Parser from "./parser.js";
import Work from "./work.js";
import LocalWorkStorage from "./local_work_storage.js";
import FirebaseWorkStorage from "./firebase_work_storage.js";

class Newtab {

  constructor() {
    this.useFirebase = false;

    this.localWorkStorage = new LocalWorkStorage(this);
    this.firebaseWorkStorage = new FirebaseWorkStorage(this);
    this.localWorkStorage.initialize(() => {
      this.firebaseWorkStorage.initialize((alreadyLoggedIn) => {
        this.mm = new MindMap("#target");
        this.currentWork = Work.newInstance();
        this.changeUseFirebase(alreadyLoggedIn);
        this.assignEventHandlers();
        this.loadWorkList();
      });
    });
  }

  assignEventHandlers() {
    let source = document.querySelector("#source");
    source.addEventListener("keydown", e => {
      var elem, end, start, value;
      if (e.keyCode === 9) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        elem = e.target;
        start = elem.selectionStart;
        end = elem.selectionEnd;
        value = elem.value;
        elem.value = "" + value.substring(0, start) + "\t" + value.substring(end);
        elem.selectionStart = elem.selectionEnd = start + 1;
        return false;
      }
    });

    source.addEventListener("keyup", () => {
      this.drawMindmap(() => {
        this.getWorkStorage().save(this.currentWork, () => {
          this.loadWorkList();
        });
      });
    });

    let btnLast = document.querySelector("#btnLast");
    btnLast.addEventListener("click", () => {
      this.getWorkStorage().getLast(work => {
        this.load(work);
      });
    });

    let btnDelete = document.querySelector("#btnDelete");
    btnDelete.addEventListener("click", () => {
      if (this.currentWork.content) {
        let confirmMessage = document.querySelector("#confirmMessage");
        confirmMessage.innerText = "Do you really want to delete `" + this.currentWork.firstLine + "`?";
        $("#confirmDialog").modal("show");
      }
    });

    let btnConfirmYes = document.querySelector("#btnConfirmYes");
    btnConfirmYes.addEventListener("click", () => {
      $("#confirmDialog").modal("hide");
      if (this.currentWork.content) {
        this.getWorkStorage().remove(this.currentWork, () => {
          this.loadWorkList();
          this.load(Work.newInstance());
        });
      }
    });

    let btnNew = document.querySelector("#btnNew");
    btnNew.addEventListener("click", () => {
      this.load(Work.newInstance());
    });

    let btnTopSites = document.querySelector("#btnTopSites");
    btnTopSites.addEventListener("click", () => {
      let text = "Top Sites\n";
      chrome.topSites.get(sites => {
        sites.forEach(site => {
          text = text + "\t[" + site.title + "](" + site.url + ")\n";
        });
        let work = new Work(Date.now(), text, Date.now());
        work.isSave = false;
        this.load(work);
      });
    });

    let btnCopyAsPlainText = document.querySelector("#btnCopyAsPlainText");
    btnCopyAsPlainText.addEventListener("click", () => {
      this.onBtnCopyAsPlainTextClicked();
    });

    let btnCopyAsMarkdownText = document.querySelector("#btnCopyAsMarkdownText");
    btnCopyAsMarkdownText.addEventListener("click", () => {
      this.onBtnCopyAsMarkdownTextClicked();
    });

    let btnOnline = document.querySelector("#btnOnline");
    btnOnline.addEventListener("click", () => {
      this.onBtnOnlineClicked();
    });

    $("#loginDialog").on("shown.bs.modal", () => {
      $("#inputEmail").focus();
    });

    $("#createUserDialog").on("shown.bs.modal", () => {
      $("#inputNewEmail").focus();
    });

    let btnLogin = document.querySelector("#btnLogin");
    btnLogin.addEventListener("click", () => {
      this.onBtnLoginClicked();
    });

    let btnOpenCreateUserDialog = document.querySelector("#btnOpenCreateUserDialog");
    btnOpenCreateUserDialog.addEventListener("click", () => {
      this.onBtnOpenCreateUserDialogClicked();
    });

    let btnCreateUser = document.querySelector("#btnCreateUser");
    btnCreateUser.addEventListener("click", () => {
      this.onBtnCreateUserClicked();
    });

    let btnForgotPassword = document.querySelector("#btnForgotPassword");
    btnForgotPassword.addEventListener("click", () => {
      this.onBtnForgotPasswordClicked();
    });
  }

  updateLoginErrorMessage(message) {
    const loginErrorMessage = document.querySelector("#loginErrorMessage");
    if (message) {
      loginErrorMessage.innerText = message;
    } else {
      loginErrorMessage.innerText = "";
    }
  }

  updateCreateUserErrorMessage(message) {
    const createUserErrorMessage = document.querySelector("#createUserErrorMessage");
    if (message) {
      createUserErrorMessage.innerText = message;
    } else {
      createUserErrorMessage.innerText = "";
    }
  }

  onBtnForgotPasswordClicked() {
    this.updateLoginErrorMessage("");
    const email = document.querySelector("#inputEmail").value;
    this.firebaseWorkStorage.sendPasswordResetEmail(email, () => {
      this.updateLoginErrorMessage("Sent an email to the address.");
    }, error => {
      console.error(error);
      this.updateLoginErrorMessage(error.message);
    });
  }

  onBtnCreateUserClicked() {
    this.updateCreateUserErrorMessage("");
    const email = document.querySelector("#inputNewEmail").value;
    const password1 = document.querySelector("#inputNewPassword1").value;
    const password2 = document.querySelector("#inputNewPassword2").value;
    if (password1 && password1 === password2) {
      this.firebaseWorkStorage.createUser(email, password1, () => {
        this.changeUseFirebase(true);
        this.loadWorkList();
        this.load(Work.newInstance());
        $("#createUserDialog").modal("hide");
      }, error => {
        console.error(error);
        this.updateCreateUserErrorMessage(error.message);
      });
    } else {
      this.updateCreateUserErrorMessage("Invalid password.");
    }
  }

  onBtnOpenCreateUserDialogClicked() {
    $("#loginDialog").modal("hide");
    this.updateCreateUserErrorMessage("");
    document.querySelector("#inputNewEmail").value = document.querySelector("#inputEmail").value;
    document.querySelector("#inputNewPassword1").value = "";
    document.querySelector("#inputNewPassword2").value = "";
    $("#createUserDialog").modal("show");
  }

  onBtnOnlineClicked() {
    if (this.useFirebase) {
      this.getWorkStorage().logout(() => {
        this.changeUseFirebase(false);
        this.loadWorkList();
        this.load(Work.newInstance());
      });
    } else {
      document.querySelector("#inputPassword").value = "";
      this.updateLoginErrorMessage("");
      $("#loginDialog").modal("show");
    }
  }

  onBtnLoginClicked() {
    this.updateLoginErrorMessage("");
    const email = document.querySelector("#inputEmail").value;
    const passwd = document.querySelector("#inputPassword").value;
    this.firebaseWorkStorage.login(email, passwd, () => {
      this.changeUseFirebase(true);
      this.loadWorkList();
      this.load(Work.newInstance());
      $("#loginDialog").modal("hide");
    }, error => {
      console.error(error);
      this.updateLoginErrorMessage(error.message);
    });
  }

  changeUseFirebase(alreadyLoggedIn) {
    this.useFirebase = alreadyLoggedIn;
    this.updateBtnOnlineText();
  }

  updateBtnOnlineText() {
    if (this.useFirebase) {
      const email = this.firebaseWorkStorage.getCurrentUserEmail();
      document.querySelector("#lblOnline").innerText = "Logout (" + email + ")";
    } else {
      document.querySelector("#lblOnline").innerText = "Login";
    }
  }

  onBtnCopyAsPlainTextClicked() {
    let source = document.querySelector("#source");
    if (source.value) {
      this.copyTextToClipboardViaCopyBuffer(source.value);
    }
  }

  onBtnCopyAsMarkdownTextClicked() {
    let source = document.querySelector("#source").value;
    let root = new Parser().parse(source);
    if (root) {
      let text = "";
      let traverse = (node, currentLevel) => {
        for (let i = 0; i < currentLevel; i += 1) {
          text += "  ";
        }
        text += "* " + node.source + "\n";
        if (!node.isLeaf()) {
          node.children.forEach(child => {
            traverse(child, currentLevel + 1);
          });
        }
      };
      traverse(root, 0);
      this.copyTextToClipboardViaCopyBuffer(text);
    }
  }

  copyTextToClipboardViaCopyBuffer(text) {
    let copyBuffer = document.querySelector("#copyBuffer");
    copyBuffer.value = text;
    let range = document.createRange();
    range.selectNode(copyBuffer);
    window.getSelection().addRange(range);
    try {
      var result = document.execCommand("copy");
      let msg = result ? "successful" : "unsuccessful";
      console.log("Copy source text was " + msg);
    } catch (e) {
      console.log("Oops, unable to copy");
    }
  }

  drawMindmap(callback) {
    let source = document.querySelector("#source").value;
    let root = new Parser().parse(source);
    if (root) {
      this.currentWork.content = source;
      this.mm.draw(root);
    } else {
      this.mm.clear();
    }
    if (callback) {
      callback();
    }
  }

  load(work) {
    this.currentWork = work;
    let source = document.querySelector("#source");
    source.value = this.currentWork.content;
    this.drawMindmap();
  }

  toLocaleString(date) {
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    ].join("/") + " " + date.toLocaleTimeString();
  }

  loadWorkList() {
    this.getWorkStorage().getAll(works => {
      let history = document.querySelector("#history");
      history.innerHTML = "";
      works.forEach(work => {
        let li = document.createElement("li");
        let link = document.createElement("a");
        link.href = "#";
        let label = work.firstLine + " (" + this.toLocaleString(new Date(work.created)) + ")";
        link.appendChild(document.createTextNode(label));
        link.addEventListener("click", ((x) => {
          return () => {
            this.load(x);
          };
        })(work));
        li.appendChild(link);
        history.appendChild(li);
      });
    });
  }

  getWorkStorage() {
    if (this.useFirebase) {
      return this.firebaseWorkStorage;
    } else {
      return this.localWorkStorage;
    }
  }

  onWorkAdded() {
    this.loadWorkList();
  }

  onWorkChanged(key, changedWork) {
    this.loadWorkList();
    if (this.currentWork
      && this.currentWork.created === changedWork.created
      && this.currentWork.content !== changedWork.content) {
      this.load(changedWork);
    }
  }

  onWorkRemoved(key, removedWork) {
    this.loadWorkList();
    if (this.currentWork
      && this.currentWork.created === removedWork.created) {
      this.load(Work.newInstance());
    }
  }

}

window.addEventListener("load", () => {
  new Newtab();
});
