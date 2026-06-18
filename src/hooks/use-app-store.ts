import { useContext } from 'react';

import { AppStoreContext } from '@/state/app-store';

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error('useAppStore must be used inside AppStoreProvider');
  }
  return store;
}
