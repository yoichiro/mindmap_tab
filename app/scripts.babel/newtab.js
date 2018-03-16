"use strict";

import MindMap from "./mindmap.js";
import Parser from "./parser.js";
import Work from "./work.js";
import LocalWorkStorage from "./local_work_storage.js";
import FirebaseWorkStorage from "./firebase_work_storage.js";

class Newtab {

  constructor() {
    this.useFirebase = false;
    this.typing = false;
    this.loading = false;
    this.timer = false;

    this.localWorkStorage = new LocalWorkStorage(this);
    this.firebaseWorkStorage = new FirebaseWorkStorage(this);
    this.localWorkStorage.initialize(() => {
      this.firebaseWorkStorage.initialize(alreadyLoggedIn => {
        this.mm = new MindMap(this, "#target");
        this.currentWork = Work.newInstance();
        this.editor = this.initializeAceEditor();
        this.changeUseFirebase(alreadyLoggedIn);
        this.assignEventHandlers();
        this.loadWorkList();
      });
    });
  }

  // Ace Editor

  initializeAceEditor() {
    let editor = ace.edit("source");
    editor.setFontSize(13);
    editor.getSession().setUseSoftTabs(false);
    editor.getSession().setUseWrapMode(false);
    editor.setShowPrintMargin(false);
    editor.renderer.setShowGutter(false);
    editor.$blockScrolling = Infinity;
    return editor;
  }

  // Event Handlers

  assignEventHandlers() {
    this.editor.getSession().on("change", () => {
      this.onEditorSessionChanged();
    });
    this.editor.getSession().getSelection().on("changeSelection", () => {
      this.onEditorSelectionChanged();
    });

    ["btnDelete", "btnNew", "btnConfirmYes",
     "btnCopyAsPlainText", "btnCopyAsMarkdownText", "btnOnline",
     "btnLogin", "btnOpenCreateUserDialog", "btnCreateUser",
     "btnForgotPassword", "btnExportAsPng", "btnExportAsJpeg",
     "btnLayoutRightMain", "btnLayoutLeftMain", "btnLayoutRightOnly",
     "btnLayoutLeftOnly", "btnCopyAsHtmlText", "btnChangeLineColorMode",
     "btnEditBold", "btnEditStrikeThrough"].forEach(name => {
      let element = document.querySelector("#" + name);
      element.addEventListener("click", () => {
        this["on" + name.charAt(0).toUpperCase() + name.slice(1) + "Clicked"]();
      });
    });

    [10, 12, 14, 16, 18, 24, 36].forEach(fontSize => {
      let element = document.querySelector("#btnFontSize" + fontSize);
      element.addEventListener("click", ((fontSize) => {
        return () => {
          localStorage.fontSize = fontSize;
          this.drawMindmap();
        };
      })(fontSize));
    });

    $("#loginDialog").on("shown.bs.modal", () => {
      $("#inputEmail").focus();
    });

    $("#createUserDialog").on("shown.bs.modal", () => {
      $("#inputNewEmail").focus();
    });
  }

  onBtnEditBoldClicked() {
    const selectionRange = this.editor.getSelectionRange();
    const textRange = this.editor.getSession().getTextRange(selectionRange);
    if (textRange.length > 0) {
      this.editor.getSession().replace(selectionRange, `**${textRange}**`);
    }
  }

  onBtnEditStrikeThroughClicked() {
    const selectionRange = this.editor.getSelectionRange();
    const textRange = this.editor.getSession().getTextRange(selectionRange);
    if (textRange.length > 0) {
      this.editor.getSession().replace(selectionRange, `~~${textRange}~~`);
    }
  }

  onBtnChangeLineColorModeClicked() {
    this.mm.changeLineColorMode();
    this.drawMindmap();
  }

  onBtnLayoutRightMainClicked() {
    let leftColumn = document.querySelector("#leftColumn");
    let rightColumn = document.querySelector("#rightColumn");
    leftColumn.setAttribute("class", "show col-md-4");
    rightColumn.setAttribute("class", "show col-md-8");
  }

  onBtnLayoutLeftMainClicked() {
    let leftColumn = document.querySelector("#leftColumn");
    let rightColumn = document.querySelector("#rightColumn");
    leftColumn.setAttribute("class", "show col-md-8");
    rightColumn.setAttribute("class", "show col-md-4");
  }

  onBtnLayoutRightOnlyClicked() {
    let leftColumn = document.querySelector("#leftColumn");
    let rightColumn = document.querySelector("#rightColumn");
    leftColumn.setAttribute("class", "hidden");
    rightColumn.setAttribute("class", "show col-md-12");
  }

  onBtnLayoutLeftOnlyClicked() {
    let leftColumn = document.querySelector("#leftColumn");
    let rightColumn = document.querySelector("#rightColumn");
    leftColumn.setAttribute("class", "show col-md-12");
    rightColumn.setAttribute("class", "hidden");
  }

