import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Terminal, Lightbulb } from 'lucide-react';

/**
 * Clean Inline Formatter
 * Handles bold (**text**), inline code (`code`), inline math ($math$), italic (*text*), and links.
 */
function renderInline(text) {
  if (!text) return null;

  // Split tokens by: bold, inline code, inline math ($...$ or \(...\)), italic
  const tokenRegex = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\$[^$]+\$)|(\\\([^\\]+\\\))|(\*[^*]+\*)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];
    const key = `inline_${match.index}`;

    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      parts.push(
        <strong key={key} className="font-bold text-white">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      parts.push(
        <code key={key} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-950/80 border border-slate-700/80 font-mono text-[12px] text-indigo-300">
          {matchedStr.slice(1, -1)}
        </code>
      );
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      parts.push(
        <span key={key} className="font-serif italic text-amber-200 px-1 font-medium tracking-wide">
          {matchedStr.slice(1, -1)}
        </span>
      );
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      parts.push(
        <span key={key} className="font-serif italic text-amber-200 px-1 font-medium tracking-wide">
          {matchedStr.slice(2, -2)}
        </span>
      );
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      parts.push(
        <em key={key} className="italic text-slate-300">
          {matchedStr.slice(1, -1)}
        </em>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Code Block Component with Copy Button
 */
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
        <span className="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition text-[11px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Clean Markdown Renderer
 * Parses structured markdown without external dependencies.
 */
export default function MarkdownRenderer({ content, hideTrailers = false }) {
  if (!content) return null;

  // Optionally clean out the trailing raw Active Recall or Practice Question sections if they are rendered as interactive widgets
  let processedContent = content;
  if (hideTrailers) {
    const splitIndex = processedContent.indexOf('### 🃏 Active Recall');
    if (splitIndex !== -1) {
      processedContent = processedContent.substring(0, splitIndex).trim();
    }
  }

  const lines = processedContent.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];
  let inMathBlock = false;
  let mathBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Code Block boundary
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <CodeBlock
            key={`code_${i}`}
            language={codeBlockLang}
            code={codeBlockLines.join('\n')}
          />
        );
        inCodeBlock = false;
        codeBlockLang = '';
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = line.replace('```', '').trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // 2. Display Math boundary ($$ or \[)
    if (line === '$$' || line === '\\[') {
      if (inMathBlock) {
        elements.push(
          <div
            key={`math_${i}`}
            className="my-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center font-serif italic text-amber-200 text-sm tracking-wide overflow-x-auto"
          >
            {mathBlockLines.join('\n')}
          </div>
        );
        inMathBlock = false;
        mathBlockLines = [];
      } else {
        inMathBlock = true;
        mathBlockLines = [];
      }
      continue;
    }

    if (inMathBlock && (line === '$$' || line === '\\]')) {
      elements.push(
        <div
          key={`math_${i}`}
          className="my-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center font-serif italic text-amber-200 text-sm tracking-wide overflow-x-auto"
        >
          {mathBlockLines.join('\n')}
        </div>
      );
      inMathBlock = false;
      mathBlockLines = [];
      continue;
    }

    if (inMathBlock) {
      mathBlockLines.push(line);
      continue;
    }

    // Single-line display math: $$...$$ or \[...\]
    if ((line.startsWith('$$') && line.endsWith('$$') && line.length > 4) ||
        (line.startsWith('\\[') && line.endsWith('\\]') && line.length > 4)) {
      elements.push(
        <div
          key={`math_single_${i}`}
          className="my-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center font-serif italic text-amber-200 text-sm tracking-wide overflow-x-auto"
        >
          {line.slice(2, -2).trim()}
        </div>
      );
      continue;
    }

    // 3. Review Agent Verified banner
    if (line.includes('Review Agent Verified') || line.includes('🛡️')) {
      elements.push(
        <div
          key={`audit_${i}`}
          className="my-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 font-medium"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {line.replace(/^[🛡️*\s—-]+/, '').replace(/\*\*/g, '').trim()}
          </span>
        </div>
      );
      continue;
    }

    // 4. Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      elements.push(<hr key={`hr_${i}`} className="my-3.5 border-slate-800" />);
      continue;
    }

    // 5. Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1_${i}`} className="text-lg font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-700/60">
          {renderInline(line.substring(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2_${i}`} className="text-base font-bold text-indigo-300 mt-3.5 mb-1.5 flex items-center gap-1.5">
          {renderInline(line.substring(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3_${i}`} className="text-sm font-bold text-slate-100 mt-3 mb-1.5 flex items-center gap-1.5">
          {renderInline(line.substring(4))}
        </h3>
      );
      continue;
    }

    // 6. Blockquote / Final Answer Callouts
    if (line.startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '');
      const isFinalAnswer = quoteText.toLowerCase().includes('final answer') || quoteText.toLowerCase().includes('answer:');
      elements.push(
        <div
          key={`quote_${i}`}
          className={`my-2 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
            isFinalAnswer
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 font-semibold shadow-sm'
              : 'bg-indigo-500/10 border-l-4 border-indigo-500 text-slate-200'
          }`}
        >
          <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${isFinalAnswer ? 'text-emerald-400' : 'text-indigo-400'}`} />
          <div>{renderInline(quoteText)}</div>
        </div>
      );
      continue;
    }

    // 7. Lists: Unordered (- or *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={`li_${i}`} className="flex items-start gap-2 text-xs text-slate-300 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
          <div className="leading-relaxed">{renderInline(line.substring(2))}</div>
        </div>
      );
      continue;
    }

    // 8. Lists: Ordered (1. 2. etc.)
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      elements.push(
        <div key={`oli_${i}`} className="flex items-start gap-2 text-xs text-slate-300 my-1 pl-1">
          <span className="font-mono text-indigo-400 font-bold text-[11px] shrink-0 min-w-[16px] text-right">
            {orderedMatch[1]}.
          </span>
          <div className="leading-relaxed">{renderInline(orderedMatch[2])}</div>
        </div>
      );
      continue;
    }

    // 9. Table rows (clean formatted table lines)
    if (line.startsWith('|') && line.endsWith('|')) {
      // If it's a separator line (|:---|:---|), skip or render subtle
      if (line.includes('---')) continue;
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      elements.push(
        <div key={`tbl_${i}`} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 my-1 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px]">
          {cells.map((cell, cIdx) => (
            <div key={cIdx} className="text-slate-300 font-medium truncate">
              {renderInline(cell.trim())}
            </div>
          ))}
        </div>
      );
      continue;
    }

    // 10. Empty lines / Paragraphs
    if (line.length === 0) {
      elements.push(<div key={`sp_${i}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={`p_${i}`} className="text-xs text-slate-300 leading-relaxed my-0.5">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div className="space-y-0.5 font-sans">{elements}</div>;
}
