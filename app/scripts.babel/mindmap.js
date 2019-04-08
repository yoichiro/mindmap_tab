"use strict";

import Bounds from "./bounds.js";
import Node from "./node.js";

const DEFAULT_TEXT_FONT_SIZE = 14;
const TEXT_FONT_FAMILY = "sans-serif";
const NODE_MARGIN_WIDTH = 25;
const NODE_MARGIN_HEIGHT = 15;
const NODE_LINE_MARGIN = 5;
const CENTER_NODE_MARGIN = 5;
const LINE_COLORS = ["#0000AA", "#00AA00", "#00AAAA", "#AA0000", "#AA00AA", "#AAAA00"];
const DEFAULT_LINE_COLOR = "gray";

export default class MindMap {

  constructor(newtab, targetElementId) {
    this.newtab = newtab;
    $.jCanvas.defaults.fromCenter = false;
    $.jCanvas.defaults.layer = true;
    this.canvasDom_ = document.querySelector(targetElementId);
    this._setupCanvasMoving();
    this.canvas_ = $(this.canvasDom_);
    this._initializeCanvas();
  }

  // Public functions

  draw(root) {
    this.clear();

    this._adjustFontSize();

    this._setNodeId(root);

    let leftChildren = null, rightChildren = null;
    [leftChildren, rightChildren] = this._divideBalancedNodes(root);

    let leftMaxTextLengthNodes = this._getMaxTextLengthNodes(leftChildren);
    let rightMaxTextLengthNodes = this._getMaxTextLengthNodes(rightChildren);

    let leftLeafCount = this._getAllLeafCount(leftChildren);
    let rightLeafCount = this._getAllLeafCount(rightChildren);

    let canvasSize = this._getCanvasSize(root, leftLeafCount, rightLeafCount, leftMaxTextLengthNodes, rightMaxTextLengthNodes);
    this._drawBackgroundColor(canvasSize);

    let centerNodeBounds = this._drawCenterNode(
      canvasSize.leftNodesWidth,
      Math.max(canvasSize.height / 2 - this._getFontSize() - CENTER_NODE_MARGIN, 0),
      root.id,
      root.text,
      root.position);

    let leftHeightMargin = 0;
    let rightHeightMargin = 0;
    if (canvasSize.leftHeight < canvasSize.rightHeight) {
      leftHeightMargin = (canvasSize.rightHeight - canvasSize.leftHeight) / 2;
    } else {
      rightHeightMargin = (canvasSize.leftHeight - canvasSize.rightHeight) / 2;
    }
    this._drawLeftNodeChildrenFromCenterNode(leftChildren, centerNodeBounds, leftHeightMargin);
    this._drawRightNodeChildrenFromCenterNode(rightChildren, centerNodeBounds, rightHeightMargin);

    this._adjustCanvasSize(canvasSize);
  }

  clear() {
    this.canvas_.removeLayers();
    this.canvas_.drawLayers();
    this._resetLineColorIndex();
  }

  saveAsImage(title, format) {
    this.canvasDom_.toBlob(blob => {
      const anchor = document.createElement("a");
      const url = window.URL.createObjectURL(blob);
      anchor.href = url;
      anchor.target = "_blank";
      anchor.download = title + "." + format;
      anchor.click();
    }, "image/" + format);
  }

  changeLineColorMode(state) {
    localStorage.lineColorMode = state;
  }

  // Private functions

  _getFontSize() {
    return Number(localStorage.fontSize || DEFAULT_TEXT_FONT_SIZE);
  }

  _adjustFontSize() {
    this.canvasDom_.style.fontSize = this._getFontSize() + "px";
    this.canvasDom_.getContext("2d").font = this._getFontSize() + "px " + TEXT_FONT_FAMILY;
  }

  _getNodeHeight() {
    return this._getFontSize() + NODE_LINE_MARGIN + 1;
  }

  _getNodeHeightWithMargin() {
    return this._getNodeHeight() + NODE_MARGIN_HEIGHT;
  }

