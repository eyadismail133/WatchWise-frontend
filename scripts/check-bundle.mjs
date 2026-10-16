import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const MANIFEST_PATHS = [
  path.join(DIST_DIR, ".vite", "manifest.json"),
  path.join(DIST_DIR, "manifest.json"),
];
const CHUNK_BUDGET = 500000;
const BASELINE_BYTES = 759405;

if (!fs.existsSync(DIST_DIR)) {
  console.error("FAIL: dist/ directory not found. Run 'npm run build' first.");
  process.exit(1);
}

const manifestPath = MANIFEST_PATHS.find((p) => fs.existsSync(p));
if (!manifestPath) {
  console.error("FAIL: Vite manifest.json not found in dist/.vite/ or dist/.");
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
} catch (err) {
  console.error(`FAIL: Could not parse manifest JSON: ${err.message}`);
  process.exit(1);
}

if (
  !manifest ||
  typeof manifest !== "object" ||
  Array.isArray(manifest) ||
  Object.keys(manifest).length === 0
) {
  console.error("FAIL: Manifest is empty or invalid object.");
  process.exit(1);
}

for (const [key, item] of Object.entries(manifest)) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    console.error(`FAIL: Manifest entry "${key}" must be a non-null object.`);
    process.exit(1);
  }

  if (typeof item.file !== "string" || item.file.trim().length === 0) {
    console.error(
      `FAIL: Manifest entry "${key}" must have a nonempty string "file" property.`,
    );
    process.exit(1);
  }

  if (item.isEntry !== undefined && typeof item.isEntry !== "boolean") {
    console.error(
      `FAIL: Manifest entry "${key}" has non-boolean "isEntry" property.`,
    );
    process.exit(1);
  }

  if (
    item.isDynamicEntry !== undefined &&
    typeof item.isDynamicEntry !== "boolean"
  ) {
    console.error(
      `FAIL: Manifest entry "${key}" has non-boolean "isDynamicEntry" property.`,
    );
    process.exit(1);
  }

  for (const depField of ["imports", "dynamicImports"]) {
    if (item[depField] !== undefined) {
      if (!Array.isArray(item[depField])) {
        console.error(
          `FAIL: Manifest entry "${key}" has malformed "${depField}" field (expected array).`,
        );
        process.exit(1);
      }
      for (const depKey of item[depField]) {
        if (typeof depKey !== "string" || depKey.trim().length === 0) {
          console.error(
            `FAIL: Manifest entry "${key}" contains non-string or empty key in "${depField}".`,
          );
          process.exit(1);
        }
        if (!Object.prototype.hasOwnProperty.call(manifest, depKey)) {
          console.error(
            `FAIL: Manifest entry "${key}" references missing manifest key "${depKey}" in "${depField}".`,
          );
          process.exit(1);
        }
      }
    }
  }
}

// 1. Check all emitted JS chunks against warning budget (500,000 bytes) and verify files exist
let largestJsChunk = null;
const allEmittedJsFiles = new Set();

const assetsDir = path.join(DIST_DIR, "assets");
if (!fs.existsSync(assetsDir)) {
  console.error("FAIL: dist/assets directory not found.");
  process.exit(1);
}

const dirFiles = fs.readdirSync(assetsDir);
for (const f of dirFiles) {
  if (f.endsWith(".js")) {
    const relPath = path.join("assets", f).replace(/\\/g, "/");
    allEmittedJsFiles.add(relPath);
  }
}

for (const [key, item] of Object.entries(manifest)) {
  const fullPath = path.join(DIST_DIR, item.file);
  if (!fs.existsSync(fullPath)) {
    console.error(
      `FAIL: Manifest entry "${key}" references file that does not exist on disk: ${item.file}`,
    );
    process.exit(1);
  }
  if (item.file.endsWith(".js")) {
    allEmittedJsFiles.add(item.file);
  }
}

if (allEmittedJsFiles.size === 0) {
  console.error("FAIL: No JS chunks found in manifest or assets directory.");
  process.exit(1);
}

