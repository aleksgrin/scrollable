import React from "react";
import Scrollable from "../../scrollable/Scrollable";
import "./example_3.scss";

function App() {
  return (
    <div className="example_3">
      <Scrollable className="my-scroll">
        {Array.from({ length: 25 }).map((_, ind) => (
          <div className="my-scroll__item" key={ind}>
            {ind + 1}
          </div>
        ))}
      </Scrollable>
    </div>
  );
}

export default App;
