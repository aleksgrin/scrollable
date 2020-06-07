import React, { useState, useEffect } from "react";
import Example1 from "./examples/example_1/Example_1";
import Example2 from "./examples/example_2/Example_2";
import Example3 from "./examples/example_3/Example_3";

const startPos = 20;
let timer: number | undefined;
function App() {
  const [position, setPosotion] = useState(startPos);
  const velocity = 0.02;
  useEffect(() => {
    timer = window.setInterval(() => {
      const targetPos = position + velocity * 10;
      if (targetPos > window.innerHeight - 100) setPosotion(startPos);
      else setPosotion(targetPos);
    }, 10);
    return () => {
      window.clearInterval(timer);
    };
  }, [position]);

  return (
    <div className="App">
      <Example1 />
      <Example2 />
      <Example3 />
      <div className="app_test" style={{ top: `${position}px` }}>
        velocity: {velocity}
      </div>
    </div>
  );
}

export default App;
