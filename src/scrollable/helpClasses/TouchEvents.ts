import { DELTA_T } from "../constants";
import { getTouchCoords } from "../utils";
import { ScrollHelpers } from "./ScrollHelpers";

export class TouchEvents extends ScrollHelpers {
  onDocumentTouchMove = (evt: TouchEvent) => {
    const { isTouchStarted } = this.scrollData;
    const { isRenderScroll } = this.state;
    const isPrevent = (isRenderScroll.x || isRenderScroll.y) && isTouchStarted;
    if (isPrevent) evt.preventDefault();
  };
  onTouchStart = (evt: React.TouchEvent) => {
    const { onTouchStart } = this.props;
    const constantOffsetX = this.state.offset.x;
    const constantOffsetY = this.state.offset.y;
    const touchStartX = getTouchCoords(evt).x;
    const touchStartY = getTouchCoords(evt).y;

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
        const end = getTouchCoords(evt).x;
        const nextOffset = constantOffset.x + end - start.x;
        scrollFunction(nextOffset, "x");
      }
      if (isRenderScroll.y) {
        const end = getTouchCoords(evt).y;
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
}
