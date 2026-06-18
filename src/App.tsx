import React, { useState } from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Setting } from "./components/Setting";
import { InputPekerjaan } from "./components/InputPekerjaan";
import { RekapGaji } from "./components/RekapGaji";
import { Login } from "./components/Login";
import { Calculator, ClipboardEdit, LayoutDashboard, WalletCards, LogOut } from "lucide-react";


type ViewState = "setting" | "input" | "rekap";

function Dashboard() {
  const { currentUser, authLoading, signOut } = useAppContext();
  const [activeView, setActiveView] = useState<ViewState>("input");

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <h1 className="font-bold tracking-tight text-lg sm:text-xl text-slate-800">
                Kalkulator<span className="text-indigo-600"> Garapan</span>
              </h1>
            </div>
            
            <nav className="hidden md:flex space-x-1 sm:space-x-2">
              <NavButton view="input" active={activeView} onClick={setActiveView} icon={<ClipboardEdit className="w-4 h-4" />}>
                Input
              </NavButton>
              <NavButton view="rekap" active={activeView} onClick={setActiveView} icon={<WalletCards className="w-4 h-4" />}>
                Rekap
              </NavButton>
              {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
                <NavButton view="setting" active={activeView} onClick={setActiveView} icon={<LayoutDashboard className="w-4 h-4" />}>
                  Setting
                </NavButton>
              )}
            </nav>

            <div className="flex items-center gap-4">
              <div className="text-sm text-right hidden lg:block">
                <p className="font-medium text-slate-800 leading-tight">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
              </div>
              <button 
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
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
        {activeView === "setting" && (currentUser.role === "owner" || currentUser.role === "admin") && <Setting />}
        {activeView === "input" && <InputPekerjaan />}
        {activeView === "rekap" && <RekapGaji />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          <MobileNavButton view="input" active={activeView} onClick={setActiveView} icon={<ClipboardEdit className="w-5 h-5" />} label="Input" />
          <MobileNavButton view="rekap" active={activeView} onClick={setActiveView} icon={<WalletCards className="w-5 h-5" />} label="Rekap" />
          {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
            <MobileNavButton view="setting" active={activeView} onClick={setActiveView} icon={<LayoutDashboard className="w-5 h-5" />} label="Setting" />
          )}
        </div>
      </nav>
    </div>
  );
}

function NavButton({ view, active, onClick, children, icon }: { view: ViewState; active: ViewState; onClick: (v: ViewState) => void; children: React.ReactNode; icon: React.ReactNode }) {
  const isActive = view === active;
  return (
    <button
      onClick={() => onClick(view)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
        isActive
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
        isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
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

