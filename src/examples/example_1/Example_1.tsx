import React, { useState } from "react";
import Scrollable from "../../scrollable/Scrollable";
import "./example_1.scss";

function App() {
  const [num, setNum] = useState(2);
  return (
    <div className="example_1">
      <Scrollable
        className="my-scroll"
        scrollBarsType="onscroll"
        activeItem={num}
      >
        {Array.from({ length: 50 }).map((_, ind) => (
          <div className="my-scroll__item" key={ind}>
            {ind + 1}
          </div>
        ))}
      </Scrollable>
      <button onClick={() => setNum(num + 1)}>Следующий {num}</button>
    </div>
  );
}

export default App;
