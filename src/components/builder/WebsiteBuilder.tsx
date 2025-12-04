import { useCallback } from 'react';
import { PromptPanel } from './PromptPanel';
import { PreviewPanel } from './PreviewPanel';
import { useBuilderState } from '@/hooks/useBuilderState';
import { useToast } from '@/hooks/use-toast';
import { GEMINI_MODEL, systemPrompt } from '@/constants/constants';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export function WebsiteBuilder() {
  const {
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
  } = useBuilderState();

  const { toast } = useToast();

  const extractHtmlFromResponse = (text: string): string => {
    // Remove markdown code blocks if present
    let cleanedText = text.trim();

    // Handle ```html ... ``` format
    const htmlBlockMatch = cleanedText.match(/```html\s*([\s\S]*?)```/);
    if (htmlBlockMatch) {
      cleanedText = htmlBlockMatch[1].trim();
    }

    // Handle ``` ... ``` format
    const codeBlockMatch = cleanedText.match(/```\s*([\s\S]*?)```/);
    if (codeBlockMatch && !htmlBlockMatch) {
      cleanedText = codeBlockMatch[1].trim();
    }

    // Find the HTML document
    const doctypeIndex = cleanedText.toLowerCase().indexOf('<!doctype');
    if (doctypeIndex !== -1) {
      cleanedText = cleanedText.substring(doctypeIndex);
    }

    // Find closing html tag
    const closingHtmlIndex = cleanedText.toLowerCase().lastIndexOf('</html>');
    if (closingHtmlIndex !== -1) {
      cleanedText = cleanedText.substring(0, closingHtmlIndex + 7);
    }

    return cleanedText;
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    if (!GEMINI_API_KEY) {
      toast({
        title: "Configuration Error",
        description: "VITE_GEMINI_API_KEY is not configured in environment variables",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    let generatedCode = '';

    try {
      const userMessage = history.length > 0 && code
        ? `Current website code:\n\`\`\`html\n${code}\n\`\`\`\n\nUser refinement request: ${prompt}\n\nUpdate the website based on the request. Output the complete updated HTML.`
        : `Create a website: ${prompt}`;

      console.log('🚀 Starting generation with prompt:', prompt);
      console.log('📝 User message:', userMessage.substring(0, 200) + '...');
      console.log('🔑 API Key present:', !!GEMINI_API_KEY, 'Length:', GEMINI_API_KEY?.length);
      console.log('🤖 Using model:', GEMINI_MODEL);


      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt + "\n\n" + userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (response.status === 402) {
          throw new Error("Usage limit reached. Please add credits to continue.");
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          console.error('API Error 400:', errorData);
          throw new Error(`Bad request: ${errorData?.error?.message || 'Invalid request format'}`);
        }
        if (response.status === 403) {
          throw new Error("API key is invalid or doesn't have permission. Please check your VITE_GEMINI_API_KEY.");
        }
        const errorText = await response.text().catch(() => '');
        console.error('API Error:', response.status, errorText);
        throw new Error(`Request failed (${response.status}): ${errorText || 'Unknown error'}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Gemini streaming returns JSON objects, sometimes wrapped in arrays
        // Try to extract complete JSON objects from the buffer
        let startIdx = 0;
        while (startIdx < buffer.length) {
          // Find the start of a JSON object
          const objStart = buffer.indexOf('{', startIdx);
          if (objStart === -1) break;

          // Try to find a complete JSON object
          let braceCount = 0;
          let objEnd = -1;
          for (let i = objStart; i < buffer.length; i++) {
            if (buffer[i] === '{') braceCount++;
            if (buffer[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                objEnd = i + 1;
                break;
              }
            }
          }

          // If we found a complete object, parse it
          if (objEnd !== -1) {
            const jsonStr = buffer.slice(objStart, objEnd);
            try {
              const parsed = JSON.parse(jsonStr);

              // Gemini API response format
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                generatedCode += content;

                // Stream updates to editor in real-time
                const streamCode = extractHtmlFromResponse(generatedCode);
                if (streamCode.includes('<!DOCTYPE') || streamCode.includes('<!doctype') || streamCode.includes('<html')) {
                  setCode(streamCode);
                  setViewMode('editor'); // Switch to editor to see streaming
                }
              }
            } catch (e) {
              // Silently skip invalid JSON
            }
            startIdx = objEnd;
          } else {
            // No complete object found, keep the remaining buffer
            buffer = buffer.slice(objStart);
            break;
          }
        }

        // Clear processed data from buffer
        if (startIdx > 0 && startIdx < buffer.length) {
          buffer = buffer.slice(startIdx);
        } else if (startIdx >= buffer.length) {
          buffer = '';
        }
      }

      // Clean and extract HTML
      console.log('📦 Raw generated code length:', generatedCode.length);
      console.log('📦 Raw generated code preview:', generatedCode.substring(0, 500));

      const finalCode = extractHtmlFromResponse(generatedCode);

      console.log('✨ Extracted code length:', finalCode.length);
      console.log('✨ Extracted code preview:', finalCode.substring(0, 500));
      console.log('✅ Has DOCTYPE:', finalCode.includes('<!DOCTYPE') || finalCode.includes('<!doctype'));
      console.log('✅ Has <html>:', finalCode.includes('<html'));

      if (finalCode.includes('<!DOCTYPE') || finalCode.includes('<!doctype') || finalCode.includes('<html')) {
        setCode(finalCode);
        addToHistory(prompt.trim(), finalCode);
        setViewMode('editor'); // Show in editor mode for iterative improvements
        toast({
          title: "Website generated!",
          description: "Code is ready in the editor. Switch to Preview to see it live.",
        });
        // Keep prompt in input for iterative refinement - don't clear it
      } else {
        console.error('❌ Validation failed. Generated code:', generatedCode);
        console.error('❌ Extracted code:', finalCode);
        throw new Error('Generated content does not appear to be valid HTML');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, code, history.length, isGenerating, setCode, addToHistory, setIsGenerating, setViewMode, toast]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Panel - Prompt */}
      <aside className="w-[360px] min-w-[320px] max-w-[420px] border-r border-border flex-shrink-0">
        <PromptPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          history={history}
          onLoadFromHistory={loadFromHistory}
          onClearHistory={clearHistory}
        />
      </aside>

      {/* Right Panel - Preview/Editor */}
      <main className="flex-1 min-w-0">
        <PreviewPanel
          code={code}
          onCodeChange={setCode}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isGenerating={isGenerating}
        />
      </main>
    </div>
  );
}