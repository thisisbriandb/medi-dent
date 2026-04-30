import { Mail } from 'lucide-react';

export default function EmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Mail className="w-8 h-8 text-blue-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Messagerie</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        Cette fonctionnalité sera disponible très bientôt.
      </p>
    </div>
  );
}
