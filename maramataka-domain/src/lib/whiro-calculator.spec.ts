import { calculateWhiroStart } from './whiro-calculator';

describe('calculateWhiroStart', () => {
  it('uses same-day sunset when New Moon occurs before sunset', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T10:00:00+13:00'),
      sunsets: [
        new Date('2026-01-01T20:47:00+13:00'),
        new Date('2026-01-02T20:47:00+13:00'),
      ],
    });

    expect(result).toEqual(new Date('2026-01-01T20:47:00+13:00'));
  });

  it('uses next sunset when New Moon occurs after sunset', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T22:00:00+13:00'),
      sunsets: [
        new Date('2026-01-01T20:47:00+13:00'),
        new Date('2026-01-02T20:47:00+13:00'),
      ],
    });

    expect(result).toEqual(new Date('2026-01-02T20:47:00+13:00'));
  });

  it('throws when no sunset exists after New Moon', () => {
    expect(() =>
      calculateWhiroStart({
        newMoonAt: new Date('2026-01-03T10:00:00+13:00'),
        sunsets: [new Date('2026-01-01T20:47:00+13:00')],
      })
    ).toThrow('No sunset found after New Moon');
  });
});