const failedChunks = [];
for (const relFile of allEmittedJsFiles) {
  const fullPath = path.join(DIST_DIR, relFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL: Emitted JS file not found on disk: ${relFile}`);
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath);
  const rawSize = content.length;
  if (rawSize === 0) {
    console.error(`FAIL: Emitted JS chunk is empty (0 bytes): ${relFile}`);
    process.exit(1);
  }
  const gzipSize = zlib.gzipSync(content).length;
  const chunkInfo = { file: relFile, rawSize, gzipSize };
  if (!largestJsChunk || rawSize > largestJsChunk.rawSize) {
    largestJsChunk = chunkInfo;
  }
  if (rawSize > CHUNK_BUDGET) {
    failedChunks.push(chunkInfo);
  }
}

if (!largestJsChunk) {
  console.error("FAIL: No JS chunks were evaluated.");
  process.exit(1);
}

if (failedChunks.length > 0) {
  console.error(
    `FAIL: ${failedChunks.length} JS chunk(s) exceeded budget of ${CHUNK_BUDGET} bytes:`,
  );
  for (const c of failedChunks) {
    console.error(
      `  - ${c.file}: ${c.rawSize} bytes (gzip: ${c.gzipSize} bytes)`,
    );
  }
  process.exit(1);
}

// 2. Compute initial entry / static-import closure (deduplicated, excluding dynamicImports)
const entryKeys = Object.keys(manifest).filter(
  (key) => manifest[key].isEntry === true,
);
if (entryKeys.length === 0) {
  console.error("FAIL: No entry point (isEntry: true) found in manifest.");
  process.exit(1);
}

const staticClosureKeys = new Set();
function collectStaticClosure(key) {
  if (staticClosureKeys.has(key)) return;
  staticClosureKeys.add(key);
  const item = manifest[key];
  if (!item) {
    console.error(
      `FAIL: Referenced manifest static import key "${key}" not found in manifest.`,
    );
    process.exit(1);
  }
  if (item.imports !== undefined) {
    for (const imp of item.imports) {
      collectStaticClosure(imp);
    }
  }
}

for (const entryKey of entryKeys) {
  collectStaticClosure(entryKey);
}

const initialClosureFiles = new Set();
let initialRawSize = 0;
let initialGzipSize = 0;
const closureDetails = [];

for (const key of staticClosureKeys) {
  const item = manifest[key];
  if (!item || !item.file) {
    console.error(
      `FAIL: Manifest entry "${key}" in static closure is missing 'file' property.`,
    );
    process.exit(1);
  }
  if (!item.file.endsWith(".js")) continue;
  if (initialClosureFiles.has(item.file)) continue;
  initialClosureFiles.add(item.file);

  const fullPath = path.join(DIST_DIR, item.file);
  if (!fs.existsSync(fullPath)) {
    console.error(
      `FAIL: Initial closure chunk file not found on disk: ${item.file} (referenced by ${key})`,
    );
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath);
  const raw = content.length;
  if (raw === 0) {
    console.error(
      `FAIL: Initial closure chunk file is empty (0 bytes): ${item.file}`,
    );
    process.exit(1);
  }
  const gzip = zlib.gzipSync(content).length;
  initialRawSize += raw;
  initialGzipSize += gzip;
  closureDetails.push({ file: item.file, rawSize: raw, gzipSize: gzip });
}

if (initialClosureFiles.size === 0 || initialRawSize === 0) {
  console.error(
    "FAIL: Initial static closure evaluated to 0 files or 0 bytes.",
  );
  process.exit(1);
}

// 3. Verify detail page is genuinely deferred
const titleDetailManifestEntry = Object.entries(manifest).find(
  ([key, val]) =>
    key.includes("TitleDetail") ||
    (val && val.src && val.src.includes("TitleDetail")) ||
    (val && val.name && val.name.toLowerCase() === "titledetail"),
);

if (!titleDetailManifestEntry) {
  console.error("FAIL: TitleDetail page not found in manifest.");
  process.exit(1);
}

const [titleDetailKey, titleDetailVal] = titleDetailManifestEntry;

if (staticClosureKeys.has(titleDetailKey)) {
  console.error(
    `FAIL: TitleDetail (${titleDetailKey}) was found in the initial static entry closure! It is not deferred.`,
  );
  process.exit(1);
}

if (!titleDetailVal || !titleDetailVal.isDynamicEntry) {
  console.error(
    `FAIL: TitleDetail (${titleDetailKey}) does not have isDynamicEntry: true.`,
  );
  process.exit(1);
}

if (!titleDetailVal.file) {
  console.error(
    `FAIL: TitleDetail (${titleDetailKey}) is missing 'file' property in manifest.`,
  );
  process.exit(1);
}

const detailFullPath = path.join(DIST_DIR, titleDetailVal.file);
if (!fs.existsSync(detailFullPath)) {
  console.error(
    `FAIL: Deferred TitleDetail chunk file not found on disk: ${titleDetailVal.file}`,
  );
  process.exit(1);
}

console.log("Bundle Analysis Summary:");
console.log(`- Warning Budget: ${CHUNK_BUDGET} bytes`);
console.log(
  `- Largest JS Chunk: ${largestJsChunk.file} (${largestJsChunk.rawSize} bytes, gzip: ${largestJsChunk.gzipSize} bytes) [PASS]`,
);
console.log("- Initial Entry Closure (static imports only, deduplicated):");
for (const c of closureDetails) {
  console.log(`  * ${c.file}: ${c.rawSize} bytes (gzip: ${c.gzipSize} bytes)`);
}
console.log(
  `- Total Initial Closure Raw Size: ${initialRawSize} bytes (gzip: ${initialGzipSize} bytes)`,
);
const savedBytes = BASELINE_BYTES - initialRawSize;
const savedPercent = ((savedBytes / BASELINE_BYTES) * 100).toFixed(2);
console.log(
  `- Baseline Comparison: ${initialRawSize} bytes vs baseline ${BASELINE_BYTES} bytes (${savedBytes} bytes saved, ${savedPercent}% reduction)`,
);
console.log(
  `- Detail Page Deferred Check: ${titleDetailKey} -> ${titleDetailVal.file} is genuinely deferred (isDynamicEntry: true, excluded from initial closure) [PASS]`,
);
console.log("✓ All bundle verification checks PASSED.");
