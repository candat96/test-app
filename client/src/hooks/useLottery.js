import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useLottery() {
  const [latestResult, setLatestResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLatest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getLatest();
      if (response.data.success) {
        setLatestResult(response.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (days = 30) => {
    try {
      setLoading(true);
      const response = await api.getHistory(days);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async (days = 30) => {
    try {
      setLoading(true);
      const response = await api.getStatistics(days);
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateResult = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.updateLatest();
      if (response.data.success) {
        setLatestResult(response.data.data);
        await fetchHistory();
      }
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  const importSample = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.importSample();
      if (response.data.success) {
        await fetchHistory();
        await fetchStatistics();
      }
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory, fetchStatistics]);

  return {
    latestResult,
    history,
    statistics,
    loading,
    error,
    fetchLatest,
    fetchHistory,
    fetchStatistics,
    updateResult,
    importSample
  };
}

export function useAIAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await api.getAIProviders();
      if (response.data.success) {
        setProviders(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  }, []);

  const analyze = useCallback(async (days = 30, provider = 'anthropic') => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAIAnalysis(days, provider);
      if (response.data.success) {
        setAnalysis(response.data.data);
      }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async (modelKey) => {
    try {
      await api.clearPredictionCache(modelKey);
      await fetchProviders();
    } catch (err) {
      console.error('Failed to clear cache:', err);
      throw err;
    }
  }, [fetchProviders]);

  const clearAllAndReanalyze = useCallback(async (days = 30, provider = 'anthropic') => {
    try {
      setLoading(true);
      setError(null);
      // Clear tất cả cache
      await api.clearPredictionCache(null);
      // Dự đoán lại
      const response = await api.getAIAnalysis(days, provider);
      if (response.data.success) {
        setAnalysis(response.data.data);
      }
      await fetchProviders();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProviders]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    analysis,
    providers,
    loading,
    error,
    analyze,
    fetchProviders,
    clearCache,
    clearAllAndReanalyze
  };
}
