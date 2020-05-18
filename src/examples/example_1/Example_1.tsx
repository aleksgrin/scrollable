import React from "react";
import Scrollable from "../../scrollable/Scrollable";
import "./example_1.scss";

function App() {
  return (
    <div className="example_1">
      <Scrollable className="my-scroll">
        {Array.from({ length: 5 }).map((_, ind) => (
          <div className="my-scroll__item">{ind + 1}</div>
        ))}
      </Scrollable>
    </div>
  );
}

export default App;