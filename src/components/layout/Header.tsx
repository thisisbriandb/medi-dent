import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo et Nom */}
          <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="Logo AllôDocta" 
                width={48} 
                height={48} 
                className="rounded-xl w-12 h-12" 
                priority
              />
            </Link>

      
         

          {/* Boutons d'action */}
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                S'inscrire
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}