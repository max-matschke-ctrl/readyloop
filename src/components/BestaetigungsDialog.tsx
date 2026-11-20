'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  offen: boolean;
  /** Als Frage, z. B. „Mitglied deaktivieren?“ (§6.16). */
  titel: string;
  children?: ReactNode;
  bestaetigen: string;
  onBestaetigen: () => void;
  onAbbrechen: () => void;
}

/**
 * Bestätigungsdialog (§6.16): natives <dialog>, Radius 6, shadow-pop, max. 28 rem.
 * Nur für gefährliche Aktionen. Escape und „Abbrechen“ schließen ohne Aktion; der Fokus kehrt zurück.
 */
export function BestaetigungsDialog({ offen, titel, children, bestaetigen, onBestaetigen, onAbbrechen }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titelId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) d.showModal();
    if (!offen && d.open) d.close();
  }, [offen]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titelId}
      onCancel={(e) => {
        e.preventDefault();
        onAbbrechen();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[28rem] rounded-flaeche border border-steel-200 bg-white p-0 text-ink shadow-pop backdrop:bg-ink/40"
    >
      <div className="space-y-3 p-5">
        <h2 id={titelId} className="text-xl font-semibold leading-7">
          {titel}
        </h2>
        {children && <div className="text-sm text-steel">{children}</div>}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="button" className="btn btn-gefaehrlich" onClick={onBestaetigen}>
            {bestaetigen}
          </button>
          <button type="button" className="btn btn-still" onClick={onAbbrechen} autoFocus>
            Abbrechen
          </button>
        </div>
      </div>
    </dialog>
  );
}
