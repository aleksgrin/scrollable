import { InertionHelpers } from "./InertionHelpers";
import { getSize, isValueOutBound, getBoundaryValue } from "../utils";

export class ScrollHelpers extends InertionHelpers {
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

  setScrollOnTouchEnd = () => {
    const { isTouchMoveStarted } = this.scrollData;
    const { isRenderScroll, offset } = this.state;

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
      this.setInertion((path: number, type: "x" | "y") => {
        this.setScroll(offset[type] - path, type);
      });
    }
  };
}
