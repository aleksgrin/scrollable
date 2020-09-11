import { BaseData } from "./BaseData";
import { isValueOutBound } from "../utils";
import { TAnimate } from "../types";
import { VISIBILITY_FADE_TIME } from "../constants";

export class Helpers extends BaseData {
  setVisibility = () => {
    if (this.props.options?.scrollBarsBehavior?.visibility !== "onscroll")
      return;

    window.clearTimeout(this.visibilityTimerId);
    this.setState({ scrollBars: true });
    this.visibilityTimerId = window.setTimeout(() => {
      this.setState({ scrollBars: false });
    }, VISIBILITY_FADE_TIME);
  };

  isOffsetOut = (type: "x" | "y") => {
    const {
      MAX_OFFSET: { [type]: MAX_OFFSET },
      MIN_OFFSET: { [type]: MIN_OFFSET },
      offset: { [type]: offset },
    } = this.state;

    return isValueOutBound(-offset, MIN_OFFSET, MAX_OFFSET);
  };

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
