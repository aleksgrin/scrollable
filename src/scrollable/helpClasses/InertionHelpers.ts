import { DOMHelpers } from "./DOMHelpers";
import { getBoundaryValue } from "../utils";

export class InertionHelpers extends DOMHelpers {
  calculateVelocity = (index: number) => {
    const { timesArray, V_MIN } = this.scrollData;
    const len = timesArray.length;
    const last = timesArray[len - 1];
    const firstInd = len - 1 - index > 0 ? len - 1 - index : 0;
    const first = timesArray[firstInd];
    const direction = {
      x: last.x - first.x > 0 ? "-" : "+",
      y: last.y - first.y > 0 ? "-" : "+",
    };
    const vAbs = {
      x: Math.abs((last.x - first.x) / (last.t - first.t)),
      y: Math.abs((last.y - first.y) / (last.t - first.t)),
    };
    const vBoundedAbs = {
      x: getBoundaryValue(vAbs.x, V_MIN, Infinity),
      y: getBoundaryValue(vAbs.y, V_MIN, Infinity),
    };

    const vBounded = {
      x: direction.x === "+" ? vBoundedAbs.x : -vBoundedAbs.x,
      y: direction.y === "+" ? vBoundedAbs.y : -vBoundedAbs.y,
    };
    return vBounded;
  };

  setInertion = (cb?: (path: number, type: "x" | "y") => void) => {
    const { V_MIN } = this.scrollData;
    const { isRenderScroll } = this.state;
    const v0 = this.calculateVelocity(2);
    const SPEED_OF_VELOCITY_DECREASE = 0.002;

    const decreaseTime = (type: "x" | "y") =>
      (-1 / SPEED_OF_VELOCITY_DECREASE) * Math.log(V_MIN / Math.abs(v0[type]));
    const path = (t: number, type: "x" | "y") =>
      (v0[type] / SPEED_OF_VELOCITY_DECREASE) *
      (1 - Math.exp(-SPEED_OF_VELOCITY_DECREASE * t));

    const timing = (timeFraction: number) => timeFraction;
    const drawType = (type: "x" | "y") => (progress: number) => {
      const targetPath = path(decreaseTime(type) * progress, type);
      if (cb) cb(targetPath, type);
    };
    if (isRenderScroll.y && decreaseTime("y") > 0) {
      this.animate({
        duration: decreaseTime("y"),
        timing,
        draw: drawType("y"),
      });
    }
    if (isRenderScroll.x && decreaseTime("x") > 0) {
      this.animate({
        duration: decreaseTime("x"),
        timing,
        draw: drawType("x"),
      });
    }

    this.scrollData.timesArray = [];
  };
}
