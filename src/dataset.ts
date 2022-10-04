import { option } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { Row } from "./data";
import { Filter } from "./filter";

export type DataSet = { name: string; filter: Filter };

export const all: DataSet = { name: "All", filter: () => true };

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

export const hugePop: DataSet = {
  name: "Huge Population",
  filter: flow(pickPop, optionBetween([1_000_000_000, Infinity])),
};

export const mediumPop: DataSet = {
  name: "Medium Population",
  filter: flow(pickPop, optionBetween([10_000_000, 1_000_000_000])),
};

export const smallPop: DataSet = {
  name: "Small Population",
  filter: flow(pickPop, optionBetween([1_000_000, 10_000_000])),
};

export const tinyPop: DataSet = {
  name: "Tiny Population",
  filter: flow(pickPop, optionBetween([1_000, 1_000_000])),
};

export const matchByName = (name: string) =>
  match(name)
    .with(hugePop.name, () => hugePop)
    .with(mediumPop.name, () => mediumPop)
    .with(smallPop.name, () => smallPop)
    .with(tinyPop.name, () => tinyPop)
    .otherwise(() => all);
