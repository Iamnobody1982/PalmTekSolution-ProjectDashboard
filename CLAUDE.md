# PalmTek Portfolio Executive Dashboard — CLAUDE.md
> File này là "bộ nhớ" của Claude Code cho project này.
> ĐỌC KỸ TOÀN BỘ trước khi thực hiện bất kỳ thay đổi nào.
> Sau mỗi session làm việc, cập nhật section "Session Log" bên dưới.

---

## 🎯 Project Overview

**Dashboard**: Agile Portfolio Executive Dashboard cho PalmTek Solution JSC  
**Tech**: Pure HTML + Vanilla JS + Chart.js — deploy trên GitHub Pages  
**Auth**: OAuth2 PKCE → Microsoft login → Azure DevOps REST API  
**URL**: https://iamnobody1982.github.io/PalmTekSolution-ProjectDashboard/palmtek-dashboard.html  
**Repo**: https://github.com/Iamnobody1982/PalmTekSolution-ProjectDashboard  
**File chính**: `palmtek-dashboard.html` (~4000+ dòng, single-file architecture)

---

## 👤 Owner Context

- **Tên**: Hung Tran (TRAN GIANG BAO HUNG)
- **Vai trò**: PM, Agile Coach, Program Manager tại PalmTek Solution JSC
- **Giao tiếp**: Tiếng Việt, xưng "anh" — gọi Claude là "em"
- **Phong cách**: Thực dụng, ưu tiên impact, không thích giải thích dài dòng
- **QUAN TRỌNG**: Tên "TRAN GIANG BAO HUNG" và "HUNG TRAN GIANG BAO" phải bị **exclude** khỏi mọi hiển thị member

---

## 🔐 Azure AD Config

| Field | Value |
|-------|-------|
| Client ID | `0d973364-b101-468e-81a0-7d163d8ae4f4` |
| Tenant ID | `0602dee6-d765-462c-8f89-7276ba040d7c` |
| ADO Org | `PalmtekSolution` |
| ADO Scope | `499b84ac-1321-427f-aa17-267ca6975798/user_impersonation` |
| Redirect URI | `https://iamnobody1982.github.io/PalmTekSolution-ProjectDashboard/palmtek-dashboard.html` |
| Admin Consent | ✅ Granted |

---

## 🏗️ ADO Work Item Hierarchy

```
Initiative (custom type)
  └── Epic
        └── Feature
              └── User Story / Task
                    └── Bug (linked anywhere)
```

- **WIQL includes**: `'Initiative','Epic','Feature','User Story','Task','Bug'`
- **Fallback**: if no `Initiative` type → use `Epic` as L1 (auto-detect)
- **Active projects**: `Depository`, `e-PrMS`, `e-PMMS`
- **Excluded projects**: `branding`, `team hub`, `palmtek branding`
- **Excluded members**: `TRAN GIANG BAO HUNG`, `HUNG TRAN GIANG BAO`, `GIANG BAO HUNG`

---

## 📊 Dashboard Structure

### All Projects View
1. **KPI Strip** (7 cards): Completion, Remaining, Active Initiatives, Active Epics, Open Bugs, Utilization, Avg Cycle Time
2. **Portfolio Health** (cards) + **Resource Allocation** (table) — side by side
3. **Initiative Status** (full-width expandable table)
4. **Bug Overview** | **Top 10 Epics by Open Bugs** | **Team Performance** — 3 cols
5. **Weekly Activity** (color-coded table)
6. **Footer bar**

### Project Detail View (per project tab)
1. **Banner** với project name + LIVE badge
2. **5 KPI cards** (horizontal row): Completion, Remaining+OE/CW/RW, Utilization, Members, Open Bugs
3. **Initiative accordion** (3-level: Initiative → Epic → Feature, click to expand)
4. **Bug Overview** | **Top Epics** | **Team Performance** — 3 cols
5. **Weekly Activity** (filtered by project members)
6. **Footer bar**

### Weekly Activity Color Rules
- `≥ 6h`: 🟢 Green `#DCFCE7`
- `4h < x < 6h`: 🟡 Amber `#FEF3C7`
- `≤ 4h`: 🔴 Red `#FEE2E2`
- Future dates: no color
- **Source**: ADO Revision API (`/_apis/wit/workitems/{id}/revisions`) — exact CW delta per day
- Columns: CW per day | Total CW | OE | RW

