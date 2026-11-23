// Testhilfe: Rohzugriff auf den Demo-Store (alle Übernahmen inkl. abgeschlossener), am Repository-Vertrag vorbei.
// Das Repository liefert seit Review I3M nur offene Übernahmen bzw. den Verlauf je Gerät (F-27).
import type { Id, Uebernahme } from '@/domain/types';
import type { DemoStand } from '@/server/repo/demo/daten';
import type { DemoRepository } from '@/server/repo/demo/repository';

export function alleUebernahmen(repo: DemoRepository, organisationId: Id, geraetId?: Id): Uebernahme[] {
  const { stand } = repo as unknown as { stand: DemoStand };
  return structuredClone(
    stand.uebernahmen.filter((u) => u.organisationId === organisationId && (geraetId === undefined || u.geraetId === geraetId)),
  );
}
