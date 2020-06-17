import React from "react";
import Scrollable from "../../scrollable/Scrollable";
import "./example_1.scss";

function App() {
  return (
    <div className="example_1">
      <Scrollable className="my-scroll" scrollBarsType="onscroll">
        {Array.from({ length: 50 }).map((_, ind) => (
          <div className="my-scroll__item" key={ind}>
            {ind + 1}
          </div>
        ))}
      </Scrollable>
    </div>
  );
}

export default App;
