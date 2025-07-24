import Link from 'next/link';
import Image from 'next/image';
import {
  Facebook,
  Instagram,
  Linkedin,
  Phone,
  Mail,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

const footerLinks = {
  "Services": [
    { label: "Téléconsultation", href: "/teleconsultation" },
    { label: "Prise de RDV", href: "/rendez-vous" },
    { label: "Médecins spécialistes", href: "/specialistes" },
    { label: "Urgences", href: "/urgences" },
    { label: "Suivi médical", href: "/suivi" },
  ],
  "Patients": [
    { label: "Comment ça marche", href: "/guide" },
    { label: "FAQ", href: "/faq" },
    { label: "Tarifs & Remboursements", href: "/tarifs" },
    { label: "Espace patient", href: "/espace-patient" },
  ],
  "Professionnels": [
    { label: "Rejoindre AllôDocta", href: "/recrutement" },
    { label: "Espace praticien", href: "/espace-praticien" },
    { label: "Formation", href: "/formation" },
    { label: "Partenariats", href: "/partenariats" },
  ],
  "Contact": [
    { label: "01 23 45 67 89", href: "tel:+33123456789", icon: Phone },
    { label: "contact@allodocta.fr", href: "mailto:contact@allodocta.fr", icon: Mail },
    { label: "Paris, France", href: "https://goo.gl/maps", icon: MapPin },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white border-t mt-24">
      {/* Section principale */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Logo et description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/logo.png"
                alt="Logo AllôDocta"
                width={48}
                height={48}
                className="rounded-xl w-12 h-12"
              />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                AllôDocta
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              AllôDocta connecte patients et professionnels de santé pour un accès aux soins simplifié et de qualité. Notre mission : rendre la santé accessible à tous, partout en France.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="text-gray-400 hover:text-cyan-500 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Colonnes de liens */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-cyan-600 flex items-center gap-2 group"
                    >
                      {"icon" in link && link.icon ? (
                        <>
                          <link.icon className="w-4 h-4" />
                          {link.label}
                        </>
                      ) : (
                        <>
                          {link.label}
                          <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bande inférieure */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2">
              <Link href="/mentions-legales" className="hover:text-cyan-600 transition-colors">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="hover:text-cyan-600 transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="/cgv" className="hover:text-cyan-600 transition-colors">
                CGV
              </Link>
            </div>
            <p>© {new Date().getFullYear()} AllôDocta. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
