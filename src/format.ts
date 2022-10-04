export const determineMagnitude = (number: number, order = 10) => {
  let cursor = number;

  function up(current: number): number {
    return cursor < order
      ? current
      : (() => {
          cursor /= order;
          return up(current + 1);
        })();
  }

  function down(current: number): number {
    return cursor > 1
      ? current
      : (() => {
          cursor *= order;
          return down(current - 1);
        })();
  }

  return number === 0 ? 0 : Math.abs(number) < 1 ? down(0) : up(0);
};

/**
 * suffix with nominal indicator
 * @example
 * ```typescript
 * expect(formatMilleSuffix(1_000_000_000)).toEqual("1 bn");
 * ```
 */
export const formatMilleSuffix = (() => {
  const suffixes = ["", "k", "m", "bn", "tn"];

  return (number: number) => {
    const magnitude = Math.min(
      determineMagnitude(number, 1000),
      suffixes.length - 1
    );

    const suffix = suffixes[magnitude];

    return `${(number * Math.pow(1000, -magnitude)).toFixed(2)} ${suffix}`;
  };
})();

/**
 * suffix with metric prefix and optional unit
 * @example
 * ```typescript
 * expect(formatScientific(1_000_000, "j")).toEqual("1 Mj");
 * ```
 */
export const formatScientific = (() => {
  const upSuffixes = ["k", "M", "G", "T", "P", "E", "Z", "Y"];
  const downSuffixes = ["m", "μ", "n", "p", "f", "a"];

  return (number: number, unit = "") => {
    const magnitude = determineMagnitude(number, 1000);

    const suffix =
      magnitude < 0
        ? downSuffixes[
            Math.min(Math.abs(magnitude) - 1, downSuffixes.length - 1)
          ]
        : upSuffixes[Math.min(magnitude - 1, upSuffixes.length - 1)];

    return `${(number * Math.pow(1000, -magnitude)).toFixed(
      2
    )} ${suffix}${unit}`;
  };
})();
