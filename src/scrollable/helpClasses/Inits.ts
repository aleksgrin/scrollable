import { WheelEvents } from "./WheelEvents";
import { ACTIVE_ITEM_WARN } from "../constants";
import { getSize } from "../utils";

export class Inits extends WheelEvents {
  updateScrollData = (type: "x" | "y", cb?: () => void) => {
    const { wrapperOutSize, wrapperInnerSize } = this.getDOMRect(getSize(type));

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

  onWindowResize = () => {
    this.updateScrollData("y");
    this.updateScrollData("x");
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
}
