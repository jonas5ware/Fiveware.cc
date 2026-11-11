import React from 'react';
import { NavTabId } from '../layout/Navbar';

interface HowToUseSectionProps {
  onNavigateTab?: (tab: NavTabId) => void;
}

interface SiteTabItem {
  id: NavTabId;
  name: string;
}

export const HowToUseSection: React.FC<HowToUseSectionProps> = ({ onNavigateTab }) => {
  const tabs: SiteTabItem[] = [
    { id: 'apps', name: 'Apps' },
    { id: 'support', name: 'Support' },
    { id: 'discord', name: 'Group' },
  ];

  const handleGoToTab = (tab: NavTabId) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section id="how-to-use" className="w-full max-w-[210px] mx-auto px-4 pt-2 pb-14 text-center">
      {/* Caixinha ultra limpa e minimalista */}
      <div className="w-full rounded-2xl bg-zinc-900/50 border border-zinc-800/70 p-1.5 backdrop-blur-md shadow-lg flex flex-col space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleGoToTab(tab.id)}
            className="w-full py-2.5 px-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 active:bg-zinc-800/70 font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer text-center select-none"
          >
            {tab.name}
          </button>
        ))}
      </div>
    </section>
  );
};
