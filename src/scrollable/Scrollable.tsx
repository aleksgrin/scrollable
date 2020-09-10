import React from "react";
import cx from "classnames";
import { Inits } from "./Inits";
import { IScrollWrapProps } from "./types";
import { ScrollControlsY, ScrollControlsX } from "./ScrollControls";
import "./scrollable.scss";

class ScrollWrap extends Inits {
  componentDidMount() {
    this.initEventListeners();
    this.updateScrollData("y", () =>
      this.scrollToActiveItem(this.props.activeItem, null)
    );
    this.updateScrollData("x", () =>
      this.scrollToActiveItem(this.props.activeItem, null)
    );
    this.printWarnings();
  }

  componentWillUnmount() {
    this.destroyEventListeners();
  }

  componentDidUpdate(prevProps: IScrollWrapProps) {
    const { activeItem: currentActiveItem } = this.props;
    const { activeItem: prevActiveItem } = prevProps;
    this.scrollToActiveItem(currentActiveItem, prevActiveItem);
  }

  render() {
    const { className, children } = this.props;
    const {
      crollPersentage,
      scroll,
      offset,
      isRenderScroll,
      transition,
      scrollBars,
    } = this.state;

    const visibility = this.props.options?.scrollBarsBehavior?.visibility;

    const isRenderBarsY = visibility !== "none" && isRenderScroll.y;
    const isRenderBarsX = visibility !== "none" && isRenderScroll.x;
    return (
      <div className={cx("scrollable", className)}>
        <div
          className="scrollable__inner"
          onTouchStart={this.onTouchStart}
          onWheel={this.onWheel}
          onMouseOver={this.onMouseOver}
          onMouseLeave={this.onMouseLeave}
          onClick={this.onClick}
          ref={this.wrapperOut}
        >
          <div
            className={cx("scrollable__content", {
              [`${className}__content`]: className,
            })}
            style={{
              transform: `translate3d(${offset.x}px,${offset.y}px, 0)`,
              transition: transition,
            }}
            ref={this.wrapperInner}
          >
            {children}
          </div>
        </div>
        {isRenderBarsY && (
          <ScrollControlsY
            crollPersentage={crollPersentage.y}
            scrollPosition={scroll.y}
            transitionValue={transition}
            scrollBars={scrollBars}
            onMouseDown={this.onMouseDown}
            ref={this.scrollWrapperOutY}
          />
        )}
        {isRenderBarsX && (
          <ScrollControlsX
            crollPersentage={crollPersentage.x}
            scrollPosition={scroll.x}
            onMouseDown={this.onMouseDown}
            transitionValue={transition}
            scrollBars={scrollBars}
            ref={this.scrollWrapperOutX}
          />
        )}
      </div>
    );
  }
}

export default ScrollWrap;
