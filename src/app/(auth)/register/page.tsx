'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils"; // Assure-toi d’avoir une fonction `cn` pour gérer les classes conditionnelles

export default function RegisterChoicePage() {
  const [selected, setSelected] = useState<"patient" | "medecin" | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selected === "patient") router.push("/register/patient");
    if (selected === "medecin") router.push("/register/medecin");
  };

  return (
    <div className="flex flex-col items-center justify-center  bg-white p-6">
      <h1 className="text-2xl font-semibold text-center mb-8">
        Rejoignez Allodocta
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        <label
          onClick={() => setSelected("patient")}
          className={cn(
            "cursor-pointer border rounded-lg p-6 flex flex-col items-start gap-2 transition-all",
            selected === "patient"
              ? "border-green-600 bg-green-50 shadow-md"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-lg font-medium">Je suis un patient</span>
            <span
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                selected === "patient"
                  ? "border-green-600"
                  : "border-gray-400"
              )}
            >
              {selected === "patient" && (
                <div className="w-2.5 h-2.5 bg-green-600 rounded-full" />
              )}
            </span>
          </div>
          <p className="text-sm text-gray-600">Je cherche un praticien</p>
        </label>

        <label
          onClick={() => setSelected("medecin")}
          className={cn(
            "cursor-pointer border rounded-lg p-6 flex flex-col items-start gap-2 transition-all",
            selected === "medecin"
              ? "border-green-600 bg-green-50 shadow-md"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-lg font-medium">Je suis un praticien</span>
            <span
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                selected === "medecin"
                  ? "border-green-600"
                  : "border-gray-400"
              )}
            >
              {selected === "medecin" && (
                <div className="w-2.5 h-2.5 bg-green-600 rounded-full" />
              )}
            </span>
          </div>
          <p className="text-sm text-gray-600">Je propose des consultations</p>
        </label>
      </div>

      <button
        disabled={!selected}
        onClick={handleContinue}
        className={cn(
          "mt-6 px-6 py-2 rounded-md text-white font-medium transition",
          selected
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-300 cursor-not-allowed"
        )}
      >
        Continuer
      </button>

      <p className="mt-4 text-sm text-gray-600">
        Vous avez déjà un compte ?{" "}
        <a href="/login" className="text-green-600 hover:underline">
          Se connecter
        </a>
      </p>
    </div>
  );
}
