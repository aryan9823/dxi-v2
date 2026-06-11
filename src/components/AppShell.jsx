import { cn, NAV_ITEMS, ROUTE_META } from '../utils.js';

// NavIcon — renders SVG icon for each route
function NavIcon({ route, active }) {
  const c = active ? '#C9A96E' : '#8B8B8B';
  const icons = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8"/></svg>,
    orders:    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke={c} strokeWidth="1.8"/><path d="M9 12h6M9 16h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
    farmers:   <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><circle cx="12" cy="8" r="3" stroke={c} strokeWidth="1.8"/><path d="M6 20v-1a6 6 0 0112 0v1" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
    credits:   <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><rect x="2" y="5" width="20" height="14" rx="2" stroke={c} strokeWidth="1.8"/><path d="M2 10h20" stroke={c} strokeWidth="1.8"/></svg>,
    delivery:  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="11" width="14" height="10" rx="2" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="21" r="1" stroke={c} strokeWidth="1.8"/><circle cx="20" cy="21" r="1" stroke={c} strokeWidth="1.8"/></svg>,
    fleet:     <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><circle cx="12" cy="10" r="3" stroke={c} strokeWidth="1.8"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={c} strokeWidth="1.8"/></svg>,
    crates:    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><rect x="2" y="7" width="20" height="14" rx="2" stroke={c} strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12v4M10 14h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
    whatsapp:  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    profile:   <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  };
  return icons[route] || <svg viewBox="0 0 24 24" className="h-5 w-5"><circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.8"/></svg>;
}

function AppShell({ route, onRouteChange, currentUser, syncModeLabel, banner, onLogout, children }) {
  const routeMeta = {
    dashboard: { title: "Dashboard",    sub: "Your dairy business at a glance" },
    orders:    { title: "Orders",        sub: "Manage today's orders"           },
    farmers:   { title: "Farmers",       sub: "Farmer management & payments"   },
    credits:   { title: "Credit Ledger", sub: "Track outstanding payments"     },
    delivery:  { title: "Delivery",      sub: "Today's delivery status"        },
    fleet:     { title: "Fleet",         sub: "Live milkman tracking"          },
    crates:    { title: "Crate Ledger",  sub: "Track crate movement"           },
    whatsapp:  { title: "WhatsApp",      sub: "Order automation"               },
    profile:   { title: "Profile",       sub: "Account & settings"             },
  };
  const meta = routeMeta[route] || { title: 'DXI', sub: '' };

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="no-print hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 lg:flex-col"
        style={{ background: '#1A1A1A' }}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="h-8 w-8 rounded-xl bg-[#C9A96E] flex items-center justify-center">
            <span className="text-[10px] font-black text-white">DXI</span>
          </div>
          <div>
            <p className="text-xs font-black text-white">Dairy Intelligence</p>
            <p className="text-[10px] text-white/40">{syncModeLabel}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = route === item.route;
            return (
              <button key={item.route} onClick={() => onRouteChange(item.route)}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  active ? 'bg-[#C9A96E] text-white' : 'text-white/50 hover:bg-white/5 hover:text-white')}>
                <NavIcon route={item.route} active={active} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-[10px] text-white/30 mb-1">{currentUser?.email}</p>
          <button onClick={onLogout} className="text-xs text-white/40 hover:text-white">Sign out</button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div className="lg:pl-56 min-h-screen flex flex-col">

        {/* Banner */}
        {banner && (
          <div className="bg-emerald-600 text-white text-xs font-semibold text-center py-2 px-4 no-print">
            {banner}
          </div>
        )}

        {/* Page header */}
        <header className="no-print sticky top-0 z-20 border-b border-[#E8E2D9] bg-[#FAF8F5]/90 backdrop-blur px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#999]">{meta.sub}</p>
              <h1 className="text-xl font-black text-[#1A1A1A]">{meta.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-[#999] border border-[#E8E2D9] rounded-lg px-3 py-1.5">
                {syncModeLabel}
              </span>
              <button onClick={() => onRouteChange('profile')}
                className="h-8 w-8 rounded-xl bg-[#1A1A1A] text-[#C9A96E] text-xs font-black flex items-center justify-center">
                {(currentUser?.email || 'O')[0].toUpperCase()}
              </button>
              <button onClick={onLogout}
                className="hidden sm:block text-xs text-[#999] hover:text-[#1A1A1A] border border-[#E8E2D9] rounded-lg px-3 py-1.5">
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ────────────────────────────── */}
      <nav className="lg:hidden no-print fixed bottom-0 left-0 right-0 z-30 border-t border-[#E8E2D9] bg-white/95 backdrop-blur">
        <div className={cn('grid gap-0', `grid-cols-${Math.min(NAV_ITEMS.length, 8)}`)}>
          {NAV_ITEMS.map(item => {
            const active = route === item.route;
            return (
              <button key={item.route} onClick={() => onRouteChange(item.route)}
                className={cn('flex flex-col items-center justify-center py-2 px-1 gap-0.5 transition-all',
                  active ? 'text-[#C9A96E]' : 'text-[#999]')}>
                <NavIcon route={item.route} active={active} />
                <span className="text-[9px] font-semibold leading-none">{item.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default AppShell;
