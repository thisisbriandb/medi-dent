'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {Header, Footer} from '@/components/layout'

export default function Home() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  <Header />

  <main className="max-w-7xl mx-auto px-8 py-16">
    {/* Section Hero Texte + CTA */}
    <section
      id="hero"
      className="flex items-center justify-center py-16"
    >
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-light text-slate-900 leading-tight tracking-tight mb-8">
          Votre <span className="text-indigo-500">cabinet dentaire</span> moderne et efficace
        </h1>

        <p className="text-lg text-slate-500 mb-12 leading-relaxed">
          Gérez vos patients, rendez-vous et consultations ... en toute simplicité avec Medi-Dent.
        </p>

        <div className="flex gap-6 items-center justify-center">
          <Link href="/login">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Se connecter
            </Button>
          </Link>

          <Link href="/register">
            <Button 
              variant="outline"
              className="text-indigo-500 font-semibold flex items-center gap-2 hover:text-indigo-600 transition-colors group border-indigo-500"
            >
              Créer un cabinet{" "}
              <span className="transform group-hover:translate-x-1 transition-transform">
                {'>'}
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  </main>

  <Footer />
</div>
  );
}
