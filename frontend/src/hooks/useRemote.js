import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';

export function useRemote(loader, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try { const response = await loader(); setState({ data: response.data.data, loading: false, error: '' }); }
    catch (error) { setState({ data: null, loading: false, error: getErrorMessage(error) }); }
  }, dependencies);
  useEffect(() => { load(); const refresh = () => load(); window.addEventListener('operations:refresh', refresh); return () => window.removeEventListener('operations:refresh', refresh); }, [load]);
  return { ...state, reload: load };
}
