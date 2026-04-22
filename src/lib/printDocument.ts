/**
 * Ouvre une fenêtre isolée contenant uniquement le HTML du document,
 * applique un style d'impression propre, lance print(), puis ferme.
 *
 * Usage :
 *   const ref = useRef<HTMLDivElement>(null);
 *   <div ref={ref}> ... contenu document ... </div>
 *   <button onClick={() => printDocument(ref.current!)}>Imprimer</button>
 */
export function printDocument(element: HTMLElement, title = 'Document') {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Veuillez autoriser les popups pour imprimer.');
    return;
  }

  const html = element.innerHTML;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #111827;
      background: white;
      padding: 0;
      line-height: 1.5;
      font-size: 14px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ─── Typography ─── */
    h1, h2, h3 { font-weight: 700; }
    .text-xs { font-size: 12px; }
    .text-sm { font-size: 13px; }
    .text-lg { font-size: 18px; }
    .text-xl { font-size: 20px; }
    .text-2xl { font-size: 24px; }
    .text-\\[10px\\] { font-size: 10px; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-mono { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; }
    .uppercase { text-transform: uppercase; }
    .italic { font-style: italic; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .whitespace-pre-wrap { white-space: pre-wrap; }
    .tracking-wide { letter-spacing: 0.025em; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-widest { letter-spacing: 0.1em; }
    .leading-tight { line-height: 1.25; }
    .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }

    /* ─── Colors ─── */
    .text-gray-400 { color: #9ca3af; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-700 { color: #374151; }
    .text-gray-800 { color: #1f2937; }
    .text-gray-900 { color: #111827; }
    .text-blue-500 { color: #3b82f6; }
    .text-blue-600 { color: #2563eb; }
    .text-emerald-600 { color: #059669; }
    .text-red-600 { color: #dc2626; }

    /* ─── Backgrounds ─── */
    .bg-blue-50 { background-color: #eff6ff; }
    .bg-gray-50 { background-color: #f9fafb; }
    .bg-gray-100 { background-color: #f3f4f6; }

    /* ─── Borders ─── */
    .border-b { border-bottom: 1px solid #e5e7eb; }
    .border-t { border-top: 1px solid #e5e7eb; }
    .border-b-2 { border-bottom: 2px solid #d1d5db; }
    .border-t-2 { border-top: 2px solid #1f2937; }
    .border-gray-100 { border-color: #f3f4f6; }
    .border-gray-200 { border-color: #e5e7eb; }
    .border-gray-300 { border-color: #d1d5db; }
    .border-gray-800 { border-color: #1f2937; }
    .border-blue-200 { border-color: #bfdbfe; }

    /* ─── Layout ─── */
    .flex { display: flex; }
    .inline-flex { display: inline-flex; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .items-start { align-items: flex-start; }
    .items-center { align-items: center; }
    .items-end { align-items: flex-end; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .justify-end { justify-content: flex-end; }
    .flex-1 { flex: 1; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .gap-6 { gap: 24px; }
    .gap-8 { gap: 32px; }
    .gap-x-4 { column-gap: 16px; }
    .gap-y-1 { row-gap: 4px; }

    /* ─── Spacing ─── */
    .p-4 { padding: 16px; }
    .px-6 { padding-left: 24px; padding-right: 24px; }
    .py-3 { padding-top: 12px; padding-bottom: 12px; }
    .py-4 { padding-top: 16px; padding-bottom: 16px; }
    .pr-4 { padding-right: 16px; }
    .pt-2 { padding-top: 8px; }
    .pt-6 { padding-top: 24px; }
    .pt-8 { padding-top: 32px; }
    .pb-3 { padding-bottom: 12px; }
    .pb-6 { padding-bottom: 24px; }
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .mb-8 { margin-bottom: 32px; }
    .mb-12 { margin-bottom: 48px; }
    .ml-2 { margin-left: 8px; }
    .ml-auto { margin-left: auto; }
    .mt-0\\.5 { margin-top: 2px; }
    .mt-1 { margin-top: 4px; }
    .mt-6 { margin-top: 24px; }
    .space-y-2 > * + * { margin-top: 8px; }
    .space-y-4 > * + * { margin-top: 16px; }

    /* ─── Sizing ─── */
    .w-7 { width: 28px; }
    .h-7 { height: 28px; }
    .w-16 { width: 64px; }
    .w-28 { width: 112px; }
    .w-32 { width: 128px; }
    .w-48 { width: 192px; }
    .w-72 { width: 288px; }
    .w-full { width: 100%; }

    /* ─── Misc ─── */
    .rounded-full { border-radius: 9999px; }
    .rounded-lg { border-radius: 8px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .divide-y > * + * { border-top: 1px solid #f9fafb; }
    .divide-gray-100 > * + * { border-top-color: #f3f4f6; }

    /* ─── Tables ─── */
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px 0; }
    td { padding: 12px 0; font-size: 13px; }

    /* No break */
    .print-no-break { break-inside: avoid; }
  </style>
</head>
<body>
  ${html}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
      setTimeout(function() { window.close(); }, 3000);
    };
  <\/script>
</body>
</html>`);

  printWindow.document.close();
}
