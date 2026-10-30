import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Sparkles } from 'lucide-react';

export default function PracticeQuestionCard({ questionData }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [revealed, setRevealed] = useState(false);

  if (!questionData || !questionData.question || !questionData.options) {
    return null;
  }

  const { question, options, answerIndex = 0, explanation } = questionData;

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelectedIdx(idx);
    setRevealed(true);
  };

  const handleReset = () => {
    setSelectedIdx(null);
    setRevealed(false);
  };

  const isCorrect = selectedIdx === answerIndex;

  return (
    <div className="mt-3.5 p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 shadow-lg text-xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 font-bold text-indigo-300">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Quick Concept Checkpoint</span>
        </div>
        {revealed && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retest</span>
          </button>
        )}
      </div>

      <p className="font-semibold text-slate-100 mb-3 text-xs sm:text-sm leading-relaxed">
        {question}
      </p>

      <div className="space-y-1.5 mb-3">
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-indigo-500/50';

          if (revealed) {
            if (idx === answerIndex) {
              btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
            } else if (idx === selectedIdx) {
              btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
            } else {
              btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={`w-full p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition text-xs ${btnStyle}`}
            >
              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                revealed && idx === answerIndex
                  ? 'bg-emerald-500 text-white'
                  : revealed && idx === selectedIdx
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {letter}
              </span>
              <span className="leading-snug mt-0.5">{opt}</span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className={`p-3 rounded-lg border text-xs leading-relaxed transition ${
          isCorrect
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-1.5 font-bold mb-1">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Spot On! Correct Answer: Option {String.fromCharCode(65 + answerIndex)}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Not quite. Correct Answer: Option {String.fromCharCode(65 + answerIndex)}</span>
              </>
            )}
          </div>
          {explanation && (
            <p className="text-slate-300 text-[11px] mt-1 pl-5">
              {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
