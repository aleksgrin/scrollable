import React, { PureComponent, createRef, forwardRef } from "react";
import cx from "classnames";
import "./scrollable.scss";

interface IScrollWrapProps {
  className?: string;
  scrollBars?: boolean;
  clickable?: boolean;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  onMove?: (offset: IInitialState) => void;
  onWheel?: (offset: IInitialState) => void;
}

interface IInitialState {
  x: number;
  y: number;
}

type TInitialBool = {
  x: boolean;
  y: boolean;
};

interface IState {
  offset: IInitialState;
  scroll: IInitialState;
  crollPersentage: IInitialState;
  isRenderScroll: TInitialBool;
  transition: string;
  MAX_OFFSET: IInitialState;
  MAX_SCROLL: IInitialState;
  MIN_OFFSET: IInitialState;
  MIN_SCROLL: IInitialState;
}

interface IDomRect {
  wrapperOutSize: number | undefined;
  wrapperInnerSize: number | undefined;
  scrollWrapperOutSize: number | undefined;
}

interface IscrollData {
  isTouchStarted: boolean;
  isTouchMoveStarted: boolean;
  isCursorInside: boolean;
  start: IInitialState;
  constantOffset: IInitialState;
  decreaseTime: IInitialState;
  V_MIN: number;
  timesArray: Array<{ t: number; x: number; y: number }>;
  transitionOnWheel: string;
  transitionOnTouchEnd: (time: number) => string;
  transitionOnTouchMove: string;
  transitionOnClick: string;
}

const DELTA_T = 10;
class ScrollWrap extends PureComponent<IScrollWrapProps, IState> {
  state: IState = {
    offset: { x: 0, y: 0 },
    scroll: { x: 0, y: 0 },
    crollPersentage: { x: 0, y: 0 },
    isRenderScroll: { x: true, y: true },
    transition: "",
    MAX_OFFSET: { x: 0, y: 0 },
    MIN_OFFSET: { x: 0, y: 0 },
    MAX_SCROLL: { x: 0, y: 0 },
    MIN_SCROLL: { x: 0, y: 0 },
  };

  scrollData: IscrollData = {
    isTouchStarted: false,
    isTouchMoveStarted: false,
    isCursorInside: false,
    start: { x: 0, y: 0 },
    constantOffset: { x: 0, y: 0 },
    V_MIN: 0.02,
    decreaseTime: { x: 0, y: 0 },
    timesArray: [],
    transitionOnWheel: "transform ease 0.5s",
    transitionOnTouchEnd: (decreaseTime) =>
      `transform cubic-bezier(0.16, 1, 0.3, 1) ${decreaseTime}ms`,
    transitionOnTouchMove: "",
    transitionOnClick: "transform ease 0.5s",
  };

  timer: undefined | number;

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

