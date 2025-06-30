import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-white">
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-cyan-50 to-white">
          <div className="container mx-auto px-4 py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left space-y-8">
                <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight text-gray-900">
                  La solution <br />
                  <span className="text-cyan-600">simple et sécurisée</span><br />
                  pour vos rendez-vous médicaux
                </h1>
                <p className="text-xl text-gray-600 max-w-lg">
                  Rejoignez plus de 75 000 praticiens qui font déjà confiance à notre plateforme. Créez votre compte et commencez à gérer vos rendez-vous dès aujourd'hui.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register/patient">
                    <Button className="w-full sm:w-auto text-lg px-8 py-6 bg-cyan-600 hover:bg-cyan-700 text-white">
                      Je suis patient
                    </Button>
                  </Link>
                  <Link href="/register/medecin">
                    <Button variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2">
                      Je suis médecin
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image 
                    src="/doctor-consultation.jpg" 
                    alt="Consultation médicale" 
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Floating Card */}
                <div className="absolute -right-12 top-1/4 bg-white p-6 rounded-xl shadow-lg max-w-xs">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Prise de RDV rapide</h3>
                      <p className="text-sm text-gray-500">En moins de 2 minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <h3 className="text-4xl font-display font-bold text-cyan-600 mb-2">75 000+</h3>
                <p className="text-gray-600">Praticiens nous font confiance</p>
              </div>
              <div className="p-6">
                <h3 className="text-4xl font-display font-bold text-cyan-600 mb-2">1M+</h3>
                <p className="text-gray-600">Rendez-vous pris par mois</p>
              </div>
              <div className="p-6">
                <h3 className="text-4xl font-display font-bold text-cyan-600 mb-2">98%</h3>
                <p className="text-gray-600">Taux de satisfaction</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">Comment ça marche ?</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto">
                  <Image src="/file.svg" alt="Rechercher" width={32} height={32} />
                </div>
                <h3 className="text-xl font-semibold">Trouvez un praticien</h3>
                <p className="text-gray-600">Recherchez parmi des milliers de spécialistes qualifiés près de chez vous.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto">
                  <Image src="/window.svg" alt="Rendez-vous" width={32} height={32} />
                </div>
                <h3 className="text-xl font-semibold">Prenez rendez-vous</h3>
                <p className="text-gray-600">Sélectionnez un créneau disponible et réservez en quelques clics.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto">
                  <Image src="/globe.svg" alt="Dossier Médical" width={32} height={32} />
                </div>
                <h3 className="text-xl font-semibold">Gérez votre santé</h3>
                <p className="text-gray-600">Accédez à votre historique et vos documents médicaux en toute sécurité.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">Ce que disent nos utilisateurs</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-8 rounded-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-cyan-100 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold">Dr. Marie Laurent</h4>
                    <p className="text-gray-600">Médecin généraliste</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Allodocta m'a permis de mieux gérer mon agenda et de réduire considérablement le temps consacré aux tâches administratives. Mes patients apprécient la simplicité de prise de rendez-vous."
                </p>
              </div>
              <div className="bg-gray-50 p-8 rounded-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-cyan-100 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold">Sophie Martin</h4>
                    <p className="text-gray-600">Patiente</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Une plateforme intuitive qui simplifie vraiment la prise de rendez-vous médicaux. Je peux facilement trouver un spécialiste et gérer mes rendez-vous en quelques clics."
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 