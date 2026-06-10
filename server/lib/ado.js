const fetch = require('node-fetch');

const ADO_ORG = 'PalmtekSolution';
const ADO_BASE = 'https://dev.azure.com/' + ADO_ORG;

const EXCL_MEMBERS = ['TRAN GIANG BAO HUNG', 'HUNG TRAN GIANG BAO', 'GIANG BAO HUNG'];
const EXCL_PROJECTS = ['branding', 'team hub', 'palmtek branding'];

const FIELDS = [
  'System.Id', 'System.Title', 'System.State', 'System.WorkItemType',
  'System.AssignedTo', 'System.ChangedDate', 'System.Parent',
  'Microsoft.VSTS.Scheduling.RemainingWork',
  'Microsoft.VSTS.Scheduling.OriginalEstimate',
  'Microsoft.VSTS.Scheduling.CompletedWork',
  'Microsoft.VSTS.Common.ActivatedDate',
  'Microsoft.VSTS.Common.ResolvedDate',
  'Microsoft.VSTS.Common.ClosedDate',
  'Microsoft.VSTS.Common.Priority'
];

function makeHeaders(pat) {
  const token = Buffer.from(':' + pat).toString('base64');
  return {
    Authorization: 'Basic ' + token,
    'Content-Type': 'application/json'
  };
}

async function adoGet(pat, path) {
  const url = ADO_BASE + '/' + path;
  const res = await fetch(url, { headers: makeHeaders(pat) });
  if (!res.ok) return null;
  return res.json();
}

