import { BaseData } from "./BaseData";
import { getSize, isValueOutBound, getBoundaryValue } from "./HelperFunctions";

export class Helpers extends BaseData {
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

  isOffsetOut = (type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      offset: { [type]: offset },
    } = this.state;

    return isValueOutBound(-offset, MIN_OFFSET, MAX_OFFSET);
  };

  setScroll = (offset: number, type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      MAX_SCROLL: { [type]: MAX_SCROLL },
      MIN_SCROLL: { [type]: MIN_SCROLL },
    } = this.state;

    const nextScrollBarValue = Math.round((-offset * MAX_SCROLL) / MAX_OFFSET);
    const boundaryOffset = -getBoundaryValue(-offset, MIN_OFFSET, MAX_OFFSET);

    const boundaryScrollBarValue = getBoundaryValue(
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

  setScrollLog = (offset: number, type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      MAX_SCROLL: { [type]: MAX_SCROLL },
      MIN_SCROLL: { [type]: MIN_SCROLL },
    } = this.state;

    const { scrollWrapperOutSize = 0 } = this.getDOMRect(getSize(type));
    const nextScrollBarValue = Math.round((-offset * MAX_SCROLL) / MAX_OFFSET);
    const isOffsetOutBound = isValueOutBound(-offset, MIN_OFFSET, MAX_OFFSET);

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

    const boundaryScrollBarValue = getBoundaryValue(
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

  // InertionHelpers
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
      x: getBoundaryValue(vAbs.x, V_MIN, Infinity),
      y: getBoundaryValue(vAbs.y, V_MIN, Infinity),
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
}
