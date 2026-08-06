import { create } from 'zustand';

interface UiState {
  isDiscoveryActive: boolean;
  activeScreen: string;
  setDiscoveryActive: (active: boolean) => void;
  setActiveScreen: (screen: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDiscoveryActive: false,
  activeScreen: 'Home',
  setDiscoveryActive: (active) => set({ isDiscoveryActive: active }),
  setActiveScreen: (screen) => set({ activeScreen: screen }),
}));
