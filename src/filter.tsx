import { Slider, Typography } from "@mui/material";
import { array, option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import React from "react";
import { Row, useData } from "./data";
import { useDatasetRows } from "./dataset";

export type Filter = {
  id: string;
  predicate: (row: Row) => boolean;
};

const EpcFilter = function EpcFilter() {
  const rows = useData();

  /**
   * EPC FILTER
   */
  const [minEpc, maxEpc] = React.useMemo(() => {
    const epcs = pipe(
      rows,
      array.map((row) => row.region.energyPerCapita),
      array.compact
    );

    return epcs.length === 0
      ? [-Infinity, Infinity] // 0 length would create [Infinity, -Infinity]
      : [Math.min(...epcs), Math.max(...epcs)];
  }, [rows]);

  const [epcRange, setEpcRange] = React.useState(
    () => [minEpc, maxEpc] as const
  );

  const epcFilter: Filter = React.useMemo(
    () => ({
      id: "epc",
      predicate: (row) => {
        const [selectedMin, selectedMax] = epcRange;

        return pipe(
          row.region.energyPerCapita,
          option.map((epc) => selectedMin <= epc && epc <= selectedMax),
          option.getOrElse(
            () => selectedMin === minEpc && selectedMax === maxEpc
          )
        );
      },
    }),
    [epcRange]
  );

  const setFilter = useSetFilter();
  React.useEffect(() => {
    setFilter(epcFilter);
  }, [epcFilter]);

  return (
    <div>
      <Typography variant="body1" style={{ textAlign: "center" }}>
        Energy per capita
      </Typography>
      <Slider
        // mui typings aren't very precise
        value={epcRange as unknown as number[]}
        onChange={(_e, newValue) => setEpcRange(newValue as [number, number])} 
        min={minEpc}
        max={maxEpc}
        valueLabelDisplay="on"
      />
    </div>
  );
};

const fib = (x: number): number => {
  return x === 0 ? 0 : x === 1 ? 1 : fib(x - 1) + fib(x - 2);
};

export const FilterArea = React.memo(function FilterArea() {
  const filters = useFilters();

  fib(40);

  return (
    <div aria-label="Filter Area">
      <Typography variant="h5">Filters</Typography>
      <Typography variant="h5">
        Filters ({Object.keys(filters).length})
      </Typography>
      <EpcFilter />
    </div>
  );
});

const context = React.createContext<
  [
    Record<string, Filter>,
    React.Dispatch<React.SetStateAction<Record<string, Filter>>>
  ]
>([
  {},
  () => {
    /*ignore*/
  },
]);

export const FiltersProvider = function FiltersProvider({
  children,
}: React.PropsWithChildren) {
  const state = React.useState({} as Record<string, Filter>);

  return <context.Provider value={state}>{children}</context.Provider>;
};

export const useFilters = () => React.useContext(context)[0];
export const useSetFilter = () => {
  const setState = React.useContext(context)[1];

  return (filter: Filter) =>
    setState((current) => ({
      ...current,
      [filter.id]: filter,
    }));
};

export const useFilteredRows = () => {
  const datasetRows = useDatasetRows();
  const filters = Object.values(useFilters());
  return datasetRows.filter((row) =>
    filters.every((filter) => filter.predicate(row))
  );
};
