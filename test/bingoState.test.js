import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialState,
  deserializeState,
  serializeState,
  setTitle,
  toggleNumber,
  clearNumbers,
} from '../src/bingoState.js';

test('creates a bingo state with 75 unmarked numbers', () => {
  const state = createInitialState();

  assert.equal(state.title, 'Bingo');
  assert.deepEqual(state.recentMarked, []);
  assert.equal(state.numbers.length, 75);
  assert.deepEqual(state.numbers.slice(0, 5), [
    { value: 1, marked: false },
    { value: 2, marked: false },
    { value: 3, marked: false },
    { value: 4, marked: false },
    { value: 5, marked: false },
  ]);
  assert.deepEqual(state.numbers.at(-1), { value: 75, marked: false });
});

test('toggles a number between marked and unmarked', () => {
  const marked = toggleNumber(createInitialState(), 12);
  const unmarked = toggleNumber(marked, 12);

  assert.equal(marked.numbers[11].marked, true);
  assert.equal(unmarked.numbers[11].marked, false);
});

test('clears every marked number', () => {
  const state = toggleNumber(toggleNumber(createInitialState(), 7), 33);
  const cleared = clearNumbers(state);

  assert.equal(cleared.numbers.every((number) => !number.marked), true);
  assert.deepEqual(cleared.recentMarked, []);
});

test('tracks the last 5 marked numbers with the most recent first', () => {
  const state = [4, 9, 12, 22, 31, 44].reduce(
    (currentState, value) => toggleNumber(currentState, value),
    createInitialState()
  );

  assert.deepEqual(state.recentMarked, [44, 31, 22, 12, 9]);
});

test('removes a number from recent marked list when it is unmarked', () => {
  const state = toggleNumber(
    toggleNumber(toggleNumber(createInitialState(), 8), 19),
    8
  );

  assert.deepEqual(state.recentMarked, [19]);
});

test('updates the title and falls back to the default when blank', () => {
  const titled = setTitle(createInitialState(), 'Festa Junina');
  const blank = setTitle(titled, '   ');

  assert.equal(titled.title, 'Festa Junina');
  assert.equal(blank.title, 'Bingo');
});

test('serializes and deserializes state for presentation sync', () => {
  const state = setTitle(toggleNumber(createInitialState(), 25), 'Rodada 1');
  const restored = deserializeState(serializeState(state));

  assert.deepEqual(restored, state);
});
