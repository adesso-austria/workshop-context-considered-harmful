---
highlightTheme: github-dark-dimmed
css: [css/custom.css]
defaultTemplate: "[[tpl-default]]"
width: 1024
height: 800
controls: false
navigationMode: "linear"
---

# Context considered harmful
#### how hooks aren't state management

---

# About me

###### Katja Potensky
- Principal Software Engineer **@** adesso
- :star: always surrounded by better engineers
- Learned to :heart: math through typescript

---

# Setup

https://github.com/adesso-austria/workshop-context-considered-harmful

---

# Refresher

--

## Hooks

```tsx
const Component = function Component() { 
	// simply associate value to component 
	const ref = React.useRef("A simple value"); 
	// current state and function to update it 
	const [seed, setSeed] = React.useState(42); 
	// derived value 
	const answerToLife = React.useMemo(() => calculate(seed), [seed]); 
	// infinite loop 
	setSeed((current) => current + 1); 
};
```

--

## Context

```tsx
<Provider value={"Hey mom"}> 
  <Nested> 
    <Component> 
      <Consumer>
        {/* const value = useContext() // Hey mom */} 
      </Consumer> 
    </Component> 
  </Nested> 
</Provider>
```

--

## reducers

```tsx
const reducer = (state, action) => 
  match(action)
    .with({type: "increment"}, ({payload}) => state + payload)
    .with({type: "decrement"}, ({payload}) => state - payload)
    .with({type: "multiply"}, ({payload}) => state * payload)
    .otherwise(() => state)

const state1 = reducer(21, {type: "increment", payload: 10}) // 31
const state2 = reducer(21, {type: "decrement", payload: 10}) // 11
const state3 = reducer(21, {type: "multiply", payload: 2}) // 42
```

---

# Separation of Concerns
git tag: `start-task-01`

--

- `app.tsx` contains everything
- works, but not easy to maintain

> [!tip]
> each module should represent one concern. "One" means "orthogonal" to everything else in this case.

--

## Dataset

1. rename `dataset.ts` to `dataset.tsx`
2. add a new Component  `DataSet`
3. transfer the following things from `app.tsx` to the new component
	1. the "header" element
	2. `dataset` state
	3. url parsing effect

--

## Filter

1. rename `filter.ts` to `filter.tsx`
2. create a new component `FilterArea`
3. transfer the following things from `app.tsx` to the new component
	1. the "filter area" element
	2. the `data` hook
	3. the `minEpc` and `maxEpc` derivation
	4. the `epcRange` state
	5. the `epcFilter` derivation

--

## Wrap-Up

- separated concerns a little bit
- app is broken
- where to get the state from?

--

# Lifting state up

- state needs to be shared across multiple components
- context can hold state

--

## State module

```typescript
// state.tsx
type State = {
  rows: Row[];
  filters: Record<string, Filter>;
  dataSet: Option<Filter>;
}

type Action =
  | { type: "set data"; payload: Row[] }
  | { type: "set dataset"; payload: option.Option<Filter> }
  | { type: "set filter"; payload: Filter };
```

--

## State provider

```typescript
// state.tsx
const context = React.createContext<[State, React.Dispatch<Action>]>([
  initialState,
  ignore,
])
// ...
export const StateProvider = function StateProvider({
  children,
}: React.PropsWithChildren) {
  const value = React.useReducer(reducer, initialState);
  return <context.Provider value={value}>{children}</context.Provider>;
};
```

--

## Wiring the state provider

```tsx
// index.tsx
<StateProvider>
  <App />
</StateProvider>
```

--

## selecting state

```typescript
// state.tsx
const selectDatasetRows = ({ dataset, data }: State): Row[] => pipe(
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
```

--

## hookifying state

```typescript
// state.tsx
export const useFilteredRows = flow(useState, selectFilteredRows);
```

--

## reading the state

```typescript
// app.tsx
const filteredRows = useFilteredRows();
```

--

## dispatch updates

```typescript
// state.tsx
export const useSetData = () => {
  const dispatch = useDispatch();
  return (data: Row[]) =>
    dispatch({
      type: "set data",
      payload: data,
    });
};

export const useSetDataset = // analogous to useSetData

export const useSetFilter = // analogous to useSetData
```

--

## updating the state

```typescript
// app.tsx
const setData = useSetData();
const data = useData();
React.useEffect(() => setData(data), [data]);
```

```typescript
// dataset.tsx
const setStoreDataset = useSetDataset();
React.useEffect(() => setStoreDataset(dataset), [dataset]);
```

```typescript
// filter.tsx
const setFilter = useSetFilter();
React.useEffect(() => setFilter(epcFilter), [epcFilter]);
```

--

## Wrap up

- app works again
- a bit sluggish

---

# Where the problems start
git tag: `start-task-02`

--

## Display active filters

```typescript
// state.tsx
const selectFilters = (state: State) => state.filters;

export const useFilters = flow(useState, selectFilters);
```

```typescript
// filter.tsx
const filters = useFilters();
// ...
<Typography variant="h5">
  Filters ({Object.keys(filters).length})
</Typography>
```

--

## Simulate slow UI

```typescript
// filter.tsx
const fib = (x: number): number => {
  return x === 0 ? 0 : x === 1 ? 1 : fib(x - 1) + fib(x - 2);
};
// ...
export const FilterArea = React.memo(function FilterArea() {
  const filters = useFilters();
 
  fib(40);
```

now select another dataset

--

## Why so slow?

- nothing changes in `FilterArea`
- context changes
- react can't tell whether update is relevant for consumer

--

## trying to fix it
- wrap `FilterArea` in `React.memo`

--

## Wrap up

- app is still slow
- consumers of context re-render regardless
- `React.memo` only works for prop changes

---

# Splitting contexts
git tag: `start-task-03`

> [!tip] (not really a) Tip
> make contexts really fine-grained to prevent unwanted re-renders

--

## Wrap up

- performance issue is fixed
- app is a whole lot more ~~enterprise ready~~ complex

---

# Hitting a wall
git tag: `start-task-04`

--

## A new feature

hide datasets that would be empty with the current filter state

- calculate eligible datasets in `DataSetProvider`

--

![[Drawing 2023-03-22 00.28.20.excalidraw|800]]

--

## Wrap up

> [!warning] splitting contexts leads to...
> - increased complexity
> - risk of circular dependencies
> - cross dependencies growing ever harder to manage

---

# Time to rethink
git tag: `start-task-05`

- updating context value leads to re-render
- we need more fine grained control over updates
- hold observable state in context

--

## Observable state

```typescript
// state.tsx
import * as Rx from "rxjs";
// ...
const context = 
  React.createContext<[
    Rx.BehaviourSubject<State>, 
    React.Dispatch<Action>
  ]>()
// ...
const store = React.useMemo(
  () => new Rx.BehaviorSubject(initialState), 
  []
)

const dispatch = React.useCallback(
  (action: Action) => store.next(reducer(store.value, action)),
  [store]
)
```

--

## Observing state

```typescript
export const useSelector = <T>(selector: (state: State) => T) => {
  const store = useStore();

  const [value, setValue] = React.useState(() => selector(store.value));

  React.useEffect(() => {
    const subscription = store.pipe(
      Rx.map(selector),
      Rx.distinctUntilChanged(),
    ).subscribe((next) => setValue(next));

    return () => subscription.unsubscribe();
  })
}
```

--

## Wrap up

![[not-different-from-redux.png]]