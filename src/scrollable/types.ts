export interface IscrollData {
  isTouchStarted: boolean;
  isClickStarted: boolean;
  isTouchMoveStarted: boolean;
  isCursorInside: boolean;
  start: IXYNumber;
  barStart: IXYNumber;
  constantOffset: IXYNumber;
  constantBarOffset: IXYNumber;
  V_MIN: number;
  timesArray: Array<{ t: number; x: number; y: number }>;
}

export interface IXYNumber {
  x: number;
  y: number;
}

export type TXYBool = {
  x: boolean;
  y: boolean;
};

export interface IState {
  offset: IXYNumber;
  scroll: IXYNumber;
  crollPersentage: IXYNumber;
  isRenderScroll: TXYBool;
  transition: string;
  scrollBars: boolean;
  MAX_OFFSET: IXYNumber;
  MAX_SCROLL: IXYNumber;
  MIN_OFFSET: IXYNumber;
  MIN_SCROLL: IXYNumber;
}

export type TScrollBehavior = {
  inertion?: boolean;
  bounce?: boolean;
};

export type TScrollBarsBehavior = {
  visibility?: TScrollBarVisibility;
};

export type TOptionEvents = {
  click?: boolean;
};

export type TOptions = {
  // scrollbars: исчезновение при скролле, может еще стили
  // скролл: затухание, оттягивание, удар с оттягиванием
  // события: возможность кликать, тянуть за скролбары
  scrollBehavior?: TScrollBehavior;
  scrollBarsBehavior?: TScrollBarsBehavior;
  events?: TOptionEvents;
};

export interface IScrollableProps {
  options?: TOptions;
  className?: string;
  activeItem?: number;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  onMove?: (offset: IXYNumber) => void;
  onWheel?: (offset: IXYNumber) => void;
}

export type TScrollBarVisibility = "none" | "onscroll" | "always";

export type TAnimate = {
  timing: (timeFraction: number) => number;
  draw: (progress: number) => void;
  duration: number;
};
