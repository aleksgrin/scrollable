import React, { PureComponent, createRef, forwardRef } from "react";
import cx from "classnames";
import "./scrollable.scss";

interface IScrollWrapProps {
  className?: string;
  scrollBars?: boolean;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  onMove?: (offset: IInitialState) => void;
  onWheel?: (offset: IInitialState) => void;
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

interface IDomRect {
  wrapperOutSize: number | undefined;
  wrapperInnerSize: number | undefined;
  scrollWrapperOutSize: number | undefined;
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
    const { onTouchStart } = this.props;
    const constantOffsetX = this.state.offset.x;
    const constantOffsetY = this.state.offset.y;
    const touchStartX = this.getTouchCoords(evt).x;
    const touchStartY = this.getTouchCoords(evt).y;

    this.scrollData.isTouchStarted = true;
    this.scrollData.constantOffset = { x: constantOffsetX, y: constantOffsetY };
    this.scrollData.start = { x: touchStartX, y: touchStartY };
    if (onTouchStart) onTouchStart();
  };

  onMove = (evt: React.TouchEvent) => {
    const {
      isTouchStarted,
      constantOffset,
      start,
      isRenderScroll,
    } = this.scrollData;
    const { onMove } = this.props;
    if (isTouchStarted) {
      if (isRenderScroll.x) {
        const end = this.getTouchCoords(evt).x;
        const nextOffset = constantOffset.x + end - start.x;
        this.setScroll(nextOffset, "x");
      }
      if (isRenderScroll.y) {
        const end = this.getTouchCoords(evt).y;
        const nextOffset = constantOffset.y + end - start.y;
        this.setScroll(nextOffset, "y");
      }
      if ((isRenderScroll.x || isRenderScroll.y) && onMove)
        onMove(this.state.offset);
    }
  };

  onTouchEnd = () => {
    const { onTouchEnd } = this.props;
    this.scrollData.isTouchStarted = false;
    if (onTouchEnd) onTouchEnd();
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

  setScroll = (offset: number, type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      MAX_SCROLL: { [type]: MAX_SCROLL },
      MIN_SCROLL: { [type]: MIN_SCROLL },
    } = this.scrollData;

    const nextScrollBarValue = Math.round((-offset * MAX_SCROLL) / MAX_OFFSET);
    const boundaryOffset = -this.getBoundaryValue(
      -offset,
      MIN_OFFSET,
      MAX_OFFSET
    );

    const boundaryScrollBarValue = this.getBoundaryValue(
      nextScrollBarValue,
      MIN_SCROLL,
      MAX_SCROLL
    );

    this.setState((prevState) => ({
      offset: {
        ...prevState.offset,
        [type]: boundaryOffset,
      },
      scroll: {
        ...prevState.scroll,
        [type]: boundaryScrollBarValue,
      },
    }));
  };

  onScroll = (evt: React.WheelEvent) => {
    const { isRenderScroll } = this.scrollData;
    const { onWheel } = this.props;
    const { offset } = this.state;
    if (isRenderScroll.y) {
      const nextOffsetY = offset.y - evt.deltaY;
      this.setScroll(nextOffsetY, "y");
    }
    if (isRenderScroll.x) {
      const nextOffsetX = offset.x - evt.deltaX;
      this.setScroll(nextOffsetX, "x");
    }
    if ((isRenderScroll.x || isRenderScroll.y) && onWheel) onWheel(offset);
  };

  onMouseOver = () => (this.scrollData.isCursorInside = true);

  onMouseLeave = () => (this.scrollData.isCursorInside = false);

  onWheel = (evt: WheelEvent) => {
    const { isRenderScroll, isCursorInside } = this.scrollData;
    const isPrevent = (isRenderScroll.x || isRenderScroll.y) && isCursorInside;
    if (isPrevent) evt.preventDefault();
  };

