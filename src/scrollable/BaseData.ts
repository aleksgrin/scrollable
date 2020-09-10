import React, { PureComponent, createRef, forwardRef } from "react";
import { IScrollWrapProps, IState, IscrollData, TAnimate } from "./types";
import { getInitialBarsVisibility } from "./HelperFunctions";

export class BaseData extends PureComponent<IScrollWrapProps, IState> {
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
}
