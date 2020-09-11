import { PureComponent, createRef } from "react";
import { IScrollableProps, IState, IscrollData } from "../types";
import { getInitialBarsVisibility } from "../utils";

export class BaseData extends PureComponent<IScrollableProps, IState> {
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
}
