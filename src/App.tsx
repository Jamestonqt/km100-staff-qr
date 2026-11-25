import { useState, useEffect, useCallback } from 'react';
import { Navbar, type ActiveTab } from './components/Navbar';
import { KPISummaryBar } from './components/KPISummaryBar';
import { ScannerView } from './components/ScannerView';
import { GeneratorView } from './components/GeneratorView';
import { DirectoryView } from './components/DirectoryView';
import { LogsView } from './components/LogsView';
import { SetupModal } from './components/SetupModal';
import type { Employee, KPISummary, ScanLog } from './types/database';
import { portalService, isSupabaseConfigured } from './lib/supabase';
import { soundManager } from './utils/audio';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [kpiSummary, setKpiSummary] = useState<KPISummary>({
    totalActiveStaff: 0,
    currentlyOnSite: 0,
    todayCheckIns: 0,
    deniedToday: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [empList, logList, kpis] = await Promise.all([
        portalService.getEmployees(),
        portalService.getScanLogs(),
        portalService.getKPISummary(),
      ]);
      setEmployees(empList);
      setLogs(logList);
      setKpiSummary(kpis);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Audio mute toggle
  const handleToggleMute = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const handleScanRecorded = () => {
    loadData();
  };

  const handleEmployeeCreated = (newEmp: Employee) => {
    setEmployees((prev) => [...prev, newEmp]);
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSupabaseLive={isSupabaseConfigured}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Real-time KPI Metric Cards */}
        <KPISummaryBar summary={kpiSummary} loading={loading} />

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
      <footer className="border-t border-[#222730] bg-[#0d0f12] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-orange-500">KM100 Skills & Training Center, Inc.</span> • Staff & Gate Access Control
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="text-orange-500 hover:text-orange-400 hover:underline cursor-pointer"
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
