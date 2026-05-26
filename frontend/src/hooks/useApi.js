import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Em dev usa /api com proxy. Em prod usa a URL do Render
const isDev = import.meta.env.DEV;
const API_BASE = isDev
 ? '/api'
  : `https://${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export function useApi(endpoint, deps = [], pollInterval = 10000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      // endpoint já vem tipo '/price/0x...' sem o /api
      const res = await api.get(endpoint);
      if (mounted.current) {
        setData(res.data.data || res.data);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err.response?.data?.error || err.message);
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
  }, [fetchData, pollInterval,...deps]); // add pollInterval nas deps

  return { data, loading, error, refetch: fetchData };
}

export default api;
