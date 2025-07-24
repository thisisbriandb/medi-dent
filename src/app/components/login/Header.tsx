import Link from "next/link";
import Image from "next/image";
import { Phone, User, Stethoscope } from "lucide-react";

export function LoginHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 relative">
            <div className="relative w-24 h-20">
              <Image
                src="/logo.png"
                alt="Logo AllôDocta"
                width={96}
                height={80}
                className="object-contain w-24 h-20"
                priority
              />
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/register/patient" 
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Espace Patient</span>
            </Link>
            <Link 
              href="/register/medecin" 
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Espace Médecin</span>
            </Link>
            <Link 
              href="tel:+33123456789" 
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Nous contacter</span>
            </Link>
          </nav>

          {/* Boutons de connexion/inscription */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}