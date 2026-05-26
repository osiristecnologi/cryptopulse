import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export function useApi(endpoint, deps = [], pollInterval = 10000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(endpoint);
      if (mounted.current) {
        setData(res.data.data || res.data);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [endpoint]);

  useEffect(() => {
    mounted.current = true;
    fetchData();

    const interval = setInterval(fetchData, pollInterval);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
}

export default api;
