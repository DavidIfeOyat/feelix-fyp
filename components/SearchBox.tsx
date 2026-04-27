"use client";

import { useState } from "react";

export default function SearchBox() {
  const [q, setQ] = useState("");

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search films or people…"
        className="w-full bg-transparent text-white outline-none placeholder:text-white/60"
      />

      <span className="text-sm text-white/70">⌘K</span>
    </div>
  );
}