"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * خلفية ملكية: تدرجات أورورا + نجوم متلألئة (تُرسم على العميل فقط
 * لتجنب اختلاف الترطيب بين الخادم والمتصفح).
 */
export function Aurora() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // تُرسم النجوم على العميل فقط لتفادي اختلاف الترطيب بين الخادم والمتصفح
    setMounted(true);
  }, []);

  const stars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: 1.5 + Math.random() * 2.5,
        dur: 3 + Math.random() * 4,
        delay: Math.random() * 5,
      })),
    []
  );

  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      {mounted &&
        stars.map((s) => (
          <span
            key={s.id}
            className="star"
            style={
              {
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                "--tw-dur": `${s.dur}s`,
                "--tw-delay": `${s.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
    </div>
  );
}
