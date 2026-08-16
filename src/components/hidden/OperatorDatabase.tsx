import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import "./OperatorDatabase.css";
import TacticalHeader from "./TacticalHeader";
import {
  COMBAT_DICE_META,
  DICE_POOL_STORAGE_KEY,
  type CombatDiceTier,
} from "../../data/combatDice";
import {
  GADGET_KIND_LABELS,
  OPERATORS,
  OPERATOR_SOURCE_LABELS,
  RANGE_BAND_LABELS,
  ttsCardUrl,
  type Operator,
  type OperatorSource,
  type OperatorTeam,
  type RangeBand,
} from "../../data/operators";
import {
  GadgetFields,
  HeaderFields,
  RangeFields,
  SectionEditButton,
  StatsFields,
  useLocalOperatorEditor,
  useOperatorCardEditor,
} from "./OperatorLocalEditor";

type TeamFilter = "All" | OperatorTeam;
type SourceFilter = "All" | OperatorSource;

const SOURCES: OperatorSource[] = [
  "core",
  "year1",
  "year2",
  "year3",
  "year4",
  "year5",
  "year6plus",
];

const LocalCardImage = ({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (failed) {
    return <>{fallback ?? null}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={loaded ? undefined : { opacity: 0, position: "absolute" }}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
};

const DicePips = ({ dice }: { dice: CombatDiceTier[] }) => (
  <span className="dice-pips">
    {dice.map((tier, i) => (
      <span
        key={`${tier}-${i}`}
        className={`dice-pip dice-pip--${tier}`}
        title={COMBAT_DICE_META[tier].label}
      />
    ))}
    <span className="visually-hidden">
      {dice.map((tier) => COMBAT_DICE_META[tier].label).join(" + ")}
    </span>
  </span>
);

const OperatorDetailPane = ({
  operator,
  canEditLocally,
  onSaved,
  onLoadRange,
}: {
  operator: Operator;
  canEditLocally: boolean;
  onSaved: (next: Operator) => void;
  onLoadRange: (op: Operator, band: RangeBand) => void;
}) => {
  const editor = useOperatorCardEditor(operator, onSaved);
  const fields = {
    draft: editor.draft,
    setDraft: editor.setDraft,
    onSave: () => void editor.save(),
    saving: editor.saving,
    status: editor.status,
  };

  const startEdit = (section: NonNullable<typeof editor.editing>) => {
    if (editor.editing === section) {
      editor.cancel();
      return;
    }
    editor.setEditing(section);
  };

  return (
    <div className="operator-profile">
      <div className="operator-header">
        <div className="section-head">
          {editor.editing === "header" ? (
            <h3>Identity</h3>
          ) : (
            <h3>{operator.name}</h3>
          )}
          {canEditLocally && (
            <SectionEditButton
              section="header"
              editing={editor.editing}
              onToggle={startEdit}
            />
          )}
        </div>
        {editor.editing === "header" && canEditLocally ? (
          <HeaderFields {...fields} />
        ) : (
          <div className="operator-header-badges">
            <span className="source-badge">
              {OPERATOR_SOURCE_LABELS[operator.source]}
            </span>
            <span className={`team-badge ${operator.team.toLowerCase()}`}>
              {operator.team}
            </span>
          </div>
        )}
      </div>

      {!operator.statsVerified && editor.editing !== "header" && (
        <div className="operator-meta-row">
          <span className="unverified-banner" role="status">
            Unverified — confirm against the card.
          </span>
        </div>
      )}

      <div className="operator-image">
        <LocalCardImage
          src={ttsCardUrl(operator.id, "profile")}
          alt={`${operator.name} operator profile card`}
          className="operator-profile-card"
          fallback={
            <div className="placeholder-portrait">
              No local card image. Run the TTS extractor after opening
              this operator in Tabletop Simulator.
            </div>
          }
        />
      </div>

      <div className="operator-stats">
        <div className="section-head">
          <h4>Combat stats</h4>
          {canEditLocally && (
            <SectionEditButton
              section="stats"
              editing={editor.editing}
              onToggle={startEdit}
            />
          )}
        </div>
        {editor.editing === "stats" && canEditLocally ? (
          <StatsFields {...fields} />
        ) : (
          <div className="operator-stats-row">
            <div className="stat-group">
              <label>Stamina</label>
              <div className="stat-value">{operator.stamina ?? "—"}</div>
            </div>
            <div className="stat-group">
              <label>Run</label>
              <div className="stat-value">{operator.run ?? "—"}</div>
            </div>
            <div className="stat-group">
              <label>Destroy</label>
              <div className="stat-value">
                {operator.destroy ? (
                  <span className={`destroy-pip destroy-pip--${operator.destroy}`}>
                    {COMBAT_DICE_META[operator.destroy].label}
                  </span>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="operator-loadout">
        <div className="section-head">
          <h4>Hit dice by range</h4>
          {canEditLocally && (
            <SectionEditButton
              section="ranges"
              editing={editor.editing}
              onToggle={startEdit}
            />
          )}
        </div>
        {editor.editing === "ranges" && canEditLocally ? (
          <RangeFields {...fields} />
        ) : operator.ranges && operator.ranges.length > 0 ? (
          <table className="range-table">
            <thead>
              <tr>
                <th scope="col">Range</th>
                <th scope="col">Spaces</th>
                <th scope="col">Dice</th>
                <th scope="col">
                  <span className="visually-hidden">Load into roller</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {operator.ranges.map((band) => (
                <tr key={band.id}>
                  <th scope="row">{RANGE_BAND_LABELS[band.id]}</th>
                  <td>{band.spaces}</td>
                  <td>
                    <DicePips dice={band.dice} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="load-dice-button"
                      onClick={() => onLoadRange(operator, band)}
                    >
                      Load dice pool
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">
            Range dice not transcribed — load this operator in TTS so
            the profile card can be cached, then re-run the extractor.
          </p>
        )}
      </div>

      <div className="operator-loadout">
        <div className="section-head">
          <h4>Unique gadget</h4>
          {canEditLocally && (
            <SectionEditButton
              section="gadget"
              editing={editor.editing}
              onToggle={startEdit}
            />
          )}
        </div>
        {editor.editing === "gadget" && canEditLocally ? (
          <GadgetFields {...fields} />
        ) : (
          <div className="ability-group">
            <label>{operator.gadgetName}</label>
            <p className="gadget-kind">
              {GADGET_KIND_LABELS[operator.gadgetKind]}
            </p>
            {operator.gadget.length > 0 ? (
              <ul className="gadget-list">
                {operator.gadget.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                Paraphrased rules will be filled once the profile card
                image is available.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const operatorPath = (id: string) => `/operator-database/${id}`;

const OperatorDatabase = () => {
  const navigate = useNavigate();
  const { operatorId } = useParams<{ operatorId: string }>();
  const canEditLocally = useLocalOperatorEditor();
  const [roster, setRoster] = useState<Operator[]>(OPERATORS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState<TeamFilter>("All");
  const [filterSource, setFilterSource] = useState<SourceFilter>("All");

  const selectedOperator: Operator | null =
    roster.find((op) => op.id === operatorId) ?? null;
  const fallbackId =
    roster.find((op) => op.statsVerified)?.id ?? roster[0]?.id ?? null;

  const filteredOperators = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return roster.filter((op) => {
      const matchesSearch =
        !q ||
        op.name.toLowerCase().includes(q) ||
        op.gadgetName.toLowerCase().includes(q);
      const matchesTeam = filterTeam === "All" || op.team === filterTeam;
      const matchesSource = filterSource === "All" || op.source === filterSource;
      return matchesSearch && matchesTeam && matchesSource;
    });
  }, [searchTerm, filterTeam, filterSource, roster]);

  useEffect(() => {
    if (!selectedOperator) return;
    document
      .getElementById(`operator-${selectedOperator.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedOperator?.id]);

  if (!selectedOperator && fallbackId) {
    return <Navigate to={operatorPath(fallbackId)} replace />;
  }

  const loadRangeDice = (op: Operator, band: RangeBand) => {
    sessionStorage.setItem(
      DICE_POOL_STORAGE_KEY,
      JSON.stringify({
        dice: band.dice,
        label: `${op.name} ${RANGE_BAND_LABELS[band.id]} (${band.spaces})`,
      }),
    );
    navigate("/dice-roller");
  };

  const selectOperator = (id: string) => {
    if (id === operatorId) return;
    navigate(operatorPath(id), { replace: true });
  };

  const selectByIndex = (index: number) => {
    const next = filteredOperators[index];
    if (next) selectOperator(next.id);
  };

  const onRosterKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (filteredOperators.length === 0) return;
    const current = filteredOperators.findIndex((op) => op.id === operatorId);
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      selectByIndex(
        current < 0 ? 0 : Math.min(filteredOperators.length - 1, current + 1),
      );
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectByIndex(current < 0 ? 0 : Math.max(0, current - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      selectByIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectByIndex(filteredOperators.length - 1);
    }
  };

  return (
    <div className="operator-database">
      <TacticalHeader title="Operator Database" />

      <div className="operator-filters">
        <div className="search-box">
          <label className="visually-hidden" htmlFor="operator-search">
            Search operators
          </label>
          <input
            id="operator-search"
            type="text"
            placeholder="Search operators or gadgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="team-filter" role="group" aria-label="Filter by team">
          {(["All", "Attacker", "Defender"] as const).map((team) => (
            <button
              key={team}
              type="button"
              className={filterTeam === team ? "active" : ""}
              onClick={() => setFilterTeam(team)}
            >
              {team === "All" ? "All" : team === "Attacker" ? "Attackers" : "Defenders"}
            </button>
          ))}
        </div>

        <div className="source-filter">
          <label htmlFor="operator-source">Expansion</label>
          <select
            id="operator-source"
            value={filterSource}
            onChange={(e) =>
              setFilterSource(e.target.value as SourceFilter)
            }
          >
            <option value="All">All expansions</option>
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {OPERATOR_SOURCE_LABELS[source]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="operator-content">
        <div
          className="operators-list"
          role="listbox"
          tabIndex={0}
          aria-label="Operator roster"
          aria-activedescendant={
            selectedOperator ? `operator-${selectedOperator.id}` : undefined
          }
          onKeyDown={onRosterKeyDown}
        >
          {filteredOperators.map((operator) => (
            <button
              type="button"
              key={operator.id}
              id={`operator-${operator.id}`}
              role="option"
              aria-selected={selectedOperator?.id === operator.id}
              className={`operator-card ${selectedOperator?.id === operator.id ? "selected" : ""}`}
              onClick={() => selectOperator(operator.id)}
            >
              <div className={`operator-icon ${operator.team.toLowerCase()}`}>
                <LocalCardImage
                  src={ttsCardUrl(operator.id, "portrait")}
                  alt=""
                  className="operator-portrait"
                  fallback={
                    <div className="placeholder-image">
                      {operator.name.charAt(0)}
                    </div>
                  }
                />
              </div>
              <div className="operator-card-text">
                <div className="operator-name">{operator.name}</div>
                <div className={`operator-team ${operator.team.toLowerCase()}`}>
                  {OPERATOR_SOURCE_LABELS[operator.source]}
                </div>
              </div>
            </button>
          ))}

          {filteredOperators.length === 0 && (
            <div className="no-results">
              No operators found matching your filters.
            </div>
          )}
        </div>

        <div className="operator-details">
          {selectedOperator ? (
            <OperatorDetailPane
              key={selectedOperator.id}
              operator={selectedOperator}
              canEditLocally={canEditLocally}
              onSaved={(next) =>
                setRoster((prev) =>
                  prev.map((op) => (op.id === next.id ? next : op)),
                )
              }
              onLoadRange={loadRangeDice}
            />
          ) : (
            <div className="no-selection">
              <p>Select an operator to view their details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorDatabase;
