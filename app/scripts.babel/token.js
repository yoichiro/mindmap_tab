"use strict";

export default class Token {

  constructor(text, url) {
    this.text = text;
    this.url = url;
  }

  hasUrl() {
    return this.url && this.url.length > 0;
  }

  toHtml() {
    if (this.hasUrl()) {
      return "<a href=\"" + this.url + "\">" + this.escapeHTML(this.text) + "</a>";
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
