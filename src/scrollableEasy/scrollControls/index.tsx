import React, { forwardRef } from "react";

type Ref = HTMLDivElement;
type ScrollProps = {
  crollSize: number;
  scrollPosition: number;
  transitionValue: string;
  onMouseDown: (evt: React.MouseEvent) => void;
};

export const ScrollControlsY = forwardRef<Ref, ScrollProps>(
  ({ crollSize, scrollPosition, transitionValue, onMouseDown }, ref) => (
    <div className="scrollable__scroll-bar scrollable__scroll-bar--y" ref={ref}>
      <div
        className="scrollable__scroll-bar-inner scrollable__scroll-bar-inner--y"
        style={{
          height: `${crollSize}%`,
          transform: `translate3d(0, ${scrollPosition}px, 0)`,
          transition: `${transitionValue}`,
        }}
        onMouseDown={onMouseDown}
      />
    </div>
  )
);
