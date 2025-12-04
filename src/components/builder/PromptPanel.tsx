import { useState } from 'react';
import { Sparkles, Trash2, Clock, ChevronDown } from 'lucide-react';
import type { PromptHistoryItem } from '@/types/builder';

interface PromptPanelProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  history: PromptHistoryItem[];
  onLoadFromHistory: (item: PromptHistoryItem) => void;
  onClearHistory: () => void;
}

export function PromptPanel({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  history,
  onLoadFromHistory,
  onClearHistory,
}: PromptPanelProps) {
  const [showHistory, setShowHistory] = useState(true);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onGenerate();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-3">
          <div className="brand-icon">
            <Sparkles />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Website Builder</h1>
            <p className="text-xs text-muted-foreground">AI-powered generation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`status-dot ${isGenerating ? 'generating' : ''}`} />
          <span className="text-xs text-muted-foreground">
            {isGenerating ? 'Generating' : ''}
          </span>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Prompt
          </label>
          {prompt && !isGenerating && (
            <button
              onClick={() => onPromptChange('')}
              className="text-xs text-muted-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the website you want to create..."
          className="prompt-textarea"
          disabled={isGenerating}
        />

        <button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="btn-primary mt-3"
        >
          {isGenerating ? (
            <>
              <div className="spinner" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          <span className="kbd">⌘</span> + <span className="kbd">Enter</span> to generate
        </p>
      </div>

      {/* History Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="section-header"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5" />
            History
            {history.length > 0 && (
              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                {history.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${showHistory ? '' : '-rotate-90'}`}
          />
        </button>

        {showHistory && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {history.length > 0 && (
              <div className="px-4 pb-2">
                <button
                  onClick={onClearHistory}
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              </div>
            )}

            {/* Native scrollable div instead of Radix ScrollArea */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="empty-state">
                    No history yet. Generate your first website!
                  </p>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onLoadFromHistory(item)}
                      className="history-item"
                    >
                      <p className="text-sm text-foreground line-clamp-2 mb-1">
                        {item.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(item.timestamp)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
