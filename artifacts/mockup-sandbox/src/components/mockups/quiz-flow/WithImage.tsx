import { useState } from "react";

const questions = [
  {
    id: 1,
    text: "What is the woman in the picture doing?",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    options: ["Reading a book", "Writing a letter", "Talking on the phone", "Listening to music"],
    correct: 0,
  },
  {
    id: 2,
    text: "What can you see in the background?",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    options: ["A forest", "A city skyline", "A beach", "A mountain range"],
    correct: 1,
  },
  {
    id: 3,
    text: "Which word best describes the mood of the image?",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    options: ["Joyful", "Melancholic", "Peaceful", "Chaotic"],
    correct: 2,
  },
];

export function WithImage() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean[]>(Array(questions.length).fill(false));
  const [confirmed, setConfirmed] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);

  const q = questions[current];
  const progress = answered.filter(Boolean).length;

  const handleSelect = (i: number) => {
    if (confirmed) return;
    setSelected(i);
  };

  const handleNext = () => {
    if (selected === null) return;
    const newAnswered = [...answered];
    newAnswered[current] = true;
    setAnswered(newAnswered);
    setConfirmed(true);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(current + 1);
        setSelected(null);
        setConfirmed(false);
      }
    }, 700);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #1e1730 0%, #2a1f45 60%, #1a1535 100%)" }}
    >
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-5 pt-8 pb-2 flex-shrink-0">
        <button className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <span className="text-white/50 text-sm font-medium">{current + 1} / {questions.length}</span>
        <button className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
        </button>
      </div>

      <div className="w-full px-5 mt-1 flex-shrink-0">
        <p className="text-white/60 text-xs font-semibold tracking-widest uppercase">Чтение с картинкой</p>
      </div>

      {/* Image window */}
      <div className="w-full px-5 mt-3 flex-shrink-0">
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.45)" }}
          onClick={() => setImgExpanded(!imgExpanded)}
        >
          <img
            src={q.image}
            alt="Question image"
            className="w-full object-cover transition-all duration-300"
            style={{ height: imgExpanded ? 220 : 160 }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4))" }} />
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: "rgba(0,0,0,0.5)" }}>
            <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="w-full px-5 mt-3 flex-shrink-0">
        <div className="rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
          <p className="text-slate-800 text-sm font-semibold leading-snug">{q.text}</p>
        </div>
      </div>

      {/* Options */}
      <div className="w-full px-5 mt-3 flex-1">
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = confirmed && i === q.correct;
            const isWrong = confirmed && isSelected && i !== q.correct;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all"
                style={{
                  background: isCorrect ? "rgba(34,197,94,0.2)" : isWrong ? "rgba(239,68,68,0.2)" : isSelected ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.08)",
                  border: `2px solid ${isCorrect ? "#22c55e" : isWrong ? "#ef4444" : isSelected ? "#8b5cf6" : "rgba(255,255,255,0.12)"}`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: isCorrect ? "#22c55e" : isWrong ? "#ef4444" : isSelected ? "#8b5cf6" : "rgba(255,255,255,0.15)",
                    border: `2px solid ${isSelected || isCorrect || isWrong ? "transparent" : "rgba(255,255,255,0.25)"}`,
                  }}
                >
                  {(isSelected || isCorrect) && <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>}
                  {isWrong && <svg width="9" height="9" fill="white" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>}
                </div>
                <span className="text-sm font-medium" style={{ color: isCorrect ? "#86efac" : isWrong ? "#fca5a5" : isSelected ? "#e9d5ff" : "rgba(255,255,255,0.85)" }}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={selected === null}
          className="w-full mt-3 py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: selected !== null ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "rgba(255,255,255,0.1)",
            color: selected !== null ? "white" : "rgba(255,255,255,0.3)",
            boxShadow: selected !== null ? "0 4px 20px rgba(139,92,246,0.4)" : "none",
          }}
        >
          {current === questions.length - 1 ? "Завершить" : "Следующий →"}
        </button>
      </div>

      {/* Progress */}
      <div className="w-full px-5 pb-8 mt-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs font-medium">Урок 3</span>
          <span className="text-white/50 text-xs font-medium">{Math.round((progress / questions.length) * 100)}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(progress / questions.length) * 100}%`, background: "linear-gradient(90deg, #f97316, #fb923c)" }} />
        </div>
      </div>
    </div>
  );
}
