import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  GADGET_KIND_LABELS,
  OPERATOR_SOURCE_LABELS,
  RANGE_BAND_LABELS,
  type GadgetKind,
  type Operator,
  type OperatorSource,
  type OperatorTeam,
  type RangeBand,
  type RangeBandId,
} from "../../data/operators";
import type { CombatDiceTier } from "../../data/combatDice";

const SOURCES: OperatorSource[] = [
  "core",
  "year1",
  "year2",
  "year3",
  "year4",
  "year5",
  "year6plus",
];

const KINDS: GadgetKind[] = ["setup", "action", "reaction", "passive"];
const TIERS: CombatDiceTier[] = ["yellow", "orange", "red"];
const BANDS: RangeBandId[] = ["short", "medium", "long"];
const DEFAULT_SPACES: Record<RangeBandId, string> = {
  short: "1–3",
  medium: "4–6",
  long: "7+",
};

export type EditorSection = "header" | "stats" | "ranges" | "gadget" | "notes";

type Draft = {
  name: string;
  team: OperatorTeam;
  source: OperatorSource;
  gadgetName: string;
  gadgetKind: GadgetKind;
  gadgetText: string;
  stamina: string;
  run: string;
  destroy: "" | CombatDiceTier;
  rangeSpaces: Record<RangeBandId, string>;
  rangeDice: Record<RangeBandId, string>;
  notesText: string;
  statsVerified: boolean;
};

function diceToText(dice: CombatDiceTier[] | undefined): string {
  return (dice ?? []).join(" ");
}

function textToDice(value: string): CombatDiceTier[] {
  return value
    .split(/[\s,]+/)
    .filter(
      (tier): tier is CombatDiceTier =>
        tier === "yellow" || tier === "orange" || tier === "red",
    );
}

function draftFrom(operator: Operator): Draft {
  const byId = Object.fromEntries(
    (operator.ranges ?? []).map((band) => [band.id, band]),
  ) as Partial<Record<RangeBandId, RangeBand>>;
  return {
    name: operator.name,
    team: operator.team,
    source: operator.source,
    gadgetName: operator.gadgetName,
    gadgetKind: operator.gadgetKind,
    gadgetText: operator.gadget.join("\n"),
    stamina: operator.stamina == null ? "" : String(operator.stamina),
    run: operator.run == null ? "" : String(operator.run),
    destroy: operator.destroy ?? "",
    rangeSpaces: {
      short: byId.short?.spaces ?? DEFAULT_SPACES.short,
      medium: byId.medium?.spaces ?? DEFAULT_SPACES.medium,
      long: byId.long?.spaces ?? DEFAULT_SPACES.long,
    },
    rangeDice: {
      short: diceToText(byId.short?.dice),
      medium: diceToText(byId.medium?.dice),
      long: diceToText(byId.long?.dice),
    },
    notesText: (operator.notes ?? []).join("\n"),
    statsVerified: operator.statsVerified,
  };
}

function optionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function operatorFromDraft(id: string, draft: Draft): Operator {
  const ranges = BANDS.map((bandId) => ({
    id: bandId,
    spaces: draft.rangeSpaces[bandId].trim() || DEFAULT_SPACES[bandId],
    dice: textToDice(draft.rangeDice[bandId]),
  }));
  const complete = ranges.every((band) => band.dice.length > 0);
  const gadget = draft.gadgetText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const notes = draft.notesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const operator: Operator = {
    id,
    name: draft.name.trim() || id,
    team: draft.team,
    source: draft.source,
    gadgetName: draft.gadgetName,
    gadgetKind: draft.gadgetKind,
    gadget,
    statsVerified: draft.statsVerified,
  };
  const stamina = optionalNumber(draft.stamina);
  const run = optionalNumber(draft.run);
  if (stamina != null) operator.stamina = stamina;
  if (run != null) operator.run = run;
  if (draft.destroy) operator.destroy = draft.destroy;
  if (complete) operator.ranges = ranges;
  if (notes.length > 0) operator.notes = notes;
  return operator;
}

export function useLocalOperatorEditor(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return;
    let cancelled = false;
    fetch("/api/local-operators")
      .then((response) => {
        if (!cancelled) setEnabled(response.ok);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}

export function useOperatorCardEditor(
  operator: Operator,
  onSaved: (next: Operator) => void,
) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(operator));
  const [editing, setEditing] = useState<EditorSection | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const operatorId = useRef(operator.id);

  useEffect(() => {
    if (operatorId.current === operator.id) return;
    operatorId.current = operator.id;
    setDraft(draftFrom(operator));
    setEditing(null);
    setStatus(null);
  }, [operator]);

  const cancel = () => {
    setDraft(draftFrom(operator));
    setEditing(null);
    setStatus(null);
  };

  const save = async () => {
    const next = operatorFromDraft(operator.id, draft);
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/local-operators/${operator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const payload = (await response.json()) as {
        error?: string;
        operator?: Operator;
      };
      if (!response.ok || !payload.operator) {
        setStatus(payload.error ?? "Save failed.");
        return;
      }
      onSaved(payload.operator);
      setDraft(draftFrom(payload.operator));
      setEditing(null);
      setStatus("Saved");
    } catch {
      setStatus("Save failed — is pnpm dev running?");
    } finally {
      setSaving(false);
    }
  };

  return {
    draft,
    setDraft,
    editing,
    setEditing,
    cancel,
    save,
    saving,
    status,
  };
}

