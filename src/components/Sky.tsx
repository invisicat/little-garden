import React, { useEffect, useState } from "react";

/**
 * The living sky behind the whole app. Its gradient and the drifting sun
 * shift with the hour — dawn, midday, dusk, night — so the garden always
 * sits in the right light.
 */
export function Sky({ night = false }: { night?: boolean }) {
  const [vars, setVars] = useState(() => skyVars(new Date().getHours(), night));

  useEffect(() => {
    setVars(skyVars(new Date().getHours(), night));
    const id = setInterval(() => setVars(skyVars(new Date().getHours(), night)), 60_000);
    return () => clearInterval(id);
  }, [night]);

  return (
    <>
      <div className={`sky ${night ? "sky--night" : ""}`} style={vars as React.CSSProperties} />
      <div className="sun" style={vars as React.CSSProperties} />
    </>
  );
}

function skyVars(hour: number, night: boolean): Record<string, string> {
  // a forced night theme keeps the moon out regardless of the hour
  if (night) {
    return {
      "--sky-top": "#243352",
      "--sky-mid": "#1b2735",
      "--sun-top": "9%",
      "--sun-left": "73%",
      "--sun-core": "#e2e8f4", // moon glow
    };
  }

  // dawn 5-8, day 8-17, dusk 17-20, night otherwise
  let top = "#dceef0",
    mid = "#eef4ea",
    sunTop = "12%",
    sunLeft = "70%",
    sunCore = "#fbe9a8";

  if (hour >= 5 && hour < 8) {
    top = "#f6dcc2"; // peachy dawn
    mid = "#f0ead6";
    sunTop = "30%";
    sunLeft = "20%";
    sunCore = "#fbd9a0";
  } else if (hour >= 8 && hour < 17) {
    top = "#cfe6ef"; // bright day
    mid = "#eef5ea";
    sunTop = "10%";
    sunLeft = "72%";
    sunCore = "#fdeeb0";
  } else if (hour >= 17 && hour < 20) {
    top = "#e9c7b0"; // dusk
    mid = "#efe1cf";
    sunTop = "44%";
    sunLeft = "78%";
    sunCore = "#f6b27a";
  } else {
    top = "#bcc7e0"; // night
    mid = "#dfe4ea";
    sunTop = "8%";
    sunLeft = "22%";
    sunCore = "#e8edf7"; // moon
  }

  return {
    "--sky-top": top,
    "--sky-mid": mid,
    "--sun-top": sunTop,
    "--sun-left": sunLeft,
    "--sun-core": sunCore,
  };
}
