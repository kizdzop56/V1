import { useState } from "react";

const steps = [
  {
    id: 1,
    text: "Describe what you did last weekend using at least 3 past tense verbs.",
    hint: "Example: went, visited, watched, ate, played...",
  },
  {
    id: 2,
    text: "Write a short paragraph about your favourite book or film.",
    hint: "Mention the title, what it is about, and why you like it.",
  },
];

export function FreeForm() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(steps.length).fill(""));
  const [done, setDone] = useState<boolean[]>(Array(steps.length).fill(false));
  const [submitted, setSubmitted] = useState(false);

  const q = steps[current];
  const progress = done.filter(Boolean).length;
  const currentText = answers[current];

  const handleNext = () => {
    if (!currentText.trim()) return;
    const newDone = [...done];
    newDone[current] = true;
    setDone(newDone);
    if (current < steps.length - 1) {
      setCurrent(current + 1);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "linear-gradient(160deg, #1e1730 0%, #2a1f45 60%, #1a1535 100%)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
          <svg width="40" height="40" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Отлично!</h2>
        <p className="text-white/60 text-center text-sm mb-8">Ваш ответ отправлен на проверку учителю. Оценка появится после проверки.</p>
        <div className="w-full rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.12)" }}>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Ваши ответы отправлены</p>
          <p className="text-white/70 text-sm">Свободный ответ · {steps.length} задания</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #1e1730 0%, #2a1f45 60%, #1a1535 100%)" }}>
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-5 pt-8 pb-2 flex-shrink-0">
        <button className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <span className="text-white/50 text-sm font-medium">{current + 1} / {steps.length}</span>
        <div className="w-8" />
      </div>

      <div className="w-full px-5 mt-1 flex-shrink-0">
        <p className="text-white/60 text-xs font-semibold tracking-widest uppercase">Свободный ответ</p>
      </div>

      {/* Question card */}
      <div className="w-full px-5 mt-5 flex-shrink-0">
        <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #ec4899, #db2777)" }}>
              <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
            </div>
            <div>
              <p className="text-slate-800 text-sm font-semibold leading-snug">{q.text}</p>
              <p className="text-slate-400 text-xs mt-1.5">{q.hint}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Text answer */}
      <div className="w-full px-5 mt-4 flex-1 flex flex-col">
        <textarea
          value={currentText}
          onChange={e => {
            const newAnswers = [...answers];
            newAnswers[current] = e.target.value;
            setAnswers(newAnswers);
          }}
          placeholder="Напишите ваш ответ здесь..."
          rows={7}
          className="w-full rounded-2xl px-4 py-4 text-sm resize-none outline-none flex-1"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.9)",
            caretColor: "#8b5cf6",
          }}
        />

        {/* Attach photo button */}
        <button
          className="mt-3 flex items-center gap-2 px-4 py-3 rounded-2xl self-start"
          style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.12)" }}
        >
          <svg width="15" height="15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Прикрепить фото</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!currentText.trim()}
          className="w-full mt-4 py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: currentText.trim() ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "rgba(255,255,255,0.1)",
            color: currentText.trim() ? "white" : "rgba(255,255,255,0.3)",
            boxShadow: currentText.trim() ? "0 4px 20px rgba(139,92,246,0.4)" : "none",
          }}
        >
          {current === steps.length - 1 ? "Отправить ответ" : "Следующий →"}
        </button>
      </div>

      {/* Progress */}
      <div className="w-full px-5 pb-8 mt-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs font-medium">Урок 3</span>
          <span className="text-white/50 text-xs font-medium">{Math.round((progress / steps.length) * 100)}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(progress / steps.length) * 100}%`, background: "linear-gradient(90deg, #f97316, #fb923c)" }} />
        </div>
      </div>
    </div>
  );
}
