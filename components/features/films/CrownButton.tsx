'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import SignUpPrompt from '../auth/SignUpPrompt';

export default function CrownButton({ tmdbId }:{ tmdbId:number }) {
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { supabase.auth.getSession().then(({data}) => setAuthed(!!data.session)); }, []);
  const onClick = () => { if (!authed) setOpen(true); else {/* call API to add */} };

  return (
    <>
      <button onClick={onClick} className="chip">👑 Add to Rushmore</button>
      {open && <SignUpPrompt title="Make your Mount Rushmore"
                             message="Create your profile to crown your 4 all-time favourites." />}
    </>
  );
}
