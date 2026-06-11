import { useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AppShell from './components/AppShell.jsx';
import { readLocal, writeLocal, removeLocal, KEYS } from './services/storage.js';
import { DEMO_ACCOUNT } from './utils.js';

import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MilkmanLoginPage from './pages/MilkmanLoginPage.jsx';
import MilkmanPortal from './pages/MilkmanPortal.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import FarmersPage from './pages/FarmersPage.jsx';
import CreditTrackerPage from './pages/CreditPage.jsx';
import DeliveryPage from './pages/DeliveryPage.jsx';
import FleetPage from './pages/FleetPage.jsx';
import CratesPage from './pages/CratesPage.jsx';
import WhatsAppPage from './pages/WhatsAppPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const STORAGE_KEYS_MM = {
  session: 'dxi_milkman_session_v1',
};

const safeReadLocal = (k) => {
  try {
    return readLocal ? readLocal(k) : null;
  } catch {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
};

const safeWriteLocal = (k, v) => {
  try {
    if (writeLocal) {
      writeLocal(k, v);
    } else {
      localStorage.setItem(k, JSON.stringify(v));
    }
  } catch {}
};

const safeRemoveLocal = (k) => {
  try {
    if (removeLocal) {
      removeLocal(k);
    } else {
      localStorage.removeItem(k);
    }
  } catch {}
};

function getRoute() {
  if (typeof window === 'undefined') return 'landing';
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  return raw || 'landing';
}

function AppAuth() {
  const [route, setRoute] = useState(getRoute());
  const [user, setUser] = useState(() => safeReadLocal(KEYS?.session));
  const [milkmanUser, setMilkmanUser] = useState(() => safeReadLocal(STORAGE_KEYS_MM.session));
  const [crates, setCrates] = useState(() => safeReadLocal(KEYS?.crates) || []);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    safeWriteLocal(KEYS?.crates, crates);
  }, [crates]);

  const navigate = (target) => {
    setRoute(target);
    window.location.hash = target === 'landing' ? '#landing' : `#/${target}`;
  };

  const handleLogout = () => {
    safeRemoveLocal(KEYS?.session);
    safeRemoveLocal(STORAGE_KEYS_MM.session);
    setUser(null);
    setMilkmanUser(null);
    navigate('landing');
  };

  const currentUser = user || milkmanUser;

  const handleLoginSuccess = (nextUser, targetRoute = 'dashboard') => {
    const normalizedUser = nextUser || {
      email: DEMO_ACCOUNT.email,
      name: DEMO_ACCOUNT.name,
      provider: 'demo',
    };
    setUser(normalizedUser);
    setMilkmanUser(null);
    safeWriteLocal(KEYS?.session, normalizedUser);
    navigate(targetRoute);
  };

  const handleDemoLogin = async (email, password) => {
    const e = String(email || '').trim().toLowerCase();
    const p = String(password || '').trim();
    if (e === DEMO_ACCOUNT.email && p === DEMO_ACCOUNT.password) {
      return { ok: true, user: { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name, provider: 'demo' } };
    }
    return { ok: false, message: 'Invalid demo credentials.' };
  };

  const publicRoutes = ['landing', 'login', 'milkman-login'];

  const renderPage = () => {
    if (!currentUser && publicRoutes.includes(route)) {
      if (route === 'milkman-login') {
        return (
          <MilkmanLoginPage
            onLoginSuccess={(u) => {
              setMilkmanUser(u);
              safeWriteLocal(STORAGE_KEYS_MM.session, u);
              navigate('milkman');
            }}
          />
        );
      }

      if (route === 'login') {
        return (
          <LoginPage
            onLogin={handleDemoLogin}
            onLoginSuccess={(u) => handleLoginSuccess(u, 'dashboard')}
            onRouteChange={navigate}
            firebaseReady={true}
          />
        );
      }

      return <LandingPage onRouteChange={navigate} />;
    }

    if (!currentUser) {
      navigate('login');
      return null;
    }

    const commonProps = {
      currentUser,
      onRouteChange: navigate,
      onLogout: handleLogout,
      crates,
      setCrates,
    };

    switch (route) {
      case 'dashboard':
        return <DashboardPage {...commonProps} />;
      case 'orders':
        return <OrdersPage {...commonProps} />;
      case 'farmers':
        return <FarmersPage {...commonProps} />;
      case 'credits':
        return <CreditTrackerPage {...commonProps} />;
      case 'delivery':
        return <DeliveryPage {...commonProps} />;
      case 'fleet':
        return <FleetPage {...commonProps} />;
      case 'crates':
        return <CratesPage {...commonProps} />;
      case 'whatsapp':
        return <WhatsAppPage {...commonProps} />;
      case 'profile':
        return <ProfilePage {...commonProps} />;
      case 'milkman':
        return <MilkmanPortal {...commonProps} />;
      default:
        return <DashboardPage {...commonProps} />;
    }
  };

  const pageContent = renderPage();

  if (!currentUser && publicRoutes.includes(route)) {
    return <ErrorBoundary>{pageContent}</ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
      <AppShell
        route={route}
        onRouteChange={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      >
        {pageContent}
      </AppShell>
    </ErrorBoundary>
  );
}

export default AppAuth;
