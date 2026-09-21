import React from 'react';
import { Plus } from 'lucide-react';
import { TabType } from '../types/finance';
import { NAV_GROUPS, getGroupForTab } from './Navbar';

interface MobileBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onQuickAdd: () => void;
}

// Thumb-reachable primary navigation for small screens.
// Mirrors the 4 desktop nav groups, with a raised quick-add button in the middle.
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onQuickAdd,
}) => {
  const activeGroup = getGroupForTab(activeTab);
  const leftGroups = NAV_GROUPS.slice(0, 2);
  const rightGroups = NAV_GROUPS.slice(2);

  const renderGroupButton = (group: (typeof NAV_GROUPS)[number]) => {
    const Icon = group.icon;
    const isActive = activeGroup.id === group.id;
    return (
      <button
        key={group.id}
        onClick={() => onSelectTab(group.tabs[0])}
        className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-semibold transition ${
          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Icon className="h-5 w-5" />
        {group.label}
      </button>
    );
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto max-w-md grid grid-cols-5 items-center px-2 py-1">
        {leftGroups.map(renderGroupButton)}

        <div className="flex items-center justify-center">
          <button
            onClick={onQuickAdd}
            aria-label="Quick add income or expense"
            className="flex h-12 w-12 -mt-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {rightGroups.map(renderGroupButton)}
      </div>
    </nav>
  );
};
