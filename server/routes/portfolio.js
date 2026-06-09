const express = require('express');
const router = express.Router();
const ado = require('../lib/ado');
const cache = require('../lib/cache');

const CACHE_TTL = 5 * 60 * 1000;       // 5 min for portfolio data
const WEEKLY_TTL = 30 * 60 * 1000;     // 30 min for weekly revisions

function getPAT() {
  const pat = process.env.ADO_PAT;
  if (!pat) throw new Error('ADO_PAT not configured');
  return pat;
}

// GET /api/portfolio — returns project list + per-project data + team
router.get('/', async (req, res) => {
  const forceRefresh = req.query.refresh === '1';

  try {
    const pat = getPAT();
    const cacheKey = 'portfolio_main';

    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json({ ...cached, fromCache: true, cacheAge: Math.round(cache.age(cacheKey) / 1000) });
      }
    }

    const projects = await ado.getProjects(pat);
    if (!projects.length) return res.status(503).json({ error: 'No ADO projects found' });

    const dataArr = await Promise.all(projects.map(proj => ado.fetchProj(pat, proj)));
    const team = ado.buildTeamData(dataArr);

    // Strip _items from response (large, internal-only)
    const cleanData = dataArr.map(d => {
      const { _items, ...rest } = d;
      return rest;
    });

    const payload = {
      projects,
      data: cleanData,
      team,
      fetchedAt: Date.now()
    };

    cache.set(cacheKey, payload, CACHE_TTL);
    return res.json({ ...payload, fromCache: false });

  } catch (err) {
    console.error('[portfolio] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/weekly?weekStart=2024-01-15 — returns weekly revision data
router.get('/weekly', async (req, res) => {
  const weekStart = req.query.weekStart;
  if (!weekStart) return res.status(400).json({ error: 'weekStart required (ISO date)' });

  const forceRefresh = req.query.refresh === '1';

  try {
    const pat = getPAT();
    const cacheKey = 'weekly_' + weekStart;

    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json({ ...cached, fromCache: true });
      }
    }

    // Need full data (with _items) for weekly — re-fetch if not in cache
    const portfolioKey = 'portfolio_main_with_items';
    let dataWithItems = cache.get(portfolioKey);

    if (!dataWithItems) {
      const projects = await ado.getProjects(pat);
      dataWithItems = await Promise.all(projects.map(proj => ado.fetchProj(pat, proj)));
      cache.set(portfolioKey, dataWithItems, CACHE_TTL);
    }

    const wkOpt = { start: new Date(weekStart) };
    const weekly = await ado.buildWeeklyRevisions(pat, dataWithItems, wkOpt);

    cache.set(cacheKey, weekly, WEEKLY_TTL);
    return res.json({ ...weekly, fromCache: false });

  } catch (err) {
    console.error('[weekly] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/cache — clear all cache (admin)
router.delete('/cache', (req, res) => {
  cache.del();
  res.json({ cleared: true });
});

module.exports = router;
