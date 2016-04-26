"use strict";

import Node from "./node.js";

export default class Parser {

  // Public functions

  parse(source) {
    let lines = source.split(/\r\n|\r|\n/);
    let root = null;
    let prevNode = null;
    let prevLevel = -1;
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].trim()) {
        let level = this._getIndentLevel(lines[i]);
        if (i === 0) {
          if (level === 0) {
            root = Node.root(lines[i]);
            prevNode = root;
            prevLevel = 0;
          } else {
            console.log("Invalid first line.");
            return null;
          }
        } else {
          if (prevLevel === level) {
            let parentNode = prevNode.parent;
            if (parentNode) {
              let node = null;
              parentNode.add(lines[i], x => {
                node = x;
              });
              prevLevel = level;
              prevNode = node;
            } else {
              console.log("Parent is null.");
              return null;
            }
          } else if (level < prevLevel) {
            let parentNode = prevNode.parent;
            for (let j = 0; j < prevLevel - level; j += 1) {
              parentNode = parentNode.parent;
            }
            if (parentNode) {
              let node = null;
              parentNode.add(lines[i], x => {
                node = x;
              });
              prevLevel = level;
              prevNode = node;
            } else {
              console.log("Parent is null.");
              return null;
            }
          } else if (prevLevel === level - 1) {
            let node = null;
            prevNode.add(lines[i], x => {
              node = x;
            });
            prevLevel = level;
            prevNode = node;
          } else {
            console.log("Invalid indent.");
            return null;
          }
        }
      }
    }
    return root;
  }

  // Private functions

  _getIndentLevel(text) {
    let level = 0;
    for (let i = 0; i < text.length; i += 1) {
      if (text.charAt(i) === "\t") {
        level += 1;
      } else {
        break;
      }
    }
    return level;
  }

}
