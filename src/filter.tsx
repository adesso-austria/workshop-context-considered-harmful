import { Slider, Typography } from "@mui/material";
import { array, option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import React from "react";
import { Row, useData } from "./data";
import { useSetFilter } from "./state";

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
          option.map(
            (epc) =>
              selectedMin <= epc && epc <= selectedMax
          ),
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
        onChange={(_e, newValue) =>
          setEpcRange(newValue as [number, number])
        }
        min={minEpc}
        max={maxEpc}
        valueLabelDisplay="on"
      />
    </div>
  );
};

export const FilterArea = function FilterArea() {
  return (
    <div aria-label="Filter Area">
      <Typography variant="h5">Filters</Typography>
      <EpcFilter />
    </div>
  );
};
