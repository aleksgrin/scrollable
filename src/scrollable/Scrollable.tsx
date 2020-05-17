import React, { PureComponent, createRef, forwardRef } from "react";
import cx from "classnames";
import "./scrollable.scss";

interface IScrollWrapProps {
  className?: string;
  scrollBars?: boolean;
}

interface IInitialState {
  x: number;
  y: number;
}
interface IState {
  offset: IInitialState;
  scroll: IInitialState;
  crollPersentage: IInitialState;
}

class ScrollWrap extends PureComponent<IScrollWrapProps, IState> {
  state: IState = {
    offset: { x: 0, y: 0 },
    scroll: { x: 0, y: 0 },
    crollPersentage: { x: 0, y: 0 },
  };

  scrollData = {
    isTouchStarted: false,
    isCursorInside: false,
    start: { x: 0, y: 0 },
    constantOffset: { x: 0, y: 0 },
    isRenderScroll: { x: true, y: true },
    MAX_OFFSET: { x: 0, y: 0 },
    MIN_OFFSET: { x: 0, y: 0 },
    MAX_SCROLL: { x: 0, y: 0 },
    MIN_SCROLL: { x: 0, y: 0 },
  };

  wrapperOut = createRef<HTMLDivElement>();
  wrapperInner = createRef<HTMLDivElement>();
  scrollWrapperOutY = createRef<HTMLDivElement>();
  scrollWrapperOutX = createRef<HTMLDivElement>();

  getTouchCoords = (evt: React.TouchEvent) => {
    const x = evt.changedTouches[0].clientX;
    const y = evt.changedTouches[0].clientY;
    return { x, y };
  };

  onTouchStart = (evt: React.TouchEvent) => {
    const constantOffsetX = this.state.offset.x;
    const constantOffsetY = this.state.offset.y;
    const touchStartX = this.getTouchCoords(evt).x;
    const touchStartY = this.getTouchCoords(evt).y;

    this.scrollData.isTouchStarted = true;
    this.scrollData.constantOffset = { x: constantOffsetX, y: constantOffsetY };
    this.scrollData.start = { x: touchStartX, y: touchStartY };
  };

  onTouchEnd = () => {
    this.scrollData.isTouchStarted = false;
  };

  onMove = (evt: React.TouchEvent) => {
    const {
      isTouchStarted,
      constantOffset,
      start,
      isRenderScroll,
    } = this.scrollData;
    if (isTouchStarted) {
      if (isRenderScroll.x) {
        const end = this.getTouchCoords(evt).x;
        const nextOffset = constantOffset.x + end - start.x;
        this.setScrollX(nextOffset);
      }
      if (isRenderScroll.y) {
        const end = this.getTouchCoords(evt).y;
        const nextOffset = constantOffset.y + end - start.y;
        this.setScrollY(nextOffset);
      }
    }
  };

  getBoundaryValue = (value: number, min: number, max: number) => {
    if (value >= max) {
      return max;
    }
    if (value <= min) {
      return min;
    }
    return value;
  };

  setScrollX = (offset: number) => {
    const {
      MAX_OFFSET: { x: MAX_OFFSET_X },
      MIN_OFFSET: { x: MIN_OFFSET_X },
      MAX_SCROLL: { x: MAX_SCROLL_X },
      MIN_SCROLL: { x: MIN_SCROLL_X },
    } = this.scrollData;

    const nextLeft = Math.round((-offset * MAX_SCROLL_X) / MAX_OFFSET_X);
    const boundaryOffset = -this.getBoundaryValue(
      -offset,
      MIN_OFFSET_X,
      MAX_OFFSET_X
    );

    const boundaryLeft = this.getBoundaryValue(
      nextLeft,
      MIN_SCROLL_X,
      MAX_SCROLL_X
    );

    this.setState((prevState) => ({
      offset: {
        ...prevState.offset,
        x: boundaryOffset,
      },
      scroll: {
        ...prevState.scroll,
        x: boundaryLeft,
      },
    }));
  };

