import React, { useState, useEffect } from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Setting } from "./components/Setting";
import { InputPekerjaan } from "./components/InputPekerjaan";
import { RekapGaji } from "./components/RekapGaji";
import { TugasMitra } from "./components/TugasMitra";
import { LogSemuaAktifitas } from "./components/LogSemuaAktifitas";
import { Login } from "./components/Login";
import { Calculator, ClipboardEdit, LayoutDashboard, WalletCards, LogOut, History, ClipboardList } from "lucide-react";


type ViewState = "setting" | "input" | "tugas" | "rekap" | "log";

function Dashboard() {
  const { currentUser, authLoading, signOut } = useAppContext();
  const [activeView, setActiveView] = useState<ViewState>("input");

  // Load and apply dark mode preference
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const [currentAppMode, setCurrentAppMode] = useState<"ronce" | "service">("ronce");
  
  // Prevent unauthorized access to setting/log view
  useEffect(() => {
    if (currentUser && currentUser.role !== "owner" && currentUser.role !== "admin" && activeView === "setting") {
      setActiveView("input");
    }
    if (currentUser && currentUser.role !== "owner" && activeView === "log") {
      setActiveView("input");
    }
    if (currentUser && currentUser.role !== "owner" && currentAppMode === "service") {
      setCurrentAppMode("ronce");
    }
  }, [currentUser, activeView, currentAppMode]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">Loading...</div>;
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-950 transition-colors duration-200">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div 
              className={`flex items-center gap-3 ${currentUser.role === 'owner' ? 'cursor-pointer group' : ''}`}
              onClick={() => {
                if (currentUser.role === 'owner') {
                  setCurrentAppMode(prev => prev === "ronce" ? "service" : "ronce");
                }
              }}
              title={currentUser.role === 'owner' ? `Pindah ke Kalkulator ${currentAppMode === "ronce" ? "Service" : "Ronce"}` : undefined}
            >
              <div className="bg-indigo-600 p-2 rounded-lg text-white group-hover:bg-indigo-700 transition-colors">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold tracking-tight text-lg sm:text-xl text-slate-800 dark:text-slate-100 leading-none">
                  Kalkulator<span className="text-indigo-600 dark:text-indigo-400"> {currentAppMode === "ronce" ? "Ronce" : "Service"}</span>
                </h1>
                {currentAppMode === "ronce" && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Sistem Pencatatan Mitra</span>
                )}
              </div>
            </div>
            
            {currentAppMode === "ronce" ? (
              <nav className="hidden md:flex space-x-1 sm:space-x-2">
                <NavButton view="input" active={activeView} onClick={setActiveView} icon={<ClipboardEdit className="w-4 h-4" />}>
                  Input
                </NavButton>
                <NavButton view="tugas" active={activeView} onClick={setActiveView} icon={<ClipboardList className="w-4 h-4" />}>
                  Tugas
                </NavButton>
                <NavButton view="rekap" active={activeView} onClick={setActiveView} icon={<WalletCards className="w-4 h-4" />}>
                  Rekap
                </NavButton>
                <NavButton view="log" active={activeView} onClick={setActiveView} icon={<ClipboardList className="w-4 h-4" />}>
                  Log
                </NavButton>
                {(currentUser.role === 'owner') && (
                  <NavButton view="setting" active={activeView} onClick={setActiveView} icon={<LayoutDashboard className="w-4 h-4" />}>
                    Setting
                  </NavButton>
                )}
              </nav>
            ) : (
              <nav className="hidden md:flex space-x-1 sm:space-x-2">
                <NavButton view="input" active={activeView} onClick={setActiveView} icon={<ClipboardEdit className="w-4 h-4" />}>
                  Estimasi
                </NavButton>
                <NavButton view="tugas" active={activeView} onClick={setActiveView} icon={<ClipboardList className="w-4 h-4" />}>
                  Tugas
                </NavButton>
                <NavButton view="rekap" active={activeView} onClick={setActiveView} icon={<WalletCards className="w-4 h-4" />}>
                  Rekap
                </NavButton>
                {(currentUser.role === 'owner') && (
                  <NavButton view="setting" active={activeView} onClick={setActiveView} icon={<LayoutDashboard className="w-4 h-4" />}>
                    Setting
                  </NavButton>
                )}
              </nav>
            )}

            <div className="flex items-center gap-4">
              <div className="text-sm text-right hidden lg:block">
                <p className="font-medium text-slate-800 dark:text-slate-200 leading-tight">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
              </div>
              <button 
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
                <span className="sr-only sm:not-sr-only sm:text-sm font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pb-4 sm:pb-8 mb-24 md:mb-8 ${activeView === "rekap" ? "pt-0" : "pt-1.5 sm:pt-3"}`}>
        {currentAppMode === "ronce" ? (
          <>
            {(activeView === "setting" && currentUser.role === "owner") && <Setting />}
            {activeView === "input" && <InputPekerjaan />}
            {activeView === "tugas" && <TugasMitra />}
            {activeView === "rekap" && <RekapGaji />}
            {activeView === "log" && <LogSemuaAktifitas />}
          </>
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/80 text-center mt-4">
            <Calculator className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {activeView === "input" ? "Estimasi Service" : 
               activeView === "tugas" ? "Tugas Service" : 
               activeView === "rekap" ? "Rekap Service" : 
               "Setting Service"}
            </h2>
            <p className="text-sm text-slate-500 mt-2">Area ini sedang dalam tahap pengembangan.</p>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/80 z-40 pb-safe">
        {currentAppMode === "ronce" ? (
          <div className="flex justify-around items-center h-16 px-2">
            <MobileNavButton view="input" active={activeView} onClick={setActiveView} icon={<ClipboardEdit className="w-5 h-5" />} label="Input" />
            <MobileNavButton view="tugas" active={activeView} onClick={setActiveView} icon={<ClipboardList className="w-5 h-5" />} label="Tugas" />
            <MobileNavButton view="rekap" active={activeView} onClick={setActiveView} icon={<WalletCards className="w-5 h-5" />} label="Rekap" />
            <MobileNavButton view="log" active={activeView} onClick={setActiveView} icon={<ClipboardList className="w-5 h-5" />} label="Log" />
            {(currentUser.role === 'owner') && (
              <MobileNavButton view="setting" active={activeView} onClick={setActiveView} icon={<LayoutDashboard className="w-5 h-5" />} label="Setting" />
            )}
          </div>
        ) : (
          <div className="flex justify-around items-center h-16 px-2">
            <MobileNavButton view="input" active={activeView} onClick={setActiveView} icon={<ClipboardEdit className="w-5 h-5" />} label="Estimasi" />
            <MobileNavButton view="tugas" active={activeView} onClick={setActiveView} icon={<ClipboardList className="w-5 h-5" />} label="Tugas" />
            <MobileNavButton view="rekap" active={activeView} onClick={setActiveView} icon={<WalletCards className="w-5 h-5" />} label="Rekap" />
            {(currentUser.role === 'owner') && (
              <MobileNavButton view="setting" active={activeView} onClick={setActiveView} icon={<LayoutDashboard className="w-5 h-5" />} label="Setting" />
            )}
          </div>
        )}
      </nav>
    </div>
  );
}

function NavButton({ view, active, onClick, children, icon }: { view: ViewState; active: ViewState; onClick: (v: ViewState) => void; children: React.ReactNode; icon: React.ReactNode }) {
  const isActive = view === active;
  return (
    <button
      onClick={() => onClick(view)}
      className={`px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
        isActive
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-755 hover:text-slate-900 dark:hover:text-slate-200"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function MobileNavButton({ view, active, onClick, icon, label }: { view: ViewState; active: ViewState; onClick: (v: ViewState) => void; icon: React.ReactNode; label: string }) {
  const isActive = view === active;
  return (
    <button
      onClick={() => onClick(view)}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors cursor-pointer ${
        isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}

