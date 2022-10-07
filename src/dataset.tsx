import { MenuItem, Select, Typography } from "@mui/material";
import { option } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import React from "react";
import { match } from "ts-pattern";
import { Row, useData } from "./data";
import { Filter, useFilteredRows } from "./filter";

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

const datasets = [hugePop, mediumPop, smallPop, tinyPop];

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
    setStoreDataset(option.some(dataset));
  }, [dataset]);

  const eligibleDatasets = useEligibleDatasets();

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
        {eligibleDatasets.map((dataset) => (
          <MenuItem key={dataset.id} value={dataset.id}>
            {dataset.id}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
};

const context = React.createContext<{
  dataset: [
    option.Option<Filter>,
    React.Dispatch<React.SetStateAction<option.Option<Filter>>>
  ];
  eligibleDatasets: Filter[];
}>({
  dataset: [
    option.none,
    () => {
      /*ignore*/
    },
  ],
  eligibleDatasets: [],
});
export const DataSetProvider = function DataSetProvider({
  children,
}: React.PropsWithChildren) {
  const dataset = React.useState(option.none as option.Option<Filter>);

  const filteredRows = useFilteredRows();
  const eligibleDatasets = React.useMemo(() => {
    return datasets.filter(
      (dataset) => filteredRows.filter(dataset.predicate).length > 0
    );
  }, [filteredRows]);

  return (
    <context.Provider value={{ dataset, eligibleDatasets }}>
      {children}
    </context.Provider>
  );
};

export const useDataset = () => React.useContext(context).dataset[0];
export const useSetDataset = () => React.useContext(context).dataset[1];

export const useDatasetRows = () => {
  const data = useData();
  const dataset = useDataset();

  return pipe(
    dataset,
    option.map((dataset) => data.filter(dataset.predicate)),
    option.getOrElse(() => data)
  );
};

export const useEligibleDatasets = () => React.useContext(context).eligibleDatasets;
