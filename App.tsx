
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { FermenterDetail } from './components/FermenterDetail';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { FermentationHistory } from './components/FermentationHistory';
import { FinishedBrewDetail } from './components/FinishedBrewDetail';
import { Settings } from './components/Settings';
import { MOCK_FERMENTERS } from './services/mockData';
import { Fermenter, FermenterStatus, BeerStyle, DeviceMode, FinishedBrew } from './types';
import { History, LogOut, Settings as SettingsIcon, LayoutGrid, ArrowLeft, Snowflake, Circle, Flame, Timer, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

type ViewState = 'DASHBOARD' | 'HISTORY' | 'SETTINGS';
type AuthState = 'LOGIN' | 'REGISTER';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthState>('LOGIN');
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [fermenters, setFermenters] = useState<Fermenter[]>(MOCK_FERMENTERS);
  const [selectedFermenterId, setSelectedFermenterId] = useState<string | null>(null);
  const [selectedBrew, setSelectedBrew] = useState<FinishedBrew | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-refresh simulation
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
        setFermenters(prev => prev.map(f => ({
            ...f,
            currentDevice: {
                ...f.currentDevice,
                lastUpdate: new Date().toISOString()
            }
        })));
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleUpdateFermenter = (id: string, updates: Partial<Fermenter>) => {
    setFermenters(prev => prev.map(f => 
        f.id === id ? { ...f, ...updates } : f
    ));
  };

  const handleAddFermenter = (newDevice: Partial<Fermenter>) => {
    const newFermenter: Fermenter = {
        id: Math.random().toString(36).substr(2, 9),
        name: newDevice.name || 'Novo Dispositivo',
        ipAddress: newDevice.ipAddress || '',
        mode: DeviceMode.FERMENTER,
        status: FermenterStatus.IDLE,
        beerName: '',
        style: BeerStyle.LAGER,
        startDate: '',
        og: 0,
        fg: 1.010,
        volume: 20,
        targetTemp: 20,
        readings: [],
        currentDevice: {
            gravity: 1.000,
            temperature: 20,
            battery: 0,
            angle: 0,
            rssi: 0,
            lastUpdate: ''
        },
        currentFridgeTemp: 20,
        profile: [],
        currentStepIndex: 0,
        isPaused: false,
        ...newDevice
    };
    setFermenters(prev => [...prev, newFermenter]);
  };

  const handleDeleteFermenter = (id: string) => {
    setFermenters(prev => prev.filter(f => f.id !== id));
    if (selectedFermenterId === id) {
        setSelectedFermenterId(null);
    }
  };

  const handleBack = () => {
    if (selectedBrew) {
      setSelectedBrew(null);
    } else if (selectedFermenterId) {
      setSelectedFermenterId(null);
    }
  };

  const selectedFermenter = fermenters.find(f => f.id === selectedFermenterId);

  if (!isAuthenticated) {
    if (authView === 'REGISTER') {
        return (
            <Register 
                onLogin={() => setIsAuthenticated(true)} 
                onSwitchToLogin={() => setAuthView('LOGIN')} 
            />
        );
    }
    return (
        <Login 
            onLogin={() => setIsAuthenticated(true)} 
            onSwitchToRegister={() => setAuthView('REGISTER')} 
        />
    );
  }

  // Header Styles
  const headerBtnBase = "flex items-center justify-center gap-1 md:gap-2 px-2 md:px-3 lg:px-4 h-8 md:h-10 rounded-md text-[11px] font-bold uppercase tracking-wider border transition-all shrink-0";
  const iconOnlyBase = "flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-md border transition-all shrink-0";
  const navBtnDefault = "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white";
  const navBtnActive = "border-neutral-400 text-white bg-white/5";

  // Status Logic for the Active Fermenter
  const isOnline = selectedFermenter && 
    (new Date().getTime() - new Date(selectedFermenter.currentDevice.lastUpdate).getTime()) < 30 * 60 * 1000;
  
  const isCooling = selectedFermenter && selectedFermenter.currentFridgeTemp < selectedFermenter.currentDevice.temperature - 0.2;
  const isHeating = selectedFermenter && selectedFermenter.currentFridgeTemp > selectedFermenter.currentDevice.temperature + 0.2;

  const showBackButton = selectedFermenterId !== null || selectedBrew !== null;

  return (
    <div className="min-h-screen bg-black pb-10">
      <nav className="bg-black py-6 no-print border-b border-neutral-800/50">
        <div className="w-full px-4 md:px-8 flex flex-wrap items-center justify-between gap-y-4">
          
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer select-none" 
            onClick={() => {
                setSelectedFermenterId(null);
                setSelectedBrew(null);
                setCurrentView('DASHBOARD');
            }}
          >
            <div className="flex items-baseline">
                <span className="text-2xl md:text-4xl font-black text-white tracking-tighter">BREW</span>
                <div className="relative">
                    <span className="text-2xl md:text-4xl font-black text-white tracking-tighter">W</span>
                    <div className="absolute top-0 -right-1.5 md:-right-2 w-2 md:w-3 h-1.5 md:h-2 bg-white rounded-tr-sm"></div>
                </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex flex-wrap items-center gap-1 md:gap-2 justify-end">
            
            {/* Contextual Status Badges - Only visible inside a Fermenter Detail */}
            {selectedFermenterId && selectedFermenter && (
              <>
                <div className={`${headerBtnBase} ${isOnline ? 'border-green-500/50 text-green-500 bg-green-500/5' : 'border-red-500/50 text-red-500 bg-red-500/5'}`}>
                    <Circle size={8} className={isOnline ? "fill-current" : ""} />
                    <span className="hidden lg:inline">{isOnline ? 'Online' : 'Offline'}</span>
                </div>

                {isCooling && (
                  <div className={`${headerBtnBase} border-blue-500/50 text-blue-500 bg-blue-500/5`}>
                      <Snowflake size={14} />
                      <span className="hidden lg:inline">Resfriando</span>
                  </div>
                )}

                {isHeating && (
                  <div className={`${headerBtnBase} border-orange-500/50 text-orange-500 bg-orange-500/5`}>
                      <Flame size={14} />
                      <span className="hidden lg:inline">Aquecendo</span>
                  </div>
                )}

                {!isCooling && !isHeating && isOnline && (
                  <div className={`${headerBtnBase} border-neutral-700 text-neutral-500`}>
                      <Timer size={14} />
                      <span className="hidden lg:inline">Estável</span>
                  </div>
                )}
              </>
            )}

            {/* Navigation Icons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                  title="Grid"
                  onClick={() => {
                      setSelectedFermenterId(null);
                      setSelectedBrew(null);
                      setCurrentView('DASHBOARD');
                  }}
                  className={`${iconOnlyBase} ${currentView === 'DASHBOARD' && !selectedFermenterId && !selectedBrew ? navBtnActive : navBtnDefault}`}
              >
                  <LayoutGrid size={18} />
              </button>

              <button 
                  title="Logs"
                  onClick={() => {
                      setSelectedFermenterId(null);
                      setSelectedBrew(null);
                      setCurrentView('HISTORY');
                  }}
                  className={`${iconOnlyBase} ${currentView === 'HISTORY' && !selectedBrew ? navBtnActive : navBtnDefault}`}
              >
                  <History size={18} />
              </button>

              <button 
                  title="Settings"
                  onClick={() => {
                    setSelectedFermenterId(null);
                    setSelectedBrew(null);
                    setCurrentView('SETTINGS');
                  }}
                  className={`${iconOnlyBase} ${currentView === 'SETTINGS' ? navBtnActive : navBtnDefault}`}
              >
                  <SettingsIcon size={18} />
              </button>

              <button 
                  title="Toggle Theme"
                  onClick={toggleTheme}
                  className={`${iconOnlyBase} ${navBtnDefault}`}
              >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Back Button - Centralized for all detailed views */}
              {showBackButton && (
                  <button 
                      onClick={handleBack}
                      className={`${headerBtnBase} border-neutral-800 text-neutral-100 bg-neutral-900/40 hover:bg-neutral-800 ml-2`}
                  >
                      <ArrowLeft size={14} />
                      <span className="hidden lg:inline">Voltar</span>
                  </button>
              )}

              {currentView === 'DASHBOARD' && !selectedFermenterId && !selectedBrew && (
                <button 
                    onClick={() => setIsAuthenticated(false)}
                    className="ml-2 p-2 text-neutral-700 hover:text-red-500 transition-colors"
                    title="Sair"
                >
                    <LogOut size={18} />
                </button>
              )}
            </div>

            {/* Hamburger Button - Mobile */}
            <button 
                className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
            <div className="md:hidden absolute top-20 right-4 left-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2 z-50 shadow-2xl">
                <button 
                    onClick={() => {
                        setSelectedFermenterId(null);
                        setSelectedBrew(null);
                        setCurrentView('DASHBOARD');
                        setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${currentView === 'DASHBOARD' && !selectedFermenterId && !selectedBrew ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <LayoutGrid size={18} /> Dashboard
                </button>

                <button 
                    onClick={() => {
                        setSelectedFermenterId(null);
                        setSelectedBrew(null);
                        setCurrentView('HISTORY');
                        setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${currentView === 'HISTORY' && !selectedBrew ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <History size={18} /> Histórico
                </button>

                <button 
                    onClick={() => {
                      setSelectedFermenterId(null);
                      setSelectedBrew(null);
                      setCurrentView('SETTINGS');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${currentView === 'SETTINGS' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <SettingsIcon size={18} /> Configurações
                </button>

                <button 
                    onClick={() => {
                        toggleTheme();
                        setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-neutral-400 hover:bg-white/5 hover:text-white transition-all"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} Alternar Tema
                </button>

                {showBackButton && (
                    <button 
                        onClick={() => {
                            handleBack();
                            setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-neutral-100 bg-neutral-800 hover:bg-neutral-700 transition-all mt-2"
                    >
                        <ArrowLeft size={18} /> Voltar
                    </button>
                )}

                {currentView === 'DASHBOARD' && !selectedFermenterId && !selectedBrew && (
                  <button 
                      onClick={() => setIsAuthenticated(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 transition-all mt-2"
                  >
                      <LogOut size={18} /> Sair
                  </button>
                )}
            </div>
        )}
      </nav>

      <main className="mt-2">
        {selectedBrew ? (
          <FinishedBrewDetail brew={selectedBrew} />
        ) : selectedFermenterId && selectedFermenter ? (
          <FermenterDetail 
            fermenter={selectedFermenter} 
            onUpdate={handleUpdateFermenter}
          />
        ) : currentView === 'HISTORY' ? (
          <FermentationHistory onSelectBrew={setSelectedBrew} />
        ) : currentView === 'SETTINGS' ? (
          <Settings />
        ) : (
          <Dashboard 
            fermenters={fermenters} 
            onSelectFermenter={setSelectedFermenterId}
            onUpdateFermenter={handleUpdateFermenter}
            onAddFermenter={handleAddFermenter}
            onDeleteFermenter={handleDeleteFermenter}
          />
        )}
      </main>
    </div>
  );
};

export default App;
