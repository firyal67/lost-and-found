/**
 * matchScore.js
 * ─────────────────────────────────────────────────────────────
 * Calcule un score de correspondance entre deux annonces (lost ↔ found).
 *
 * Score normalisé 0–100, composé de 5 critères pondérés :
 *
 *  Critère              Poids max   Description
 *  ──────────────────── ─────────── ────────────────────────────────────
 *  objectType           40 pts      Type d'objet identique
 *  city                 25 pts      Même ville
 *  delegation           10 pts      Même délégation / quartier
 *  date                 15 pts      Proximité temporelle (fenêtre 60 j)
 *  keywords             10 pts      Similarité Jaccard titre + description
 *  ──────────────────── ─────────── ────────────────────────────────────
 *  TOTAL                100 pts
 */

'use strict';

// ── Stopwords français courants ───────────────────────────────────────────────
const STOPWORDS = new Set([
  'le','la','les','de','du','des','un','une','en','à','au','aux',
  'et','ou','mais','donc','or','ni','car','que','qui','quoi','dont',
  'ce','se','sa','son','ses','mon','ma','mes','ton','ta','tes',
  'il','elle','ils','elles','je','tu','nous','vous','on',
  'est','sont','a','ont','été','par','pour','sur','dans','avec',
  'plus','très','bien','aussi','tout','tous','si','non','pas','ne',
  'une','objet','perdu','trouvé','lost','found',
]);

/**
 * Tokenise un texte en un Set de mots normalisés.
 * @param {string} text
 * @returns {Set<string>}
 */
function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprime les accents
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/**
 * Similarité de Jaccard entre deux ensembles de tokens.
 * J(A,B) = |A ∩ B| / |A ∪ B|   →  [0, 1]
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {number}
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union        = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calcule le score de correspondance entre une annonce source et une annonce candidate.
 *
 * @param {Object} source   - Annonce de référence (champs: objectType, city, delegation, date, title, description)
 * @param {Object} candidate - Annonce à évaluer
 * @returns {{
 *   total:      number,   // score global 0–100
 *   breakdown:  {         // détail par critère
 *     objectType: number,
 *     city:       number,
 *     delegation: number,
 *     date:       number,
 *     keywords:   number,
 *   },
 *   details: {            // méta-info pour le debug / affichage
 *     diffDays:      number | null,
 *     keywordScore:  number,
 *     sharedTokens:  string[],
 *   }
 * }}
 */
function calculateMatchScore(source, candidate) {
  const breakdown = {
    objectType: 0,
    city:       0,
    delegation: 0,
    date:       0,
    keywords:   0,
  };

  // ── Critère 1 : Type d'objet (40 pts) ────────────────────────────────────
  if (source.objectType && candidate.objectType === source.objectType) {
    breakdown.objectType = 40;
  }

  // ── Critère 2 : Ville (25 pts) ────────────────────────────────────────────
  if (source.city && candidate.city &&
      source.city.toLowerCase().trim() === candidate.city.toLowerCase().trim()) {
    breakdown.city = 25;
  }

  // ── Critère 3 : Délégation / quartier (10 pts) ───────────────────────────
  if (source.delegation && candidate.delegation &&
      source.delegation.trim().length > 0 &&
      source.delegation.toLowerCase().trim() === candidate.delegation.toLowerCase().trim()) {
    breakdown.delegation = 10;
  }

  // ── Critère 4 : Proximité temporelle (15 pts) ────────────────────────────
  let diffDays = null;
  if (source.date && candidate.date) {
    const srcDate  = new Date(source.date);
    const candDate = new Date(candidate.date);
    diffDays = Math.abs((srcDate - candDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0)       breakdown.date = 15;  // même jour
    else if (diffDays <= 3)   breakdown.date = 14;
    else if (diffDays <= 7)   breakdown.date = 12;
    else if (diffDays <= 14)  breakdown.date = 10;
    else if (diffDays <= 30)  breakdown.date = 7;
    else if (diffDays <= 60)  breakdown.date = 3;
    else                      breakdown.date = 0;
  }

  // ── Critère 5 : Similarité mots-clés (10 pts) ────────────────────────────
  const srcTokens  = tokenize(`${source.title  || ''} ${source.description  || ''}`);
  const candTokens = tokenize(`${candidate.title || ''} ${candidate.description || ''}`);
  const jaccard    = jaccardSimilarity(srcTokens, candTokens);
  const sharedTokens = [...srcTokens].filter((w) => candTokens.has(w));

  // On pondère : Jaccard ≥ 0.15 → plein score
  const keywordScore  = Math.min(1, jaccard / 0.15);
  breakdown.keywords  = Math.round(keywordScore * 10);

  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);

  return {
    total:     Math.min(100, total),
    breakdown,
    details: {
      diffDays,
      keywordScore: Math.round(jaccard * 100) / 100,
      sharedTokens: sharedTokens.slice(0, 10),
    },
  };
}

module.exports = { calculateMatchScore, tokenize, jaccardSimilarity };
