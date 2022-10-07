import React from "react";
import { Filter } from "./filter";
import { match } from "ts-pattern";
import { Row } from "./data";
import { flow, pipe } from "fp-ts/lib/function";
import { option } from "fp-ts";
import { BehaviorSubject, distinctUntilChanged, map, Observable } from "rxjs";

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

const context = React.createContext<
  [BehaviorSubject<State>, React.Dispatch<Action>]
>([
  new BehaviorSubject(initialState),
  () => {
    /* ignore */
  },
]);

export const StateProvider = function StateProvider({
  children,
}: React.PropsWithChildren) {
  const store = React.useMemo(() => new BehaviorSubject(initialState), []);
  const dispatch = React.useCallback(
    (action: Action) => {
      const next = reducer(store.value, action);
      store.next(next);
    },
    [store]
  );
  return (
    <context.Provider value={[store, dispatch]}>{children}</context.Provider>
  );
};

const useState = () => React.useContext(context)[0];

function useSelector<T>(selector: (state: State) => T) {
  const state = useState();
  const [selected, setSelected] = React.useState(() => selector(state.value));

  React.useEffect(() => {
    const subscription = state
      .pipe(map(selector), distinctUntilChanged())
      .subscribe((selected) => setSelected(selected));
    return () => subscription.unsubscribe();
  }, []);

  return selected;
}

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

export const useFilteredRows = () => useSelector(selectFilteredRows);

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
