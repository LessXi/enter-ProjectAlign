import { create } from 'zustand';
import type { Role } from '@/types/inventory';

interface RoleState {
  currentRole: Role;
  setRole: (role: Role) => void;
}

export const useInventoryStore = create<RoleState>((set) => ({
  currentRole: 'boss',
  setRole: (role) => set({ currentRole: role }),
}));
