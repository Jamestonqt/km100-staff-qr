import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar, type ActiveTab } from './components/Navbar';
import { KPISummaryBar } from './components/KPISummaryBar';
import { ScannerView } from './components/ScannerView';
import { GeneratorView } from './components/GeneratorView';
import { DirectoryView } from './components/DirectoryView';
import { LogsView } from './components/LogsView';
import { SetupModal } from './components/SetupModal';
import type { Employee, ScanLog } from './types/database';
import { portalService, isSupabaseConfigured } from './lib/supabase';
import { soundManager } from './utils/audio';
import { getInitialTheme, applyTheme, type Theme } from './utils/theme';
import { getCurrentlyOnSiteCount } from './utils/presence';

export function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  const currentlyOnSite = useMemo(
    () => getCurrentlyOnSiteCount(logs, employees),
    [logs, employees]
  );

  const { admissionsToday, deniedToday } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let checkIns = 0;
    let denied = 0;
    for (const log of logs) {
      if (new Date(log.scanned_at).getTime() < todayStart) continue;
      if (log.scan_type === 'CHECK_IN' && log.verification_status === 'VALID') checkIns++;
      if (log.verification_status !== 'VALID' && log.verification_status !== 'DUPLICATE_SCAN') denied++;
    }
    return { admissionsToday: checkIns, deniedToday: denied };
  }, [logs]);

  // Apply theme class to <html> on theme state changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [empList, logList] = await Promise.all([
        portalService.getEmployees(),
        portalService.getScanLogs(),
      ]);
      setEmployees(empList);
      setLogs(logList);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep the live feed and on-site count in sync with Supabase Realtime
  useEffect(() => {
    const unsubscribeEmployees = portalService.subscribeToEmployees(loadData);
    const unsubscribeLogs = portalService.subscribeToScanLogs(loadData);
    return () => {
      unsubscribeEmployees();
      unsubscribeLogs();
    };
  }, [loadData]);

  // Audio mute toggle
  const handleToggleMute = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const handleScanRecorded = (log?: ScanLog) => {
    if (log) {
      setLogs((prev) => [log, ...prev.filter((l) => l.id !== log.id)]);
    }
    loadData();
  };

  const handleEmployeeCreated = (newEmp: Employee) => {
    setEmployees((prev) => [...prev, newEmp]);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d0f12] dark:text-white flex flex-col font-sans selection:bg-orange-600 selection:text-white transition-colors">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSupabaseLive={isSupabaseConfigured}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
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
            onEmployeeUpdated={loadData}
          />
        )}

        {activeTab === 'logs' && <LogsView logs={logs} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-[#222730] dark:bg-[#0d0f12] py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-orange-600 dark:text-orange-500">KM100 Skills &amp; Training Center, Inc.</span> • Staff Access &amp; Attendance Portal
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline cursor-pointer"
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
        onResetData={loadData}
      />
    </div>
  );
}

export default App;
