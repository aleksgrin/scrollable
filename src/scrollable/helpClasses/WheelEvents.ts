import { KeyBoardEvents } from "./KeyBoardEvents";

export class WheelEvents extends KeyBoardEvents {
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
    if ((isRenderScroll.x || isRenderScroll.y) && onWheel) onWheel(offset);
  };

  onDocumentWheel = (evt: WheelEvent) => {
    const { isCursorInside } = this.scrollData;
    const { isRenderScroll } = this.state;
    const isPrevent = (isRenderScroll.x || isRenderScroll.y) && isCursorInside;
    if (isPrevent) evt.preventDefault();
  };
}
