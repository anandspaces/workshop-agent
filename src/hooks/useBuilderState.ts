import { useState, useEffect, useCallback } from 'react';
import type { PromptHistoryItem, ViewMode } from '@/types/builder';
import { STORAGE_KEYS, DEFAULT_CODE } from '@/constants/constants';

export function useBuilderState() {
  const [code, setCode] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CODE);
    return saved || DEFAULT_CODE;
  });

  const [history, setHistory] = useState<PromptHistoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return (saved as ViewMode) || 'preview';
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CODE, code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  const addToHistory = useCallback((promptText: string, generatedCode: string) => {
    const newItem: PromptHistoryItem = {
      id: crypto.randomUUID(),
      prompt: promptText,
      code: generatedCode,
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50 items
  }, []);

  const loadFromHistory = useCallback((item: PromptHistoryItem) => {
    setCode(item.code);
    setPrompt(item.prompt);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }, []);

  const resetCode = useCallback(() => {
    setCode(DEFAULT_CODE);
  }, []);

  return {
    code,
    setCode,
    history,
    addToHistory,
    loadFromHistory,
    clearHistory,
    viewMode,
    setViewMode,
    isGenerating,
    setIsGenerating,
    prompt,
    setPrompt,
    resetCode,
  };
}