  setScrollY = (offset: number) => {
    const {
      MAX_OFFSET: { y: MAX_OFFSET_Y },
      MIN_OFFSET: { y: MIN_OFFSET_Y },
      MAX_SCROLL: { y: MAX_SCROLL_Y },
      MIN_SCROLL: { y: MIN_SCROLL_Y },
    } = this.scrollData;

    const nextTop = Math.round((-offset * MAX_SCROLL_Y) / MAX_OFFSET_Y);
    const boundaryOffset = -this.getBoundaryValue(
      -offset,
      MIN_OFFSET_Y,
      MAX_OFFSET_Y
    );

    const boundaryTop = this.getBoundaryValue(
      nextTop,
      MIN_SCROLL_Y,
      MAX_SCROLL_Y
    );

    this.setState((prevState) => ({
      offset: {
        ...prevState.offset,
        y: boundaryOffset,
      },
      scroll: {
        ...prevState.scroll,
        y: boundaryTop,
      },
    }));
  };

  onScroll = (evt: React.WheelEvent) => {
    if (this.scrollData.isRenderScroll.y) {
      const nextOffsetY = this.state.offset.y - evt.deltaY;
      this.setScrollY(nextOffsetY);
    }
    if (this.scrollData.isRenderScroll.x) {
      const nextOffsetX = this.state.offset.x - evt.deltaX;
      this.setScrollX(nextOffsetX);
    }
  };

  onMouseOver = () => (this.scrollData.isCursorInside = true);

  onMouseLeave = () => (this.scrollData.isCursorInside = false);

  onWheel = (evt: WheelEvent) =>
    this.scrollData.isCursorInside && evt.preventDefault();

  onTouchMove = (evt: TouchEvent) =>
    this.scrollData.isTouchStarted && evt.preventDefault();

  getCenterCoords = (elem: HTMLElement) => {
    const outerRect = this.wrapperOut.current!.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();

    const centerX = (outerRect.width - elemRect.width) / 2;
    const centerY = (outerRect.height - elemRect.height) / 2;
    return { centerX, centerY };
  };

  onClick = (evt: React.SyntheticEvent) => {
    const targetElem = evt.target as HTMLElement;
    const { offsetLeft, offsetTop } = targetElem;
    const { centerX, centerY } = this.getCenterCoords(targetElem);

    if (this.scrollData.isRenderScroll.y) {
      this.setScrollY(-(offsetTop - centerY));
    }
    if (this.scrollData.isRenderScroll.x) {
      this.setScrollX(-(offsetLeft - centerX));
    }
  };

  getDOMRectY = () => {
    const wrapperOutHeight = this.wrapperOut.current!.getBoundingClientRect()
      .height;
    const wrapperInnerHeight = this.wrapperInner.current!.getBoundingClientRect()
      .height;
    const scrollWrapperOutHeight = this.scrollWrapperOutY.current!.getBoundingClientRect()
      .height;

    return {
      wrapperOutHeight,
      wrapperInnerHeight,
      scrollWrapperOutHeight,
    };
  };

  getDOMRectX = () => {
    const wrapperOutWidth = this.wrapperOut.current!.getBoundingClientRect()
      .width;
    const wrapperInnerWidth = this.wrapperInner.current!.getBoundingClientRect()
      .width;
    const scrollWrapperOutWidth = this.scrollWrapperOutX.current!.getBoundingClientRect()
      .width;

    return {
      wrapperOutWidth,
      wrapperInnerWidth,
      scrollWrapperOutWidth,
    };
  };

  updateScrollDataY = () => {
    const {
      wrapperOutHeight,
      wrapperInnerHeight,
      scrollWrapperOutHeight,
    } = this.getDOMRectY();

    if (
      wrapperOutHeight !== undefined &&
      wrapperInnerHeight !== undefined &&
      scrollWrapperOutHeight !== undefined
    ) {
      const MAX_OFFSET_Y = wrapperInnerHeight - wrapperOutHeight;
      const crollPersentageY = (1 - MAX_OFFSET_Y / wrapperInnerHeight) * 100;
      const MAX_SCROLL_TOP =
        scrollWrapperOutHeight -
        (scrollWrapperOutHeight * crollPersentageY) / 100;

      this.scrollData.MAX_OFFSET.y = MAX_OFFSET_Y;
      this.scrollData.MAX_SCROLL.y = MAX_SCROLL_TOP;

      this.scrollData.isRenderScroll.y = MAX_OFFSET_Y > 0;

      this.setState((prevState) => ({
        crollPersentage: {
          ...prevState.crollPersentage,
          y: crollPersentageY,
        },
      }));
    }
  };

