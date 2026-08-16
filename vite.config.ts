import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import type { IncomingMessage, ServerResponse } from "node:http";

const TTS_CARDS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "tmp/tts-cards",
);

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** Serve gitignored TTS card slices at /tts-cards during local dev/preview. */
function serveTtsCards(): Plugin {
  const handle = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = req.url ?? "";
    if (!url.startsWith("/tts-cards/")) {
      next();
      return;
    }

    const rel = decodeURIComponent(url.slice("/tts-cards/".length).split("?")[0]);
    if (
      !rel ||
      rel.includes("..") ||
      path.isAbsolute(rel) ||
      rel.startsWith("_sheets/")
    ) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const file = path.resolve(TTS_CARDS_DIR, rel);
    if (!file.startsWith(TTS_CARDS_DIR + path.sep) || !fs.existsSync(file)) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const stat = fs.statSync(file);
    if (!stat.isFile()) {
      res.statusCode = 404;
      res.end();
      return;
    }

    res.setHeader(
      "Content-Type",
      MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
    );
    res.setHeader("Cache-Control", "no-cache");
    fs.createReadStream(file).pipe(res);
  };

  return {
    name: "serve-tts-cards",
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

const OPERATORS_JSON = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "src/data/operators.json",
);

function isLoopback(req: IncomingMessage): boolean {
  const addr = req.socket.remoteAddress ?? "";
  return (
    addr === "127.0.0.1" ||
    addr === "::1" ||
    addr === "::ffff:127.0.0.1"
  );
}

function jsonResponse(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function formatOperatorsJson(operators: unknown[]): string {
  let json = JSON.stringify(operators, null, 2);
  json = json.replace(
    /\[\s*\n\s*((?:"(?:yellow|orange|red)",?\s*)+)\n\s*\]/g,
    (_match, inner: string) =>
      `[${inner.replace(/\s+/g, " ").trim().replace(/,$/, "")}]`,
  );
  json = json.replace(
    /\{\s*\n\s*"id": ("(?:short|medium|long)"),\s*\n\s*"spaces": ("[^"]*"),\s*\n\s*"dice": (\[[^\]]+\])\s*\n\s*\}/g,
    '{ "id": $1, "spaces": $2, "dice": $3 }',
  );
  return `${json}\n`;
}

function sanitizeOperator(value: unknown, expectedId: string): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || raw.id !== expectedId) return null;
  if (typeof raw.name !== "string" || raw.name.trim() === "") return null;
  if (raw.team !== "Attacker" && raw.team !== "Defender") return null;
  const sources = [
    "core",
    "year1",
    "year2",
    "year3",
    "year4",
    "year5",
    "year6plus",
  ];
  if (typeof raw.source !== "string" || !sources.includes(raw.source)) {
    return null;
  }
  if (typeof raw.gadgetName !== "string") return null;
  const kinds = ["setup", "action", "reaction", "passive"];
  if (typeof raw.gadgetKind !== "string" || !kinds.includes(raw.gadgetKind)) {
    return null;
  }
  if (!Array.isArray(raw.gadget) || raw.gadget.some((line) => typeof line !== "string")) {
    return null;
  }
  if (typeof raw.statsVerified !== "boolean") return null;
  const out: Record<string, unknown> = {
    id: raw.id,
    name: raw.name.trim(),
    team: raw.team,
    source: raw.source,
    gadgetName: raw.gadgetName,
    gadgetKind: raw.gadgetKind,
    gadget: raw.gadget.map((line) => line.trim()).filter(Boolean),
  };
  if (typeof raw.stamina === "number" && Number.isFinite(raw.stamina)) {
    out.stamina = raw.stamina;
  }
  if (typeof raw.run === "number" && Number.isFinite(raw.run)) {
    out.run = raw.run;
  }
  if (raw.destroy === "yellow" || raw.destroy === "orange" || raw.destroy === "red") {
    out.destroy = raw.destroy;
  }
  if (typeof raw.weaponName === "string" && raw.weaponName.trim()) {
    out.weaponName = raw.weaponName.trim();
  }
  if (Array.isArray(raw.ranges)) {
    const ranges = raw.ranges.flatMap((band) => {
      if (!band || typeof band !== "object") return [];
      const row = band as Record<string, unknown>;
      if (row.id !== "short" && row.id !== "medium" && row.id !== "long") {
        return [];
      }
      if (typeof row.spaces !== "string") return [];
      if (!Array.isArray(row.dice)) return [];
      const dice = row.dice.filter(
        (tier) => tier === "yellow" || tier === "orange" || tier === "red",
      );
      return [{ id: row.id, spaces: row.spaces, dice }];
    });
    if (ranges.length === 3 && ranges.every((band) => band.dice.length > 0)) {
      out.ranges = ranges;
    }
  }
  if (Array.isArray(raw.notes)) {
    const notes = raw.notes
      .filter((line) => typeof line === "string")
      .map((line) => line.trim())
      .filter(Boolean);
    if (notes.length > 0) out.notes = notes;
  }
  out.statsVerified = raw.statsVerified;
  return out;
}

/** Loopback-only write of src/data/operators.json from the Operator Database editor. */
function localOperatorsApi(): Plugin {
  const handle = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const pathOnly = (req.url ?? "").split("?")[0];
    if (!pathOnly.startsWith("/api/local-operators")) {
      next();
      return;
    }
    if (!isLoopback(req)) {
      jsonResponse(res, 403, { error: "localhost only" });
      return;
    }

    if (req.method === "GET" && pathOnly === "/api/local-operators") {
      jsonResponse(res, 200, { enabled: true });
      return;
    }

    const putMatch = pathOnly.match(/^\/api\/local-operators\/([^/]+)$/);
    if (req.method === "PUT" && putMatch) {
      const id = decodeURIComponent(putMatch[1]);
      let parsed: unknown;
      try {
        parsed = JSON.parse(await readBody(req));
      } catch {
        jsonResponse(res, 400, { error: "invalid json" });
        return;
      }
      const operator = sanitizeOperator(parsed, id);
      if (!operator) {
        jsonResponse(res, 400, { error: "invalid operator" });
        return;
      }
      if (!fs.existsSync(OPERATORS_JSON)) {
        jsonResponse(res, 500, { error: "operators.json missing" });
        return;
      }
      const roster = JSON.parse(
        fs.readFileSync(OPERATORS_JSON, "utf8"),
      ) as { id: string }[];
      const index = roster.findIndex((row) => row.id === id);
      if (index < 0) {
        jsonResponse(res, 404, { error: "operator not found" });
        return;
      }
      roster[index] = operator as { id: string };
      fs.writeFileSync(OPERATORS_JSON, formatOperatorsJson(roster));
      jsonResponse(res, 200, { ok: true, operator });
      return;
    }

    jsonResponse(res, 404, { error: "not found" });
  };

  return {
    name: "local-operators-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(req, res, next);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveTtsCards(), localOperatorsApi()],
});
