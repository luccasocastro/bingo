export const DEFAULT_TITLE = 'Bingo';
export const TOTAL_NUMBERS = 75;

export function createInitialState() {
  return {
    title: DEFAULT_TITLE,
    recentMarked: [],
    numbers: Array.from({ length: TOTAL_NUMBERS }, (_, index) => ({
      value: index + 1,
      marked: false,
    })),
  };
}

export function toggleNumber(state, value) {
  const selectedNumber = state.numbers.find((number) => number.value === value);
  const willMark = selectedNumber ? !selectedNumber.marked : false;

  return {
    ...state,
    recentMarked: updateRecentMarked(state.recentMarked ?? [], value, willMark),
    numbers: state.numbers.map((number) =>
      number.value === value ? { ...number, marked: !number.marked } : number
    ),
  };
}

export function clearNumbers(state) {
  return {
    ...state,
    recentMarked: [],
    numbers: state.numbers.map((number) => ({ ...number, marked: false })),
  };
}

export function setTitle(state, title) {
  const nextTitle = title.trim() || DEFAULT_TITLE;

  return {
    ...state,
    title: nextTitle,
  };
}

export function serializeState(state) {
  return JSON.stringify(state);
}

export function deserializeState(serializedState) {
  if (!serializedState) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(serializedState);

    if (!isValidState(parsed)) {
      return createInitialState();
    }

    return {
      ...parsed,
      recentMarked: normalizeRecentMarked(parsed.recentMarked, parsed.numbers),
    };
  } catch {
    return createInitialState();
  }
}

function isValidState(state) {
  return (
    typeof state?.title === 'string' &&
    Array.isArray(state.numbers) &&
    state.numbers.length === TOTAL_NUMBERS &&
    state.numbers.every(
      (number, index) =>
        number?.value === index + 1 && typeof number.marked === 'boolean'
    )
  );
}

function updateRecentMarked(recentMarked, value, willMark) {
  const withoutValue = recentMarked.filter((recentValue) => recentValue !== value);

  if (!willMark) {
    return withoutValue;
  }

  return [value, ...withoutValue].slice(0, 5);
}

function normalizeRecentMarked(recentMarked, numbers) {
  if (!Array.isArray(recentMarked)) {
    return [];
  }

  const markedValues = new Set(
    numbers.filter((number) => number.marked).map((number) => number.value)
  );

  return recentMarked
    .filter((value, index, list) => list.indexOf(value) === index)
    .filter((value) => Number.isInteger(value) && markedValues.has(value))
    .slice(0, 5);
}
