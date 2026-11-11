import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogIn, ChevronRight, LogOut, Headphones, Shield, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import ghostLogo from '../../assets/fiveware-ghost.png';

export type NavTabId = 'home' | 'courses' | 'products' | 'apps' | 'support' | 'cleaners' | 'discord' | 'my-tickets';

export interface NavTab {
  id: NavTabId;
  label: string;
}

export const NAV_TABS: NavTab[] = [
  { id: 'home', label: 'Home' },
  { id: 'products', label: 'Products' },
  { id: 'apps', label: 'Apps' },
  { id: 'support', label: 'Support' },
  { id: 'discord', label: 'Group' },
];

interface NavbarProps {
  activeTab?: NavTabId;
  onTabChange?: (tab: NavTabId) => void;
  onActionClick?: () => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
  hasClientTickets?: boolean;
  clientTicketCount?: number;
  hasUnreadAdminReply?: boolean;
  isStaffOrAdmin?: boolean;
  isAdminSession?: boolean;
  unreadStaffTicketsCount?: number;
  onOpenStaffPortal?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAdminPrompt?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'home',
  onTabChange,
  onActionClick,
  user = null,
  onLogout,
  hasClientTickets = false,
  clientTicketCount = 0,
  isStaffOrAdmin = false,
  isAdminSession = false,
  unreadStaffTicketsCount = 0,
  onOpenStaffPortal,
  onOpenAdminPanel,
  onOpenAdminPrompt,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const visibleTabs: NavTab[] = [
    ...NAV_TABS,
    ...(hasClientTickets ? [{ id: 'my-tickets' as const, label: 'My Tickets' }] : [])
  ];

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectTab = (tabId: NavTabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (user) {
      setProfileDropdownOpen((prev) => !prev);
    } else if (onActionClick) {
      onActionClick();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-zinc-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Brand Logo Fiveware.cc with invisible admin trigger button right beside it */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSelectTab('home')}
              className="group flex items-center gap-2.5 focus-visible:outline-none rounded-lg cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800/90 flex items-center justify-center bg-zinc-950 shrink-0 shadow-sm transition-all duration-300 group-hover:border-sky-400/50 group-hover:shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                <img
                  src={ghostLogo}
                  alt="Fiveware.cc Ghost Logo"
                  onError={(e) => {
                    e.currentTarget.src = '/fiveware-ghost.png';
                  }}
                  className="w-full h-full object-cover select-none transform-gpu transition-transform duration-700 ease-in-out group-hover:rotate-[360deg] hover:rotate-[360deg]"
                />
              </div>
              <span className="text-sm font-bold font-display tracking-tight text-white group-hover:text-sky-400 transition-colors">
                Fiveware.cc
              </span>
            </button>

            {/* Cadeado invisível do Painel Admin ao lado do nome Fiveware */}
            <button
              type="button"
              onClick={onOpenAdminPrompt}
              aria-label="Controle Admin"
              title=""
              tabIndex={-1}
              className="opacity-0 hover:opacity-10 active:opacity-20 transition-opacity p-1.5 -ml-0.5 rounded cursor-default select-none focus:outline-none"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>

          {/* Center: Desktop Navigation Tabs - Identical layout to user screenshot */}
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 py-1 select-none">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isTicketsTab = tab.id === 'my-tickets';

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={cn(
                    'text-[14px] sm:text-[15px] font-normal transition-colors duration-150 cursor-pointer focus-visible:outline-none whitespace-nowrap',
                    isActive
                      ? 'text-[#ff2b2b] font-medium'
                      : 'text-white hover:text-zinc-300'
                  )}
                >
                  <span>{tab.label}</span>
                  {isTicketsTab && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                      {clientTicketCount || 1}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Circular Profile Avatar + Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Circular Profile Avatar (Sky/Blue gradient with white silhouette avatar) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={handleProfileClick}
                title={user ? `${user.name} (${user.email})` : 'Sign in to account'}
                aria-label="User account"
                className="group relative w-8 h-8 rounded-full bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] flex items-center justify-center overflow-hidden shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer ring-1 ring-white/10 hover:ring-white/30"
              >
                {/* Silhouette avatar matching the screenshot */}
                <svg
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-5 h-5 translate-y-0.5 select-none"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 4a4 4 0 100 8 4 4 0 000-8zm-6.5 14a6.5 6.5 0 0113 0H5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Profile Dropdown if logged in */}
              <AnimatePresence>
                {profileDropdownOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 rounded-xl bg-zinc-950 border border-zinc-800 p-3 shadow-2xl z-50 text-left"
                  >
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-zinc-800/80">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#38bdf8] to-[#0284c7] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 translate-y-0.5">
                          <path
                            fillRule="evenodd"
                            d="M12 4a4 4 0 100 8 4 4 0 000-8zm-6.5 14a6.5 6.5 0 0113 0H5.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Staff & Admin links inside dropdown - strictly for verified Admin sessions */}
                    {isAdminSession && (
                      <div className="py-2 border-b border-zinc-800/80 space-y-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            if (onOpenStaffPortal) onOpenStaffPortal();
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-400 hover:text-white hover:bg-sky-950/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Headphones className="w-3.5 h-3.5" />
                            <span>Staff Dashboard</span>
                          </div>
                          {unreadStaffTicketsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-sky-500 text-black font-bold">
                              {unreadStaffTicketsCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            if (onOpenAdminPanel) onOpenAdminPanel();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-white hover:bg-amber-950/40 transition-colors cursor-pointer"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin Panel</span>
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center justify-start gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              className="md:hidden p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 transition-colors focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[270px] bg-black border-l border-zinc-800 flex flex-col justify-between p-6 z-50 shadow-2xl"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-800 flex items-center justify-center bg-zinc-900 shrink-0">
                      <img
                        src={ghostLogo}
                        alt="Fiveware.cc Ghost Logo"
                        onError={(e) => {
                          e.currentTarget.src = '/fiveware-ghost.png';
                        }}
                        className="w-full h-full object-cover select-none transform-gpu transition-transform duration-700 ease-in-out hover:rotate-[360deg]"
                      />
                    </div>
                    <span className="text-base font-bold font-display text-white">Fiveware.cc</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close"
                    className="p-1 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Nav Items */}
                <nav className="flex flex-col gap-1.5 mt-5">
                  {visibleTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleSelectTab(tab.id)}
                        className={cn(
                          'flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-left text-sm font-medium transition-colors cursor-pointer',
                          isActive
                            ? 'bg-zinc-900 text-[#ff2b2b] font-semibold'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                        )}
                      >
                        <span>{tab.label}</span>
                        <ChevronRight
                          className={cn(
                            'w-4 h-4',
                            isActive ? 'text-[#ff2b2b]' : 'text-zinc-600'
                          )}
                        />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                {isAdminSession && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenStaffPortal) onOpenStaffPortal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-sky-400 bg-sky-950/40 border border-sky-500/30 hover:border-sky-500/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4" />
                      <span>Staff Dashboard</span>
                    </div>
                    {unreadStaffTicketsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-sky-500 text-black font-bold">
                        {unreadStaffTicketsCount}
                      </span>
                    )}
                  </button>
                )}

                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#38bdf8] to-[#0284c7] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 translate-y-0.5">
                          <path
                            fillRule="evenodd"
                            d="M12 4a4 4 0 100 8 4 4 0 000-8zm-6.5 14a6.5 6.5 0 0113 0H5.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onActionClick) onActionClick();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                  >
                    <span>Sign In</span>
                    <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                )}

                <p className="text-[11px] text-center text-zinc-500 font-mono">
                  Fiveware.cc © 2026
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
