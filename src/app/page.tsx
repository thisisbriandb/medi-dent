'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Lock, Database, Search } from 'lucide-react';
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
        <section id="hero" className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-8">
          <div>
            <h1 className="text-5xl font-light text-slate-900 leading-tight tracking-tight mb-8">
              Nous <span className="text-indigo-500">transformons</span> la façon dont les gens se soigent
            </h1>
            <p className="text-lg text-slate-500 mb-12 leading-relaxed max-w-[90%]">
              Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo.
            </p>
            <div className="flex gap-6 items-center">
              <Link href="/register">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Démarrer</Button>
              </Link>
              <button
                className="text-indigo-500 font-semibold flex items-center gap-2 hover:text-indigo-600 transition-colors group"
                onClick={() => alert('Démo en direct !')}
              >
                Démo en direct <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

                  {/* Grille d'images */}
          <section className="relative w-full h-[600px]">
            {/* Image 1 */}
            <div className="absolute top-0 right-0 w-40 h-60 rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform">
              <Image
                src="/images/photo1.jpg"
                alt="Personne 1"
                width={400}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            {/* Image 2 */}
            <div className="absolute top-[20%] right-[160px] w-44 h-64 rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform">
              <Image
                src="/images/photo2.jpg"
                alt="Personne 2"
                width={400}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            {/* Image 3 */}
            <div className="absolute top-[40%] right-0 w-48 h-64 rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform">
              <Image
                src="/images/photo3.jpg"
                alt="Personne 3"
                width={400}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            {/* Image 4 */}
            <div className="absolute top-[60%] right-[180px] w-44 h-56 rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform">
              <Image
                src="/images/photo4.jpg"
                alt="Personne 4"
                width={400}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            {/* Image 5 */}
            <div className="absolute bottom-0 right-0 w-36 h-52 rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform">
              <Image
                src="/images/photo5.jpg"
                alt="Personne 5"
                width={400}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </section>
        </section>

         {/* Recherche médecin */}
         <section id="search" className="pt-24 pb-20">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Trouvez votre médecin</h2>
              <p className="text-gray-600">Plus de 10 000 professionnels de santé à votre service</p>
            </div>

            <div className="max-w-2xl mx-auto relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <Input
                placeholder="Rechercher un médecin, établissement, spécialité..."
                className="w-full rounded-2xl py-6 px-12 text-lg border-0 shadow-lg focus:ring-2 focus:ring-cyan-600 bg-white"
              />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
                Rechercher
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {['Médecin généraliste', 'Dentiste', 'Cardiologue', 'Pédiatre', 'Dermatologue'].map((spec, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection('search')}
                  className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-cyan-600 hover:text-white transition-all duration-300 shadow-sm"
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION "A better workflow" */}
        <section className="bg-white rounded-3xl py-16 px-8 mt-24 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Texte */}
            <div>
              <p className="text-indigo-600 font-medium mb-2">Faites-vous consulter en 2 minutes</p>
              <h2 className="text-4xl font-light text-gray-900 mb-4">A better workflow</h2>
              <p className="text-gray-600 mb-6">
                Lorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores impedit perferendis suscipit eaque.
              </p>

              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <Upload className="text-indigo-600 h-5 w-5 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Push to deploy.</p>
                    <p className="text-gray-600 text-sm">Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Lock className="text-indigo-600 h-5 w-5 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">SSL certificates.</p>
                    <p className="text-gray-600 text-sm">Anim aute id magna aliqua ad ad non deserunt sunt.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Database className="text-indigo-600 h-5 w-5 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Database backups.</p>
                    <p className="text-gray-600 text-sm">Ac tincidunt sapien vehicula erat auctor rhoncus.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Image */}
            <div>
              <Image
                src="/product.jpg"
                alt="Product"
                width={800}
                height={600}
                className="rounded-xl shadow-xl"
              />
            </div>
          </div>
        </section>

      </main>
      <Footer />
      </div>
  );
}