  _resetLineColorIndex() {
    this.lineColorIndex = 0;
  }

  _changeLineColorIndex() {
    this.lineColorIndex += 1;
    if (LINE_COLORS.length <= this.lineColorIndex) {
      this.lineColorIndex = 0;
    }
  }

  _getLineColor() {
    const lineColorMode = JSON.parse(localStorage.lineColorMode || "false");
    if (lineColorMode) {
      return LINE_COLORS[this.lineColorIndex];
    } else {
      return DEFAULT_LINE_COLOR;
    }
  }

  _setupCanvasMoving() {
    let x, y, sx, sy, dragging;
    this.canvasDom_.addEventListener("mousedown", e => {
      x = e.pageX;
      y = e.pageY;
      sx = this.canvasDom_.parentNode.scrollLeft;
      sy = this.canvasDom_.parentNode.scrollTop;
      dragging = true;
      this.canvasDom_.style.cursor = "move";
    });
    this.canvasDom_.addEventListener("mousemove", e => {
      if (dragging) {
        this.canvasDom_.parentNode.scrollLeft = sx - (e.pageX - x);
        this.canvasDom_.parentNode.scrollTop = sy - (e.pageY - y);
      }
    });
    this.canvasDom_.addEventListener("mouseup", () => {
      dragging = false;
      this.canvasDom_.style.cursor = "default";
    });
    this.canvasDom_.addEventListener("mouseleave", () => {
      dragging = false;
      this.canvasDom_.style.cursor = "default";
    });
    this.canvasDom_.addEventListener("touchstart", e => {
      x = e.changedTouches[0].pageX;
      y = e.changedTouches[0].pageY;
      sx = this.canvasDom_.parentNode.scrollLeft;
      sy = this.canvasDom_.parentNode.scrollTop;
      dragging = true;
      this.canvasDom_.style.cursor = "move";
    });
    this.canvasDom_.addEventListener("touchmove", e => {
      if (dragging) {
        this.canvasDom_.parentNode.scrollLeft = sx - (e.changedTouches[0].pageX - x);
        this.canvasDom_.parentNode.scrollTop = sy - (e.changedTouches[0].pageY - y);
      }
    });
    this.canvasDom_.addEventListener("touchend", () => {
      dragging = false;
      this.canvasDom_.style.cursor = "default";
    });
  }

  _setNodeId(node) {
    let id = 0;
    Node.visit(node, x => {
      x.id = id;
      id += 1;
    });
  }

  _adjustCanvasSize(canvasSize) {
    this.canvas_.attr("width", canvasSize.width);
    this.canvas_.attr("height", canvasSize.height);
    this.canvas_.drawLayers();
  }

  _sum(x) {
    if (x.length > 0) {
      return x.reduce((p, c) => {
        return p + c;
      });
    } else {
      return 0;
    }
  }

  _measureText(text) {
    const context = this.canvasDom_.getContext("2d");
    return context.measureText(text).width;
  }

  _drawText(x, y, name, text, position, bold, strikeThrough) {
    this.canvas_.drawText({
      fillStyle: strikeThrough ? "lightgray" : bold ? "red" : "black",
      // strokeStyle: "black",
      strokeWidth: "0",
      x: x,
      y: y,
      fontSize: this._getFontSize(),
      fontFamily: TEXT_FONT_FAMILY,
      text: text,
      name: name + "-text",
      click: (position => {
        return () => {
          this.newtab.jumpCaretTo(position);
        };
      })(position)
    });
    return this.canvas_.getLayer(name + "-text");
  }

  _drawLink(x, y, name, text, url) {
    this.canvas_.drawText({
      fillStyle: "blue",
      // strokeStyle: "black",
      strokeWidth: "0",
      x: x,
      y: y,
      fontSize: this._getFontSize(),
      fontFamily: TEXT_FONT_FAMILY,
      text: text,
      name: name + "-text",
      click: (url => {
        return (layout) => {
          if (layout.event.shiftKey) {
            window.open(url);
          } else {
            location.href = url;
          }
        };
      })(url),
      cursors: {
        mouseover: "pointer"
      }
    });
    return this.canvas_.getLayer(name + "-text");
  }

