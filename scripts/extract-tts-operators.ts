/**
 * Extract operator profile/gadget cards from the official 6: Siege TTS Corebox
 * workshop JSON, then slice Steam Cloud card sheets into gitignored PNGs.
 *
 * Usage:
 *   pnpm exec tsx scripts/extract-tts-operators.ts
 *   pnpm exec tsx scripts/extract-tts-operators.ts --json /path/to/2920905487.json
 */
import { execFile } from "child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { homedir } from "os";
import path from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "tmp", "tts-cards");

const DEFAULT_TTS_JSON = path.join(
  homedir(),
  "Library",
  "Tabletop Simulator",
  "Mods",
  "Workshop",
  "Video Game",
  "2920905487.json",
);

const TTS_CACHE_DIRS = [
  path.join(homedir(), "Library", "Tabletop Simulator", "Mods", "Images"),
  path.join(homedir(), "Library", "Tabletop Simulator", "Mods", "Images Raw"),
];

const NAME_ALIASES: Record<string, string> = {
  Kaplan: "Kapkan",
  Tachanca: "Tachanka",
  Jager: "Jäger",
  Capitao: "Capitão",
  Nokk: "Nøkk",
};

const RAW_NICKNAMES = new Set([
  "Ace",
  "Alibi",
  "Amaru",
  "Aruni",
  "Ash",
  "Bandit",
  "Blackbeard",
  "Blitz",
  "Buck",
  "Capitao",
  "Castle",
  "Caveira",
  "Clash",
  "Doc",
  "Dokkaebi",
  "Echo",
  "Ela",
  "Finka",
  "Flores",
  "Frost",
  "Fuze",
  "Glaz",
  "Gridlock",
  "Hibana",
  "IQ",
  "Iana",
  "Jackal",
  "Jager",
  "Kaid",
  "Kali",
  "Kaplan",
  "Lesion",
  "Lion",
  "Maestro",
  "Maverick",
  "Melusi",
  "Mira",
  "Montagne",
  "Mute",
  "Nokk",
  "Nomad",
  "Oryx",
  "Pulse",
  "Rook",
  "Sledge",
  "Smoke",
  "Tachanca",
  "Thatcher",
  "Thermite",
  "Thunderbird",
  "Twitch",
  "Valkyrie",
  "Vigil",
  "Ying",
  "Zero",
  "Zofia",
]);

const SKIP_CARD_NICKS = new Set(["Activation", "Activation Red"]);

interface CustomDeckDef {
  FaceURL?: string;
  BackURL?: string;
  NumWidth?: number;
  NumHeight?: number;
  UniqueBack?: boolean;
}

interface TtsObject {
  Name?: string;
  Nickname?: string;
  CardID?: number;
  CustomDeck?: Record<string, CustomDeckDef>;
  Transform?: { scaleX?: number };
  ContainedObjects?: TtsObject[];
  ObjectStates?: TtsObject[];
  [key: string]: unknown;
}

interface FoundCard {
  name: string;
  nickname: string;
  cardId: number | null;
  numWidth: number;
  numHeight: number;
  scaleX: number;
  faceUrl: string;
  backUrl: string;
  uniqueBack: boolean;
  role: "profile" | "gadget" | "token";
}

interface OperatorKit {
  rawNickname: string;
  displayName: string;
  cards: FoundCard[];
}

interface ManifestSlice {
  role: FoundCard["role"];
  file: string;
  cardId: number;
  grid: string;
  cell: number;
  faceUrl: string;
}

interface ManifestOperator {
  id: string;
  name: string;
  rawNickname: string;
  slices: ManifestSlice[];
}

function displayName(raw: string): string {
  return NAME_ALIASES[raw] ?? raw;
}

function slug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function httpsUrl(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}

