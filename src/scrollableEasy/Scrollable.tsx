import React, {
  PropsWithChildren,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import classnames from "classnames";
import { ScrollControlsY } from "./scrollControls";
import { IScrollableProps } from "./types";
import { getBoundaryValue } from "./utils";
import "./scrollable.scss";

const DEFAULT_STATE = {
  offset: 0,
  scroll: 0,
  crollSize: 0,
  isRenderScroll: true,
  transition: "",
  MAX_OFFSET: 0,
  MIN_OFFSET: 0,
  MAX_SCROLL: 0,
  MIN_SCROLL: 0,
};

const DEFAULT_SCROLL_DATA = {
  isCursorInside: false,
};

const useClientRect = (): [
  DOMRect | null,
  (node: HTMLElement | null) => void
] => {
  const [rect, setRect] = useState<null | DOMRect>(null);
  const ref = useCallback((node: HTMLElement | null) => {
    if (node !== null) setRect(node.getBoundingClientRect());
  }, []);
  return [rect, ref];
};

const Scrollable = (props: PropsWithChildren<IScrollableProps>) => {
  const [state, setState] = useState(DEFAULT_STATE);
  const scrollData = useRef(DEFAULT_SCROLL_DATA);

  const [wrapperOutRect, wrapperOutRef] = useClientRect();
  const [wrapperInnerRect, wrapperInnerRef] = useClientRect();
  const [scrollWrapperOutRect, scrollWrapperOutRef] = useClientRect();

  const onDocumentWheel = (evt: WheelEvent) => {
    if (state.isRenderScroll && scrollData.current.isCursorInside)
      evt.preventDefault();
  };

  const onKeyDown = (evt: KeyboardEvent) => {
    const { isCursorInside } = scrollData.current;
    if (!isCursorInside) return;
    evt.preventDefault();
    const TRANSLATE_SMALL = 50;
    const TRANSLATE_BIG = 150;
    const isArrowKey = ["ArrowDown", "ArrowUp"].includes(evt.key);
    const TRANSLATE_VALUE = evt.repeat ? TRANSLATE_BIG : TRANSLATE_SMALL;

    if (isArrowKey) {
      setState((prevState) => ({ ...prevState, transition: "" }));
    }
    if (state.isRenderScroll && evt.key === "ArrowDown") {
      const nextOffset = state.offset - TRANSLATE_VALUE;
      setScroll(nextOffset);
    }
    if (state.isRenderScroll && evt.key === "ArrowUp") {
      const nextOffset = state.offset + TRANSLATE_VALUE;
      setScroll(nextOffset);
    }
  };

  const initEventListeners = () => {
    window.document.addEventListener("wheel", onDocumentWheel, {
      passive: false,
    });
    window.addEventListener("keydown", onKeyDown);
  };

  const destroyEventListeners = () => {
    window.document.removeEventListener("wheel", onDocumentWheel);
    window.removeEventListener("keydown", onKeyDown);
  };

  useEffect(() => {
    initEventListeners();
    return destroyEventListeners;
  }, []);

  useEffect(() => {
    if (wrapperInnerRect && wrapperOutRect && scrollWrapperOutRect) {
      const MAX_OFFSET = wrapperInnerRect.height - wrapperOutRect.height;
      const crollSize = (1 - MAX_OFFSET / wrapperInnerRect.height) * 100;
      const MAX_SCROLL =
        scrollWrapperOutRect.height -
        (scrollWrapperOutRect.height * crollSize) / 100;
      setState((prevState) => ({
        ...prevState,
        MAX_OFFSET,
        MAX_SCROLL,
        crollSize,
        isRenderScroll: MAX_OFFSET > 0,
      }));
    }
  }, [wrapperInnerRect, wrapperOutRect, scrollWrapperOutRect]);

  const setScroll = (offset: number) => {
    const { MAX_OFFSET, MIN_OFFSET, MAX_SCROLL, MIN_SCROLL } = state;

    const nextScrollBarValue = Math.round((-offset * MAX_SCROLL) / MAX_OFFSET);
    const boundaryOffset = -getBoundaryValue(-offset, MIN_OFFSET, MAX_OFFSET);

    const boundaryScrollBarValue = getBoundaryValue(
      nextScrollBarValue,
      MIN_SCROLL,
      MAX_SCROLL
    );

    setState((prevState) => ({
      ...prevState,
      offset: boundaryOffset,
      scroll: boundaryScrollBarValue,
    }));
  };

  const onWheel = (evt: React.WheelEvent) => {
    if (state.isRenderScroll) {
      const nextOffset = state.offset - evt.deltaY;
      setScroll(nextOffset);
      setState((prevState) => ({
        ...prevState,
        transition: "transform ease 0.5s",
      }));
    }
  };

  const onMouseOver = () => (scrollData.current.isCursorInside = true);

  const onMouseLeave = () => (scrollData.current.isCursorInside = false);

  const visibility = props.options?.scrollBarsBehavior?.visibility;
  const isRenderBar = visibility !== "none" && state.isRenderScroll;
  return (
    <div className={classnames("scrollable", props.className)}>
      <div
        className="scrollable__inner"
        onWheel={onWheel}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        ref={wrapperOutRef}
      >
        <div
          className={classnames("scrollable__content", {
            [`${props.className}__content`]: props.className,
          })}
          style={{
            transform: `translate3d(0,${state.offset}px, 0)`,
            transition: state.transition,
          }}
          ref={wrapperInnerRef}
        >
          {props.children}
        </div>
      </div>
      {isRenderBar && (
        <ScrollControlsY
          crollSize={state.crollSize}
          scrollPosition={state.scroll}
          transitionValue={state.transition}
          onMouseDown={() => {}}
          // onMouseDown={this.onMouseDown}
          ref={scrollWrapperOutRef}
        />
      )}
    </div>
  );
};

export default Scrollable;
