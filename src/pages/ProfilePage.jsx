import { Card, Btn } from '../components/ui.jsx';
import { cn, MILKMAN_ACCOUNTS, DEMO_ACCOUNT } from '../utils.js';

function ProfilePage({ user, onLogout }) {
  const u = user || {};

  return (
    <div className="space-y-5 max-w-lg">
      {/* User card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-xl font-black text-[#C9A96E]">
            {(u.name || u.email || 'O')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-[#1A1A1A] text-lg">{u.name || 'Owner'}</p>
            <p className="text-sm text-[#999]">{u.email || '—'}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F0EDE8] text-[#C9A96E]">
              {u.provider === 'firebase' ? 'Firebase Account' : 'Demo Account'}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#999]">Sync mode</span>
            <span className="font-semibold text-[#1A1A1A]">
              {u.provider === 'firebase' ? '☁ Firestore live sync' : '💾 Local storage'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#999]">App version</span>
            <span className="font-semibold text-[#1A1A1A]">DXI v2.0</span>
          </div>
        </div>
      </Card>

      {/* Demo credentials */}
      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#999] mb-3">Demo Credentials</p>
        <div className="space-y-2">
          <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] p-3">
            <p className="text-xs font-bold text-[#666] mb-1">Owner</p>
            <p className="text-sm font-mono text-[#1A1A1A]">{DEMO_ACCOUNT.email}</p>
            <p className="text-sm font-mono text-[#999]">{DEMO_ACCOUNT.password}</p>
          </div>
          {MILKMAN_ACCOUNTS.slice(0, 2).map(mm => (
            <div key={mm.id} className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] p-3">
              <p className="text-xs font-bold text-[#666] mb-1">{mm.name}</p>
              <p className="text-sm font-mono text-[#1A1A1A]">{mm.email}</p>
              <p className="text-sm font-mono text-[#999]">{mm.password}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Sign out */}
      <Btn variant="danger" className="w-full py-3" onClick={onLogout}>
        Sign Out
      </Btn>
    </div>
  );
}

export default ProfilePage;
