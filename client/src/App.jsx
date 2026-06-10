import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import KPIStrip from './components/KPIStrip';
import PortfolioHealth from './components/PortfolioHealth';
import InitiativeStatusAll from './components/InitiativeStatusAll';
import BugOverview from './components/BugOverview';
import TopEpics from './components/TopEpics';
import TeamPerformance from './components/TeamPerformance';
import WeeklyActivity from './components/WeeklyActivity';
import ProjectDetail from './components/ProjectDetail';
import LoadingOverlay from './components/LoadingOverlay';
import { fetchPortfolio } from './api/portfolio';

export default function App() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadMsg, setLoadMsg] = useState('Connecting to Azure DevOps...');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    setLoadMsg(refresh ? 'Refreshing data...' : 'Connecting to Azure DevOps...');
    try {
      const data = await fetchPortfolio(refresh);
      setPortfolio(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const projects = portfolio ? portfolio.projects : [];
  const data = portfolio ? portfolio.data : [];
  const team = portfolio ? portfolio.team : [];

  const allBugStates = {};
  let allBugTotal = 0;
  data.forEach(d => {
    Object.entries(d.bi.states || {}).forEach(([s, n]) => {
      allBugStates[s] = (allBugStates[s] || 0) + n;
      allBugTotal += n;
    });
  });

  const activeProj = activeTab !== 'all' ? data.find(d => d.proj === activeTab) : null;

  return (
    <>
      {loading && <LoadingOverlay message={loadMsg} />}

      <div id="dash" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          lastUpdated={portfolio ? portfolio.fetchedAt : null}
          onRefresh={() => load(true)}
        />

        <div className="cnt" style={{ paddingBottom: 24 }}>
          {error && <div className="errb">{error}</div>}

          {/* TABS */}
          {!loading && projects.length > 0 && (
            <div className="tabrow">
              <button
                className={'tab' + (activeTab === 'all' ? ' active' : '')}
                onClick={() => setActiveTab('all')}
              >
                All Projects
              </button>
              {projects.map(p => (
                <button
                  key={p}
                  className={'tab' + (activeTab === p ? ' active' : '')}
                  onClick={() => setActiveTab(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* ALL PROJECTS VIEW */}
          {!loading && activeTab === 'all' && data.length > 0 && (
            <>
              <KPIStrip data={data} team={team} />
              <PortfolioHealth data={data} />
              <InitiativeStatusAll data={data} />
              <div className="row-bug3">
                <div className="card">
                  <div className="sec">🐛 Bug Overview</div>
                  <BugOverview bugStates={allBugStates} total={allBugTotal} canvasId="bugc_all" />
                </div>
                <div className="card">
                  <div className="sec">🚨 Top 10 Epics by Open Bugs</div>
                  <TopEpics data={data} showProject={true} />
                </div>
                <div className="card">
                  <div className="sec">🏆 Team Performance</div>
                  <TeamPerformance team={team} showProject={false} />
                </div>
              </div>
              <WeeklyActivity filterMembers={null} />
            </>
          )}

          {/* PROJECT DETAIL VIEW */}
          {!loading && activeTab !== 'all' && activeProj && (
            <ProjectDetail d={activeProj} team={team} />
          )}

          {/* FOOTER */}
          {!loading && (
            <div className="footer">
              <span>PalmTek Solution JSC · Portfolio Executive Dashboard</span>
              <span>
                {portfolio && portfolio.fromCache
                  ? 'Cached · ' + (Math.round(portfolio.cacheAge / 60) || '<1') + 'm ago'
                  : portfolio ? 'Live data' : ''}
              </span>
              <span>Last updated: {portfolio ? new Date(portfolio.fetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
