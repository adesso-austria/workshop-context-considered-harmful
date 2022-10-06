import React from "react";
import { Filter } from "./filter";
import { match } from "ts-pattern";
import { Row } from "./data";
import { flow, pipe } from "fp-ts/lib/function";
import { option } from "fp-ts";

type State = {
  data: Row[];
  filters: Record<string, Filter>;
  dataset: option.Option<Filter>;
};
const initialState: State = { data: [], filters: {}, dataset: option.none };

type Action =
  | { type: "set data"; payload: Row[] }
  | { type: "set dataset"; payload: option.Option<Filter> }
  | { type: "set filter"; payload: Filter };

const reducer: React.Reducer<State, Action> = (state, action) =>
  match(action)
    .with({ type: "set data" }, ({ payload }) => ({
      ...state,
      data: payload,
    }))
    .with({ type: "set dataset" }, ({ payload }) => ({
      ...state,
      dataset: payload,
    }))
    .with({ type: "set filter" }, ({ payload }) => ({
      ...state,
      filters: {
        ...state.filters,
        [payload.id]: payload,
      },
    }))
    .exhaustive();

const context = React.createContext<[State, React.Dispatch<Action>]>([
  initialState,
  () => {
    /* ignore */
  },
]);

export const StateProvider = function StateProvider({
  children,
}: React.PropsWithChildren) {
  const value = React.useReducer(reducer, initialState);
  return <context.Provider value={value}>{children}</context.Provider>;
};

const useState = () => React.useContext(context)[0];
const useDispatch = () => React.useContext(context)[1];

const selectDatasetRows = ({ dataset, data }: State): Row[] =>
  pipe(
    dataset,
    option.map((dataset) => data.filter(dataset.predicate)),
    option.getOrElse(() => data)
  );

const selectFilteredRows = (state: State) => {
  const dataSetRows = selectDatasetRows(state);
  const filters = Object.values(state.filters);
  return dataSetRows.filter((row) =>
    filters.every((filter) => filter.predicate(row))
  );
};

export const useFilteredRows = flow(useState, selectFilteredRows);

export const useSetData = () => {
  const dispatch = useDispatch();
  return (data: Row[]) =>
    dispatch({
      type: "set data",
      payload: data,
    });
};

export const useSetDataset = () => {
  const dispatch = useDispatch();
  return (dataset: Filter) =>
    dispatch({
      type: "set dataset",
      payload: option.some(dataset),
    });
};

export const useSetFilter = () => {
  const dispatch = useDispatch();
  return (filter: Filter) =>
    dispatch({
      type: "set filter",
      payload: filter,
    });
};
