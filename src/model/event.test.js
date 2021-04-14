import TableEvent from './event';

test('FIXED_PERIOD_OF_TIME_IN_HOURS within range', () => {
  const actual = TableEvent.FIXED_PERIOD_OF_TIME_IN_HOURS;
  const expected = Math.max(1, Math.abs(parseInt(actual.toFixed(0), 10)));
  expect(actual).toBe(expected);
});
