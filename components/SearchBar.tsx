"use client";

import { useState } from "react";

export default function SearchBar() {
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="surface flex items-center gap-2 rounded-[--radius-xl] px-3 py-2"
    >
      <span className="opacity-70">⌘</span>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search films or people…"
        className="w-full border-0 bg-transparent p-0 outline-none"
      />
    </form>
  );
}