  _initializeCanvas() {
    let dummyTextLayer = this._drawText(0, 0, "dummy", "", 0, false, false);
    this.canvas_.removeLayer(dummyTextLayer).drawLayers();
  }

  _drawRect(x, y, width, height, name) {
    this.canvas_.drawRect({
      strokeStyle: "gray",
      strokeWidth: 1,
      x: x,
      y: y,
      width: width,
      height: height,
      cornerRadius: 5,
      name: name + "-rect",
      intangible: true
    });
    return this.canvas_.getLayer(name + "-rect");
  }

  _drawLine(x1, y1, x2, y2, name) {
    this.canvas_.drawLine({
      strokeStyle: this._getLineColor(),
      strokeWidth: 1,
      x1: x1, y1: y1,
      x2: x2, y2: y2,
      name: name + "-line"
    });
    return this.canvas_.getLayer(name + "-line");
  }

  _drawCenterNode(x, y, name, text, position) {
    let textLayer = this._drawText(x + CENTER_NODE_MARGIN, y + CENTER_NODE_MARGIN, name, text, position, false, false);
    let width = textLayer.width + CENTER_NODE_MARGIN * 2;
    let height = textLayer.height + CENTER_NODE_MARGIN * 2;
    this._drawRect(x, y, width, height, name);
    return new Bounds(x, y, width, height);
  }

  _drawNode(x, y, isLeftBase, node) {
    let textWidth = this._measureText(node.text);
    if (isLeftBase) {
      // this._drawText(x, y, node.id, node.text);
      this._drawTokens(x, y, node);
      this._drawLine(x, y + this._getFontSize() + NODE_LINE_MARGIN, x + textWidth, y + this._getFontSize() + NODE_LINE_MARGIN, node.id);
      return new Bounds(x, y, textWidth, this._getFontSize() + NODE_LINE_MARGIN);
    } else {
      // this._drawText(x - textWidth, y, node.id, node.text);
      this._drawTokens(x - textWidth, y, node);
      this._drawLine(x - textWidth, y + this._getFontSize() + NODE_LINE_MARGIN, x, y + this._getFontSize() + NODE_LINE_MARGIN, node.id);
      return new Bounds(x - textWidth, y, textWidth, this._getFontSize() + NODE_LINE_MARGIN);
    }
  }

  _drawTokens(x, y, node) {
    let cx = x;
    node.tokens.forEach((token, index) => {
      let layer;
      if (token.hasUrl()) {
        layer = this._drawLink(cx, y, node.id + "-" + index, token.text, token.url);
      } else {
        layer = this._drawText(cx, y, node.id + "-" + index, token.text, node.position, token.isBold(), token.isStrikeThrough());
      }
      cx = cx + layer.width;
    });
  }

  _connectNodeToCenterNode(nodeBounds, centerNodeBounds, name) {
    let isLeft = nodeBounds.x2 < centerNodeBounds.x1;
    let x1 = isLeft ? nodeBounds.x2 : nodeBounds.x1;
    let y1 = nodeBounds.y1 + nodeBounds.height;
    let cx1 = isLeft ? centerNodeBounds.x1 : centerNodeBounds.x1 + centerNodeBounds.width;
    let cy1 = nodeBounds.y1 + nodeBounds.height;
    let cx2 = isLeft ? nodeBounds.x2 : nodeBounds.x1;
    let cy2 = centerNodeBounds.y1 + centerNodeBounds.height / 2;
    let x2 = isLeft ? centerNodeBounds.x1 : centerNodeBounds.x2;
    let y2 = centerNodeBounds.y1 + centerNodeBounds.height / 2;
    this.canvas_.drawBezier({
                              strokeStyle: this._getLineColor(),
                              strokeWidth: 1,
                              x1: x1, y1: y1,
                              cx1: cx1, cy1: cy1,
                              cx2: cx2, cy2: cy2,
                              x2: x2, y2: y2,
                              name: name + "-bezier"
                            });
  }

