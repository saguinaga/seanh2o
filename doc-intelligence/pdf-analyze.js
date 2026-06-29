/** Client-side PDF text extraction + lightweight CRE field heuristics */
window.DocPdfAnalyze = (function () {
  const WORKER =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  function ensurePdfJs() {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
  }

  async function extractTextFromPdf(file) {
    ensurePdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const parts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it) => it.str).join(' ');
      parts.push(text);
    }
    return {
      pages: pdf.numPages,
      text: parts.join('\n\n'),
      fileName: file.name,
      sizeMb: (file.size / (1024 * 1024)).toFixed(2),
    };
  }

  function firstMatch(text, patterns) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) return m[1].trim();
    }
    return null;
  }

  function money(raw) {
    if (!raw) return null;
    const n = raw.replace(/[^0-9.]/g, '');
    if (!n) return null;
    const val = Number(n);
    if (Number.isNaN(val)) return null;
    return val >= 1000 ? `$${Math.round(val).toLocaleString('en-US')}` : `$${val}`;
  }

  function pct(raw) {
    if (!raw) return null;
    return raw.includes('%') ? raw : `${raw}%`;
  }

  function analyzeCreText(text, fileName = '') {
    const excerpt = text.replace(/\s+/g, ' ').trim().slice(0, 1200);
    const hits = {};
    const upbRaw = firstMatch(text, [
      /(?:UPB|unpaid principal balance|principal balance)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
      /\$\s*([\d,]{7,})\s*(?:UPB|unpaid)/i,
    ]);
    if (upbRaw) hits.upb = money(upbRaw);

    const dscrRaw = firstMatch(text, [/DSCR[:\s(]*([\d.]+)/i, /debt service coverage[:\s]*([\d.]+)/i]);
    if (dscrRaw) hits.dscr = dscrRaw;

    const ltvRaw = firstMatch(text, [/LTV[:\s(]*([\d.]+%?)/i, /loan[- ]to[- ]value[:\s]*([\d.]+%?)/i]);
    if (ltvRaw) hits.ltv = pct(ltvRaw);

    const noiRaw = firstMatch(text, [
      /NOI[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
      /net operating income[:\s]*\$?\s*([\d,]+)/i,
    ]);
    if (noiRaw) hits.noi = money(noiRaw);

    const occRaw = firstMatch(text, [/occupancy[:\s]*([\d.]+%?)/i, /occupied[:\s]*([\d.]+%?)/i]);
    if (occRaw) hits.occupancy = pct(occRaw);

    const loanId = firstMatch(text, [
      /loan\s*(?:id|#|number)[:\s]*([A-Z0-9-]+)/i,
      /(LN-\d{4}-\d+)/i,
    ]);
    if (loanId) hits.loan_id = loanId;

    const property = firstMatch(text, [
      /(?:property|collateral|asset)[:\s]*([A-Za-z0-9][A-Za-z0-9\s,'.-]{4,60})/i,
    ]);
    if (property) hits.property_name = property.split(/\s{2,}|\.|\n/)[0].trim();

    const delinq = firstMatch(text, [/days?\s*delinquent[:\s]*(\d+)/i, /delinquen\w+[:\s]*(\d+)\s*days?/i]);
    if (delinq) hits.delinquency = delinq;

    const appr = firstMatch(text, [
      /(?:as[- ]is|appraised)\s*value[:\s]*\$?\s*([\d,]+)/i,
      /appraised at[:\s]*\$?\s*([\d,]+)/i,
    ]);
    if (appr) hits.collateral_value = money(appr);

    const status = firstMatch(text, [
      /(?:workout|loan)\s*status[:\s]*([A-Za-z][A-Za-z\s]{4,40})/i,
      /(modification under review|special servicing|non[- ]performing)/i,
    ]);
    if (status) hits.workout_status = status.trim();

    if (!hits.property_name && fileName) {
      hits.property_name = fileName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
    }

    const matchedKeys = Object.keys(hits);
    const keywords = [];
    ['UPB', 'DSCR', 'LTV', 'NOI', 'rent roll', 'servicer', 'covenant', 'occupancy', 'foreclosure']
      .forEach((k) => { if (new RegExp(k, 'i').test(text)) keywords.push(k); });

    return {
      hits,
      excerpt,
      matchedKeys,
      keywords,
      charCount: text.length,
      fromPdf: matchedKeys.length > 0,
    };
  }

  return { extractTextFromPdf, analyzeCreText };
})();