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

interface IscrollData {
  isTouchStarted: boolean;
  isClickStarted: boolean;
  isTouchMoveStarted: boolean;
  isCursorInside: boolean;
  start: IInitialState;
  barStart: IInitialState;
  constantOffset: IInitialState;
  constantBarOffset: IInitialState;
  V_MIN: number;
  timesArray: Array<{ t: number; x: number; y: number }>;
}

type TAnimate = {
  timing: (timeFraction: number) => number;
  draw: (progress: number) => void;
  duration: number;
};
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
    isClickStarted: false,
    isTouchMoveStarted: false,
    isCursorInside: false,
    start: { x: 0, y: 0 },
    barStart: { x: 0, y: 0 },
    constantOffset: { x: 0, y: 0 },
    constantBarOffset: { x: 0, y: 0 },
    V_MIN: 0.02,
    timesArray: [],
  };

  timer: undefined | number;
  animationFrameTimerId: number = 0;

  wrapperOut = createRef<HTMLDivElement>();
  wrapperInner = createRef<HTMLDivElement>();
  scrollWrapperOutY = createRef<HTMLDivElement>();
  scrollWrapperOutX = createRef<HTMLDivElement>();

  // Вспомогательные функции
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

  getTouchCoords = (evt: React.TouchEvent | TouchEvent) => {
    const x = evt.changedTouches[0].clientX;
    const y = evt.changedTouches[0].clientY;
    return { x, y };
  };

  isOffsetOut = (type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      offset: { [type]: offset },
    } = this.state;

    return this.isValueOutBound(-offset, MIN_OFFSET, MAX_OFFSET);
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

  getSize = (coords: "x" | "y") => {
    if (coords === "x") return "width";
    return "height";
  };

  getCenterCoords = (elem: HTMLElement) => {
    const outerRect = this.wrapperOut.current!.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();

    const centerX = (outerRect.width - elemRect.width) / 2;
    const centerY = (outerRect.height - elemRect.height) / 2;
    return { centerX, centerY };
  };

  // Функции задачи скролла
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

    if (isNaN(offset)) {
      debugger;
    }
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

  setScrollBar = (barOffset: number, type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      MAX_SCROLL: { [type]: MAX_SCROLL },
      MIN_SCROLL: { [type]: MIN_SCROLL },
    } = this.state;

    const nextOffset = Math.round((-barOffset * MAX_OFFSET) / MAX_SCROLL);
    const boundaryOffset = -this.getBoundaryValue(
      -nextOffset,
      MIN_OFFSET,
      MAX_OFFSET
    );

    const boundaryScrollBarValue = this.getBoundaryValue(
      barOffset,
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

  animate = ({ timing, draw, duration }: TAnimate) => {
    let start = performance.now();

    const animate = (time: number) => {
      let timeFraction = (time - start) / duration;

      if (timeFraction > 1) timeFraction = 1;
      let progress = timing(timeFraction);
      draw(progress);
      if (timeFraction < 1) {
        this.animationFrameTimerId = requestAnimationFrame(animate);
      }
    };
    this.animationFrameTimerId = requestAnimationFrame(animate);
  };

  // Обработчики событий
  onMouseDown = (evt: React.MouseEvent) => {
    const constantBarOffsetX = this.state.scroll.x;
    const constantBarOffsetY = this.state.scroll.y;
    const clickStartX = evt.clientX;
    const clickStartY = evt.clientY;

    this.scrollData.isClickStarted = true;
    this.scrollData.constantBarOffset = {
      x: constantBarOffsetX,
      y: constantBarOffsetY,
    };
    this.scrollData.barStart = { x: clickStartX, y: clickStartY };
    window.document.addEventListener("mousemove", this.onMouseMove);
    window.document.addEventListener("mouseup", this.onMouseUp);
  };

  onMouseMove = (evt: MouseEvent) => {
    const { isClickStarted, constantBarOffset, barStart } = this.scrollData;
    const { isRenderScroll } = this.state;
    if (isClickStarted) {
      if (isRenderScroll.x) {
        const end = evt.clientX;
        const nextBarOffset = constantBarOffset.x + end - barStart.x;
        this.setScrollBar(nextBarOffset, "x");
      }
      if (isRenderScroll.y) {
        const end = evt.clientY;
        const nextBarOffset = constantBarOffset.y + end - barStart.y;
        this.setScrollBar(nextBarOffset, "y");
      }
      if (isRenderScroll.x || isRenderScroll.y) {
        this.setState({ transition: "" });
      }
    }
  };

  onMouseUp = () => {
    this.scrollData.isClickStarted = false;
    window.document.removeEventListener("mousemove", this.onMouseMove);
    window.document.removeEventListener("mouseup", this.onMouseUp);
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
    if (typeof onTouchStart === "function") onTouchStart();

    window.cancelAnimationFrame(this.animationFrameTimerId);
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

    window.document.addEventListener("touchmove", this.onMove);
    window.document.addEventListener("touchend", this.onTouchEnd);
  };

  onMove = (evt: TouchEvent) => {
    const { isTouchStarted, constantOffset, start } = this.scrollData;
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
        this.setState({ transition: "" });
      }
      if (
        (isRenderScroll.x || isRenderScroll.y) &&
        typeof onMove === "function"
      )
        onMove(this.state.offset);
    }
  };

  onTouchEnd = () => {
    const { onTouchEnd } = this.props;
    if (typeof onTouchEnd === "function") onTouchEnd();
    window.clearInterval(this.timer);
    this.setScrollOnTouchEnd();
    this.scrollData.isTouchStarted = false;
    this.scrollData.isTouchMoveStarted = false;
    window.document.removeEventListener("touchmove", this.onMove);
    window.document.removeEventListener("touchend", this.onTouchEnd);
  };

  setScrollOnTouchEnd = () => {
    const { isTouchMoveStarted } = this.scrollData;
    const { isRenderScroll } = this.state;

    if (!isTouchMoveStarted) return;

    const isOffsetOut = {
      x: this.isOffsetOut("x"),
      y: this.isOffsetOut("y"),
    };

    const isSetX = isOffsetOut.x && isRenderScroll.x;
    const isSetY = isOffsetOut.y && isRenderScroll.y;
    if (isSetY || isSetX) {
      this.setState({ transition: "transform ease 0.5s" });
    }
    if (isSetY) {
      this.setScroll(this.state.offset.y, "y");
    }
    if (isSetX) {
      this.setScroll(this.state.offset.x, "x");
    }
    if (!isSetX && !isSetY) {
      this.setInertion();
    }
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
    const { isRenderScroll, offset } = this.state;
    const v0 = this.calculateVelocity(2);
    const A = 0.002; // Коэффициент, отражающий быстроту уменьшения скорости

    const decreaseTime = (type: "x" | "y") =>
      (-1 / A) * Math.log(V_MIN / Math.abs(v0[type]));
    const path = (t: number, type: "x" | "y") =>
      (v0[type] / A) * (1 - Math.exp(-A * t));

    const timing = (timeFraction: number) => timeFraction;
    const drawType = (type: "x" | "y") => (progress: number) => {
      const targetPath = path(decreaseTime(type) * progress, type);
      this.setScroll(offset[type] - targetPath, type);
    };
    if (isRenderScroll.y && decreaseTime("y") > 0) {
      this.animate({
        duration: decreaseTime("y"),
        timing,
        draw: drawType("y"),
      });
    }
    if (isRenderScroll.x && decreaseTime("x") > 0) {
      this.animate({
        duration: decreaseTime("x"),
        timing,
        draw: drawType("x"),
      });
    }

    this.scrollData.timesArray = [];
  };

  onWheel = (evt: React.WheelEvent) => {
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
      this.setState({ transition: "transform ease 0.5s" });
    if ((isRenderScroll.x || isRenderScroll.y) && onWheel) onWheel(offset);
  };

  onMouseOver = () => (this.scrollData.isCursorInside = true);

  onMouseLeave = () => (this.scrollData.isCursorInside = false);

  onDocumentWheel = (evt: WheelEvent) => {
    const { isCursorInside } = this.scrollData;
    const { isRenderScroll } = this.state;
    const isPrevent = (isRenderScroll.x || isRenderScroll.y) && isCursorInside;
    if (isPrevent) evt.preventDefault();
  };

  onDocumentTouchMove = (evt: TouchEvent) => {
    const { isTouchStarted } = this.scrollData;
    const { isRenderScroll } = this.state;
    const isPrevent = (isRenderScroll.x || isRenderScroll.y) && isTouchStarted;
    if (isPrevent) evt.preventDefault();
  };

  onClick = (evt: React.SyntheticEvent) => {
    const { clickable = true } = this.props;
    const noClickClassnames = ["scrollable__inner", "scrollable__content"];
    if (!clickable) return;
    const targetElem = evt.target as HTMLElement;
    if (
      noClickClassnames.some((className) =>
        targetElem.classList.contains(className)
      )
    )
      return;
    const { offsetLeft, offsetTop } = targetElem;
    const { centerX, centerY } = this.getCenterCoords(targetElem);
    const { isRenderScroll } = this.state;

    if (isRenderScroll.x || isRenderScroll.y)
      this.setState({ transition: "transform ease 0.5s" });
    if (isRenderScroll.y) {
      this.setScroll(-(offsetTop - centerY), "y");
    }
    if (isRenderScroll.x) {
      this.setScroll(-(offsetLeft - centerX), "x");
    }
  };

  onWindowResize = () => {
    this.updateScrollData("y");
    this.updateScrollData("x");
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

  onKeyDown = (evt: KeyboardEvent) => {
    const { isCursorInside } = this.scrollData;
    const { isRenderScroll } = this.state;
    if (!isCursorInside) return;
    evt.preventDefault();
    const TRANSLATE_SMALL = 50;
    const TRANSLATE_BIG = 150;
    const isArrowKey = [
      "ArrowDown",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
    ].includes(evt.key);
    const TRANSLATE_VALUE = evt.repeat ? TRANSLATE_BIG : TRANSLATE_SMALL;

    if (isArrowKey) this.setState({ transition: "" });
    if (isRenderScroll.y && evt.key === "ArrowDown") {
      const nextOffset = this.state.offset.y - TRANSLATE_VALUE;
      this.setScroll(nextOffset, "y");
    }
    if (isRenderScroll.y && evt.key === "ArrowUp") {
      const nextOffset = this.state.offset.y + TRANSLATE_VALUE;
      this.setScroll(nextOffset, "y");
    }
    if (isRenderScroll.x && evt.key === "ArrowLeft") {
      const nextOffset = this.state.offset.x + TRANSLATE_VALUE;
      this.setScroll(nextOffset, "x");
    }
    if (isRenderScroll.x && evt.key === "ArrowRight") {
      const nextOffset = this.state.offset.x - TRANSLATE_VALUE;
      this.setScroll(nextOffset, "x");
    }
  };

  initEventListeners = () => {
    window.document.addEventListener("wheel", this.onDocumentWheel, {
      passive: false,
    });
    window.document.addEventListener("touchmove", this.onDocumentTouchMove, {
      passive: false,
    });
    window.addEventListener("resize", this.onWindowResize);
    window.addEventListener("keydown", this.onKeyDown);
  };

  destroyEventListeners = () => {
    window.document.removeEventListener("wheel", this.onDocumentWheel);
    window.document.removeEventListener("touchmove", this.onDocumentTouchMove);
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
        {isRenderScrollBarsY && (
          <ScrollControlsY
            crollPersentage={crollPersentage.y}
            scrollPosition={scroll.y}
            transitionValue={transition}
            onMouseDown={this.onMouseDown}
            ref={this.scrollWrapperOutY}
          />
        )}
        {isRenderScrollBarsX && (
          <ScrollControlsX
            crollPersentage={crollPersentage.x}
            scrollPosition={scroll.x}
            onMouseDown={this.onMouseDown}
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
  onMouseDown: (evt: React.MouseEvent) => void;
};

const ScrollControlsX = forwardRef<Ref, ScrollProps>(
  ({ crollPersentage, scrollPosition, transitionValue, onMouseDown }, ref) => (
    <div className="scrollable__scroll-bar scrollable__scroll-bar--x" ref={ref}>
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--x"
        style={{
          width: `${crollPersentage}%`,
          transform: `translate3d(${scrollPosition}px, 0, 0)`,
          transition: `${transitionValue}`,
        }}
        onMouseDown={onMouseDown}
      />
    </div>
  )
);

const ScrollControlsY = forwardRef<Ref, ScrollProps>(
  ({ crollPersentage, scrollPosition, transitionValue, onMouseDown }, ref) => (
    <div className="scrollable__scroll-bar scrollable__scroll-bar--y" ref={ref}>
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--y"
        style={{
          height: `${crollPersentage}%`,
          transform: `translate3d(0, ${scrollPosition}px, 0)`,
          transition: `${transitionValue}`,
        }}
        onMouseDown={onMouseDown}
      />
    </div>
  )
);

export default ScrollWrap;
