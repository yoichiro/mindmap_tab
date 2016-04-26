"use strict";

export default class Bounds {

  constructor(x, y, width, height) {
    this.x = x;
    this.x1 = x;
    this.y = y;
    this.y1 = y;
    this.width = width;
    this.height = height;
    this.x2 = x + width;
    this.y2 = y + height;
  }

}
