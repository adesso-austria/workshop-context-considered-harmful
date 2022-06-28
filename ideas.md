# react context considered harmful? (context vs state-management)

1. build store based on context + useReducer (1h)
1. scale it up (15min)
1. notice performance lag - expensive derived values?
	1. derive from nested value (5min)
	* redux dev-tools - profiler (5min)
		* maybe show connection to chrome profiler?
1. try to divide contexts (30min)
	1. provider nesting gets ugly
2. depend on value from nested provider in outer provider (10min)
	1. basically impossible (talk about proxies?)
3. highlight impasse: (5min)
  * performance suffers from combined store
  * separated store makes datamodel impossible
4. try to implement selectors with context (1h)
	1. still rerenders every time
	2. create wrapper component that consumes context and passes selected props to memoized child component (30min)
	3. still shitty -> context can't replace state-management
		* context is not _meant_ to replace state-management
1. updating context rerenders consumers -> observer pattern (10min)

# sync with talk after me (Lenz)

1. create redux from scratch? (1h)
	1. extend with middleware capabilities (30min)
	2. build "time machine" (30min)
	3. build serialization middleware? (30min)
2. move to RTK (1h)
  1. migration path or separate app?
  1. non-json values? Functions, maps, sets, etc...

