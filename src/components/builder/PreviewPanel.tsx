import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Eye, Code2, Download, Check, Copy, ExternalLink } from 'lucide-react';
import type { ViewMode } from '@/types/builder';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';

interface PreviewPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isGenerating: boolean;
}

export function PreviewPanel({
  code,
  onCodeChange,
  viewMode,
  onViewModeChange,
  isGenerating,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editorCode, setEditorCode] = useState(code);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Update iframe when code changes
  useEffect(() => {
    if (iframeRef.current && viewMode === 'preview') {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [code, viewMode]);

  // Sync editor code with main code
  useEffect(() => {
    setEditorCode(code);
    setHasChanges(false);
  }, [code]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorCode(value);
      setHasChanges(value !== code);
    }
  };

  const applyChanges = () => {
    onCodeChange(editorCode);
    setHasChanges(false);
    toast({
      title: "Changes applied",
      description: "Your code changes have been applied to the preview.",
    });
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    zip.file('index.html', code);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'website.zip');

    toast({
      title: "Download started",
      description: "Your website has been downloaded as a ZIP file.",
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "HTML code copied to clipboard.",
    });
  };

  const openInNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(code);
      newWindow.document.close();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="toggle-group">
            <button
              onClick={() => onViewModeChange('preview')}
              className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => onViewModeChange('editor')}
              className={`toggle-btn ${viewMode === 'editor' ? 'active' : ''}`}
            >
              <Code2 className="w-4 h-4" />
              Code
            </button>
          </div>

          {/* Apply Changes Button */}
          {viewMode === 'editor' && hasChanges && (
            <button
              onClick={applyChanges}
              className="btn-primary"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            >
              <Check className="w-4 h-4" />
              Apply
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="action-btn"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={openInNewTab}
            className="action-btn"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="action-btn"
            title="Download as ZIP"
            style={{ width: 'auto', paddingLeft: '10px', paddingRight: '10px', gap: '6px', display: 'flex' }}
          >
            <Download className="w-4 h-4" />
            <span className="text-xs font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {/* Progress bar for generation */}
        {isGenerating && <div className="progress-bar" />}

        {viewMode === 'preview' ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full bg-white"
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={editorCode}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'SF Mono', 'Fira Code', 'Monaco', monospace",
                padding: { top: 16, bottom: 16 },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: 'on',
                renderWhitespace: 'none',
                bracketPairColorization: { enabled: true },
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
