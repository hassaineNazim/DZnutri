const { readFileSync } = require('node:fs');
const { Buffer } = require('node:buffer');
const { gunzipSync } = require('node:zlib');

const AUDIT_ENDPOINT =
  'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk';

// Expo SDK 52 verrouille node-tar 6.x dans son CLI de build. Forcer tar 7
// supprime l’alerte mais casse `expo prebuild` (API CommonJS incompatible).
// L’exception est limitée à cet avis précis ; tout nouvel avis critique,
// y compris un autre avis visant tar, bloque la CI.
const acceptedCriticalTooling = new Set([
  'tar:https://github.com/advisories/GHSA-23hp-3jrh-7fpw',
]);
const acceptedHighTooling = new Set([
  'tar:https://github.com/advisories/GHSA-34x7-hfp2-rc4v',
  'tar:https://github.com/advisories/GHSA-8qq5-rm4j-mr97',
  'tar:https://github.com/advisories/GHSA-83g3-92jg-28cx',
  'tar:https://github.com/advisories/GHSA-qffp-2rhf-9h96',
  'tar:https://github.com/advisories/GHSA-9ppj-qmqm-q256',
  'tar:https://github.com/advisories/GHSA-r6q2-hw4h-h46w',
  'tar:https://github.com/advisories/GHSA-8x88-c5mf-7j5w',
  '@xmldom/xmldom:https://github.com/advisories/GHSA-wh4c-j3r5-mjhp',
  '@xmldom/xmldom:https://github.com/advisories/GHSA-2v35-w6hq-6mfw',
  '@xmldom/xmldom:https://github.com/advisories/GHSA-f6ww-3ggp-fr8h',
  '@xmldom/xmldom:https://github.com/advisories/GHSA-x6wf-f3px-wcqx',
  '@xmldom/xmldom:https://github.com/advisories/GHSA-j759-j44w-7fr8',
  'brace-expansion:https://github.com/advisories/GHSA-mh99-v99m-4gvg',
]);

function packageNameFromLockPath(lockPath) {
  return lockPath.split('node_modules/').filter(Boolean).at(-1);
}

function buildProductionInventory() {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const inventory = {};

  for (const [lockPath, metadata] of Object.entries(lock.packages || {})) {
    if (!lockPath.includes('node_modules/') || metadata.dev === true) continue;
    if (typeof metadata.version !== 'string') continue;

    const name = metadata.name || packageNameFromLockPath(lockPath);
    if (!name) continue;
    inventory[name] ||= new Set();
    inventory[name].add(metadata.version);
  }

  return Object.fromEntries(
    Object.entries(inventory).map(([name, versions]) => [
      name,
      [...versions],
    ]),
  );
}

async function fetchAuditReport(inventory) {
  const response = await fetch(AUDIT_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'accept-encoding': 'identity',
      'content-type': 'application/json',
    },
    body: JSON.stringify(inventory),
  });

  const raw = Buffer.from(await response.arrayBuffer());
  const decoded =
    raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw;

  if (!response.ok) {
    throw new Error(
      `registre npm HTTP ${response.status}: ${decoded.toString('utf8').slice(0, 300)}`,
    );
  }

  return JSON.parse(decoded.toString('utf8'));
}

async function main() {
  const report = await fetchAuditReport(buildProductionInventory());
  const advisories = Object.entries(report).flatMap(([name, items]) =>
    items.map((item) => ({ ...item, packageName: name })),
  );
  const counts = advisories.reduce((result, item) => {
    result[item.severity] = (result[item.severity] || 0) + 1;
    return result;
  }, {});

  const critical = advisories.filter((item) => item.severity === 'critical');
  const unexpectedCritical = critical.filter(
    (item) =>
      !acceptedCriticalTooling.has(`${item.packageName}:${item.url}`),
  );
  const unexpectedHigh = advisories.filter(
    (item) =>
      item.severity === 'high' &&
      !acceptedHighTooling.has(`${item.packageName}:${item.url}`),
  );

  for (const item of critical.filter(
    (candidate) => !unexpectedCritical.includes(candidate),
  )) {
    console.warn(
      `[audit] Exception temporaire documentée: ${item.packageName} — ${item.url} (CLI Expo SDK 52, hors runtime mobile).`,
    );
  }

  console.log(
    `[audit] Avis production: ${counts.critical || 0} critique(s), ${counts.high || 0} élevé(s), ${counts.moderate || 0} modéré(s), ${counts.low || 0} faible(s).`,
  );
  const highPackages = [
    ...new Set(
      advisories
        .filter((item) => item.severity === 'high')
        .map((item) => item.packageName),
    ),
  ];
  if (highPackages.length > 0) {
    console.warn(
      `[audit] Avis élevés restant dans la pile Expo/RN: ${highPackages.join(', ')}.`,
    );
  }

  if (unexpectedCritical.length > 0) {
    console.error(
      `[audit] Vulnérabilités critiques non autorisées:\n${unexpectedCritical
        .map((item) => `- ${item.packageName}: ${item.url}`)
        .join('\n')}`,
    );
    process.exit(1);
  }

  if (unexpectedHigh.length > 0) {
    console.error(
      `[audit] Vulnérabilités élevées non autorisées:\n${unexpectedHigh
        .map((item) => `- ${item.packageName}: ${item.url}`)
        .join('\n')}`,
    );
    process.exit(1);
  }

  console.log('[audit] Aucune vulnérabilité critique ou élevée non autorisée.');
}

main().catch((error) => {
  console.error(`[audit] Échec du contrôle: ${error.message}`);
  process.exit(1);
});
