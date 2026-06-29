import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <main className="max-w-[1280px] mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