---

## 🔢 Metric Calculations

| Metric | Formula |
|--------|---------|
| **Completion %** | `done / total` at **User Story/Task level only** (không double-count) |
| **Capacity** | `sum(OriginalEstimate)` từ all work items — **KHÔNG dùng** `mems*60*10` |
| **Burned** | `sum(CompletedWork)` |
| **Remaining** | `sum(RemainingWork)` |
| **Utilization** | `Burned / (members × 30h/week)` |
| **Avg Cycle Time** | `avg(ClosedDate - ActivatedDate)` per member |
| **Velocity** | Items completed trong **current calendar week** (Mon–Sun) |
| **Performance** | `<2d = Fast`, `2–4d = Normal`, `>4d = Slow` (by Avg Cycle Time) |
| **OE/CW/RW** | Aggregated bottom-up: Task→Story→Feature→Epic→Initiative |
| **Weekly CW/day** | ADO Revision API — delta CompletedWork giữa các revisions liên tiếp |
| **Delta vs last** | `localStorage` cache — compare current vs previous refresh |

---

## ⚙️ Key Functions

| Function | Purpose |
|----------|---------|
| `appInit()` | Entry point — check OAuth token/callback |
| `signIn()` | OAuth2 PKCE redirect to Microsoft |
| `boot()` | Post-login: get user info, load data |
| `loadAll()` | Discover ADO projects + fetch all data |
| `fetchProj(proj)` | WIQL query + work items + members for 1 project |
| `transformProj(proj, items, mems)` | Build data model từ raw ADO items |
| `buildTeamData(data)` | Compute cycle time từ ActivatedDate→ClosedDate |
| `buildWeeklyRevisions(data, wk)` | Weekly activity từ Revision API |
| `fetchItemRevisions(id, token)` | Fetch revisions cho 1 work item |
| `renderWkToEl(wkData, el)` | Render weekly table vào element |
| `renderAll(data)` | Render tất cả All-Projects sections |
| `buildProjHTML(d)` | Build Project Detail HTML |
| `toggle1/toggle2(id)` | Accordion expand/collapse L1/L2 |
| `initPD(d)` | Init project detail: charts + weekly |
| `avgCycleTime()` | Returns avg cycle từ `_MOCK.team` |
| `delta(cur,prev,unit,inv)` | Returns HTML span với ▲/▼ delta |
| `cacheLoad() / cacheSave()` | localStorage KPI snapshot cho deltas |

---

## 🎨 Brand & Design

```css
--pr: #AF3331;      /* PalmTek Red — màu chủ đạo */
--prd: #7A2322;     /* Dark wine (header) */
--green: #16A34A;
--amber: #D97706;
--red: #DC2626;
--ocean: #1D4ED8;
--purple: #7C3AED;
```

Header gradient: `linear-gradient(90deg, #5C0F0F, #7A2322, #AF3331, #8B1A1A)`  
Font: Inter (Google Fonts)  
Logo: file `logo_b64.txt` trong cùng folder — base64 PNG

---

## 🐛 Known Bug History — KHÔNG LẶP LẠI

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `delta()` undefined | Định nghĩa sau khi gọi | Define trước `renderKPIs()` |
| `avgCycleTime()` undefined | Định nghĩa sau khi gọi | Define trước `renderKPIs()` |
| `saveCacheSnapshot()` undefined | Function bị xóa nhưng vẫn gọi | Xóa hết call — `renderKPIs` xử lý cache |
| `_SKIP_` broken code | Bad footer inject bằng string concat | Never inject via string concat |
| Duplicate `<script>` blocks | Inject thêm tag | Luôn đếm = 2 (CDN + app) |
| Capacity = `mems*60*10` | Sai formula | Dùng `OE` (sum OriginalEstimate) |
| Feature hiện như Initiative | WIQL thiếu `'Initiative'` type | Include trong WIQL |
| Top Epics hiện all | Thiếu filter | Chỉ show epics với `open > 0` |
| `prog-inline` quá hẹp | CSS thiếu min-width | `min-width:200px; flex:1` |
| Weekly Activity toàn số 0 | Source data sai | Dùng Revision API với `revisedDate`, delta ≤ 200, 30-day lookback |
| Initiative Status layout lệch | Status/progress columns quá hẹp | Left-shift status/progress columns, wider progress bars |