  _connectNodes(parentBounds, childBounds, name) {
    let isLeft = childBounds.x2 < parentBounds.x1;
    let x1 = isLeft ? childBounds.x2 : childBounds.x1;
    let y1 = childBounds.y1 + childBounds.height;
    let cx1 = isLeft ? parentBounds.x1 : parentBounds.x1 + parentBounds.width;
    let cy1 = childBounds.y1 + childBounds.height;
    let cx2 = isLeft ? childBounds.x2 : childBounds.x1;
    let cy2 = parentBounds.y2;
    let x2 = isLeft ? parentBounds.x1 : parentBounds.x2;
    let y2 = parentBounds.y2;
    this.canvas_.drawBezier({
                              strokeStyle: this._getLineColor(),
                              strokeWidth: 1,
                              x1: x1, y1: y1,
                              cx1: cx1, cy1: cy1,
                              cx2: cx2, cy2: cy2,
                              x2: x2, y2: y2,
                              name: name + "-bezier"
                            });
  }

  _getLeafCount(node) {
    let leafCount = 0;
    Node.visit(node, x => {
      if (x.isLeaf()) {
        leafCount += 1;
      }
    });
    return leafCount;
  }

  _getDivideIndex(root) {
    let leafCountList = root.children.map(child => {
      return this._getLeafCount(child);
    });
    let minDelta = null;
    let divideIndex = null;
    leafCountList.forEach((leafCount, index) => {
      if (index < leafCountList.length - 1) {
        let sum = (prev, current) => {
          return prev + current;
        };
        let leftSum = leafCountList.slice(0, index + 1).reduce(sum);
        let rightSum = leafCountList.slice(index + 1).reduce(sum);
        let delta = Math.abs(leftSum - rightSum);
        if (minDelta !== null) {
          if (delta < minDelta) {
            minDelta = delta;
            divideIndex = index;
          }
        } else {
          minDelta = delta;
          divideIndex = index;
        }
      }
    });
    return divideIndex;
  }

  _divideBalancedNodes(root) {
    const wingMode = localStorage.wingMode || "both";
    if (wingMode === "both") {
      let divideIndex = this._getDivideIndex(root);
      let left = root.children.slice(0, divideIndex + 1);
      let right = root.children.slice(divideIndex + 1);
      return [left, right];
    } else if (wingMode === "right") {
      return [[], root.children];
    } else {
      return [root.children, []];
    }
  }

  _getAllTextLength(nodes) {
    if (nodes.length > 0) {
      let sizes = nodes.map(x => {
        return this._measureText(x.text);
      });
      sizes.push((sizes.length - 1) * NODE_MARGIN_WIDTH);
      return this._sum(sizes);
    } else {
      return 0;
    }
  }

  _getMaxTextLengthNodes(children) {
    let maxLengthNodes = [];
    let traverse = (children, prev) => {
      children.forEach(node => {
        let nodes = prev.slice();
        nodes.push(node);
        if (node.isLeaf()) {
          if (this._getAllTextLength(maxLengthNodes) < this._getAllTextLength(nodes)) {
            maxLengthNodes = nodes;
          }
        } else {
          traverse(node.children, nodes);
        }
      });
    };
    traverse(children, []);
    return maxLengthNodes;
  }

  _getAllLeafCount(nodes) {
    return this._sum(nodes.map(node => {
      return this._getLeafCount(node);
    }));
  }

