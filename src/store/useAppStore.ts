import { create } from 'zustand';
import type { AppState, StallItem, Product, DiscountRule, Scene, SimulationResult, ActiveTab, Scheme, SchemeData } from '@/types';
import { SCHEME_DATA_VERSION } from '@/types';
import { defaultProducts } from '@/data/products';
import { defaultDiscountRules, defaultStallItems } from '@/data/materials';
import { scenes } from '@/data/scenes';

const STORAGE_KEY = 'stall-simulator-state';
const SCHEMES_KEY = 'stall-simulator-schemes';
const SNAPSHOT_KEY = 'stall-simulator-snapshot';

function hashContent(obj: unknown): string {
  const str = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h = ((h << 5) - h) + ch;
    h |= 0;
  }
  return h.toString(36);
}

function calculateSnapshotHash(state: {
  stallItems: StallItem[];
  products: Product[];
  discountRules: DiscountRule[];
  selectedSceneId: string | undefined;
  simulationHours: number;
}): string {
  return hashContent([
    state.stallItems,
    state.products,
    state.discountRules,
    state.selectedSceneId,
    state.simulationHours,
  ]);
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const state = data.state || data;
    const scene = scenes.find((s) => s.id === state.selectedSceneId) || scenes[0];

    const currentHash = calculateSnapshotHash({
      stallItems: state.stallItems || defaultStallItems,
      products: state.products || defaultProducts,
      discountRules: state.discountRules || defaultDiscountRules,
      selectedSceneId: state.selectedSceneId,
      simulationHours: state.simulationHours ?? 4,
    });

    const savedSnapshot = localStorage.getItem(SNAPSHOT_KEY);
    const hasUnsavedChanges = savedSnapshot
      ? currentHash !== savedSnapshot
      : !!state.isDirty;

    return {
      stallItems: state.stallItems || defaultStallItems,
      products: state.products || defaultProducts,
      discountRules: state.discountRules || defaultDiscountRules,
      selectedScene: scene,
      simulationHours: state.simulationHours ?? 4,
      currentSchemeId: state.currentSchemeId || null,
      currentSchemeName: state.currentSchemeName || '未命名方案',
      isDirty: hasUnsavedChanges,
    };
  } catch (e) {
    console.error('Failed to load persisted state', e);
    return null;
  }
}

function loadSchemesFromStorage(): Scheme[] {
  try {
    const raw = localStorage.getItem(SCHEMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load schemes', e);
    return [];
  }
}

function saveSchemesToStorage(schemes: Scheme[]) {
  try {
    localStorage.setItem(SCHEMES_KEY, JSON.stringify(schemes));
  } catch (e) {
    console.error('Failed to save schemes', e);
  }
}

function migrateSchemeData(scheme: Scheme): Scheme {
  if (scheme.version >= SCHEME_DATA_VERSION) return scheme;

  const data = { ...scheme.data };

  if (!scheme.version || scheme.version < 2) {
    data.stallItems = data.stallItems || [];
    data.products = data.products || defaultProducts;
    data.discountRules = data.discountRules || defaultDiscountRules;
    data.selectedSceneId = data.selectedSceneId || scenes[0].id;
    data.simulationHours = data.simulationHours ?? 4;
  }

  return {
    ...scheme,
    version: SCHEME_DATA_VERSION,
    data,
  };
}

const persisted = loadPersistedState();

let saveTimeout: number | null = null;

function debouncedSave(state: AppState) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = window.setTimeout(() => {
    const data = {
      stallItems: state.stallItems,
      products: state.products,
      discountRules: state.discountRules,
      selectedSceneId: state.selectedScene?.id,
      simulationHours: state.simulationHours,
      currentSchemeId: state.currentSchemeId,
      currentSchemeName: state.currentSchemeName,
      isDirty: state.isDirty,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: data,
        timestamp: Date.now(),
        version: SCHEME_DATA_VERSION,
      })
    );
  }, 100);
}

