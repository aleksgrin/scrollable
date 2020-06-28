import React, { PureComponent, createRef, forwardRef } from "react";
import cx from "classnames";
import "./scrollable.scss";

const ACTIVE_ITEM_WARN =
  "Для использования 'props.activeItem' необходимо, чтобы количество дочерних элементов у 'Scrollable' на первом уровне вложенности было больше 1";

type TScrollBarVisibility = "none" | "onscroll" | "always";

type TScrollBehavior = {
  inertion?: boolean;
  bounce?: boolean;
};

type TScrollBarsBehavior = {
  visibility?: TScrollBarVisibility;
};

type TOptionEvents = {
  click?: boolean;
};

export type TOptions = {
  // scrollbars: исчезновение при скролле, может еще стили
  // скролл: затухание, оттягивание, удар с оттягиванием
  // события: возможность кликать, тянуть за скролбары
  scrollBehavior?: TScrollBehavior;
  scrollBarsBehavior?: TScrollBarsBehavior;
  events?: TOptionEvents;
};
interface IScrollWrapProps {
  options?: TOptions;
  className?: string;
  activeItem?: number;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  onMove?: (offset: IXYNumber) => void;
  onWheel?: (offset: IXYNumber) => void;
}

interface IXYNumber {
  x: number;
  y: number;
}

type TXYBool = {
  x: boolean;
  y: boolean;
};

interface IState {
  offset: IXYNumber;
  scroll: IXYNumber;
  crollPersentage: IXYNumber;
  isRenderScroll: TXYBool;
  transition: string;
  scrollBars: boolean;
  MAX_OFFSET: IXYNumber;
  MAX_SCROLL: IXYNumber;
  MIN_OFFSET: IXYNumber;
  MIN_SCROLL: IXYNumber;
}

interface IscrollData {
  isTouchStarted: boolean;
  isClickStarted: boolean;
  isTouchMoveStarted: boolean;
  isCursorInside: boolean;
  start: IXYNumber;
  barStart: IXYNumber;
  constantOffset: IXYNumber;
  constantBarOffset: IXYNumber;
  V_MIN: number;
  timesArray: Array<{ t: number; x: number; y: number }>;
}

type TAnimate = {
  timing: (timeFraction: number) => number;
  draw: (progress: number) => void;
  duration: number;
};

