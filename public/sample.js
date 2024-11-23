function adjustLine(from, to, line) {
  const fT = from.offsetTop + from.offsetHeight / 2;
  const tT = to.offsetTop + to.offsetHeight / 2;
  const fL = from.offsetLeft + from.offsetWidth / 2;
  const tL = to.offsetLeft + to.offsetWidth / 2;

  const CA = Math.abs(tT - fT);
  const CO = Math.abs(tL - fL);
  const H = Math.sqrt(CA * CA + CO * CO);
  const ANG = (180 / Math.PI) * Math.acos(CA / H);

  const top = fT < tT ? fT + (tT - fT) / 2 : tT + (fT - tT) / 2;
  const left = fL < tL ? fL + (tL - fL) / 2 : tL + (fL - tL) / 2;

  const adjustedAngle =
    (fT < tT && fL > tL) || (fT > tT && fL < tL) ? -ANG : ANG;

  line.style.transform = `rotate(${adjustedAngle}deg)`;
  line.style.top = `${top - H / 2}px`;
  line.style.left = `${left}px`;
  line.style.height = `${H}px`;
}

function connectFamily() {
  // Spouse line
  adjustLine(
    document.getElementById("husband"),
    document.getElementById("wife"),
    document.getElementById("spouse-line")
  );

  // Parent to child lines
  adjustLine(
    document.getElementById("husband"),
    document.getElementById("child1"),
    document.getElementById("child-line1")
  );
  adjustLine(
    document.getElementById("wife"),
    document.getElementById("child2"),
    document.getElementById("child-line2")
  );
}

// Run the function to connect family members
connectFamily();

// Reconnect lines on window resize
window.addEventListener("resize", connectFamily);
