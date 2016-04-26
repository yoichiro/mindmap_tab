"use strict";

export default class Token {

  constructor(text, url) {
    this.text = text;
    this.url = url;
  }

  hasUrl() {
    return this.url && this.url.length > 0;
  }

}