const getInitialBarsVisibility = (type?: TScrollBarVisibility) => {
  switch (type) {
    case "none":
      return false;
    case "always":
      return true;
    case "onscroll":
      return false;
    default:
      return true;
  }
};
const DELTA_T = 10;
class ScrollWrap extends PureComponent<IScrollWrapProps, IState> {
  state: IState = {
    offset: { x: 0, y: 0 },
    scroll: { x: 0, y: 0 },
    crollPersentage: { x: 0, y: 0 },
    isRenderScroll: { x: true, y: true },
    transition: "",
    scrollBars: getInitialBarsVisibility(
      this.props.options?.scrollBarsBehavior?.visibility
    ),
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

  velocityTimerId: undefined | number;
  animationFrameTimerId: number = 0;
  visibilityTimerId: number | undefined;

  wrapperOut = createRef<HTMLDivElement>();
  wrapperInner = createRef<HTMLDivElement>();
  scrollWrapperOutY = createRef<HTMLDivElement>();
  scrollWrapperOutX = createRef<HTMLDivElement>();

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

  setVisibility = () => {
    if (this.props.options?.scrollBarsBehavior?.visibility !== "onscroll")
      return;
    const VISIBILITY_FADE_TIME = 600;

    window.clearTimeout(this.visibilityTimerId);
    this.setState({ scrollBars: true });
    this.visibilityTimerId = window.setTimeout(() => {
      this.setState({ scrollBars: false });
    }, VISIBILITY_FADE_TIME);
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
    const isOffsetOutBound = this.isValueOutBound(
      -offset,
      MIN_OFFSET,
      MAX_OFFSET
    );

    const MAX_LOG_OFFSET = scrollWrapperOutSize * 0.25;
    const CONSTANT_ATAN_LIM = MAX_LOG_OFFSET / (Math.PI / 2);
    let boundaryOffset: number;
    if (isOffsetOutBound) {
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

  showScrollBars = () => this.setState({ scrollBars: true });

  hideScrollBars = () => this.setState({ scrollBars: false });

  scrollToActiveItem = (
    currentItem: number | undefined,
    prevItem: number | undefined | null
  ) => {
    const elems = this.wrapperInner.current?.children;
    if (currentItem === undefined || prevItem === currentItem || !elems) return;
    if (elems.length < 2) return;

    const targetElem = elems[currentItem];
    this.scrollToDOMElement(targetElem as HTMLElement);
  };

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
    this.velocityTimerId = window.setInterval(() => {
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
    let bounce = this.props.options?.scrollBehavior?.bounce;
    bounce = bounce !== undefined ? bounce : true;
    const scrollFunction = bounce ? this.setScrollLog : this.setScroll;
    if (isTouchStarted) {
      this.scrollData.isTouchMoveStarted = true;
      if (isRenderScroll.x) {
        const end = this.getTouchCoords(evt).x;
        const nextOffset = constantOffset.x + end - start.x;
        scrollFunction(nextOffset, "x");
      }
      if (isRenderScroll.y) {
        const end = this.getTouchCoords(evt).y;
        const nextOffset = constantOffset.y + end - start.y;
        scrollFunction(nextOffset, "y");
      }
      if (isRenderScroll.x || isRenderScroll.y) {
        this.setVisibility();
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
    window.clearInterval(this.velocityTimerId);
    this.setScrollOnTouchEnd();
    this.scrollData.isTouchStarted = false;
    this.scrollData.isTouchMoveStarted = false;
    window.document.removeEventListener("touchmove", this.onMove);
    window.document.removeEventListener("touchend", this.onTouchEnd);
  };

  setScrollOnTouchEnd = () => {
    const { isTouchMoveStarted } = this.scrollData;
    const { isRenderScroll } = this.state;
    let inertion = this.props.options?.scrollBehavior?.inertion;
    inertion = inertion !== undefined ? inertion : true;

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
    if (!isSetX && !isSetY && inertion) {
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
    if (isRenderScroll.x || isRenderScroll.y) {
      this.setVisibility();
      this.setState({ transition: "transform ease 0.5s" });
    }
    if ((isRenderScroll.x || isRenderScroll.y) && typeof onWheel === "function")
      onWheel(offset);
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
    let clickable = this.props.options?.events?.click;
    clickable = clickable !== undefined ? clickable : true;
    const noClickClassnames = ["scrollable__inner", "scrollable__content"];
    if (!clickable) return;
    const targetElem = evt.target as HTMLElement;
    if (
      noClickClassnames.some((className) =>
        targetElem.classList.contains(className)
      )
    )
      return;
    this.scrollToDOMElement(targetElem);
  };

  scrollToDOMElement = (elem: HTMLElement | undefined) => {
    if (elem === undefined) return;
    const { offsetLeft, offsetTop } = elem;
    const { centerX, centerY } = this.getCenterCoords(elem);
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

  updateScrollData = (type: "x" | "y", cb?: () => void) => {
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
        () => {
          this.updateScrollBars(type);
          if (typeof cb === "function") cb();
        }
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

    if (isArrowKey) {
      this.setVisibility();
      this.setState({ transition: "" });
    }
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

  printWarnings = () => {
    const { activeItem } = this.props;
    const elems = this.wrapperInner.current?.children;

    if (activeItem !== undefined && elems && elems.length < 2)
      console.error(ACTIVE_ITEM_WARN);
  };

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
        {isRenderScroll.y && (
          <ScrollControlsY
            crollPersentage={crollPersentage.y}
            scrollPosition={scroll.y}
            transitionValue={transition}
            scrollBars={scrollBars}
            onMouseDown={this.onMouseDown}
            ref={this.scrollWrapperOutY}
          />
        )}
        {isRenderScroll.x && (
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

type Ref = HTMLDivElement;
type ScrollProps = {
  crollPersentage: number;
  scrollPosition: number;
  transitionValue: string;
  scrollBars: boolean;
  onMouseDown: (evt: React.MouseEvent) => void;
};

const ScrollControlsX = forwardRef<Ref, ScrollProps>(
  (
    {
      crollPersentage,
      scrollPosition,
      transitionValue,
      scrollBars,
      onMouseDown,
    },
    ref
  ) => (
    <div
      className={cx("scrollable__scroll-bar scrollable__scroll-bar--x", {
        "scrollable__scroll-bar--hide": !scrollBars,
      })}
      ref={ref}
    >
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
  (
    {
      crollPersentage,
      scrollPosition,
      transitionValue,
      scrollBars,
      onMouseDown,
    },
    ref
  ) => (
    <div
      className={cx("scrollable__scroll-bar scrollable__scroll-bar--y", {
        "scrollable__scroll-bar--hide": !scrollBars,
      })}
      ref={ref}
    >
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