async function adoPost(pat, path, body) {
  const url = ADO_BASE + '/' + path;
  const res = await fetch(url, {
    method: 'POST',
    headers: makeHeaders(pat),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('ADO POST ' + path + ' -> ' + res.status);
  return res.json();
}

async function getProjects(pat) {
  const data = await adoGet(pat, '_apis/projects?api-version=7.0&$top=100');
  if (!data || !data.value) return [];
  return data.value
    .map(p => p.name)
    .filter(n => {
      const l = n.toLowerCase();
      return !EXCL_PROJECTS.some(ex => l.includes(ex));
    })
    .sort();
}

async function getItems(pat, proj, ids) {
  if (!ids.length) return [];
  const batches = [];
  for (let i = 0; i < ids.length; i += 200) batches.push(ids.slice(i, i + 200));
  const results = await Promise.all(
    batches.map(chunk =>
      adoGet(pat, proj + '/_apis/wit/workitems?ids=' + chunk.join(',') + '&fields=' + FIELDS.join(',') + '&api-version=7.0')
        .then(d => (d && d.value) ? d.value : [])
        .catch(() => [])
    )
  );
  return results.flat();
}

async function getMembers(pat, proj) {
  const data = await adoGet(pat, '_apis/projects/' + proj + '/teams/' + encodeURIComponent(proj + ' Team') + '/members?api-version=7.0');
  return (data && data.value) ? data.value : [];
}

async function fetchItemRevisions(pat, proj, itemId) {
  const data = await adoGet(pat, proj + '/_apis/wit/workitems/' + itemId + '/revisions?api-version=7.0&$expand=fields');
  return (data && data.value) ? data.value : [];
}

function gf(w, f) { return (w.fields && w.fields[f]) || 0; }
function gs(w, f) { return (w.fields && w.fields[f]) || ''; }
function isDone(w) { return ['Done', 'Closed', 'Resolved', 'Completed'].includes(gs(w, 'System.State')); }

function transformProj(proj, items, mems) {
  const byType = {};
  items.forEach(w => {
    const t = gs(w, 'System.WorkItemType');
    if (!byType[t]) byType[t] = [];
    byType[t].push(w);
  });

  const initiatives = byType['Initiative'] || [];
  const epics = byType['Epic'] || [];
  const features = byType['Feature'] || [];
  const stories = (byType['User Story'] || []).concat(byType['Task'] || []);
  const bugs = byType['Bug'] || [];

  let L1, L2, L3;
  if (initiatives.length > 0) { L1 = initiatives; L2 = epics; L3 = features; }
  else if (epics.length > 0) { L1 = epics; L2 = features; L3 = stories; }
  else { L1 = features; L2 = stories; L3 = []; }

  const itemById = {};
  items.forEach(w => { itemById[w.id] = w; });

  // All non-bug items — defined early so closures can use it
  const allNonBug = initiatives.concat(epics).concat(features).concat(stories);

  // Recursive: collect ALL non-bug descendants at any depth (fixes OE/CW/RW at all levels)
  function getAllDescendants(startId) {
    const result = [];
    const visited = new Set();
    function recurse(id) {
      allNonBug.forEach(w => {
        const parentId = gf(w, 'System.Parent');
        if (parentId === id && !visited.has(w.id)) {
          visited.add(w.id);
          result.push(w);
          recurse(w.id);
        }
      });
    }
    recurse(startId);
    return result;
  }

  function findAncestorByType(startId, type) {
    let cur = startId, visited = {}, limit = 10;
    while (cur && limit-- > 0) {
      if (visited[cur]) break; visited[cur] = true;
      const w = itemById[cur]; if (!w) break;
      if (gs(w, 'System.WorkItemType') === type) return w;
      cur = gf(w, 'System.Parent');
    }
    return null;
  }

  function sumF(arr, field) { return arr.reduce((a, w) => a + gf(w, field), 0); }
  function pctOf(done, total) { return total > 0 ? Math.round(done / total * 100) : 0; }
  function sortActive(arr) {
    return arr.slice().sort((a, b) => {
      function r(w) {
        const s = gs(w, 'System.State');
        return s === 'Active' || s === 'In Progress' ? 0 : s === 'Done' || s === 'Closed' ? 2 : 1;
      }
      return r(a) - r(b);
    });
  }

  function buildL3Items(l2id) {
    return L3.filter(s => gf(s, 'System.Parent') === l2id);
  }

  function buildL2Data(l1id) {
    const childL2 = sortActive(L2.filter(e => gf(e, 'System.Parent') === l1id));
    return childL2.map(ep => {
      const epId = ep.id;
      const l3items = buildL3Items(epId);
      let leafItems;

      if (initiatives.length > 0 && epics.length > 0 && features.length > 0) {
        const childFeats = sortActive(features.filter(f => gf(f, 'System.Parent') === epId));
        leafItems = childFeats.reduce((a, f) =>
          a.concat(stories.filter(s => gf(s, 'System.Parent') === f.id)), []);

        const featData = childFeats.map(f => {
          const fId = f.id;
          const fSt = stories.filter(s => gf(s, 'System.Parent') === fId);
          const fDone = fSt.filter(isDone).length;
          const fTotal = Math.max(fSt.length, 1);
          const fPct = pctOf(fDone, fTotal);
          const fState = fPct >= 100 ? 'Done' : (gs(f, 'System.State') === 'Active' || gs(f, 'System.State') === 'In Progress') ? 'Active' : gs(f, 'System.State');
          return {
            title: gs(f, 'System.Title'), state: fState, pct: fPct,
            todo: fSt.filter(s => { const st = gs(s, 'System.State'); return st === 'New' || st === 'To Do'; }).length,
            dev: fSt.filter(s => { const st = gs(s, 'System.State'); return st === 'Active' || st === 'In Progress'; }).length,
            test: fSt.filter(s => gs(s, 'System.State') === 'Testing').length,
            done: fDone, total: fTotal,
            oe: Math.round(sumF(getAllDescendants(fId), 'Microsoft.VSTS.Scheduling.OriginalEstimate') + gf(f, 'Microsoft.VSTS.Scheduling.OriginalEstimate')),
            cw: Math.round(sumF(getAllDescendants(fId), 'Microsoft.VSTS.Scheduling.CompletedWork') + gf(f, 'Microsoft.VSTS.Scheduling.CompletedWork')),
            rw: Math.round(sumF(getAllDescendants(fId), 'Microsoft.VSTS.Scheduling.RemainingWork') + gf(f, 'Microsoft.VSTS.Scheduling.RemainingWork')),
            items: fSt.slice(0, 10).map(s => {
              const sst = gs(s, 'System.State');
              return {
                title: gs(s, 'System.Title'), state: sst,
                pct: isDone(s) ? 100 : (sst === 'Active' || sst === 'In Progress') ? 50 : 0,
                todo: (sst === 'New' || sst === 'To Do') ? 1 : 0,
                dev: (sst === 'Active' || sst === 'In Progress') ? 1 : 0,
                test: sst === 'Testing' ? 1 : 0,
                done: isDone(s) ? 1 : 0, total: 1,
                oe: Math.round(gf(s, 'Microsoft.VSTS.Scheduling.OriginalEstimate')),
                cw: Math.round(gf(s, 'Microsoft.VSTS.Scheduling.CompletedWork')),
                rw: Math.round(gf(s, 'Microsoft.VSTS.Scheduling.RemainingWork'))
              };
            })
          };
        });

        const epDone = leafItems.filter(isDone).length;
        const epTotal = Math.max(leafItems.length, 1);
        const epPct = pctOf(epDone, epTotal);
        const epState = epPct >= 100 ? 'Done' : (gs(ep, 'System.State') === 'Active' || gs(ep, 'System.State') === 'In Progress') ? 'Active' : gs(ep, 'System.State');
        return {
          title: gs(ep, 'System.Title'), state: epState, pct: epPct,
          todo: leafItems.filter(s => { const st = gs(s, 'System.State'); return st === 'New' || st === 'To Do'; }).length,
          dev: leafItems.filter(s => { const st = gs(s, 'System.State'); return st === 'Active' || st === 'In Progress'; }).length,
          test: leafItems.filter(s => gs(s, 'System.State') === 'Testing').length,
          done: epDone, total: epTotal,
          oe: Math.round(sumF(getAllDescendants(epId), 'Microsoft.VSTS.Scheduling.OriginalEstimate') + gf(ep, 'Microsoft.VSTS.Scheduling.OriginalEstimate')),
          cw: Math.round(sumF(getAllDescendants(epId), 'Microsoft.VSTS.Scheduling.CompletedWork') + gf(ep, 'Microsoft.VSTS.Scheduling.CompletedWork')),
          rw: Math.round(sumF(getAllDescendants(epId), 'Microsoft.VSTS.Scheduling.RemainingWork') + gf(ep, 'Microsoft.VSTS.Scheduling.RemainingWork')),
          epics: featData
        };
      } else {
        leafItems = l3items;
        const epDone = leafItems.filter(isDone).length;
        const epTotal = Math.max(leafItems.length, 1);
        const epPct = pctOf(epDone, epTotal);
        const epState = epPct >= 100 ? 'Done' : (gs(ep, 'System.State') === 'Active' || gs(ep, 'System.State') === 'In Progress') ? 'Active' : gs(ep, 'System.State');
        return {
          title: gs(ep, 'System.Title'), state: epState, pct: epPct,
          todo: leafItems.filter(s => { const st = gs(s, 'System.State'); return st === 'New' || st === 'To Do'; }).length,
          dev: leafItems.filter(s => { const st = gs(s, 'System.State'); return st === 'Active' || st === 'In Progress'; }).length,
          test: leafItems.filter(s => gs(s, 'System.State') === 'Testing').length,
          done: epDone, total: epTotal,
          oe: Math.round(sumF(getAllDescendants(epId), 'Microsoft.VSTS.Scheduling.OriginalEstimate') + gf(ep, 'Microsoft.VSTS.Scheduling.OriginalEstimate')),
          cw: Math.round(sumF(getAllDescendants(epId), 'Microsoft.VSTS.Scheduling.CompletedWork') + gf(ep, 'Microsoft.VSTS.Scheduling.CompletedWork')),
          rw: Math.round(sumF(getAllDescendants(epId), 'Microsoft.VSTS.Scheduling.RemainingWork') + gf(ep, 'Microsoft.VSTS.Scheduling.RemainingWork')),
          epics: leafItems.slice(0, 10).map(s => {
            const sst = gs(s, 'System.State');
            return {
              title: gs(s, 'System.Title'), state: sst,
              pct: isDone(s) ? 100 : (sst === 'Active' || sst === 'In Progress') ? 50 : 0,
              todo: (sst === 'New' || sst === 'To Do') ? 1 : 0,
              dev: (sst === 'Active' || sst === 'In Progress') ? 1 : 0,
              test: sst === 'Testing' ? 1 : 0,
              done: isDone(s) ? 1 : 0, total: 1,
              oe: Math.round(gf(s, 'Microsoft.VSTS.Scheduling.OriginalEstimate')),
              cw: Math.round(gf(s, 'Microsoft.VSTS.Scheduling.CompletedWork')),
              rw: Math.round(gf(s, 'Microsoft.VSTS.Scheduling.RemainingWork'))
            };
          })
        };
      }
    });
  }

  const initData = sortActive(L1).map(init => {
    const initId = init.id;
    const l2data = buildL2Data(initId);

    // Completion count: leaf stories via strict parent chain (same as original)
    let allLeaf = [];
    if (initiatives.length > 0 && epics.length > 0 && features.length > 0) {
      const myEpics = epics.filter(e => gf(e, 'System.Parent') === initId);
      myEpics.forEach(ep => {
        features.filter(f => gf(f, 'System.Parent') === ep.id).forEach(f => {
          stories.filter(s => gf(s, 'System.Parent') === f.id).forEach(s => allLeaf.push(s));
        });
      });
    } else {
      const myL2 = L2.filter(e => gf(e, 'System.Parent') === initId);
      myL2.forEach(e => {
        L3.filter(s => gf(s, 'System.Parent') === e.id).forEach(s => allLeaf.push(s));
      });
      if (L2 === features) {
        L3.filter(s => gf(s, 'System.Parent') === initId).forEach(s => allLeaf.push(s));
      }
    }

    const allLeafUniq = allLeaf.filter((s, i, a) => a.indexOf(s) === i);
    const iDone = allLeafUniq.filter(isDone).length;
    const iTotal = Math.max(allLeafUniq.length, 1);
    const iPct = pctOf(iDone, iTotal);

    // OE/CW/RW: recursive descendant traversal (catches Tasks under Stories, etc.)
    const allDesc = getAllDescendants(initId);

    return {
      title: gs(init, 'System.Title'), state: gs(init, 'System.State'), pct: iPct,
      todo: allLeafUniq.filter(s => { const st = gs(s, 'System.State'); return st === 'New' || st === 'To Do'; }).length,
      dev: allLeafUniq.filter(s => { const st = gs(s, 'System.State'); return st === 'Active' || st === 'In Progress'; }).length,
      test: allLeafUniq.filter(s => gs(s, 'System.State') === 'Testing').length,
      done: iDone, total: iTotal,
      oe: Math.round(sumF(allDesc, 'Microsoft.VSTS.Scheduling.OriginalEstimate') + gf(init, 'Microsoft.VSTS.Scheduling.OriginalEstimate')),
      cw: Math.round(sumF(allDesc, 'Microsoft.VSTS.Scheduling.CompletedWork') + gf(init, 'Microsoft.VSTS.Scheduling.CompletedWork')),
      rw: Math.round(sumF(allDesc, 'Microsoft.VSTS.Scheduling.RemainingWork') + gf(init, 'Microsoft.VSTS.Scheduling.RemainingWork')),
      epics: l2data
    };
  });
  const burned = Math.round(sumF(allNonBug, 'Microsoft.VSTS.Scheduling.CompletedWork'));
  const rw = Math.round(sumF(allNonBug, 'Microsoft.VSTS.Scheduling.RemainingWork'));
  const oe = Math.round(sumF(allNonBug, 'Microsoft.VSTS.Scheduling.OriginalEstimate'));

  const leafDone = stories.filter(isDone).length;
  const leafTotal = Math.max(stories.length, 1);
  const pct = oe > 0 ? Math.min(100, Math.round(burned / oe * 100)) : pctOf(leafDone, leafTotal);
  const cap = oe > 0 ? oe : mems.length * 8 * 20;
  const util = cap > 0 ? Math.min(100, Math.round(burned / cap * 100)) : 0;

  const bugSt = {};
  bugs.forEach(b => { const s = gs(b, 'System.State'); bugSt[s] = (bugSt[s] || 0) + 1; });

  const epicBugMap = {};
  bugs.forEach(b => {
    let ancestor = findAncestorByType(gf(b, 'System.Parent'), 'Epic');
    if (!ancestor) ancestor = findAncestorByType(gf(b, 'System.Parent'), 'Feature');
    if (!ancestor) return;
    const eid = ancestor.id;
    if (!epicBugMap[eid]) epicBugMap[eid] = { epic: gs(ancestor, 'System.Title'), open: 0, critical: 0, total: 0 };
    epicBugMap[eid].total++;
    if (!isDone(b)) epicBugMap[eid].open++;
    if (gf(b, 'Microsoft.VSTS.Common.Priority') <= 1 && !isDone(b)) epicBugMap[eid].critical++;
  });
  const critBugs = Object.values(epicBugMap)
    .filter(x => x.open > 0)
    .sort((a, b) => b.open - a.open)
    .slice(0, 10);

  const filteredMems = mems.filter(m => {
    const n = (m.identity && m.identity.displayName) || '';
    return !EXCL_MEMBERS.some(ex => n.toUpperCase().includes(ex));
  });

  return {
    proj,
    wi: { total: allNonBug.length, done: allNonBug.filter(isDone).length, pct, oe, cw: burned, rw, features: initData },
    bi: { total: bugs.length, states: bugSt },
    members: filteredMems.length,
    capacity: cap, burned, remaining: rw, util,
    critical_bugs: critBugs,
    _mems: filteredMems,
    _items: items
  };
}

function buildTeamData(data) {
  const map = {};
  const now = new Date(); now.setHours(23, 59, 59, 999);
  const wkStart = new Date(now);
  const day = wkStart.getDay() || 7;
  wkStart.setDate(wkStart.getDate() - day + 1);
  wkStart.setHours(0, 0, 0, 0);

  data.forEach(d => {
    d._mems.forEach(m => {
      const n = (m.identity && m.identity.displayName) || 'Unknown';
      if (EXCL_MEMBERS.some(ex => n.toUpperCase().includes(ex))) return;
      if (!map[n]) map[n] = { name: n, proj: d.proj, completed: 0, totalAssigned: 0, cycleTimes: [], weeklyCompleted: 0 };
    });
    d._items.forEach(w => {
      const a = w.fields && w.fields['System.AssignedTo'] && w.fields['System.AssignedTo'].displayName;
      if (!a || !map[a]) return;
      map[a].totalAssigned++;
      if (isDone(w)) {
        map[a].completed++;
        const activated = gs(w, 'Microsoft.VSTS.Common.ActivatedDate');
        const closed = gs(w, 'Microsoft.VSTS.Common.ClosedDate') || gs(w, 'Microsoft.VSTS.Common.ResolvedDate');
        if (activated && closed) {
          const ct = Math.round((new Date(closed) - new Date(activated)) / 86400000 * 10) / 10;
          if (ct >= 0 && ct < 365) map[a].cycleTimes.push(ct);
        }
        const changed = gs(w, 'System.ChangedDate');
        if (changed) {
          const cd = new Date(changed);
          if (cd >= wkStart && cd <= now) map[a].weeklyCompleted++;
        }
      }
    });
  });

  return Object.values(map).map(m => {
    const avgCycle = m.cycleTimes.length
      ? Math.round(m.cycleTimes.reduce((a, b) => a + b, 0) / m.cycleTimes.length * 10) / 10
      : '-';
    const velocity = m.weeklyCompleted;
    const perf = m.completed === 0 ? 'Slow'
      : (avgCycle === '-' || avgCycle < 2) ? 'Fast'
      : avgCycle <= 4 ? 'Normal'
      : 'Slow';
    return { name: m.name, proj: m.proj, completed: m.completed, total: m.totalAssigned, cycle: avgCycle, velocity, perf };
  });
}

async function buildWeeklyRevisions(pat, data, wkOpt) {
  const wkStart = new Date(wkOpt.start); wkStart.setHours(0, 0, 0, 0);
  const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6); wkEnd.setHours(23, 59, 59, 999);

  const memberMap = {};
  data.forEach(d => {
    (d._mems || []).forEach(m => {
      const n = (m.identity && m.identity.displayName) || 'Unknown';
      if (EXCL_MEMBERS.some(ex => n.toUpperCase().includes(ex))) return;
      if (!memberMap[n]) memberMap[n] = { proj: d.proj, cw: Array(7).fill(0), totalOE: 0, totalRW: 0 };
    });
    (d._items || []).forEach(w => {
      if (!['User Story', 'Task'].includes(gs(w, 'System.WorkItemType'))) return;
      const a = w.fields && w.fields['System.AssignedTo'] && w.fields['System.AssignedTo'].displayName;
      if (a && memberMap[a]) {
        memberMap[a].totalOE += gf(w, 'Microsoft.VSTS.Scheduling.OriginalEstimate');
        memberMap[a].totalRW += gf(w, 'Microsoft.VSTS.Scheduling.RemainingWork');
      }
    });
  });

  const lookback = new Date(wkStart.getTime() - 30 * 86400000);
  const revTasks = [];
  data.forEach(d => {
    (d._items || []).forEach(w => {
      if (!['User Story', 'Task'].includes(gs(w, 'System.WorkItemType'))) return;
      const a = w.fields && w.fields['System.AssignedTo'] && w.fields['System.AssignedTo'].displayName;
      if (!a || !memberMap[a]) return;
      const changed = gs(w, 'System.ChangedDate');
      if (changed && new Date(changed) >= lookback)
        revTasks.push({ proj: d.proj, id: w.id, assignee: a });
    });
  });

  const BATCH = 8;
  for (let bi = 0; bi < revTasks.length; bi += BATCH) {
    const batch = revTasks.slice(bi, bi + BATCH);
    let results;
    try {
      results = await Promise.all(
        batch.map(t =>
          fetchItemRevisions(pat, t.proj, t.id)
            .then(revs => ({ t, revs: revs || [] }))
            .catch(() => ({ t, revs: [] }))
        )
      );
    } catch (e) { results = []; }

    results.forEach(res => {
      const assignee = res.t.assignee;
      if (!memberMap[assignee] || !res.revs.length) return;
      const revs = res.revs;
      for (let ri = 1; ri < revs.length; ri++) {
        const cur = revs[ri];
        const prev = revs[ri - 1];
        const revDateStr = (cur.fields && cur.fields['System.ChangedDate']) || cur.revisedDate || '';
        if (!revDateStr) continue;
        const revDate = new Date(revDateStr);
        if (isNaN(revDate.getTime())) continue;
        if (revDate < wkStart || revDate > wkEnd) continue;
        const prevCW = parseFloat((prev.fields && prev.fields['Microsoft.VSTS.Scheduling.CompletedWork']) || 0);
        const curCW = parseFloat((cur.fields && cur.fields['Microsoft.VSTS.Scheduling.CompletedWork']) || 0);
        const delta = Math.round((curCW - prevCW) * 100) / 100;
        if (delta > 0 && delta <= 200) {
          const dayIdx = Math.floor((revDate.getTime() - wkStart.getTime()) / 86400000);
          if (dayIdx >= 0 && dayIdx < 7)
            memberMap[assignee].cw[dayIdx] = Math.round((memberMap[assignee].cw[dayIdx] + delta) * 100) / 100;
        }
      }
    });
  }

  const members = [], projs = [], days_data = [];
  Object.keys(memberMap).forEach(name => {
    const m = memberMap[name];
    members.push(name);
    projs.push(m.proj);
    days_data.push(m.cw.map(h => Math.round(h * 10) / 10));
    m.totalCW = Math.round(m.cw.reduce((a, b) => a + b, 0) * 10) / 10;
    m.totalOE = Math.round(m.totalOE * 10) / 10;
    m.totalRW = Math.round(m.totalRW * 10) / 10;
  });

  return { members, projs, days: days_data, _memberMap: memberMap };
}

async function fetchProj(pat, proj) {
  const wiql = "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject]='" + proj + "' AND [System.WorkItemType] IN ('Initiative','Epic','Feature','User Story','Task','Bug') AND [System.State]<>'Removed' ORDER BY [System.Id]";
  const [wr, mR] = await Promise.all([
    adoPost(pat, proj + '/_apis/wit/wiql?api-version=7.0', { query: wiql }),
    getMembers(pat, proj)
  ]);
  const ids = (wr && wr.workItems ? wr.workItems : []).map(w => w.id);
  const items = await getItems(pat, proj, ids);
  return transformProj(proj, items, mR);
}

module.exports = {
  getProjects,
  fetchProj,
  buildTeamData,
  buildWeeklyRevisions,
  transformProj
};
