import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar, type ActiveTab } from './components/Navbar';
import { KPISummaryBar } from './components/KPISummaryBar';
import { ScannerView } from './components/ScannerView';
import { GeneratorView } from './components/GeneratorView';
import { DirectoryView } from './components/DirectoryView';
import { LogsView } from './components/LogsView';
import { SetupModal } from './components/SetupModal';
import { LoginView } from './components/LoginView';
import type { Employee, ScanLog } from './types/database';
import {
  portalService,
  isSupabaseConfigured,
  supabase,
  authService,
  type Session,
} from './lib/supabase';
import { soundManager } from './utils/audio';
import { getInitialTheme, applyTheme, type Theme } from './utils/theme';
import { getCurrentlyOnSiteCount } from './utils/presence';
import { Loader2 } from 'lucide-react';

function computeAdmissionsSummary(logs: ScanLog[]) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const todayStart = d.getTime();
  let checkIns = 0;
  let denied = 0;
  for (const log of logs) {
    if (new Date(log.scanned_at).getTime() < todayStart) continue;
    if (log.scan_type === 'CHECK_IN' && log.verification_status === 'VALID') checkIns++;
    if (log.verification_status !== 'VALID' && log.verification_status !== 'DUPLICATE_SCAN') denied++;
  }
  return { admissionsToday: checkIns, deniedToday: denied };
}

export function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  const currentlyOnSite = useMemo(
    () => getCurrentlyOnSiteCount(logs, employees),
    [logs, employees]
  );

  const { admissionsToday, deniedToday } = useMemo(
    () => computeAdmissionsSummary(logs),
    [logs]
  );

  // Apply theme class to <html> on theme state changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Check initial authentication session & subscribe to auth state changes
  useEffect(() => {
    let isMounted = true;

    const checkInitialSession = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.getSession();
          if (error) console.error('Error fetching Supabase auth session:', error);
          if (isMounted) setSession(data.session);
        } else {
          const { data } = await authService.getSession();
          if (isMounted) setSession(data.session);
        }
      } catch (err) {
        console.error('Failed to get auth session:', err);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    checkInitialSession();

    let unsubscribe = () => {};
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, currentSession) => {
          if (isMounted) setSession(currentSession);
        }
      );
      unsubscribe = () => subscription.unsubscribe();
    } else {
      const { data: { subscription } } = authService.onAuthStateChange(
        (_event, currentSession) => {
          if (isMounted) setSession(currentSession);
        }
      );
      unsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const reloadData = useCallback(async () => {
    if (!session) return;
    try {
      const [empList, logList] = await Promise.all([
        portalService.getEmployees(),
        portalService.getScanLogs(),
      ]);
      setEmployees(empList);
      setLogs(logList);
    } catch (err) {
      console.error('Failed to reload portal data:', err);
    }
  }, [session]);

  // Load all personnel and scan data only once authenticated
  useEffect(() => {
    if (!session) return;

    let isMounted = true;
    const fetchData = async () => {
      try {
        const [empList, logList] = await Promise.all([
          portalService.getEmployees(),
          portalService.getScanLogs(),
        ]);
        if (isMounted) {
          setEmployees(empList);
          setLogs(logList);
        }
      } catch (err) {
        console.error('Failed to load portal data:', err);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [session]);

  // Keep live feed and on-site count in sync with Supabase Realtime when authenticated
  useEffect(() => {
    if (!session) return;
    const unsubscribeEmployees = portalService.subscribeToEmployees(reloadData);
    const unsubscribeLogs = portalService.subscribeToScanLogs(reloadData);
    return () => {
      unsubscribeEmployees();
      unsubscribeLogs();
    };
  }, [session, reloadData]);

  // Audio mute toggle
  const handleToggleMute = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const handleScanRecorded = (log?: ScanLog) => {
    if (log) {
      setLogs((prev) => [log, ...prev.filter((l) => l.id !== log.id)]);
    }
    reloadData();
  };

  const handleEmployeeCreated = (newEmp: Employee) => {
    setEmployees((prev) => [...prev, newEmp]);
    reloadData();
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setSession(null);
      setEmployees([]);
      setLogs([]);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  // 1. Initial Auth Verification Splash
  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0d0f12] text-slate-900 dark:text-white font-sans p-4 transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-[#222730] p-2 bg-white dark:bg-[#16191e] shadow-md animate-pulse flex items-center justify-center">
            <img
              src="/km100-logo.png"
              alt="KM100 Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-orange-600 dark:text-orange-400" />
            <span>Verifying KM100 Admin Session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Admin Login Only (Hide Navbars, Scanner, Personnel Data)
  if (!session) {
    return (
      <LoginView
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
        }}
      />
    );
  }

  // 3. Authenticated Admin Session: Full Application
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d0f12] dark:text-white flex flex-col font-sans selection:bg-orange-600 selection:text-white transition-colors">
      {/* Top Navbar with Sign Out */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSupabaseLive={isSupabaseConfigured}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSignOut={handleSignOut}
        userEmail={session.user.email}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <h1 className="sr-only">KM100 Skills &amp; Training Center — Staff Access &amp; Gate Verification Portal</h1>

        {/* Real-time KPI Metric Cards */}
        <KPISummaryBar
          activePersonnel={employees.filter((e) => e.status === 'Active').length}
          currentlyOnSite={currentlyOnSite}
          admissionsToday={admissionsToday}
          deniedToday={deniedToday}
        />

        {/* Tab Views */}
        {activeTab === 'scanner' && (
          <ScannerView
            onScanRecorded={handleScanRecorded}
            recentLogs={logs}
          />
        )}

        {activeTab === 'generator' && (
          <GeneratorView
            onEmployeeCreated={handleEmployeeCreated}
            existingEmployees={employees}
          />
        )}

        {activeTab === 'directory' && (
          <DirectoryView
            employees={employees}
            logs={logs}
            onEmployeeUpdated={reloadData}
          />
        )}

        {activeTab === 'logs' && <LogsView logs={logs} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-[#222730] dark:bg-[#0d0f12] py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-orange-700 dark:text-orange-400">KM100 Skills &amp; Training Center, Inc.</span> • Staff Access &amp; Attendance Portal
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 hover:underline cursor-pointer font-medium"
            >
              Supabase Configuration
            </button>
            <span>•</span>
            <span>CR80 Badge Standard 2026</span>
          </div>
        </div>
      </footer>

      {/* Setup / Database Configuration Modal */}
      <SetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onResetData={reloadData}
      />
    </div>
  );
}

export default App;
