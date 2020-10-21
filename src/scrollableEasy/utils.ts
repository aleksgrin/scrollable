import { TScrollBarVisibility } from "./types";

export const getTouchCoords = (evt: React.TouchEvent | TouchEvent) => {
  const x = evt.changedTouches[0].clientX;
  const y = evt.changedTouches[0].clientY;
  return { x, y };
};

export const getSize = (coords: "x" | "y") => {
  if (coords === "x") return "width";
  return "height";
};

export const isValueOutBound = (value: number, min: number, max: number) => {
  if (value > max || value < min) {
    return true;
  }
  return false;
};

export const getBoundaryValue = (value: number, min: number, max: number) => {
  if (value >= max) {
    return max;
  }
  if (value <= min) {
    return min;
  }
  return value;
};

export const getInitialBarsVisibility = (type?: TScrollBarVisibility) => {
  switch (type) {
    case "none":
      return false;
    case "always":
      return true;
    case "onscroll":
      return false;
    default:
      return true;
  }
};
