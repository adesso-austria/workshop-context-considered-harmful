import { MenuItem, Select, Typography } from "@mui/material";
import { option } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import React from "react";
import { match } from "ts-pattern";
import { Row } from "./data";
import { Filter } from "./filter";
import { useSetDataset } from "./state";

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

export const DataSet = function DataSet() {
  const [dataset, setDataset] = React.useState(() =>
    pipe(
      new URLSearchParams(location.search).get("dataset"),
      option.fromNullable,
      option.map(flow(decodeURIComponent, matchById)),
      option.getOrElse(() => all)
    )
  );

  React.useEffect(() => {
    const params = new URLSearchParams({
      dataset: encodeURIComponent(dataset.id),
    });
    history.replaceState(undefined, "", `?${params.toString()}`);
  }, [dataset]);

  const setStoreDataset = useSetDataset();
  React.useEffect(() => {
    setStoreDataset(dataset);
  }, [dataset]);

  return (
    <div aria-label="Header">
      <Typography variant="h5">Dataset</Typography>
      <Select
        variant="standard"
        label="Dataset"
        value={dataset.id}
        onChange={(e) => setDataset(matchById(e.target.value))}
      >
        <MenuItem value="All">All</MenuItem>
        <MenuItem value={hugePop.id}>{hugePop.id}</MenuItem>
        <MenuItem value={mediumPop.id}>{mediumPop.id}</MenuItem>
        <MenuItem value={smallPop.id}>{smallPop.id}</MenuItem>
        <MenuItem value={tinyPop.id}>{tinyPop.id}</MenuItem>
      </Select>
    </div>
  );
};
