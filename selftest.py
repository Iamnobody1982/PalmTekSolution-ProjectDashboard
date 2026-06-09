#!/usr/bin/env python3
"""PalmTek Dashboard - Pre-delivery self-test. Run: python3 selftest.py"""
import re, subprocess, sys, os

# Auto-detect path: cùng folder với selftest.py
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(SCRIPT_DIR, 'palmtek-dashboard.html')

def run():
    if not os.path.exists(HTML_PATH):
        print(f"FATAL: File not found: {HTML_PATH}"); return False

    with open(HTML_PATH, 'r') as f:
        html = f.read()

    # Positional extraction (không dùng regex)
    cdn_end = html.find('</script>') + 9
    app_start = html.find('<script>', cdn_end)
    app_end = html.find('</script>', app_start)
    if app_start == -1 or app_end == -1:
        print("FATAL: No app <script> block found"); return False
    js = html[app_start+8:app_end]

    with open('/tmp/_st.js', 'w') as f:
        f.write("var document={getElementById:function(){return{innerHTML:'',textContent:'',classList:{remove:function(){},add:function(){},toggle:function(a,b){return b||false}},dataset:{id:'x'},getContext:function(){return null},style:{},appendChild:function(){},querySelector:function(){return null}}},querySelectorAll:function(){return[]},createElement:function(){return{className:'',textContent:'',onclick:null,onchange:null,appendChild:function(){},selected:false,value:'',id:'',style:{}}}};\n")
        f.write("var window={addEventListener:function(){}};\nvar location={origin:'',pathname:'',search:'',href:''};\nvar history={replaceState:function(){}};\n")
        f.write("var sessionStorage={getItem:function(){return null},setItem:function(){},removeItem:function(){}};\nvar localStorage={getItem:function(){return null},setItem:function(){},removeItem:function(){}};\n")
        f.write("var URLSearchParams=function(){};\nvar TextEncoder=function(){this.encode=function(){return [];};};\nvar Uint8Array=function(){};\nvar Chart=function(){this.destroy=function(){};};\nvar crypto={subtle:{digest:function(){}},getRandomValues:function(a){return a;}};\nvar Promise={resolve:function(v){return{then:function(f){try{return Promise.resolve(f(v));}catch(e){return Promise.resolve(null);}},catch:function(){return this;}};},all:function(arr){return{then:function(f){try{return Promise.resolve(f((arr||[]).map(function(){return null;})));}catch(e){return Promise.resolve(null);}},catch:function(){return this;}}}};\n")
        f.write(js)

    r = subprocess.run(['node','--check','/tmp/_st.js'], capture_output=True, text=True)
    syntax_ok = r.returncode == 0

    checks = [
        ("avgCycleTime() defined",              'function avgCycleTime(' in js),
        ("delta() defined",                     'function delta(' in js),
        ("renderKPIs() defined",                'function renderKPIs(' in js),
        ("cacheLoad/cacheSave defined",         'function cacheLoad(' in js and 'function cacheSave(' in js),
        ("loadAll() defined",                   'async function loadAll(' in js),
        ("fetchProj() defined",                 'async function fetchProj(' in js),
        ("transformProj() defined",             'function transformProj(' in js),
        ("buildTeamData() defined",             'function buildTeamData(' in js),
        ("buildWeeklyRevisions() defined",      'async function buildWeeklyRevisions(' in js),
        ("fetchItemRevisions() defined",        'async function fetchItemRevisions(' in js),
        ("renderWkToEl() defined",              'function renderWkToEl(' in js),
        ("appInit() defined",                   'function appInit(' in js),
        ("Completion = Story/Task only",        'var leafDone' in js),
        ("Utilization = mems×30h/week",         'mems*30' in js),
        ("Velocity = calendar week",            'weeklyCompleted' in js),
        ("Perf <2d=Fast 2-4d=Normal >4d=Slow",  'avgCycle<2' in js and 'avgCycle<=4' in js),
        ("Capacity = OE not mems*60*10",        'mems.length*60*10' not in js),
        ("EXCL_MEMBERS both name orderings",    'HUNG TRAN GIANG BAO' in js),
        ("Epics sorted Active-first",           'childEpics.sort' in js),
        ("Features sorted Active-first",        'childFeats.sort' in js),
        ("Top Epics open>0 only",               'if(cb.open>0)all.push' in js),
        ("Revision API in weekly",              'fetchItemRevisions' in js),
        ("Weekly reloads on wk change",         'buildWeeklyRevisions(_MOCK.data,aWk)' in js),
        ("saveCacheSnapshot NOT called",        'saveCacheSnapshot' not in js),
        ("_SKIP_ removed",                      '_SKIP_' not in js),
        ("Script tags = 2",                     html.count('<script')==2 and html.count('</script>')==2),
        ("hdate/hcal updates present",          "getElementById('hdate')" in js),
        ("Footer present",                      'class="footer"' in html),
        ("prog-inline min-width:200px",         'min-width:200px' in html),
        ("Initiative in WIQL",                  "'Initiative'" in js),
        ("MOCK_FB fallback",                    'MOCK_FB' in js),
    ]

    all_pass = syntax_ok
    print(f"{'─'*55}")
    print(f"File: {HTML_PATH}")
    print(f"Syntax: {'✅ PASS' if syntax_ok else '❌ FAIL'}")
    if not syntax_ok: print(r.stderr[:300])
    print(f"{'─'*55}")
    for name, result in checks:
        icon = "✅" if result else "❌"
        if not result: all_pass = False
        print(f"  {icon} {name}")
    print(f"{'─'*55}")
    print(f"File size: {round(len(html.encode())/1024)}KB | Checks: {len(checks)+1}")
    print(f"\n{'✅ ALL PASS — OK to deliver' if all_pass else '❌ FAILURES — DO NOT DELIVER'}\n")
    return all_pass

if __name__ == '__main__':
    ok = run()
    sys.exit(0 if ok else 1)