  onTouchMove = (evt: TouchEvent) => {
    const { isRenderScroll, isTouchStarted } = this.scrollData;
    const isPrevent = (isRenderScroll.x || isRenderScroll.y) && isTouchStarted;
    if (isPrevent) evt.preventDefault();
  };

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
      this.setScroll(-(offsetTop - centerY), "y");
    }
    if (this.scrollData.isRenderScroll.x) {
      this.setScroll(-(offsetLeft - centerX), "x");
    }
  };

  getDOMRect = (size: "width" | "height") => {
    const wrapperOutSize = this.wrapperOut.current?.getBoundingClientRect()[
      size
    ];
    const wrapperInnerSize = this.wrapperInner.current?.getBoundingClientRect()[
      size
    ];
    let scrollWrapperOutSize = this.scrollWrapperOutX.current?.getBoundingClientRect()[
      size
    ];
    if (size === "height") {
      scrollWrapperOutSize = this.scrollWrapperOutY.current?.getBoundingClientRect()[
        size
      ];
    }

    return {
      wrapperOutSize,
      wrapperInnerSize,
      scrollWrapperOutSize,
    };
  };

  updateScrollData = (domRect: IDomRect, type: "x" | "y") => {
    const { wrapperOutSize, wrapperInnerSize, scrollWrapperOutSize } = domRect;

    if (wrapperOutSize !== undefined && wrapperInnerSize !== undefined) {
      const MAX_OFFSET = wrapperInnerSize - wrapperOutSize;
      this.scrollData.MAX_OFFSET[type] = MAX_OFFSET;
      this.scrollData.isRenderScroll[type] = MAX_OFFSET > 0;
      if (scrollWrapperOutSize !== undefined) {
        const crollPersentage = (1 - MAX_OFFSET / wrapperInnerSize) * 100;
        const MAX_SCROLL =
          scrollWrapperOutSize - (scrollWrapperOutSize * crollPersentage) / 100;

        this.scrollData.MAX_SCROLL[type] = MAX_SCROLL;
        this.setState((prevState) => ({
          crollPersentage: {
            ...prevState.crollPersentage,
            [type]: crollPersentage,
          },
        }));
      }
    }
  };

  componentDidMount() {
    window.document.addEventListener("wheel", this.onWheel, {
      passive: false,
    });

    window.document.addEventListener("touchmove", this.onTouchMove, {
      passive: false,
    });

    this.updateScrollData(this.getDOMRect("height"), "y");
    this.updateScrollData(this.getDOMRect("width"), "x");
  }

  componentWillUnmount() {
    window.document.removeEventListener("wheel", this.onWheel);
    window.document.removeEventListener("touchmove", this.onTouchMove);
  }

  render() {
    const { className, children, scrollBars = true } = this.props;
    const { isTouchStarted, isRenderScroll } = this.scrollData;
    const { crollPersentage, scroll, offset } = this.state;

    const transitionOnWheel = "transform ease 0.5s";
    const transitionOnTouch = "transform ease-out 0.3s";
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
            className={cx("scrollable__content", {
              [`${className}__content`]: className,
            })}
            style={{
              transform: `translate3d(${offset.x}px,${offset.y}px, 0)`,
              transition: `${
                isTouchStarted ? transitionOnTouch : transitionOnWheel
              }`,
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
            transitionValue={
              isTouchStarted ? transitionOnTouch : transitionOnWheel
            }
            ref={this.scrollWrapperOutY}
          />
        )}
        {isRenderScrollBarsX && (
          <ScrollControlsX
            crollPersentage={crollPersentage.x}
            scrollPosition={scroll.x}
            transitionValue={
              isTouchStarted ? transitionOnTouch : transitionOnWheel
            }
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
  transitionValue: string;
};

const ScrollControlsX = forwardRef<Ref, ScrollProps>(
  ({ crollPersentage, scrollPosition, transitionValue }, ref) => (
    <div className="scrollable__scroll-bar scrollable__scroll-bar--x" ref={ref}>
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--x"
        style={{
          width: `${crollPersentage}%`,
          transform: `translate3d(${scrollPosition}px, 0, 0)`,
          transition: `${transitionValue}`,
        }}
      />
    </div>
  )
);

const ScrollControlsY = forwardRef<Ref, ScrollProps>(
  ({ crollPersentage, scrollPosition, transitionValue }, ref) => (
    <div className="scrollable__scroll-bar scrollable__scroll-bar--y" ref={ref}>
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--y"
        style={{
          height: `${crollPersentage}%`,
          transform: `translate3d(0, ${scrollPosition}px, 0)`,
          transition: `${transitionValue}`,
        }}
      />
    </div>
  )
);

export default ScrollWrap;
