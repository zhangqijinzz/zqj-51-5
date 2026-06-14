import { useState } from 'react';
import { Store, RefreshCw, Save, Layout, Calculator, Users, BarChart3, FolderOpen, Circle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { ActiveTab } from '@/types';
import SchemeManager from './SchemeManager';

const tabs: { id: ActiveTab; label: string; icon: typeof Store }[] = [
  { id: 'setup', label: '摊位布置', icon: Layout },
  { id: 'pricing', label: '定价试算', icon: Calculator },
  { id: 'traffic', label: '客流脚本', icon: Users },
  { id: 'review', label: '复盘面板', icon: BarChart3 },
];

export default function TopNav() {
  const { activeTab, setActiveTab, resetAll, updateCurrentScheme, currentSchemeId, currentSchemeName, isDirty } = useAppStore();
  const [schemeManagerOpen, setSchemeManagerOpen] = useState(false);

  const handleSave = () => {
    if (currentSchemeId) {
      updateCurrentScheme();
    } else {
      setSchemeManagerOpen(true);
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？这将恢复为默认方案。')) {
      resetAll();
    }
  };

  return (
    <>
      <header className="relative bg-gradient-to-r from-[#1a1a2e] via-[#2d1b2e] to-[#1a1a2e] border-b border-orange-500/30">
        <div className="absolute bottom-0 left-0 right-0 h-[2px]">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-md shadow-green-400/50" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
                  摆摊试营业模拟器
                </h1>
                <p className="text-xs text-orange-300/70 mt-0.5">零成本试错，开启你的副业之旅</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full p-1.5 border border-white/10">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="text-xs text-gray-300 max-w-[120px] truncate">{currentSchemeName}</span>
                {isDirty && (
                  <Circle className="w-2 h-2 fill-orange-400 text-orange-400 shrink-0" />
                )}
              </div>

              <button
                onClick={() => setSchemeManagerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 text-sm"
              >
                <FolderOpen className="w-4 h-4" />
                方案列表
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/30 transition-all text-sm"
              >
                <Save className="w-4 h-4" />
                {currentSchemeId ? '保存' : '保存方案'}
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                重置
              </button>
            </div>
          </div>
        </div>
      </header>

      <SchemeManager
        open={schemeManagerOpen}
        onClose={() => setSchemeManagerOpen(false)}
      />
    </>
  );
}
