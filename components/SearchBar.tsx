"use client";

import { useState } from "react";

export default function SearchBar() {
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="surface px-3 py-2 rounded-[--radius-xl] flex items-center gap-2"
    >
      <span className="opacity-70">⌘</span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search films or people…"
        className="w-full bg-transparent outline-none border-0 p-0"
      />
    </form>
  );
}
