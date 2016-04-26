"use strict";

import MindMap from "./mindmap.js";
import Parser from "./parser.js";
import Work from "./work.js";

let mm = new MindMap("#target");

let currentWork = Work.newInstance();

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

let drawMindmap = (callback) => {
  let source = document.querySelector("#source").value;
  let root = new Parser().parse(source);
  if (root) {
    currentWork.content = source;
    mm.draw(root);
  } else {
    mm.clear();
  }
  if (callback) {
    callback();
  }
}

let load = work => {
  currentWork = work;
  let source = document.querySelector("#source");
  source.value = currentWork.content;
  drawMindmap();
};

let toLocaleString = date => {
  return [
           date.getFullYear(),
           date.getMonth() + 1,
           date.getDate()
         ].join("/") + " "
         + date.toLocaleTimeString();
};

let loadWorkList = () => {
  Work.getAll(works => {
    let history = document.querySelector("#history");
    history.innerHTML = "";
    works.forEach(work => {
      let li = document.createElement("li");
      let link = document.createElement("a");
      link.href = "#";
      let label = work.firstLine + " (" + toLocaleString(new Date(work.created)) + ")";
      link.appendChild(document.createTextNode(label));
      link.addEventListener("click", ((x) => {
        return () => {
          load(x);
        };
      })(work));
      li.appendChild(link);
      history.appendChild(li);
    });
  });
};

source.addEventListener("keyup", () => {
  drawMindmap(() => {
    currentWork.save(() => {
      loadWorkList();
    });
  });
});

let btnLast = document.querySelector("#btnLast");
btnLast.addEventListener("click", () => {
  Work.getLast(work => {
    load(work);
  });
});

loadWorkList();

let btnDelete = document.querySelector("#btnDelete");
btnDelete.addEventListener("click", () => {
  if (currentWork.content) {
    let confirmMessage = document.querySelector("#confirmMessage");
    confirmMessage.innerText = "Do you really want to delete `" + currentWork.firstLine + "`?";
    $("#confirmDialog").modal("show");
  }
});

let btnConfirmYes = document.querySelector("#btnConfirmYes");
btnConfirmYes.addEventListener("click", () => {
  $("#confirmDialog").modal("hide");
  if (currentWork.content) {
    Work.remove(currentWork, () => {
      loadWorkList();
      load(Work.newInstance());
    });
  }
});

let btnNew = document.querySelector("#btnNew");
btnNew.addEventListener("click", () => {
  load(Work.newInstance());
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
    load(work);
  });
});
