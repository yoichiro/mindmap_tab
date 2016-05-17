"use strict";

import Token from "./token.js";

export default class Node {

  constructor(source) {
    this.tokens = [];
    this.children = [];
    this.parent = null;
    this.id = null;
    this.source = source ? source.trim() : "";
    this._parseText(this.source);
  }

  _parseText(source) {
    let re = /\[(.+?)]\((.+?)\)/g;
    let pos = 0;
    let rs = re.exec(source);
    while (rs) {
      if (pos < rs.index) {
        this.tokens.push(new Token(source.substring(pos, rs.index)));
      }
      let text = rs[1];
      let url = rs[2];
      this.tokens.push(new Token(text, url));
      pos = rs.index + rs[0].length;
      rs = re.exec(source);
    }
    if (pos < source.length) {
      this.tokens.push(new Token(source.substring(pos)));
    }
  }

  get text() {
    return this.tokens.map(token => { return token.text; }).join("");
  }

  static root(text) {
    return new Node(text);
  }

  add(text, callback) {
    let child = new Node(text);
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
