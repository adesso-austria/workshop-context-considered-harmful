import { TextField } from "@mui/material";
import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import React from "react";
import { showOption, showStat, useData } from "./data";
import { formatMilleSuffix } from "./format";
import { Table } from "./table";

export const App = function App() {
  const data = useData();

  const [query, setQuery] = React.useState(
    () => new URLSearchParams(location.search).get("query") ?? ""
  );

  React.useEffect(() => {
    const params = new URLSearchParams({ ...(!query ? {} : { query }) });
    history.replaceState(undefined, "", `?${params.toString()}`);
  }, [query]);

  const rows = React.useMemo(
    () => data.filter((row) => row.region.name.includes(query)),
    [data, query]
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", height: "100%" }}>
      <div style={{ maxWidth: 1000 }}>
        <Table
          rows={rows}
          columns={{
            region: {
              width: 200,
              header: (
                <>
                  Region
                  <TextField
                    variant="standard"
                    placeholder="search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </>
              ),
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