export const SectionEditButton = ({
  section,
  editing,
  onToggle,
}: {
  section: EditorSection;
  editing: EditorSection | null;
  onToggle: (section: EditorSection) => void;
}) => (
  <button
    type="button"
    className="section-edit-button"
    onClick={() => onToggle(section)}
  >
    {editing === section ? "Cancel" : "Edit"}
  </button>
);

const SectionSaveRow = ({
  onSave,
  saving,
  status,
}: {
  onSave: () => void;
  saving: boolean;
  status: string | null;
}) => (
  <div className="json-editor-actions">
    <button
      type="button"
      className="load-dice-button"
      onClick={onSave}
      disabled={saving}
    >
      {saving ? "Saving…" : "Save"}
    </button>
    {status && <p className="muted">{status}</p>}
  </div>
);

type FieldsProps = {
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  onSave: () => void;
  saving: boolean;
  status: string | null;
};

export const HeaderFields = ({
  draft,
  setDraft,
  onSave,
  saving,
  status,
}: FieldsProps) => (
  <div className="section-edit-fields">
    <div className="json-editor-grid">
      <label>
        Name
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <label>
        Team
        <select
          value={draft.team}
          onChange={(e) =>
            setDraft({ ...draft, team: e.target.value as OperatorTeam })
          }
        >
          <option value="Attacker">Attacker</option>
          <option value="Defender">Defender</option>
        </select>
      </label>
      <label>
        Box
        <select
          value={draft.source}
          onChange={(e) =>
            setDraft({ ...draft, source: e.target.value as OperatorSource })
          }
        >
          {SOURCES.map((source) => (
            <option key={source} value={source}>
              {OPERATOR_SOURCE_LABELS[source]}
            </option>
          ))}
        </select>
      </label>
    </div>
    <label className="json-editor-check">
      <input
        type="checkbox"
        checked={draft.statsVerified}
        onChange={(e) =>
          setDraft({ ...draft, statsVerified: e.target.checked })
        }
      />
      Stats verified from the card
    </label>
    <SectionSaveRow onSave={onSave} saving={saving} status={status} />
  </div>
);

export const StatsFields = ({
  draft,
  setDraft,
  onSave,
  saving,
  status,
}: FieldsProps) => (
  <div className="section-edit-fields">
    <div className="json-editor-grid">
      <label>
        Stamina
        <input
          inputMode="numeric"
          value={draft.stamina}
          onChange={(e) => setDraft({ ...draft, stamina: e.target.value })}
        />
      </label>
      <label>
        Run
        <input
          inputMode="numeric"
          value={draft.run}
          onChange={(e) => setDraft({ ...draft, run: e.target.value })}
          placeholder="blank if none"
        />
      </label>
      <label>
        Destroy
        <select
          value={draft.destroy}
          onChange={(e) =>
            setDraft({
              ...draft,
              destroy: e.target.value as Draft["destroy"],
            })
          }
        >
          <option value="">None</option>
          {TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {tier}
            </option>
          ))}
        </select>
      </label>
    </div>
    <SectionSaveRow onSave={onSave} saving={saving} status={status} />
  </div>
);

export const RangeFields = ({
  draft,
  setDraft,
  onSave,
  saving,
  status,
}: FieldsProps) => (
  <div className="section-edit-fields">
    <p className="muted">Dice colors: yellow orange red.</p>
    {BANDS.map((band) => (
      <div key={band} className="json-editor-range-row">
        <span>{RANGE_BAND_LABELS[band]}</span>
        <input
          aria-label={`${band} spaces`}
          value={draft.rangeSpaces[band]}
          onChange={(e) =>
            setDraft({
              ...draft,
              rangeSpaces: { ...draft.rangeSpaces, [band]: e.target.value },
            })
          }
        />
        <input
          aria-label={`${band} dice`}
          placeholder="yellow red red"
          value={draft.rangeDice[band]}
          onChange={(e) =>
            setDraft({
              ...draft,
              rangeDice: { ...draft.rangeDice, [band]: e.target.value },
            })
          }
        />
      </div>
    ))}
    <SectionSaveRow onSave={onSave} saving={saving} status={status} />
  </div>
);

export const GadgetFields = ({
  draft,
  setDraft,
  onSave,
  saving,
  status,
}: FieldsProps) => (
  <div className="section-edit-fields">
    <div className="json-editor-grid">
      <label>
        Gadget name
        <input
          value={draft.gadgetName}
          onChange={(e) => setDraft({ ...draft, gadgetName: e.target.value })}
        />
      </label>
      <label>
        Kind
        <select
          value={draft.gadgetKind}
          onChange={(e) =>
            setDraft({ ...draft, gadgetKind: e.target.value as GadgetKind })
          }
        >
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {GADGET_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>
    </div>
    <label className="json-editor-block">
      Rules (one line per bullet)
      <textarea
        rows={5}
        value={draft.gadgetText}
        onChange={(e) => setDraft({ ...draft, gadgetText: e.target.value })}
      />
    </label>
    <SectionSaveRow onSave={onSave} saving={saving} status={status} />
  </div>
);

export const NotesFields = ({
  draft,
  setDraft,
  onSave,
  saving,
  status,
}: FieldsProps) => (
  <div className="section-edit-fields">
    <label className="json-editor-block">
      Notes (one per line)
      <textarea
        rows={3}
        value={draft.notesText}
        onChange={(e) => setDraft({ ...draft, notesText: e.target.value })}
      />
    </label>
    <SectionSaveRow onSave={onSave} saving={saving} status={status} />
  </div>
);
