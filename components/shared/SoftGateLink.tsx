'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SignUpPrompt from '@/components/features/auth/SignUpPrompt'
import { supabase } from '@/lib/supabase/supabaseClient';

export default function SoftGateLink({ href, children, className }:{
  href: string; children: React.ReactNode; className?: string;
}) {
  const [authed, setAuthed] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const onClick = (e: React.MouseEvent) => {
    if (!authed) {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <Link href={href} onClick={onClick} className={className}>{children}</Link>
      {open && <SignUpPrompt title="Create an account to view your Watchlist"
                             message="We saved your picks. Make an account to keep them forever." />}
    </>
  );
}
