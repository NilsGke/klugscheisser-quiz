import hashString from "./hashString";

const stringToColorGradient = (string: string) => {
  const code = Math.abs(hashString(string.repeat(20)))
    .toString()
    .substring(0, 5);

  const hue = Math.floor((parseInt(code.substring(0, 4)) / 100) * 255);

  const angle = Math.floor((parseInt(code.substring(2, 4)) / 100) * 360);

  return `linear-gradient(
        ${angle}deg in hsl, 
        hsl(${hue}, 70%, 50%), 
        hsl(${hue + 360 / 8}, 70%, 50%)
    )`;
};

export default stringToColorGradient;
