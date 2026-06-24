import axios from 'axios';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });

  it('returns a Maramataka month payload', async () => {
    const res = await axios.get('/api/maramataka/month', {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        tz: '13',
      },
    });

    expect(res.status).toBe(200);
    expect(res.data.version).toBe('mita-te-tai-best');
    expect(typeof res.data.whiroStartsAt).toBe('string');
    expect(Array.isArray(res.data.nights)).toBe(true);
    expect(res.data.nights.length).toBeGreaterThan(0);

    const firstNight = res.data.nights[0];
    expect(firstNight).toMatchObject({
      mata: expect.objectContaining({
        version: 'mita-te-tai-best',
      }),
    });
    expect(typeof firstNight.startsAt).toBe('string');
    expect(typeof firstNight.endsAt).toBe('string');
  }, 30000);
});
