import { Divider } from "@mui/material";
import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import React from "react";
import { showOption, showStat, useData } from "./data";
import * as DataSet from "./dataset";
import { FilterArea } from "./filter";
import { formatMilleSuffix } from "./format";
import { useFilteredRows, useSetData } from "./state";
import { Table } from "./table";

export const App = function App() {
  const setData = useSetData();

  const data = useData();
  React.useEffect(() => setData(data), [data]);

  const rows = useFilteredRows();

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
        <DataSet.DataSet />
        <FilterArea />
        <Divider />
        <Table
          rows={rows}
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
