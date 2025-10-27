import {
  daysAgo,
  daysFromNow,
  hoursAgo,
  hoursFromNow,
  minutesFromNow,
  secondsFromNow,
} from '../../utils/date';

describe('utils/date', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  describe('secondsFromNow', () => {
    const TIME_NOW = new Date('2025-10-17T14:30:45.123Z');
    const SECS_TO_CHANGE = 30;
    const SECS_ONE_MIN = 60;
    const EXPECT_FUTURE = new Date('2025-10-17T14:31:15.123Z');
    const EXPECT_ONE_MIN = new Date('2025-10-17T14:31:45.123Z');
    const EXPECT_PAST = new Date('2025-10-17T14:30:15.123Z');

    it('should handle positive values (future)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = secondsFromNow(SECS_TO_CHANGE);
      expect(result).toEqual(EXPECT_FUTURE);
    });

    it('should handle 0 (present)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = secondsFromNow(0);
      expect(result).toEqual(TIME_NOW);
    });

    it('should handle negative values (past)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = secondsFromNow(-SECS_TO_CHANGE);
      expect(result).toEqual(EXPECT_PAST);
    });

    it('should handle large values', () => {
      jest.setSystemTime(TIME_NOW);

      const result = secondsFromNow(SECS_ONE_MIN);
      expect(result).toEqual(EXPECT_ONE_MIN);
    });
  });

  describe('minutesFromNow', () => {
    const TIME_NOW = new Date('2025-10-17T14:30:45.123Z');
    const MINS_TO_CHANGE = 30;
    const MINS_ONE_HOUR = 60;
    const EXPECT_FUTURE = new Date('2025-10-17T15:00:45.123Z');
    const EXPECT_ONE_HOUR = new Date('2025-10-17T15:30:45.123Z');
    const EXPECT_PAST = new Date('2025-10-17T14:00:45.123Z');

    it('should handle positive values (future)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = minutesFromNow(MINS_TO_CHANGE);
      expect(result).toEqual(EXPECT_FUTURE);
    });

    it('should handle 0 (present)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = minutesFromNow(0);
      expect(result).toEqual(TIME_NOW);
    });

    it('should handle negative values (past)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = minutesFromNow(-MINS_TO_CHANGE);
      expect(result).toEqual(EXPECT_PAST);
    });

    it('should handle large values', () => {
      jest.setSystemTime(TIME_NOW);

      const result = minutesFromNow(MINS_ONE_HOUR);
      expect(result).toEqual(EXPECT_ONE_HOUR);
    });
  });

  describe('hoursFromNow', () => {
    const TIME_NOW = new Date('2025-10-17T14:30:45.123Z');
    const HOURS_TO_CHANGE = 5;
    const HOURS_ONE_DAY = 24;
    const EXPECT_FUTURE = new Date('2025-10-17T19:30:45.123Z');
    const EXPECT_ONE_DAY = new Date('2025-10-18T14:30:45.123Z');
    const EXPECT_PAST = new Date('2025-10-17T09:30:45.123Z');

    it('should handle positive values (future)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = hoursFromNow(HOURS_TO_CHANGE);
      expect(result).toEqual(EXPECT_FUTURE);
    });

    it('should handle 0 (present)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = hoursFromNow(0);
      expect(result).toEqual(TIME_NOW);
    });

    it('should handle negative values (past)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = hoursFromNow(-HOURS_TO_CHANGE);
      expect(result).toEqual(EXPECT_PAST);
    });

    it('should handle large values', () => {
      jest.setSystemTime(TIME_NOW);

      const result = hoursFromNow(HOURS_ONE_DAY);
      expect(result).toEqual(EXPECT_ONE_DAY);
    });

    it('daysAgo (should handle syntactic sugar method properly)', () => {
      jest.setSystemTime(TIME_NOW);

      const result1 = hoursFromNow(-HOURS_TO_CHANGE);
      const result2 = hoursAgo(HOURS_TO_CHANGE);
      expect(result1).toEqual(result2);
    });
  });

  describe('daysFromNow', () => {
    const TIME_NOW = new Date('2025-10-17T14:30:45.123Z');
    const DAYS_TO_CHANGE = 5;
    const DAYS_ONE_YEAR = 365;
    const EXPECT_FUTURE = new Date('2025-10-22T14:30:45.123Z');
    const EXPECT_ONE_YEAR = new Date('2026-10-17T14:30:45.123Z');
    const EXPECT_PAST = new Date('2025-10-12T14:30:45.123Z');

    it('should handle positive values (future)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = daysFromNow(DAYS_TO_CHANGE);
      expect(result).toEqual(EXPECT_FUTURE);
    });

    it('should handle 0 (present)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = daysFromNow(0);
      expect(result).toEqual(TIME_NOW);
    });

    it('should handle negative values (past)', () => {
      jest.setSystemTime(TIME_NOW);

      const result = daysFromNow(-DAYS_TO_CHANGE);
      expect(result).toEqual(EXPECT_PAST);
    });

    it('should handle large values', () => {
      jest.setSystemTime(TIME_NOW);

      const result = daysFromNow(DAYS_ONE_YEAR);
      expect(result).toEqual(EXPECT_ONE_YEAR);
    });

    it('daysAgo (should handle syntactic sugar method properly)', () => {
      jest.setSystemTime(TIME_NOW);

      const result1 = daysFromNow(-DAYS_TO_CHANGE);
      const result2 = daysAgo(DAYS_TO_CHANGE);
      expect(result1).toEqual(result2);
    });
  });
});
