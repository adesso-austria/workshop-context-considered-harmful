import { Divider, MenuItem, Select, Slider, Typography } from "@mui/material";
import { array, option } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import React from "react";
import { showOption, showStat, useData } from "./data";
import * as DataSet from "./dataset";
import { Filter } from "./filter";
import { formatMilleSuffix } from "./format";
import { Table } from "./table";

export const App = function App() {
  const data = useData();

  const [dataset, setDataset] = React.useState(() =>
    pipe(
      new URLSearchParams(location.search).get("dataset"),
      option.fromNullable,
      option.map(flow(decodeURIComponent, DataSet.matchByName)),
      option.getOrElse(() => DataSet.all)
    )
  );

  React.useEffect(() => {
    const params = new URLSearchParams({
      dataset: encodeURIComponent(dataset.name),
    });
    history.replaceState(undefined, "", `?${params.toString()}`);
  }, [dataset]);

  const rows = React.useMemo(
    () => data.filter(dataset.filter),
    [data, dataset]
  );

  /**
   * POPULATION FILTER
   */
  const [minPopulation, maxPopulation] = React.useMemo(() => {
    const populations = pipe(
      rows,
      array.map((row) => row.region.population),
      array.compact
    );

    return populations.length === 0
      ? [-Infinity, Infinity] // 0 length would create [Infinity, -Infinity]
      : [Math.min(...populations), Math.max(...populations)];
  }, [rows]);

  const [populationRange, setPopulationRange] = React.useState(
    () => [minPopulation, maxPopulation] as const
  );

  React.useEffect(() => {
    setPopulationRange([-Infinity, Infinity]);
  }, [dataset]);

  const populationFilter: Filter = React.useMemo(
    () => (row) => {
      const [selectedMin, selectedMax] = populationRange;

      return pipe(
        row.region.population,
        option.map(
          (population) => selectedMin <= population && population <= selectedMax
        ),
        option.getOrElse(
          () => selectedMin === minPopulation && selectedMax === maxPopulation
        )
      );
    },
    [populationRange]
  );

  /**
   * FILTERING
   */
  const filters = React.useMemo(() => [populationFilter], [populationFilter]);

  const filteredRows = React.useMemo(
    () =>
      filters.reduce((filtered, predicate) => filtered.filter(predicate), rows),
    [rows, filters]
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", height: "100%" }}>
      <div
        style={{
          maxWidth: 1000,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "1rem",
        }}
      >
        <div aria-label="Header">
          <Typography variant="h5">Dataset</Typography>
          <Select
            variant="standard"
            label="Dataset"
            value={dataset.name}
            onChange={(e) => setDataset(DataSet.matchByName(e.target.value))}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value={DataSet.hugePop.name}>
              {DataSet.hugePop.name}
            </MenuItem>
            <MenuItem value={DataSet.mediumPop.name}>
              {DataSet.mediumPop.name}
            </MenuItem>
            <MenuItem value={DataSet.smallPop.name}>
              {DataSet.smallPop.name}
            </MenuItem>
            <MenuItem value={DataSet.tinyPop.name}>
              {DataSet.tinyPop.name}
            </MenuItem>
          </Select>
        </div>
        <div aria-label="Filter Area">
          <Typography variant="h5">Filters</Typography>
          <div>
            <Typography variant="body1" style={{ textAlign: "center" }}>
              Population
            </Typography>
            <Slider
              // mui typings aren't very precise
              value={populationRange as unknown as number[]}
              onChange={(_e, newValue) =>
                setPopulationRange(newValue as [number, number])
              }
              min={minPopulation}
              max={maxPopulation}
              valueLabelDisplay="on"
            />
          </div>
        </div>
        <Divider />
        <Table
          rows={filteredRows}
          columns={{
            region: {
              width: 200,
              header: <>Region</>,
              cell: ({ row }) => <div>{row.region.name}</div>,
            },
            population: {
              width: 150,
              align: "right",
              header: <>Population</>,
              cell: ({ row }) => (
                <div>
                  {pipe(
                    row.region.population,
                    option.map(formatMilleSuffix),
                    showOption
                  )}
                </div>
              ),
            },
            wind: {
              width: 200,
              align: "right",
              header: <>Wind (Demand / Production)</>,
              cell: ({ row }) => <div>{showStat(row.stats.wind, "Wh")}</div>,
            },
            hydro: {
              width: 200,
              align: "right",
              header: <>Hydro (Demand / Production)</>,
              cell: ({ row }) => <div>{showStat(row.stats.hydro, "Wh")}</div>,
            },
            nuclear: {
              width: 200,
              align: "right",
              header: <>Nuclear (Demand / Production)</>,
              cell: ({ row }) => <div>{showStat(row.stats.nuclear, "Wh")}</div>,
            },
            coal: {
              width: 200,
              align: "right",
              header: <>Coal (Demand / Production)</>,
              cell: ({ row }) => <div>{showStat(row.stats.coal, "Wh")}</div>,
            },
          }}
        />
      </div>
    </div>
  );
};
