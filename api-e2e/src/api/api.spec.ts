import axios from 'axios';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });

  it('returns a Maramataka page payload', async () => {
    const res = await axios.get('/api/maramataka/page', {
      params: {
        date: '2026-01-01',
        location: 'wellington',
      },
    });

    expect(res.status).toBe(200);
    expect(res.data.cycle.version).toBe('mita-te-tai-best');
    expect(typeof res.data.cycle.anchors.whiro.occursAt).toBe('string');
    expect(Array.isArray(res.data.cycle.nights)).toBe(true);
    expect(res.data.cycle.nights.length).toBeGreaterThan(0);
    expect(res.data.moonDetails).toMatchObject({
      source: expect.any(String),
    });

    const firstNight = res.data.cycle.nights[0];
    expect(firstNight).toMatchObject({
      mata: expect.objectContaining({
        version: 'mita-te-tai-best',
      }),
    });
    expect(typeof firstNight.startsAt).toBe('string');
    expect(typeof firstNight.endsAt).toBe('string');
  }, 30000);

  it('exposes liveness and readiness health checks', async () => {
    const liveness = await axios.get('/api/health/live');
    expect(liveness.status).toBe(200);
    expect(liveness.data).toEqual({
      status: 'ok',
      service: 'maramataka-api',
    });

    const readiness = await axios.get('/api/health/ready');
    expect(readiness.status).toBe(200);
    expect(readiness.data).toMatchObject({
      status: 'ok',
      service: 'maramataka-api',
      checks: {
        app: 'ok',
        astronomyProvider: 'ok',
      },
    });
  }, 30000);
});