  updateScrollDataX = () => {
    const {
      wrapperOutWidth,
      wrapperInnerWidth,
      scrollWrapperOutWidth,
    } = this.getDOMRectX();

    if (
      wrapperOutWidth !== undefined &&
      wrapperInnerWidth !== undefined &&
      scrollWrapperOutWidth !== undefined
    ) {
      const MAX_OFFSET_X = wrapperInnerWidth - wrapperOutWidth;
      const crollPersentageX = (1 - MAX_OFFSET_X / wrapperInnerWidth) * 100;
      const MAX_SCROLL_LEFT =
        scrollWrapperOutWidth -
        (scrollWrapperOutWidth * crollPersentageX) / 100;

      this.scrollData.MAX_OFFSET.x = MAX_OFFSET_X;
      this.scrollData.MAX_SCROLL.x = MAX_SCROLL_LEFT;

      this.scrollData.isRenderScroll.x = MAX_OFFSET_X > 0;
      this.setState((prevState) => ({
        crollPersentage: {
          ...prevState.crollPersentage,
          x: crollPersentageX,
        },
      }));
    }
  };

  componentDidMount() {
    window.document.addEventListener("wheel", this.onWheel, {
      passive: false,
    });

    window.document.addEventListener("touchmove", this.onTouchMove, {
      passive: false,
    });

    this.updateScrollDataX();
    this.updateScrollDataY();
  }

  componentWillUnmount() {
    window.document.removeEventListener("wheel", this.onWheel);
    window.document.removeEventListener("touchmove", this.onTouchMove);
  }

  render() {
    const { className, children, scrollBars = true } = this.props;
    const { isTouchStarted, isRenderScroll } = this.scrollData;
    const { crollPersentage, scroll, offset } = this.state;

    const transitionValue = "transform ease 0.5s";
    const isRenderScrollBarsY = scrollBars && isRenderScroll.y;
    const isRenderScrollBarsX = scrollBars && isRenderScroll.x;
    return (
      <div className={cx("scrollable", { [`${className}`]: className })}>
        <div
          className="scrollable__inner"
          onTouchStart={this.onTouchStart}
          onTouchEnd={this.onTouchEnd}
          onTouchMove={this.onMove}
          onWheel={this.onScroll}
          onMouseOver={this.onMouseOver}
          onMouseLeave={this.onMouseLeave}
          onClick={this.onClick}
          ref={this.wrapperOut}
        >
          <div
            className={cx({
              [`${className}__content`]: className,
            })}
            style={{
              transform: `translate3d(${offset.x}px,${offset.y}px, 0)`,
              transition: `${isTouchStarted ? "none" : transitionValue}`,
            }}
            ref={this.wrapperInner}
          >
            {children}
          </div>
        </div>
        {isRenderScrollBarsY && (
          <ScrollControlsY
            crollPersentage={crollPersentage.y}
            scrollPosition={scroll.y}
            isTouchStarted={isTouchStarted}
            transitionValue={transitionValue}
            ref={this.scrollWrapperOutY}
          />
        )}
        {isRenderScrollBarsX && (
          <ScrollControlsX
            crollPersentage={crollPersentage.x}
            scrollPosition={scroll.x}
            isTouchStarted={isTouchStarted}
            transitionValue={transitionValue}
            ref={this.scrollWrapperOutX}
          />
        )}
      </div>
    );
  }
}

type Ref = HTMLDivElement;
type ScrollProps = {
  crollPersentage: number;
  scrollPosition: number;
  isTouchStarted: boolean;
  transitionValue: string;
};

const ScrollControlsX = forwardRef<Ref, ScrollProps>(
  (
    { crollPersentage, scrollPosition, isTouchStarted, transitionValue },
    ref
  ) => (
    <div className="scrollable__scroll-bar scrollable__scroll-bar--x" ref={ref}>
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--x"
        style={{
          width: `${crollPersentage}%`,
          transform: `translate3d(${scrollPosition}px, 0, 0)`,
          transition: `${isTouchStarted ? "none" : transitionValue}`,
        }}
      />
    </div>
  )
);

const ScrollControlsY = forwardRef<Ref, ScrollProps>(
  (
    { crollPersentage, scrollPosition, isTouchStarted, transitionValue },
    ref
  ) => (
    <div className="scrollable__scroll-bar scrollable__scroll-bar--y" ref={ref}>
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--y"
        style={{
          height: `${crollPersentage}%`,
          transform: `translate3d(0, ${scrollPosition}px, 0)`,
          transition: `${isTouchStarted ? "none" : transitionValue}`,
        }}
      />
    </div>
  )
);

export default ScrollWrap;
