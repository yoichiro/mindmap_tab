"use strict";

export default class Token {

  constructor(text, url, bold, strikeThrough) {
    this.text = text;
    this.url = url;
    this.bold = bold;
    this.strikeThrough = strikeThrough;
  }

  hasUrl() {
    return this.url && this.url.length > 0;
  }

  isBold() {
    return this.bold;
  }

  isStrikeThrough() {
    return this.strikeThrough;
  }

  toHtml() {
    if (this.hasUrl()) {
      return "<a href=\"" + this.url + "\">" + this.escapeHTML(this.text) + "</a>";
    } else if (this.isBold()) {
      return "<span><b>" + this.escapeHTML(this.text) + "</b></span>";
    } else if (this.isStrikeThrough()) {
      return "<span><s>" + this.escapeHTML(this.text) + "</s></span>";
    } else {
      return "<span>" + this.escapeHTML(this.text) + "</span>";
    }
  }

  escapeHTML(html) {
    let e = document.createElement("div");
    e.appendChild(document.createTextNode(html));
    return e.innerHTML;
  }

}
