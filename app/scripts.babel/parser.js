"use strict";

import Node from "./node.js";

export default class Parser {

  // Public functions

  parse(source, filterStrikeThroughText) {
    const lines = source.split(/\n/);
    let root = null;
    let prevNode = null;
    let prevLevel = -1;
    let position = 0;
    for (let i = 0; i < lines.length; i += 1) {
      const trimedLine = this._trim(lines[i]);
      if (trimedLine && this._canShowText(filterStrikeThroughText, trimedLine)) {
        const level = this._getIndentLevel(lines[i]);
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
            const parentNode = prevNode.parent;
            if (parentNode) {
              let node = null;
              parentNode.add(lines[i], position + level, x => {
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
              parentNode.add(lines[i], position + level, x => {
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
            prevNode.add(lines[i], position + level, x => {
              node = x;
            });
            prevLevel = level;
            prevNode = node;
          } else {
            console.log("Invalid indent.", i, lines[i]);
            // return null;
          }
        }
      }
      position += lines[i].length + 1;
    }
    return root;
  }

  // Private functions

  _canShowText(filterStrikeThroughText, line) {
    if (filterStrikeThroughText) {
      return !/^\~\~[^~]+\~\~$/.test(line);
    } else {
      return true;
    }
  }

  _getIndentLevel(text) {
    let level = 0;
    let inSpaces = false;
    let spaceCount = 0;
    for (let i = 0; i < text.length; i += 1) {
      if (text.charAt(i) === "\t" && !inSpaces) {
        level += 1;
      } else if (text.charAt(i) === " ") {
        inSpaces = true;
        spaceCount += 1;
        if (spaceCount === 4) {
          level += 1;
          inSpaces = false;
          spaceCount = 0;
        }
      } else {
        break;
      }
    }
    return level;
  }

  _trim(text) {
    let result = "";
    for (let i = 0; i < text.length; i += 1) {
      if (text.charAt(i) !== "\t" && text.charAt(i) !== " ") {
        result += text.charAt(i);
      }
    }
    return result;
  }

}