  _getCanvasSize(root, leftLeafCount, rightLeafCount, leftMaxTextLengthNodes, rightMaxTextLengthNodes) {
    const getWidth = nodes => {
      return this._sum(nodes.map(node => {
        return this._measureText(node.text) + NODE_MARGIN_WIDTH;
      }));
    };
    const leftNodesWidth = getWidth(leftMaxTextLengthNodes);
    const rightNodesWidth = getWidth(rightMaxTextLengthNodes);
    const centerNodeWidth = this._measureText(root.text) + CENTER_NODE_MARGIN * 2 + 1;
    const width = leftNodesWidth + rightNodesWidth + centerNodeWidth;
    let height = Math.max(this._getNodeHeightWithMargin() * Math.max(leftLeafCount, rightLeafCount), this._getFontSize() + CENTER_NODE_MARGIN * 2);
    const leftHeight = this._getNodeHeightWithMargin() * leftLeafCount;
    const rightHeight = this._getNodeHeightWithMargin() * rightLeafCount;
    return {
      width: width,
      height: height,
      leftNodesWidth: leftNodesWidth,
      rightNodesWidth: rightNodesWidth,
      centerNodeWidth: centerNodeWidth,
      leftHeight: leftHeight,
      rightHeight: rightHeight
    };
  }

  _drawLeftNodeChildrenFromNode(children, parentNodeBounds, baseHeight) {
    let currentHeight = baseHeight;
    children.forEach(node => {
      let allNodesHeight = this._getLeafCount(node) * this._getNodeHeightWithMargin();
      let y = currentHeight + allNodesHeight / 2 - this._getNodeHeight() / 2;
      let x = parentNodeBounds.x - NODE_MARGIN_WIDTH;
      let nodeBounds = this._drawNode(x, y, false, node);
      this._connectNodes(parentNodeBounds, nodeBounds, node.id);
      this._drawLeftNodeChildrenFromNode(node.children, nodeBounds, currentHeight);
      currentHeight += allNodesHeight;
    });
  }

  _drawLeftNodeChildrenFromCenterNode(children, centerNodeBounds, topMargin) {
    let currentHeight = topMargin;
    children.forEach(node => {
      let allNodesHeight = this._getLeafCount(node) * this._getNodeHeightWithMargin();
      let y = currentHeight + allNodesHeight / 2 - this._getNodeHeight() / 2;
      let x = centerNodeBounds.x - NODE_MARGIN_WIDTH;
      let nodeBounds = this._drawNode(x, y, false, node);
      this._connectNodeToCenterNode(nodeBounds, centerNodeBounds, node.id);
      this._drawLeftNodeChildrenFromNode(node.children, nodeBounds, currentHeight);
      currentHeight += allNodesHeight;
      this._changeLineColorIndex();
    });
  }

  _drawRightNodeChildrenFromNode(children, parentNodeBounds, baseHeight) {
    let currentHeight = baseHeight;
    children.forEach(node => {
      let allNodesHeight = this._getLeafCount(node) * this._getNodeHeightWithMargin();
      let y = currentHeight + allNodesHeight / 2 - this._getNodeHeight() / 2;
      let x = parentNodeBounds.x2 + NODE_MARGIN_WIDTH;
      let nodeBounds = this._drawNode(x, y, true, node);
      this._connectNodes(parentNodeBounds, nodeBounds, node.id);
      this._drawRightNodeChildrenFromNode(node.children, nodeBounds, currentHeight);
      currentHeight += allNodesHeight;
    });
  }

  _drawRightNodeChildrenFromCenterNode(children, centerNodeBounds, topMargin) {
    let currentHeight = topMargin;
    children.forEach(node => {
      let allNodesHeight = this._getLeafCount(node) * this._getNodeHeightWithMargin();
      let y = currentHeight + allNodesHeight / 2 - this._getNodeHeight() / 2;
      let x = centerNodeBounds.x2 + NODE_MARGIN_WIDTH;
      let nodeBounds = this._drawNode(x, y, true, node);
      this._connectNodeToCenterNode(nodeBounds, centerNodeBounds, node.id);
      this._drawRightNodeChildrenFromNode(node.children, nodeBounds, currentHeight);
      currentHeight += allNodesHeight;
      this._changeLineColorIndex();
    });
  }

  _drawBackgroundColor(canvasSize) {
    this.canvas_.drawRect({
      fillStyle: "white",
      x: 0,
      y: 0,
      width: canvasSize.width,
      height: canvasSize.height
    });
  }

}
