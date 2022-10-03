import { TextField } from "@mui/material";
import { option, record } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { last, tap } from "ramda";
import React from "react";
import { Table } from "./table";

type Stat = {
  demand: option.Option<number>;
  generation: option.Option<number>;
  pct: option.Option<number>;
};

const createStat = (
  demand: option.Option<number>,
  generation: option.Option<number>
): Stat => ({
  demand,
  generation,
  pct: pipe(
    { demand, generation },
    record.sequence(option.Applicative),
    option.map(({ demand, generation }) =>
      generation === 0 ? 0 : demand / generation
    )
  ),
});

type BySector = {
  wind: Stat;
  solar: Stat;
  hydro: Stat;
  nuclear: Stat;
  oil: Stat;
  coal: Stat;
};

type Row = {
  region: { name: string; isoCode: string; population: option.Option<number> };
  stats: BySector;
};

const inTeraWatts = (x: number) => x * 1_000_000_000_000;

/**
 * use remote data
 */
const useData = () => {
  const [data, setData] = React.useState([] as Row[]);

  React.useEffect(() => {
    type ResponseJson = Record<
      string,
      {
        iso_code: string;
        data: Array<{ year: number } & Record<string, number>>;
      }
    >;

    const mapResponseToRows = (json: ResponseJson): Row[] =>
      Object.entries(json).map(([name, { iso_code, data: years }]): Row => {
        const current = last(years);
        return {
          region: {
            name,
            isoCode: iso_code,
            population: option.fromNullable(current?.population),
          },
          stats: {
            wind: createStat(
              pipe(
                option.fromNullable(current?.wind_consumption),
                option.map(inTeraWatts)
              ),
              pipe(
                option.fromNullable(current?.wind_electricity),
                option.map(inTeraWatts)
              )
            ),
            solar: createStat(
              pipe(
                option.fromNullable(current?.solar_consumption),
                option.map(inTeraWatts)
              ),
              pipe(
                option.fromNullable(current?.solar_electricity),
                option.map(inTeraWatts)
              )
            ),
            hydro: createStat(
              pipe(
                option.fromNullable(current?.hydro_consumption),
                option.map(inTeraWatts)
              ),
              pipe(
                option.fromNullable(current?.hydro_electricity),
                option.map(inTeraWatts)
              )
            ),
            nuclear: createStat(
              pipe(
                option.fromNullable(current?.nuclear_consumption),
                option.map(inTeraWatts)
              ),
              pipe(
                option.fromNullable(current?.nuclear_electricity),
                option.map(inTeraWatts)
              )
            ),
            oil: createStat(
              pipe(
                option.fromNullable(current?.oil_consumption),
                option.map(inTeraWatts)
              ),
              pipe(
                option.fromNullable(current?.oil_electricity),
                option.map(inTeraWatts)
              )
            ),
            coal: createStat(
              pipe(
                option.fromNullable(current?.coal_consumption),
                option.map(inTeraWatts)
              ),
              pipe(
                option.fromNullable(current?.coal_electricity),
                option.map(inTeraWatts)
              )
            ),
          },
        };
      });

    fetch("assets/energy.json")
      .then((res) => res.json())
      .then(tap(console.log))
      .then(mapResponseToRows)
      .then(setData);
  }, []);

  return data;
};

const determineMagnitude = (number: number, order = 10) => {
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

const formatMilleSuffix = (() => {
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

const formatScientific = (() => {
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

const showOption = option.getOrElse(() => "N/A");

const showStat = (stat: Stat, unit = "") =>
  pipe(
    stat,
    record.sequence(option.Applicative),
    option.map(
      ({ demand, generation, pct }) =>
        `${formatScientific(demand, unit)} / ${formatScientific(
          generation,
          unit
        )} (${(pct * 100).toFixed(0)}%)`
    ),
    showOption
  );

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
        />{" "}
      </div>
    </div>
  );
};
