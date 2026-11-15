// Carica nel bucket Storage "listings" le foto di public/photos/ usate da esperienze, alberghi e case.
// Il percorso in Storage è il nome del file (es. "c_boat.jpg"), lo stesso salvato in listing_photos.path dal seed.
// Uso: node scripts/upload-photos.mjs  (chiede la chiave segreta senza mostrarla; non va salvata in nessun file)
//   oppure SUPABASE_SERVICE_ROLE_KEY=<chiave> node scripts/upload-photos.mjs
// L'URL del progetto viene da .env.local (NEXT_PUBLIC_SUPABASE_URL) o da SUPABASE_URL.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const env = Object.fromEntries(
  (fs.existsSync(path.join(root, ".env.local")) ? fs.readFileSync(path.join(root, ".env.local"), "utf8") : "")
    .split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL = process.env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
if (!URL) {
  console.error("Manca NEXT_PUBLIC_SUPABASE_URL in .env.local.");
  process.exit(1);
}
const looksFake = (k) => !k || /xxxx|INCOLLA|TUA_CHIAVE|\.\.\./i.test(k) || k.length < 30;

// Se la chiave non è sulla riga di comando, la chiede senza mostrarla a schermo.
async function askKey() {
  process.stdout.write("Incolla la chiave segreta di Supabase (sb_secret_… o service_role) e premi Invio: ");
  process.stdin.setRawMode?.(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  let key = "";
  return new Promise((resolve) => {
    process.stdin.on("data", (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          process.stdout.write("\n");
          return resolve(key.trim());
        }
        if (ch === "\u0003") process.exit(1);
        if (ch === "\u007f") key = key.slice(0, -1);
        else key += ch;
      }
    });
  });
}

// La chiave può stare anche in .env.upload (ignorato da git, da cancellare dopo).
const uploadFile = path.join(root, ".env.upload");
const fileKey = fs.existsSync(uploadFile)
  ? (fs.readFileSync(uploadFile, "utf8").match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m)?.[1] ?? "").trim()
  : "";
const given = looksFake(process.env.SUPABASE_SERVICE_ROLE_KEY) ? fileKey : process.env.SUPABASE_SERVICE_ROLE_KEY;
const KEY = looksFake(given) ? await askKey() : given;
if (looksFake(KEY)) {
  console.error("Chiave non valida: copiala da Supabase → Project Settings → API Keys.");
  process.exit(1);
}

// Le foto citate nei file di content/ (campo image: "/photos/…").
const images = new Set();
for (const dir of ["experiences", "stays"]) {
  const base = path.join(root, "content", dir);
  for (const city of fs.readdirSync(base)) {
    for (const f of fs.readdirSync(path.join(base, city)).filter((x) => x.endsWith(".md"))) {
      const { data } = matter(fs.readFileSync(path.join(base, city, f), "utf8"));
      if (typeof data.image === "string" && data.image.startsWith("/photos/")) images.add(data.image.slice("/photos/".length));
    }
  }
}

let ok = 0;
for (const name of [...images].sort()) {
  const body = fs.readFileSync(path.join(root, "public", "photos", name));
  const res = await fetch(`${URL}/storage/v1/object/listings/${encodeURIComponent(name)}`, {
    method: "POST",
    // Vale sia per la chiave nuova (sb_secret_…) sia per la service_role legacy (JWT): il gateway di Supabase le accetta in entrambi gli header.
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": "image/jpeg", "x-upsert": "true", "Cache-Control": "max-age=31536000" },
    body,
  });
  if (res.ok) ok++;
  console.log(`${res.ok ? "ok " : "ERR"} ${name}${res.ok ? "" : ` ${res.status} ${await res.text()}`}`);
}
console.log(`${ok}/${images.size} foto in Storage (bucket "listings").`);