function generateId() {
  return `scheme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useAppStore = create<AppState>()((set, get) => ({
  activeTab: 'setup',
  stallItems: persisted?.stallItems || defaultStallItems,
  products: persisted?.products || defaultProducts,
  discountRules: persisted?.discountRules || defaultDiscountRules,
  selectedScene: persisted?.selectedScene || scenes[0],
  simulationResults: [],
  isSimulating: false,
  simulationHours: persisted?.simulationHours ?? 4,
  selectedItemId: null,
  currentSchemeId: persisted?.currentSchemeId || null,
  currentSchemeName: persisted?.currentSchemeName || '未命名方案',
  isDirty: persisted?.isDirty ?? false,

  setActiveTab: (tab: ActiveTab) => set({ activeTab: tab }),
  setSelectedItemId: (id: string | null) => set({ selectedItemId: id }),

  addStallItem: (item: StallItem) =>
    set((state) => ({
      stallItems: [...state.stallItems, item],
      selectedItemId: item.id,
      isDirty: true,
    })),

  updateStallItem: (id: string, updates: Partial<StallItem>) =>
    set((state) => ({
      stallItems: state.stallItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
      isDirty: true,
    })),

  removeStallItem: (id: string) =>
    set((state) => ({
      stallItems: state.stallItems.filter((item) => item.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
      isDirty: true,
    })),

  clearStallItems: () => set({ stallItems: [], selectedItemId: null, isDirty: true }),

  updateProduct: (id: string, updates: Partial<Product>) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      isDirty: true,
    })),

  addDiscountRule: (rule: DiscountRule) =>
    set((state) => ({
      discountRules: [...state.discountRules, rule],
      isDirty: true,
    })),

  updateDiscountRule: (id: string, updates: Partial<DiscountRule>) =>
    set((state) => ({
      discountRules: state.discountRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
      isDirty: true,
    })),

  removeDiscountRule: (id: string) =>
    set((state) => ({
      discountRules: state.discountRules.filter((r) => r.id !== id),
      isDirty: true,
    })),

  setSelectedScene: (scene: Scene | null) => set({ selectedScene: scene, isDirty: true }),

  setSimulationHours: (hours: number) => set({ simulationHours: hours, isDirty: true }),

  setSimulating: (val: boolean) => set({ isSimulating: val }),

  addSimulationResult: (result: SimulationResult) =>
    set((state) => ({
      simulationResults: [...state.simulationResults, result],
    })),

  clearSimulationResults: () => set({ simulationResults: [] }),

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SNAPSHOT_KEY);
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    set({
      stallItems: defaultStallItems,
      products: defaultProducts,
      discountRules: defaultDiscountRules,
      selectedScene: scenes[0],
      simulationResults: [],
      isSimulating: false,
      simulationHours: 4,
      selectedItemId: null,
      activeTab: 'setup',
      currentSchemeId: null,
      currentSchemeName: '未命名方案',
      isDirty: false,
    });
  },

  saveToLocalStorage: () => {
    const state = get();
    const data = {
      stallItems: state.stallItems,
      products: state.products,
      discountRules: state.discountRules,
      selectedSceneId: state.selectedScene?.id,
      simulationHours: state.simulationHours,
      currentSchemeId: state.currentSchemeId,
      currentSchemeName: state.currentSchemeName,
      isDirty: state.isDirty,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: data,
        timestamp: Date.now(),
        version: SCHEME_DATA_VERSION,
      })
    );
  },

  loadFromLocalStorage: () => {
    const loaded = loadPersistedState();
    if (loaded) {
      set(loaded);
    }
  },

  saveScheme: (name: string) => {
    const state = get();
    const now = Date.now();
    const schemeData: SchemeData = {
      stallItems: state.stallItems,
      products: state.products,
      discountRules: state.discountRules,
      selectedSceneId: state.selectedScene?.id || scenes[0].id,
      simulationHours: state.simulationHours,
    };

    const schemes = loadSchemesFromStorage();
    const existingIdx = state.currentSchemeId
      ? schemes.findIndex((s) => s.id === state.currentSchemeId)
      : -1;

    let schemeId: string;

    if (existingIdx >= 0 && name === schemes[existingIdx].name) {
      schemes[existingIdx] = {
        ...schemes[existingIdx],
        updatedAt: now,
        version: SCHEME_DATA_VERSION,
        data: schemeData,
      };
      schemeId = schemes[existingIdx].id;
    } else {
      schemeId = generateId();
      const newScheme: Scheme = {
        id: schemeId,
        name,
        createdAt: now,
        updatedAt: now,
        version: SCHEME_DATA_VERSION,
        data: schemeData,
      };
      schemes.push(newScheme);
    }

    saveSchemesToStorage(schemes);
    const snapshotHash = calculateSnapshotHash({
      stallItems: state.stallItems,
      products: state.products,
      discountRules: state.discountRules,
      selectedSceneId: state.selectedScene?.id,
      simulationHours: state.simulationHours,
    });
    localStorage.setItem(SNAPSHOT_KEY, snapshotHash);
    set({ currentSchemeId: schemeId, currentSchemeName: name, isDirty: false });
    return schemeId;
  },

  loadScheme: (id: string) => {
    const schemes = loadSchemesFromStorage();
    const scheme = schemes.find((s) => s.id === id);
    if (!scheme) return;

    const migrated = migrateSchemeData(scheme);
    const scene = scenes.find((s) => s.id === migrated.data.selectedSceneId) || scenes[0];

    const snapshotHash = calculateSnapshotHash({
      stallItems: migrated.data.stallItems,
      products: migrated.data.products,
      discountRules: migrated.data.discountRules,
      selectedSceneId: migrated.data.selectedSceneId,
      simulationHours: migrated.data.simulationHours,
    });
    localStorage.setItem(SNAPSHOT_KEY, snapshotHash);

    set({
      stallItems: migrated.data.stallItems,
      products: migrated.data.products,
      discountRules: migrated.data.discountRules,
      selectedScene: scene,
      simulationHours: migrated.data.simulationHours,
      currentSchemeId: migrated.id,
      currentSchemeName: migrated.name,
      isDirty: false,
      simulationResults: [],
      isSimulating: false,
      selectedItemId: null,
      activeTab: 'setup',
    });

    if (migrated.version !== scheme.version) {
      const idx = schemes.findIndex((s) => s.id === id);
      if (idx >= 0) {
        schemes[idx] = migrated;
        saveSchemesToStorage(schemes);
      }
    }
  },

  deleteScheme: (id: string) => {
    const schemes = loadSchemesFromStorage();
    const filtered = schemes.filter((s) => s.id !== id);
    saveSchemesToStorage(filtered);

    const state = get();
    if (state.currentSchemeId === id) {
      localStorage.removeItem(SNAPSHOT_KEY);
      set({ currentSchemeId: null, currentSchemeName: '未命名方案', isDirty: false });
    }
  },

  renameScheme: (id: string, name: string) => {
    const schemes = loadSchemesFromStorage();
    const idx = schemes.findIndex((s) => s.id === id);
    if (idx >= 0) {
      schemes[idx] = { ...schemes[idx], name, updatedAt: Date.now() };
      saveSchemesToStorage(schemes);
    }

    const state = get();
    if (state.currentSchemeId === id) {
      set({ currentSchemeName: name });
    }
  },

  updateCurrentScheme: () => {
    const state = get();
    if (!state.currentSchemeId) return;

    const schemes = loadSchemesFromStorage();
    const idx = schemes.findIndex((s) => s.id === state.currentSchemeId);
    if (idx < 0) return;

    const schemeData: SchemeData = {
      stallItems: state.stallItems,
      products: state.products,
      discountRules: state.discountRules,
      selectedSceneId: state.selectedScene?.id || scenes[0].id,
      simulationHours: state.simulationHours,
    };

    schemes[idx] = {
      ...schemes[idx],
      updatedAt: Date.now(),
      version: SCHEME_DATA_VERSION,
      data: schemeData,
    };

    saveSchemesToStorage(schemes);

    const snapshotHash = calculateSnapshotHash({
      stallItems: state.stallItems,
      products: state.products,
      discountRules: state.discountRules,
      selectedSceneId: state.selectedScene?.id,
      simulationHours: state.simulationHours,
    });
    localStorage.setItem(SNAPSHOT_KEY, snapshotHash);
    set({ isDirty: false });
  },

  getSchemeList: () => {
    return loadSchemesFromStorage().map(migrateSchemeData);
  },

  markDirty: () => set({ isDirty: true }),

  markClean: () => {
    const state = get();
    const snapshotHash = calculateSnapshotHash({
      stallItems: state.stallItems,
      products: state.products,
      discountRules: state.discountRules,
      selectedSceneId: state.selectedScene?.id,
      simulationHours: state.simulationHours,
    });
    localStorage.setItem(SNAPSHOT_KEY, snapshotHash);
    set({ isDirty: false });
  },
}));

useAppStore.subscribe((state) => {
  debouncedSave(state);
});

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const state = useAppStore.getState();
    const data = {
      stallItems: state.stallItems,
      products: state.products,
      discountRules: state.discountRules,
      selectedSceneId: state.selectedScene?.id,
      simulationHours: state.simulationHours,
      currentSchemeId: state.currentSchemeId,
      currentSchemeName: state.currentSchemeName,
      isDirty: state.isDirty,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: data,
        timestamp: Date.now(),
        version: SCHEME_DATA_VERSION,
      })
    );
  });
}
