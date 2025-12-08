import { useCallback } from 'react';
import { PromptPanel } from './PromptPanel';
import { PreviewPanel } from './PreviewPanel';
import { useBuilderState } from '@/hooks/useBuilderState';
import { useToast } from '@/hooks/use-toast';
import { systemPrompt, HTML_HEAD_TEMPLATE } from '@/constants/constants';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const TEMPERATURE = 0.7;
const MAX_OUTPUT_TOKENS = 8192;
const GEMINI_MODEL = 'gemini-3-pro-preview';

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

  const validateAndCompleteBodyTags = (bodyContent: string): string => {
    let content = bodyContent.trim();

    // Check if body opening tag exists
    const hasOpeningTag = /<body[^>]*>/i.test(content);
    const hasClosingTag = /<\/body>/i.test(content);

    // Extract content between body tags if they exist
    let innerContent = content;
    if (hasOpeningTag && hasClosingTag) {
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        innerContent = bodyMatch[1];
      }
    } else if (hasOpeningTag && !hasClosingTag) {
      // Has opening but no closing - extract everything after opening tag
      const openMatch = content.match(/<body[^>]*>([\s\S]*)/i);
      if (openMatch) {
        innerContent = openMatch[1];
      }
    } else if (!hasOpeningTag && hasClosingTag) {
      // Has closing but no opening - extract everything before closing tag
      const closeMatch = content.match(/([\s\S]*)<\/body>/i);
      if (closeMatch) {
        innerContent = closeMatch[1];
      }
    }

    // Ensure Bootstrap JS bundle is included at the end
    const bootstrapScript = '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>';
    const hasBootstrapScript = innerContent.includes('bootstrap.bundle.min.js');

    if (!hasBootstrapScript) {
      innerContent = innerContent.trim() + '\n  ' + bootstrapScript;
    }

    // Wrap in proper body tags
    return `<body>\n  ${innerContent.trim()}\n</body>`;
  };

  const extractBodyFromResponse = (text: string): string => {
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

    // Find the body tag
    const bodyStart = cleanedText.toLowerCase().indexOf('<body');
    const bodyEnd = cleanedText.toLowerCase().lastIndexOf('</body>');

    let bodyContent = '';
    if (bodyStart !== -1 && bodyEnd !== -1) {
      // Extract body tag including opening and closing tags
      bodyContent = cleanedText.substring(bodyStart, bodyEnd + 7);
    } else if (bodyStart !== -1) {
      // Has opening tag but no closing - take everything from body start
      bodyContent = cleanedText.substring(bodyStart);
    } else {
      // No body tags found - treat entire content as body content
      bodyContent = cleanedText;
    }

    // Validate and complete the body tags
    return validateAndCompleteBodyTags(bodyContent);
  };

  const mergeBodyWithHead = (bodyContent: string): string => {
    // Combine the fixed head template with the generated body content
    return `${HTML_HEAD_TEMPLATE}\n${bodyContent}\n</html>`;
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
      // Extract current body content if refining
      let currentBodyContent = '';
      if (history.length > 0 && code) {
        const bodyStart = code.toLowerCase().indexOf('<body');
        const bodyEnd = code.toLowerCase().lastIndexOf('</body>');
        if (bodyStart !== -1 && bodyEnd !== -1) {
          currentBodyContent = code.substring(bodyStart, bodyEnd + 7);
        }
      }

      const userMessage = currentBodyContent
        ? `Current website body content:\n\`\`\`html\n${currentBodyContent}\n\`\`\`\n\nUser refinement request: ${prompt}\n\nUpdate the website based on the request. Output only the updated <body> content.`
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
            temperature: TEMPERATURE,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
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
                const bodyContent = extractBodyFromResponse(generatedCode);
                const fullHtml = mergeBodyWithHead(bodyContent);
                if (bodyContent.includes('<body')) {
                  setCode(fullHtml);
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

      // Clean and extract body content, then merge with head
      console.log('📦 Raw generated code length:', generatedCode.length);
      console.log('📦 Raw generated code preview:', generatedCode.substring(0, 500));

      const bodyContent = extractBodyFromResponse(generatedCode);
      const finalCode = mergeBodyWithHead(bodyContent);

      console.log('✨ Extracted body length:', bodyContent.length);
      console.log('✨ Extracted body preview:', bodyContent.substring(0, 500));
      console.log('✨ Final HTML length:', finalCode.length);
      console.log('✅ Has <body>:', bodyContent.includes('<body'));

      if (bodyContent.includes('<body')) {
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