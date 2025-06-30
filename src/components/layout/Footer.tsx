import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">À propos d'Allodocta</h3>
            <p className="text-gray-600 text-sm">
              Allodocta simplifie l'accès aux soins en permettant aux patients de
              trouver un médecin et de prendre rendez-vous en ligne.
            </p>
          </div>

          {/* Liens Rapides */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/medecins"
                  className="text-gray-600 hover:text-cyan-600 text-sm"
                >
                  Rechercher un médecin
                </Link>
              </li>
              <li>
                <Link
                  href="/specialites"
                  className="text-gray-600 hover:text-cyan-600 text-sm"
                >
                  Spécialités médicales
                </Link>
              </li>
              <li>
                <Link
                  href="/urgences"
                  className="text-gray-600 hover:text-cyan-600 text-sm"
                >
                  Numéros d'urgence
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations Légales */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Informations Légales</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-gray-600 hover:text-cyan-600 text-sm"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-gray-600 hover:text-cyan-600 text-sm"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/cgv"
                  className="text-gray-600 hover:text-cyan-600 text-sm"
                >
                  CGV
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-600 text-sm">
                Email: contact@allodocta.fr
              </li>
              <li className="text-gray-600 text-sm">
                Tél: +33 (0)1 23 45 67 89
              </li>
              <li className="flex space-x-4 mt-4">
                {/* Icônes réseaux sociaux */}
                <a
                  href="#"
                  className="text-gray-400 hover:text-cyan-600"
                  aria-label="Twitter"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-cyan-600"
                  aria-label="LinkedIn"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-cyan-600"
                  aria-label="Facebook"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Allodocta. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}