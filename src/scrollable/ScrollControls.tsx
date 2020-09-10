import React, { forwardRef } from "react";
import cx from "classnames";

type Ref = HTMLDivElement;
type ScrollProps = {
  crollPersentage: number;
  scrollPosition: number;
  transitionValue: string;
  scrollBars: boolean;
  onMouseDown: (evt: React.MouseEvent) => void;
};

export const ScrollControlsX = forwardRef<Ref, ScrollProps>(
  (
    {
      crollPersentage,
      scrollPosition,
      transitionValue,
      scrollBars,
      onMouseDown,
    },
    ref
  ) => (
    <div
      className={cx("scrollable__scroll-bar scrollable__scroll-bar--x", {
        "scrollable__scroll-bar--hide": !scrollBars,
      })}
      ref={ref}
    >
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--x"
        style={{
          width: `${crollPersentage}%`,
          transform: `translate3d(${scrollPosition}px, 0, 0)`,
          transition: `${transitionValue}`,
        }}
        onMouseDown={onMouseDown}
      />
    </div>
  )
);

export const ScrollControlsY = forwardRef<Ref, ScrollProps>(
  (
    {
      crollPersentage,
      scrollPosition,
      transitionValue,
      scrollBars,
      onMouseDown,
    },
    ref
  ) => (
    <div
      className={cx("scrollable__scroll-bar scrollable__scroll-bar--y", {
        "scrollable__scroll-bar--hide": !scrollBars,
      })}
      ref={ref}
    >
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--y"
        style={{
          height: `${crollPersentage}%`,
          transform: `translate3d(0, ${scrollPosition}px, 0)`,
          transition: `${transitionValue}`,
        }}
        onMouseDown={onMouseDown}
      />
    </div>
  )
);
