import { ScrollBars } from "./ScrollBars";
export class MouseEvents extends ScrollBars {
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

  onMouseOver = () => (this.scrollData.isCursorInside = true);

  onMouseLeave = () => (this.scrollData.isCursorInside = false);
}
