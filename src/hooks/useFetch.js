import { useState, useEffect, useRef, useCallback } from 'react';

export const AUTO_REFRESH_INTERVAL = 15_000;

export function useFetch(fetcher, deps = [], { interval } = {}) {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const intervalRef = useRef(null);
  const fetcherRef  = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    const controller = new AbortController();

    fetcherRef.current()
      .then(d => {
        if (controller.signal.aborted) return;
        setData(d);
        setLastUpdated(Date.now());
        if (!silent) setLoading(false);
      })
      .catch(e => {
        if (controller.signal.aborted) return;
        if (!silent) {
          setError(e.message || 'Failed to load data');
          setLoading(false);
        }
      });

    return controller;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = run(false);

    if (interval) {
      intervalRef.current = setInterval(() => run(true), interval);
    }

    return () => {
      controller.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, lastUpdated };
}
