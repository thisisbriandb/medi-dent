export function Footer() {
  return (
    <footer className="bg-white border-t mt-36">
      <div className=" mx-auto px-6 py-6 text-center">

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} AllôDocta. Tous droits réservés.
        </p>

      </div>
    </footer>
  );
}