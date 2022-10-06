import { option } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { Row } from "./data";
import { Filter } from "./filter";

export const all: Filter = { id: "All", predicate: () => true };

const between =
  ([lower, upper]: [number, number]) =>
    (x: number) =>
      lower <= x && x <= upper;

const optionBetween = flow(
  between,
  (isBetween) => (maybeNumber: option.Option<number>) =>
    pipe(
      maybeNumber,
      option.map(isBetween),
      option.getOrElse(() => false)
    )
);

const pickPop = (row: Row) => row.region.population;

export const hugePop: Filter = {
  id: "Huge Population",
  predicate: flow(pickPop, optionBetween([1_000_000_000, Infinity])),
};

export const mediumPop: Filter = {
  id: "Medium Population",
  predicate: flow(pickPop, optionBetween([10_000_000, 1_000_000_000])),
};

export const smallPop: Filter = {
  id: "Small Population",
  predicate: flow(pickPop, optionBetween([1_000_000, 10_000_000])),
};

export const tinyPop: Filter = {
  id: "Tiny Population",
  predicate: flow(pickPop, optionBetween([1_000, 1_000_000])),
};

export const matchById = (id: string) =>
  match(id)
    .with(hugePop.id, () => hugePop)
    .with(mediumPop.id, () => mediumPop)
    .with(smallPop.id, () => smallPop)
    .with(tinyPop.id, () => tinyPop)
    .otherwise(() => all);
