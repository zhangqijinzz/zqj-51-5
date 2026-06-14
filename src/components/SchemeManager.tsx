import { useState, useEffect, useCallback } from 'react';
import { X, Save, FolderOpen, Trash2, Edit3, Check, AlertTriangle, Plus, Clock, Tag } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Scheme } from '@/types';

interface SchemeManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function SchemeManager({ open, onClose }: SchemeManagerProps) {
  const {
    currentSchemeId,
    currentSchemeName,
    isDirty,
    saveScheme,
    loadScheme,
    deleteScheme,
    renameScheme,
    updateCurrentScheme,
    getSchemeList,
  } = useAppStore();

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);

  const refreshSchemes = useCallback(() => {
    setSchemes(getSchemeList());
  }, [getSchemeList]);

  useEffect(() => {
    if (open) {
      refreshSchemes();
      setSaveName(currentSchemeName);
      setShowSaveDialog(false);
      setEditingId(null);
      setPendingLoadId(null);
    }
  }, [open, currentSchemeName, refreshSchemes]);

  const handleSave = () => {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    saveScheme(trimmed);
    refreshSchemes();
    setShowSaveDialog(false);
  };

  const handleOverwriteSave = () => {
    if (!currentSchemeId) return;
    updateCurrentScheme();
    refreshSchemes();
  };

  const handleLoad = (id: string) => {
    if (isDirty) {
      setPendingLoadId(id);
      return;
    }
    executeLoad(id);
  };

  const executeLoad = (id: string) => {
    loadScheme(id);
    setPendingLoadId(null);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个方案吗？删除后无法恢复。')) {
      deleteScheme(id);
      refreshSchemes();
    }
  };

  const handleRename = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    renameScheme(id, trimmed);
    setEditingId(null);
    refreshSchemes();
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hour}:${min}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">方案管理</h2>
              <p className="text-xs text-gray-500">保存、切换和对比不同经营方案</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/80 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">当前方案：</span>
            <span className="text-sm font-bold text-gray-800">{currentSchemeName}</span>
            {isDirty && (
              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                未保存
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            {currentSchemeId && isDirty ? (
              <button
                onClick={handleOverwriteSave}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                覆盖保存
              </button>
            ) : null}
            <button
              onClick={() => {
                setShowSaveDialog(true);
                setSaveName(currentSchemeId ? `${currentSchemeName} - 副本` : '我的方案');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg text-xs font-medium hover:shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              另存为新方案
            </button>
          </div>

          {showSaveDialog && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="输入方案名称..."
                autoFocus
                className="flex-1 px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
              />
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                保存
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                取消
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {schemes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">还没有保存过方案</p>
              <p className="text-gray-400 text-xs mt-1">点击「另存为新方案」保存当前经营方案</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schemes
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((scheme) => {
                  const isCurrent = scheme.id === currentSchemeId;
                  const isEditing = editingId === scheme.id;

                  return (
                    <div
                      key={scheme.id}
                      className={`rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-orange-300 bg-orange-50/60 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleRename(scheme.id)}
                                  onBlur={() => setEditingId(null)}
                                  autoFocus
                                  className="flex-1 px-2 py-1 text-sm border border-orange-300 rounded focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                />
                                <button
                                  onClick={() => handleRename(scheme.id)}
                                  className="p-1 text-green-600 hover:text-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-800 truncate">
                                  {scheme.name}
                                </h4>
                                {isCurrent && (
                                  <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                    当前
                                  </span>
                                )}
                                {scheme.version < 2 && (
                                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full shrink-0">
                                    v{scheme.version}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(scheme.updatedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {scheme.data.stallItems.length}物品 · {scheme.data.discountRules.length}折扣
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!isCurrent && (
                              <button
                                onClick={() => handleLoad(scheme.id)}
                                className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                              >
                                加载
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingId(scheme.id);
                                setEditingName(scheme.name);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(scheme.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {pendingLoadId && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="bg-white rounded-xl shadow-2xl p-6 mx-4 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">未保存的修改</h3>
                  <p className="text-xs text-gray-500">当前方案有未保存的更改</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                切换方案将丢失当前未保存的修改，是否继续？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingLoadId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (currentSchemeId) {
                      updateCurrentScheme();
                    } else {
                      saveScheme(currentSchemeName);
                    }
                    executeLoad(pendingLoadId);
                  }}
                  className="flex-1 px-4 py-2.5 bg-orange-100 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                >
                  保存并切换
                </button>
                <button
                  onClick={() => executeLoad(pendingLoadId)}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  不保存切换
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
