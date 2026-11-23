'use client';

import { Printer } from 'lucide-react';

/** „Drucken“ (§8.17): öffnet den Druckdialog des Browsers; gedruckt werden nur die Bögen (druck.css). */
export function DruckenButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primaer">
      <Printer aria-hidden="true" size={16} strokeWidth={1.75} />
      Drucken
    </button>
  );
}
