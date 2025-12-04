export interface PromptHistoryItem {
  id: string;
  prompt: string;
  code: string;
  timestamp: number;
}

export type ViewMode = 'preview' | 'editor';

export interface BuilderState {
  code: string;
  prompt: string;
  history: PromptHistoryItem[];
  viewMode: ViewMode;
  isGenerating: boolean;
}