---

## 🔧 Coding Rules — BẮT BUỘC

1. **No template literals** (backtick) — dùng string concatenation
2. **No inline onclick với string concat** — dùng `data-*` attributes
3. **Validate với Node trước khi deliver**: `node --check /tmp/test.js`
4. **Script tags phải = 2** (CDN + app) — đếm trước khi xong
5. **Chạy selftest.py** trước khi deliver — không deliver nếu có check fail
6. **Patch surgically**: tìm exact JS block boundaries, replace chỉ cái cần thiết
7. **Không dùng regex** để extract JS block — dùng positional: `cdn_end = html.find('</script>') + 9; app_start = html.find('<script>', cdn_end)`
8. Rebuild file as `html_before + '<script>' + js + '</script>' + html_after` — không re-insert `<script>` tag thủ công

---

## 🔧 Script Extraction Rule (CRITICAL)

```python
# ĐÚNG — positional
cdn_end = html.find('</script>') + 9
app_start = html.find('<script>', cdn_end)
app_end = html.find('</script>', app_start)
js = html[app_start+8:app_end]
html_before = html[:app_start]
html_after = html[app_end+9:]
# Rebuild:
new_html = html_before + '<script>' + new_js + '</script>' + html_after

# SAI — regex (vỡ khi CSS injection shift positions)
# sm = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
```

---

## ✅ Selftest Checklist (31 checks — chạy `python3 selftest.py`)

```
Syntax check (Node)
avgCycleTime() defined
delta() defined
renderKPIs() defined
cacheLoad/cacheSave defined
loadAll() defined
fetchProj() defined
transformProj() defined
buildTeamData() defined
buildWeeklyRevisions() defined
fetchItemRevisions() defined
renderWkToEl() defined
appInit() defined
Completion = Story/Task only (var leafDone)
Utilization = mems×30h/week
Velocity = calendar week
Perf <2d=Fast 2-4d=Normal >4d=Slow
Capacity = OE not mems*60*10
EXCL_MEMBERS both name orderings (HUNG TRAN GIANG BAO)
Epics sorted Active-first
Features sorted Active-first
Top Epics open>0 only
Revision API in weekly
Weekly reloads on wk change
saveCacheSnapshot NOT called
_SKIP_ removed
Script tags = 2
hdate/hcal updates present
Footer present
prog-inline min-width:200px
Initiative in WIQL
MOCK_FB fallback
```

---

## 📁 File Structure

```
PalmTekSolution-ProjectDashboard/
├── palmtek-dashboard.html   ← File chính, single-file app
├── CLAUDE.md                ← File này
├── selftest.py              ← Pre-delivery test (chạy trước khi deliver)
├── logo_b64.txt             ← PalmTek logo base64 (nếu có)
└── README.md
```

---

## 🔄 Workflow Chuẩn

Mỗi khi fix bug hoặc thêm feature:

```
1. Đọc CLAUDE.md (file này) — hiểu context
2. Hỏi clarify nếu cần (chỉ 1 câu rõ nhất)
3. Implement — dùng positional extraction, no regex
4. Chạy selftest.py — xem kết quả
5. Nếu pass → deliver
6. Nếu fail → fix → chạy lại selftest
7. Cập nhật Session Log bên dưới
```

---

## 📋 Outstanding Issues (cần fix)

- [ ] **Weekly Activity** — đang hiện toàn số 0, cần confirm root cause với Revision API
- [ ] **Initiative Status layout** — status/progress columns cần left-shift, progress bars rộng hơn
- [ ] **Top 10 Epics by Open Bugs** — filter chỉ epics có `open > 0` (đã có trong selftest)
- [ ] **Load chậm** — mỗi refresh fetch lại toàn bộ ADO, không có server-side cache

---

## 📝 Session Log

> Cập nhật sau mỗi session làm việc. Format: `[DATE] — Đã làm gì — Kết quả`

- [2026-06] — Setup Claude Code, tạo CLAUDE.md nâng cấp — Done