    const startTime = Date.now();
    this.timer = window.setInterval(() => {
      const currTime = Date.now();
      const timerValue = {
        t: currTime - startTime,
        x: this.state.offset.x,
        y: this.state.offset.y,
      };
      this.scrollData.timesArray.push(timerValue);
    }, DELTA_T);
  };

  onMove = (evt: React.TouchEvent) => {
    const {
      isTouchStarted,
      constantOffset,
      start,
      transitionOnTouchMove,
    } = this.scrollData;
    const { isRenderScroll } = this.state;
    const { onMove } = this.props;
    if (isTouchStarted) {
      this.scrollData.isTouchMoveStarted = true;
      if (isRenderScroll.x) {
        const end = this.getTouchCoords(evt).x;
        const nextOffset = constantOffset.x + end - start.x;
        this.setScrollLog(nextOffset, "x");
      }
      if (isRenderScroll.y) {
        const end = this.getTouchCoords(evt).y;
        const nextOffset = constantOffset.y + end - start.y;
        this.setScrollLog(nextOffset, "y");
      }
      if (isRenderScroll.x || isRenderScroll.y) {
        this.setState({ transition: transitionOnTouchMove });
      }
      if ((isRenderScroll.x || isRenderScroll.y) && onMove)
        onMove(this.state.offset);
    }
  };

  onTouchEnd = () => {
    const { onTouchEnd } = this.props;
    if (onTouchEnd) onTouchEnd();
    window.clearInterval(this.timer);
    this.setScrollOnTouchEnd();
    this.scrollData.isTouchStarted = false;
    this.scrollData.isTouchMoveStarted = false;
  };

  setScrollOnTouchEnd = () => {
    const {
      isTouchMoveStarted,
      transitionOnTouchEnd,
      transitionOnWheel,
    } = this.scrollData;
    const { isRenderScroll } = this.state;

    if (!isTouchMoveStarted) return;

    const isOffsetOut = {
      x: this.isOffsetOut("x"),
      y: this.isOffsetOut("y"),
    };

    const isSetX = isOffsetOut.x && isRenderScroll.x;
    const isSetY = isOffsetOut.y && isRenderScroll.y;
    if (isSetY) {
      this.setScroll(this.state.offset.y, "y");
      this.setState({ transition: transitionOnWheel });
    }
    if (isSetX) {
      this.setScroll(this.state.offset.x, "x");
      this.setState({ transition: transitionOnWheel });
    }
    if (!isSetX && !isSetY) {
      const decreaseTime = this.setInertion();
      this.setState({ transition: transitionOnTouchEnd(decreaseTime) });
    }
  };

  isOffsetOut = (type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      offset: { [type]: offset },
    } = this.state;

    return this.isValueOutBound(-offset, MIN_OFFSET, MAX_OFFSET);
  };

  calculateVelocity = (index: number) => {
    const { timesArray, V_MIN } = this.scrollData;
    const len = timesArray.length;
    const last = timesArray[len - 1];
    const firstInd = len - 1 - index > 0 ? len - 1 - index : 0;
    const first = timesArray[firstInd];
    const direction = {
      x: last.x - first.x > 0 ? "-" : "+",
      y: last.y - first.y > 0 ? "-" : "+",
    };
    const vAbs = {
      x: Math.abs((last.x - first.x) / (last.t - first.t)),
      y: Math.abs((last.y - first.y) / (last.t - first.t)),
    };
    const vBoundedAbs = {
      x: this.getBoundaryValue(vAbs.x, V_MIN, Infinity),
      y: this.getBoundaryValue(vAbs.y, V_MIN, Infinity),
    };

    const vBounded = {
      x: direction.x === "+" ? vBoundedAbs.x : -vBoundedAbs.x,
      y: direction.y === "+" ? vBoundedAbs.y : -vBoundedAbs.y,
    };
    return vBounded;
  };

  setInertion = () => {
    const { V_MIN } = this.scrollData;
    const { isRenderScroll } = this.state;
    const v0 = this.calculateVelocity(10);
    const A = 0.002; // Коэффициент, отражающий быстроту уменьшения скорости
    const decreaseTimeY = (-1 / A) * Math.log(V_MIN / Math.abs(v0.y));
    const decreaseTimeX = (-1 / A) * Math.log(V_MIN / Math.abs(v0.x));
    const decreaseTime = {
      x: decreaseTimeX,
      y: decreaseTimeY,
    };
    const pathX = (v0.x / A) * (1 - Math.exp(-A * decreaseTime.x));
    const pathY = (v0.y / A) * (1 - Math.exp(-A * decreaseTime.y));
    const path = {
      x: pathX,
      y: pathY,
    };
    this.scrollData.decreaseTime = decreaseTime;
    if (isRenderScroll.x) {
      const nextOffset = this.state.offset.x - path.x;
      this.setScroll(nextOffset, "x");
    }
    if (isRenderScroll.y) {
      const nextOffset = this.state.offset.y - path.y;
      this.setScroll(nextOffset, "y");
    }

    this.scrollData.timesArray = [];
    return Math.max(decreaseTimeX, decreaseTimeY);
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

  isValueOutBound = (value: number, min: number, max: number) => {
    if (value > max || value < min) {
      return true;
    }
    return false;
  };

  setScrollLog = (offset: number, type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      MAX_SCROLL: { [type]: MAX_SCROLL },
      MIN_SCROLL: { [type]: MIN_SCROLL },
    } = this.state;
    const { scrollWrapperOutSize = 0 } = this.getDOMRect(this.getSize(type));
    const nextScrollBarValue = Math.round((-offset * MAX_SCROLL) / MAX_OFFSET);
    const isBoundaryOffset = this.isValueOutBound(
      -offset,
      MIN_OFFSET,
      MAX_OFFSET
    );

    const MAX_LOG_OFFSET = scrollWrapperOutSize * 0.25;
    const CONSTANT_ATAN_LIM = MAX_LOG_OFFSET / (Math.PI / 2);
    let boundaryOffset: number;
    if (isBoundaryOffset) {
      const deltaOffset =
        offset > 0
          ? Math.abs(offset) - MIN_OFFSET
          : Math.abs(offset) - MAX_OFFSET;
      const logOffsetAbs =
        CONSTANT_ATAN_LIM *
        Math.atan((1 / CONSTANT_ATAN_LIM) * Math.abs(deltaOffset));
      boundaryOffset =
        offset > 0 ? MIN_OFFSET + logOffsetAbs : -MAX_OFFSET - logOffsetAbs;
    } else {
      boundaryOffset = offset;
    }

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

  setScroll = (offset: number, type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      MAX_SCROLL: { [type]: MAX_SCROLL },
      MIN_SCROLL: { [type]: MIN_SCROLL },
    } = this.state;

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
    const { onWheel } = this.props;
    const { offset, isRenderScroll } = this.state;
    if (isRenderScroll.y) {
      const nextOffsetY = offset.y - evt.deltaY;
      this.setScroll(nextOffsetY, "y");
    }
    if (isRenderScroll.x) {
      const nextOffsetX = offset.x - evt.deltaX;
      this.setScroll(nextOffsetX, "x");
    }
    if (isRenderScroll.x || isRenderScroll.y)
      this.setState({ transition: this.scrollData.transitionOnWheel });
    if ((isRenderScroll.x || isRenderScroll.y) && onWheel) onWheel(offset);
  };

  onMouseOver = () => (this.scrollData.isCursorInside = true);

  onMouseLeave = () => (this.scrollData.isCursorInside = false);

  onWheel = (evt: WheelEvent) => {
    const { isCursorInside } = this.scrollData;
    const { isRenderScroll } = this.state;
    const isPrevent = (isRenderScroll.x || isRenderScroll.y) && isCursorInside;
    if (isPrevent) evt.preventDefault();
  };

  onTouchMove = (evt: TouchEvent) => {
    const { isTouchStarted } = this.scrollData;
    const { isRenderScroll } = this.state;
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
    const { clickable = true } = this.props;
    if (!clickable) return;
    const targetElem = evt.target as HTMLElement;
    const { offsetLeft, offsetTop } = targetElem;
    const { centerX, centerY } = this.getCenterCoords(targetElem);
    const { isRenderScroll } = this.state;

    if (isRenderScroll.x || isRenderScroll.y)
      this.setState({ transition: this.scrollData.transitionOnClick });
    if (isRenderScroll.y) {
      this.setScroll(-(offsetTop - centerY), "y");
    }
    if (isRenderScroll.x) {
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

  getSize = (coords: "x" | "y") => {
    if (coords === "x") return "width";
    return "height";
  };

  updateScrollBars = (type: "x" | "y") => {
    const { wrapperInnerSize, scrollWrapperOutSize } = this.getDOMRect(
      this.getSize(type)
    );
    const MAX_OFFSET = this.state.MAX_OFFSET[type];
    if (scrollWrapperOutSize !== undefined && wrapperInnerSize !== undefined) {
      const crollPersentage = (1 - MAX_OFFSET / wrapperInnerSize) * 100;
      const MAX_SCROLL =
        scrollWrapperOutSize - (scrollWrapperOutSize * crollPersentage) / 100;

      this.setState((prevState) => ({
        crollPersentage: {
          ...prevState.crollPersentage,
          [type]: crollPersentage,
        },
        MAX_SCROLL: { ...prevState.MAX_SCROLL, [type]: MAX_SCROLL },
      }));
    }
  };

  updateScrollData = (type: "x" | "y") => {
    const { wrapperOutSize, wrapperInnerSize } = this.getDOMRect(
      this.getSize(type)
    );

    if (wrapperOutSize !== undefined && wrapperInnerSize !== undefined) {
      const MAX_OFFSET = wrapperInnerSize - wrapperOutSize;
      this.setState(
        (prevState) => ({
          isRenderScroll: {
            ...prevState.isRenderScroll,
            [type]: MAX_OFFSET > 0,
          },
          MAX_OFFSET: { ...prevState.MAX_OFFSET, [type]: MAX_OFFSET },
        }),
        () => this.updateScrollBars(type)
      );
    }
  };

  onWindowResize = () => {
    this.updateScrollData("y");
    this.updateScrollData("x");
  };

  initEventListeners = () => {
    window.document.addEventListener("wheel", this.onWheel, {
      passive: false,
    });
    window.document.addEventListener("touchmove", this.onTouchMove, {
      passive: false,
    });
    window.addEventListener("resize", this.onWindowResize);
  };

  destroyEventListeners = () => {
    window.document.removeEventListener("wheel", this.onWheel);
    window.document.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("resize", this.onWindowResize);
  };

  componentDidMount() {
    this.initEventListeners();
    this.updateScrollData("y");
    this.updateScrollData("x");
  }

  componentWillUnmount() {
    this.destroyEventListeners();
  }

  render() {
    const { className, children, scrollBars = true } = this.props;
    const {
      crollPersentage,
      scroll,
      offset,
      isRenderScroll,
      transition,
    } = this.state;

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
              transition: transition,
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
            transitionValue={transition}
            ref={this.scrollWrapperOutY}
          />
        )}
        {isRenderScrollBarsX && (
          <ScrollControlsX
            crollPersentage={crollPersentage.x}
            scrollPosition={scroll.x}
            transitionValue={transition}
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
