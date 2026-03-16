import { create } from 'zustand';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  status: string;
  coverImage?: string;
  notes?: string;
}

interface AppState {
  // Current trip
  currentTrip: Trip | null;
  setCurrentTrip: (trip: Trip | null) => void;

  // Trips list
  trips: Trip[];
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // AI Assistant
  aiPanelOpen: boolean;
  toggleAIPanel: () => void;
  aiMessages: AIMessage[];
  addAIMessage: (message: AIMessage) => void;
  clearAIMessages: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Active section for trip details
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useAppStore = create<AppState>((set) => ({
  // Current trip
  currentTrip: null,
  setCurrentTrip: (trip) => set({ currentTrip: trip }),

  // Trips list
  trips: [],
  setTrips: (trips) => set({ trips }),
  addTrip: (trip) => set((state) => ({ trips: [...state.trips, trip] })),
  updateTrip: (id, updates) =>
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      currentTrip:
        state.currentTrip?.id === id
          ? { ...state.currentTrip, ...updates }
          : state.currentTrip,
    })),
  deleteTrip: (id) =>
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
    })),

  // UI State
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // AI Assistant
  aiPanelOpen: false,
  toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  aiMessages: [],
  addAIMessage: (message) =>
    set((state) => ({ aiMessages: [...state.aiMessages, message] })),
  clearAIMessages: () => set({ aiMessages: [] }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Active section
  activeSection: 'overview',
  setActiveSection: (section) => set({ activeSection: section }),
}));
