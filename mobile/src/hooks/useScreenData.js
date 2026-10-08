import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { errorDetail } from '../services/api';

export function useScreenData(load) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const [state, setState] = useState({ data: null, loading: true, error: '', refreshing: false });

  const run = useCallback(async (refreshing) => {
    setState((current) => ({
      ...current,
      loading: current.data == null,
      refreshing,
      error: '',
    }));
    try {
      const response = await loadRef.current();
      setState({ data: response.data, loading: false, error: '', refreshing: false });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: errorDetail(error, 'Could not load this screen.'),
      }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      run(false);
    }, [run]),
  );

  return { ...state, reload: () => run(true) };
}
