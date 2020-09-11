import { MouseEvents } from "./MouseEvents";

export class KeyBoardEvents extends MouseEvents {
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
}
