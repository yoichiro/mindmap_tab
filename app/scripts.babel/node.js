"use strict";

import Token from "./token.js";

export default class Node {

  constructor(source, position) {
    this.tokens = [];
    this.children = [];
    this.parent = null;
    this.id = null;
    this.source = source ? source.trim() : "";
    this._parseText(this.source);
    this.position = position;
  }

  _parseText(source) {
    const tempTokens = this._parseUrl(source);
    tempTokens.forEach(token => {
      if (token.hasUrl()) {
        this.tokens.push(token);
      } else{
        this._parseStrikeThrough(token).forEach(x => {
          this._parseBold(x).forEach(y => {
            this.tokens.push(y);
          });
        })
      }
    });
  }

  _parseStrikeThrough(token) {
    const source = token.text;
    const re = /\~\~(.+?)\~\~/g;
    let pos = 0;
    let rs = re.exec(source);
    const tempTokens = [];
    while (rs) {
      if (pos < rs.index) {
        tempTokens.push(new Token(source.substring(pos, rs.index), null, token.isBold(), false));
      }
      let text = rs[1];
      tempTokens.push(new Token(text, null, token.isBold(), true));
      pos = rs.index + rs[0].length;
      rs = re.exec(source);
    }
    if (pos < source.length) {
      tempTokens.push(new Token(source.substring(pos), null, token.isBold(), false));
    }
    return tempTokens;
  }

  _parseBold(token) {
    const source = token.text;
    const re = /\*\*(.+?)\*\*/g;
    let pos = 0;
    let rs = re.exec(source);
    const tempTokens = [];
    while (rs) {
      if (pos < rs.index) {
        tempTokens.push(new Token(source.substring(pos, rs.index), null, false, token.isStrikeThrough()));
      }
      let text = rs[1];
      tempTokens.push(new Token(text, null, true, token.isStrikeThrough()));
      pos = rs.index + rs[0].length;
      rs = re.exec(source);
    }
    if (pos < source.length) {
      tempTokens.push(new Token(source.substring(pos), null, false, token.isStrikeThrough()));
    }
    return tempTokens;
  }

  _parseUrl(source) {
    const re = /\[(.+?)]\((.+?)\)/g;
    let pos = 0;
    let rs = re.exec(source);
    const tempTokens = [];
    while (rs) {
      if (pos < rs.index) {
        tempTokens.push(new Token(source.substring(pos, rs.index), null, false, false));
      }
      let text = rs[1];
      let url = rs[2];
      tempTokens.push(new Token(text, url, false, false));
      pos = rs.index + rs[0].length;
      rs = re.exec(source);
    }
    if (pos < source.length) {
      tempTokens.push(new Token(source.substring(pos), null, false, false));
    }
    return tempTokens;
  }

  get text() {
    return this.tokens.map(token => { return token.text; }).join("");
  }

  get html() {
    return this.tokens.map(token => { return token.toHtml(); }).join("");
  }

  static root(text) {
    return new Node(text, 0);
  }

  add(text, position, callback) {
    let child = new Node(text, position);
    child.setParent(this);
    this.children.push(child);
    if (callback) {
      callback(child);
    }
    return this;
  }

  setParent(parent) {
    this.parent = parent;
  }

  isRoot() {
    return this.parent == null;
  }

  isLeaf() {
    return this.children.length === 0;
  }

  static visit(node, callback) {
    callback(node);
    node.children.forEach(child => {
      Node.visit(child, callback);
    });
  }

}
