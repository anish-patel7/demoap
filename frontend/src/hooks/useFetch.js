import { useState, useEffect, useRef } from 'react';
import { readJson } from '../api/client';

// Defaults to '/api' (proxied to the backend by Vite in dev). Set VITE_API_BASE_URL
// (e.g. https://my-backend.example.com/api) when the backend is hosted elsewhere.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export function useFetch(url, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Id of the most recent request; responses from superseded requests are
  // ignored so a slow earlier response can't overwrite newer data.
  const requestIdRef = useRef(0);

  const refetch = async () => {
    const requestId = ++requestIdRef.current;
    // Allow callers to pass either "/dashboard" or a full "/api/..." / absolute URL.
    if (url == null) {
      setLoading(false);
      return;
    }
    const requestUrl = /^https?:\/\//.test(url) || url.startsWith(API_BASE)
      ? url
      : `${API_BASE}${url}`;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await readJson(response);
      if (requestId === requestIdRef.current) setData(json);
    } catch (err) {
      if (requestId === requestIdRef.current) setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
}