  onEditorSessionChanged() {
    if (this.timer !== false) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.typing = true;
      this.drawMindmap(() => {
        if (!this.loading) {
          this.getWorkStorage().save(this.currentWork, () => {
            this.loadWorkList();
            this.timer = false;
          });
        }
      });
    }, 2000);
  }

  onEditorSelectionChanged() {
    const selectionRange = this.editor.getSelectionRange();
    const textRange = this.editor.getSession().getTextRange(selectionRange);
    if (textRange.length > 0) {
      $(".dropdownEditItem").removeClass("disabled");
    } else {
      $(".dropdownEditItem").addClass("disabled");
    }
  }

  onBtnLastClicked() {
    this.getWorkStorage().getLast(work => {
      this.load(work);
    });
  }

  onBtnDeleteClicked() {
    if (this.currentWork.content) {
      let confirmMessage = document.querySelector("#confirmMessage");
      confirmMessage.innerText = "Do you really want to delete `" + this.currentWork.firstLine + "`?";
      $("#confirmDialog").modal("show");
    }
  }

  onBtnConfirmYesClicked() {
    $("#confirmDialog").modal("hide");
    if (this.currentWork.content) {
      this.getWorkStorage().remove(this.currentWork, () => {
        this.loadWorkList();
        this.load(Work.newInstance());
      });
    }
  }

  onBtnNewClicked() {
    this.load(Work.newInstance());
  }

  onBtnTopSitesClicked() {
    let text = "Top Sites\n";
    chrome.topSites.get(sites => {
      sites.forEach(site => {
        text = text + "\t[" + site.title + "](" + site.url + ")\n";
      });
      let work = new Work(Date.now(), text, Date.now());
      work.isSave = false;
      this.load(work);
    });
  }

  onBtnExportAsPngClicked() {
    if (this.currentWork.hasContent()) {
      this.mm.saveAsImage(this.currentWork.firstLine, "png");
    }
  }

  onBtnExportAsJpegClicked() {
    if (this.currentWork.hasContent()) {
      this.mm.saveAsImage(this.currentWork.firstLine, "jpeg");
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

  onBtnCopyAsPlainTextClicked() {
    let source = this.editor.getValue();
    if (source) {
      this.copyTextToClipboardViaCopyBuffer(source);
    }
  }

  onBtnCopyAsMarkdownTextClicked() {
    let source = this.editor.getValue();
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

  onBtnCopyAsHtmlTextClicked() {
    let source = this.editor.getValue();
    let root = new Parser().parse(source);
    if (root) {
      let text = "<ul>\n";
      let traverse = (node, currentLevel) => {
        for (let i = 0; i < currentLevel; i += 1) {
          text += "  ";
        }
        text += "<li>" + node.html;
        if (!node.isLeaf()) {
          currentLevel += 1;
          text += "\n";
          for (let i = 0; i < currentLevel; i += 1) {
            text += "  ";
          }
          text += "<ul>\n";
          node.children.forEach(child => {
            traverse(child, currentLevel + 1);
          });
          for (let i = 0; i < currentLevel; i += 1) {
            text += "  ";
          }
          text += "</ul>\n";
          currentLevel -= 1;
          for (let i = 0; i < currentLevel; i += 1) {
            text += "  ";
          }
        }
        text += "</li>\n";
      };
      traverse(root, 1);
      text += "</ul>"
      this.copyTextToClipboardViaCopyBuffer(text);
    }
  }

  // Update messages

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

  // For Firebase

  changeUseFirebase(alreadyLoggedIn) {
    this.useFirebase = alreadyLoggedIn;
    this.updateBtnOnlineText();
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
    this.typing = false;
  }

  onWorkChanged(key, changedWork) {
    this.loadWorkList();
    if (!this.typing
      && this.currentWork
      && this.currentWork.created === changedWork.created
      && this.currentWork.content !== changedWork.content) {
      this.load(changedWork);
    }
    this.typing = false;
  }

  onWorkRemoved(key, removedWork) {
    this.loadWorkList();
    if (this.currentWork
      && this.currentWork.created === removedWork.created) {
      this.load(Work.newInstance());
    }
    this.typing = false;
  }

  updateBtnOnlineText() {
    if (this.useFirebase) {
      const email = this.firebaseWorkStorage.getCurrentUserEmail();
      document.querySelector("#lblOnline").innerText = "Logout (" + email + ")";
    } else {
      document.querySelector("#lblOnline").innerText = "Login";
    }
  }

  // For Clipboard

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

  // Draw MindMap

  drawMindmap(callback) {
    let source = this.editor.getValue();
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
        link.addEventListener("click", (x => {
          return () => {
            this.load(x);
          };
        })(work));
        li.appendChild(link);
        history.appendChild(li);
      });
      if (works.length > 0) {
        let separator = document.createElement("li");
        separator.setAttribute("role", "separator");
        separator.setAttribute("class", "divider");
        history.appendChild(separator);
        let lastLi = document.createElement("li");
        let lastA = document.createElement("a");
        lastA.href = "#";
        lastA.innerText = "Last";
        lastA.addEventListener("click", () => {
          this.onBtnLastClicked();
        });
        lastLi.appendChild(lastA);
        history.appendChild(lastLi);
      }
      let topSitesLi = document.createElement("li");
      let topSitesA = document.createElement("a");
      topSitesA.href = "#";
      topSitesA.innerText = "Top sites";
      topSitesA.addEventListener("click", () => {
        this.onBtnTopSitesClicked();
      });
      topSitesLi.appendChild(topSitesA);
      history.appendChild(topSitesLi);
    });
  }

  load(work) {
    this.loading = true;
    let cursorPosition = this.editor.getCursorPosition();
    this.currentWork = work;
    this.editor.setValue(this.currentWork.content);
    this.editor.clearSelection();
    this.drawMindmap();
    this.editor.focus();
    this.editor.gotoLine(cursorPosition.row + 1, cursorPosition.column, false);
    this.loading = false;
  }

  jumpCaretTo(position) {
    let source = this.editor.getValue();
    let lines = source.split(/\n/);
    let charCount = 0;
    let row = 0;
    for (let i = 0; i < lines.length; i += 1) {
      let eol = lines[i].length + 1;  // '\n'
      if (position < charCount + eol) {
        row = i + 1;
        break;
      }
      charCount += eol;
    }
    this.editor.gotoLine(row, position - charCount, false);
    this.editor.focus();
  }

  // Utilities

  toLocaleString(date) {
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    ].join("/") + " " + date.toLocaleTimeString();
  }

}

window.addEventListener("load", () => {
  new Newtab();
});
