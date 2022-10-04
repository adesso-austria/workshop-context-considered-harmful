import { option, record } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { last } from "ramda";
import React from "react";
import { formatScientific } from "./format";

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

export const showOption = option.getOrElse(() => "N/A");

export const showStat = (stat: Stat, unit = "") =>
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


/**
 * use remote data
 */
export const useData = () => {
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
      .then(mapResponseToRows)
      .then(setData);
  }, []);

  return data;
};
