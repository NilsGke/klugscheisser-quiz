const rtf = new Intl.RelativeTimeFormat("en", {
  localeMatcher: "best fit",
  numeric: "auto",
  style: "long",
});

/**
 *
 * @param time
 * @returns {updateIn} time in ms this function would return a different result meaning it should be update to reflect the time correclty
 */
export default function getRelativeTime(time: number) {
  const diff = time - Date.now();

  const units = [
    { unit: "years", factor: 1000 * 60 * 60 * 24 * 365.25 },
    { unit: "months", factor: 1000 * 60 * 60 * 24 * 30.44 },
    { unit: "weeks", factor: 1000 * 60 * 60 * 24 * 7 },
    { unit: "days", factor: 1000 * 60 * 60 * 24 },
    { unit: "hours", factor: 1000 * 60 * 60 },
    { unit: "minutes", factor: 1000 * 60 },
    { unit: "seconds", factor: 1000 },
  ] as const satisfies {
    unit: Intl.RelativeTimeFormatUnit;
    factor: number;
  }[];

  const calculated: { unit: Intl.RelativeTimeFormatUnit; value: number }[] =
    units.map(({ unit, factor }) => ({ unit, value: diff / factor }));

  const bestFormatIndex = calculated.findIndex(({ value }) => value < -1); // if nothing mathes, `findIndex` it returns -1 -> this uses seconds
  const bestFormat = calculated.at(bestFormatIndex)!;

  return {
    result: rtf.format(Math.round(bestFormat.value), bestFormat.unit),
    updateIn: (units.at(bestFormatIndex + 1) ?? units.at(-1)!).factor, // use the next smaller unit to update
  };
}
