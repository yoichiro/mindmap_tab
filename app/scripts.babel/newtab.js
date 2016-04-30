"use strict";

import MindMap from "./mindmap.js";
import Parser from "./parser.js";
import Work from "./work.js";

class Newtab {

  constructor() {
    this.mm = new MindMap("#target");
    this.currentWork = Work.newInstance();

    this.assignEventHandlers();
    this.loadWorkList();
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
        this.currentWork.save(() => {
          this.loadWorkList();
        });
      });
    });

    let btnLast = document.querySelector("#btnLast");
    btnLast.addEventListener("click", () => {
      Work.getLast(work => {
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
        Work.remove(this.currentWork, () => {
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
    Work.getAll(works => {
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

}

window.addEventListener("load", () => {
  new Newtab();
});
