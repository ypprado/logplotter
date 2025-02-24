//const sum = require('../scripts/main-db-loader');
import { sum } from '../scripts/main-db-loader.js';

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});

test('adds 12 + 2 to equal 3', () => {
  expect(sum(12, 2)).toBe(14);
});

test('adds A + 2 to equal 3', () => {
  expect(sum(A, 2)).toBe(0);
});