function ugcCacheKey(url: string): string | null {
  const match = url.match(/\/ugc\/([^/?#]+)\/([^/?#]+)/i);
  if (!match) return null;
  return `${match[1]}${match[2]}`.replace(/\/+$/, "").toLowerCase();
}

function ugcHash(url: string): string | null {
  const match = url.match(/\/ugc\/[^/?#]+\/([^/?#]+)/i);
  if (!match) return null;
  return match[1].replace(/\/+$/, "").toLowerCase();
}

function indexTtsImageCache(dir: string, index: Map<string, string>): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
    const file = path.join(dir, name);
    const stem = name.replace(/\.[^.]+$/, "").toLowerCase();
    const ugc = stem.match(/ugc([a-z0-9]+)$/);
    if (ugc) index.set(ugc[1], file);
    const hash40 = stem.match(/([a-f0-9]{40})$/);
    if (hash40) index.set(hash40[1], file);
  }
}

function downloadCandidates(url: string): string[] {
  const https = httpsUrl(url);
  const pathMatch = https.match(/\/ugc\/[^/?#]+\/[^/?#]+/i);
  const ugcPath = pathMatch ? pathMatch[0].replace(/\/+$/, "") : null;
  const hosts = [
    https,
    https.replace(
      /https:\/\/cloud-\d+\.steamusercontent\.com/i,
      "https://steamusercontent-a.akamaihd.net",
    ),
  ];
  if (ugcPath) {
    hosts.push(`https://steamusercontent-a.akamaihd.net${ugcPath}/`);
    hosts.push(`https://steamusercontent-a.akamaihd.net${ugcPath}`);
  }
  return [...new Set(hosts)];
}

function parseJsonPath(): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--json");
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return DEFAULT_TTS_JSON;
}

function walkValues(obj: unknown, visit: (node: TtsObject) => void): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) walkValues(item, visit);
    return;
  }
  const node = obj as TtsObject;
  visit(node);
  for (const value of Object.values(node)) walkValues(value, visit);
}

function descendantOperatorFigures(root: TtsObject): Set<string> {
  const found = new Set<string>();
  walkValues(root, (node) => {
    const nick = node.Nickname ?? "";
    if (node.Name === "Figurine_Custom" && RAW_NICKNAMES.has(nick)) {
      found.add(nick);
    }
  });
  return found;
}

function classifyCard(scaleX: number, gridCells: number): FoundCard["role"] {
  if (scaleX >= 1.8) return "profile";
  if (scaleX >= 0.72 && scaleX <= 0.82 && gridCells >= 6) return "gadget";
  return "token";
}

function collectCards(root: TtsObject): FoundCard[] {
  const cards: FoundCard[] = [];
  walkValues(root, (node) => {
    const decks = node.CustomDeck;
    if (!decks) return;
    const nick = node.Nickname ?? "";
    if (SKIP_CARD_NICKS.has(nick)) return;
    const scaleX = node.Transform?.scaleX ?? 1;
    for (const def of Object.values(decks)) {
      const faceUrl = def.FaceURL?.trim();
      if (!faceUrl) continue;
      const numWidth = def.NumWidth ?? 1;
      const numHeight = def.NumHeight ?? 1;
      const cardId = typeof node.CardID === "number" ? node.CardID : null;
      if (cardId === null) continue;
      cards.push({
        name: node.Name ?? "Card",
        nickname: nick,
        cardId,
        numWidth,
        numHeight,
        scaleX,
        faceUrl,
        backUrl: def.BackURL ?? "",
        uniqueBack: Boolean(def.UniqueBack),
        role: classifyCard(scaleX, numWidth * numHeight),
      });
    }
  });
  return dedupeCards(cards);
}

function dedupeCards(cards: FoundCard[]): FoundCard[] {
  const seen = new Set<string>();
  const out: FoundCard[] = [];
  for (const card of cards) {
    const key = `${card.faceUrl}|${card.cardId}|${card.numWidth}x${card.numHeight}|${card.role}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(card);
  }
  return out;
}

function kitScore(cards: FoundCard[]): number {
  const hasProfile = cards.some((c) => c.role === "profile");
  const hasGadget = cards.some((c) => c.role === "gadget");
  return (hasProfile ? 100 : 0) + (hasGadget ? 10 : 0) - cards.length;
}

function findKits(save: TtsObject): OperatorKit[] {
  const bags: TtsObject[] = [];
  walkValues(save, (node) => {
    if (
      (node.Name === "Custom_Model_Bag" ||
        node.Name === "Custom_Model_Infinite_Bag") &&
      Array.isArray(node.ContainedObjects)
    ) {
      bags.push(node);
    }
  });

  const best = new Map<string, FoundCard[]>();
  for (const bag of bags) {
    const figures = descendantOperatorFigures(bag);
    if (figures.size !== 1) continue;
    const raw = [...figures][0];
    const cards = collectCards(bag);
    if (cards.length === 0) continue;
    const prev = best.get(raw);
    if (!prev || kitScore(cards) > kitScore(prev)) {
      best.set(raw, cards);
    }
  }

  return [...best.entries()]
    .map(([rawNickname, cards]) => ({
      rawNickname,
      displayName: displayName(rawNickname),
      cards,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function resolveSheet(
  url: string,
  dest: string,
  cache: Map<string, string>,
): Promise<boolean> {
  if (existsSync(dest)) return true;
  mkdirSync(path.dirname(dest), { recursive: true });
  const keys = [ugcCacheKey(url), ugcHash(url)].filter(
    (key): key is string => Boolean(key),
  );
  for (const key of keys) {
    const cached = cache.get(key.toLowerCase());
    if (cached && existsSync(cached)) {
      copyFileSync(cached, dest);
      return true;
    }
  }
  for (const candidate of downloadCandidates(url)) {
    try {
      await execFileAsync("curl", [
        "-fsSL",
        "--retry",
        "2",
        "-k",
        "-A",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "-o",
        dest,
        candidate,
      ]);
      if (existsSync(dest)) {
        const stat = statSync(dest);
        if (stat.size > 1000) return true;
        unlinkSync(dest);
      }
    } catch {
      if (existsSync(dest)) {
        unlinkSync(dest);
      }
    }
  }
  console.warn(`  not in cache / steam unavailable: ${url}`);
  return false;
}

async function sliceCard(
  sheetPath: string,
  dest: string,
  cardId: number,
  numWidth: number,
  numHeight: number,
): Promise<void> {
  if (existsSync(dest)) return;
  const cell = cardId % 100;
  const col = cell % numWidth;
  const row = Math.floor(cell / numWidth);
  if (row >= numHeight) {
    throw new Error(
      `Cell ${cell} is outside ${numWidth}x${numHeight} for ${sheetPath}`,
    );
  }
  const image = sharp(sheetPath);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new Error(`Could not read dimensions: ${sheetPath}`);
  }
  const cellW = Math.floor(width / numWidth);
  const cellH = Math.floor(height / numHeight);
  mkdirSync(path.dirname(dest), { recursive: true });
  await image
    .extract({
      left: col * cellW,
      top: row * cellH,
      width: cellW,
      height: cellH,
    })
    .png()
    .toFile(dest);
}

async function main(): Promise<void> {
  const jsonPath = parseJsonPath();
  if (!existsSync(jsonPath)) {
    throw new Error(`TTS workshop JSON not found: ${jsonPath}`);
  }

  console.log(`Reading ${jsonPath}`);
  const save = JSON.parse(readFileSync(jsonPath, "utf8")) as TtsObject;
  const kits = findKits(save);
  console.log(`Found ${kits.length} operator kits`);

  const sheetsDir = path.join(OUT_DIR, "_sheets");
  mkdirSync(sheetsDir, { recursive: true });

  const uniqueUrls = [
    ...new Set(
      kits.flatMap((kit) =>
        kit.cards
          .filter((c) => c.role === "profile" || c.role === "gadget")
          .map((c) => c.faceUrl),
      ),
    ),
  ];

  const cache = new Map<string, string>();
  for (const dir of TTS_CACHE_DIRS) {
    indexTtsImageCache(dir, cache);
  }
  console.log(`Indexed ${cache.size} TTS image cache keys`);

  const urlToSheet = new Map<string, string>();
  for (const [i, url] of uniqueUrls.entries()) {
    const key = ugcCacheKey(url) ?? `sheet-${String(i).padStart(2, "0")}`;
    const withExt = path.join(sheetsDir, `${key}.img`);
    console.log(`Resolving sheet ${i + 1}/${uniqueUrls.length}`);
    const ok = await resolveSheet(url, withExt, cache);
    if (ok) urlToSheet.set(url, withExt);
  }

  const operators: ManifestOperator[] = [];
  for (const kit of kits) {
    const id = slug(kit.displayName);
    const opDir = path.join(OUT_DIR, id);
    mkdirSync(opDir, { recursive: true });
    const slices: ManifestSlice[] = [];
    const usedNames = new Set<string>();

    for (const card of kit.cards) {
      if (card.role === "token") continue;
      const sheetPath = urlToSheet.get(card.faceUrl);
      if (!sheetPath) continue;
      let fileName = `${card.role}.png`;
      if (usedNames.has(fileName)) {
        fileName = `${card.role}-${card.cardId}.png`;
      }
      usedNames.add(fileName);
      const dest = path.join(opDir, fileName);
      await sliceCard(
        sheetPath,
        dest,
        card.cardId,
        card.numWidth,
        card.numHeight,
      );
      slices.push({
        role: card.role,
        file: path.relative(OUT_DIR, dest),
        cardId: card.cardId,
        grid: `${card.numWidth}x${card.numHeight}`,
        cell: card.cardId % 100,
        faceUrl: card.faceUrl,
      });
    }

    operators.push({
      id,
      name: kit.displayName,
      rawNickname: kit.rawNickname,
      slices,
    });
  }

  const missingProfile = operators.filter(
    (op) => !op.slices.some((s) => s.role === "profile"),
  );
  const withProfile = operators.length - missingProfile.length;
  if (missingProfile.length > 0) {
    console.warn(
      `No cached profile card for ${missingProfile.length} operators: ${missingProfile.map((o) => o.name).join(", ")}`,
    );
  }

  const manifest = {
    source: "2920905487",
    extractedAt: new Date().toISOString(),
    operatorCount: operators.length,
    operators,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `Wrote ${operators.length} operators (${withProfile} with profile images) to ${OUT_DIR}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
