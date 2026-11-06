/* ============================================================
   Factur-X / CII / UBL : génération et lecture des factures électroniques,
   analyse des PDF (XML intégré, texte), archives ZIP, reconnaissance automatique
   ============================================================ */
const xe = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const amt = c => ((c || 0) / 100).toFixed(2);
const d102 = iso => (iso || "").replace(/-/g, "");
const tvaIntraFR = siren => { if (!/^\d{9}$/.test(siren || "")) return ""; const k = (12 + 3 * (Number(siren) % 97)) % 97; return "FR" + String(k).padStart(2, "0") + siren; };
const UNITS = [["C62", "unité"], ["HUR", "heure"], ["DAY", "jour"], ["MON", "mois"], ["KGM", "kg"], ["MTR", "m"], ["MTK", "m²"], ["LTR", "litre"], ["E48", "forfait"], ["SET", "lot"]];
const unitLib = c => (UNITS.find(u => u[0] === c) || [c, c])[1];

/* ---------- Totaux d'une facture (montants en centimes, quantités décimales) ---------- */
function facTotals(doc) {
  const lines = (doc.lignes || []).filter(l => !l.texte).map(l => { const brut = Math.round((Number(l.qte) || 0) * (l.pu || 0)); const rem = Math.round(brut * (Number(l.remise) || 0) / 10000); return { ...l, brut, ht: brut - rem }; });
  const byRate = {}; lines.forEach(l => { const k = Number(l.taux) || 0; (byRate[k] ||= { taux: k, base: 0, tva: 0 }).base += l.ht; });
  let tva = 0; Object.values(byRate).forEach(r => { r.tva = Math.round(r.base * r.taux / 10000); tva += r.tva; });
  const ht = lines.reduce((a, l) => a + l.ht, 0); const acompte = doc.acompte || 0;
  return { lines, rates: Object.values(byRate).sort((a, b) => b.taux - a.taux), ht, tva, ttc: ht + tva, acompte, net: ht + tva - acompte };
}
function sellerInfo() {
  const fc = S.factuCfg || {};
  return { nom: S.nom, forme: S.forme, siren: S.siren || "", siret: S.siret || "", tva: S.tvaIntra || tvaIntraFR(S.siren), adresse: S.adresse || "", cp: fc.cp || "", ville: fc.ville || "", pays: "FR", email: fc.email || "", tel: fc.tel || "", capital: S.capital || 0, rcs: fc.rcs || "", naf: S.naf || "", iban: fc.iban || "", bic: fc.bic || "" };
}

/* ---------- XML CII (profil EN 16931) ---------- */
function buildCII(doc) {
  const T = facTotals(doc); const se = sellerInfo(); const bu = doc.cli || {}; const fc = S.factuCfg || {};
  const type = doc.type === "AV" ? "381" : "380";
  const cat = r => r ? "S" : (doc.exo === "export" ? "G" : doc.exo === "intra" ? "K" : doc.exo === "autoliq" ? "AE" : "E");
  const party = (tag, p) => `<ram:${tag}><ram:Name>${xe(p.nom)}</ram:Name>${p.siren ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${xe(p.siren)}</ram:ID></ram:SpecifiedLegalOrganization>` : ""}<ram:PostalTradeAddress>${p.cp ? `<ram:PostcodeCode>${xe(p.cp)}</ram:PostcodeCode>` : ""}${p.adresse ? `<ram:LineOne>${xe(p.adresse)}</ram:LineOne>` : ""}${p.ville ? `<ram:CityName>${xe(p.ville)}</ram:CityName>` : ""}<ram:CountryID>${xe(p.pays || "FR")}</ram:CountryID></ram:PostalTradeAddress>${p.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${xe(p.email)}</ram:URIID></ram:URIUniversalCommunication>` : ""}${p.tva ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${xe(p.tva)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}</ram:${tag}>`;
  const notes = [["PMT", fc.penalites || "En cas de retard de paiement, pénalités au taux de la BCE majoré de 10 points."], ["PMD", "Indemnité forfaitaire pour frais de recouvrement : 40 €."], ["AAB", fc.escompte || "Pas d'escompte pour paiement anticipé."]];
  if (doc.notes) notes.unshift(["AAI", doc.notes]);
  const lines = T.lines.map((l, i) => `<ram:IncludedSupplyChainTradeLineItem><ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument><ram:SpecifiedTradeProduct>${l.code ? `<ram:SellerAssignedID>${xe(l.code)}</ram:SellerAssignedID>` : ""}<ram:Name>${xe(l.des || "Article")}</ram:Name></ram:SpecifiedTradeProduct><ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${((Number(l.qte) ? l.ht / Number(l.qte) : 0) / 100).toFixed(4)}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement><ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="${xe(l.unite || "C62")}">${Number(l.qte) || 0}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery><ram:SpecifiedLineTradeSettlement><ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${cat(Number(l.taux))}</ram:CategoryCode><ram:RateApplicablePercent>${(Number(l.taux) / 100).toFixed(2)}</ram:RateApplicablePercent></ram:ApplicableTradeTax><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${amt(l.ht)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement></ram:IncludedSupplyChainTradeLineItem>`).join("");
  const dueCode = doc.categorie === "biens" ? "" : ((S.pa || {}).debits ? "5" : "72");
  const taxes = T.rates.map(r => `<ram:ApplicableTradeTax><ram:CalculatedAmount>${amt(r.tva)}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode>${r.taux ? "" : `<ram:ExemptionReason>${xe(doc.exoMention || "Exonération de TVA")}</ram:ExemptionReason>`}<ram:BasisAmount>${amt(r.base)}</ram:BasisAmount><ram:CategoryCode>${cat(r.taux)}</ram:CategoryCode>${dueCode && r.taux ? `<ram:DueDateTypeCode>${dueCode}</ram:DueDateTypeCode>` : ""}<ram:RateApplicablePercent>${(r.taux / 100).toFixed(2)}</ram:RateApplicablePercent></ram:ApplicableTradeTax>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
<rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>
<rsm:ExchangedDocument><ram:ID>${xe(doc.num)}</ram:ID><ram:TypeCode>${type}</ram:TypeCode><ram:IssueDateTime><udt:DateTimeString format="102">${d102(doc.date)}</udt:DateTimeString></ram:IssueDateTime>${notes.map(([c, t]) => `<ram:IncludedNote><ram:Content>${xe(t)}</ram:Content><ram:SubjectCode>${c}</ram:SubjectCode></ram:IncludedNote>`).join("")}</rsm:ExchangedDocument>
<rsm:SupplyChainTradeTransaction>${lines}
<ram:ApplicableHeaderTradeAgreement>${doc.refAcheteur ? `<ram:BuyerReference>${xe(doc.refAcheteur)}</ram:BuyerReference>` : ""}${party("SellerTradeParty", se)}${party("BuyerTradeParty", bu)}${doc.cmd ? `<ram:BuyerOrderReferencedDocument><ram:IssuerAssignedID>${xe(doc.cmd)}</ram:IssuerAssignedID></ram:BuyerOrderReferencedDocument>` : ""}</ram:ApplicableHeaderTradeAgreement>
<ram:ApplicableHeaderTradeDelivery>${doc.livraison ? `<ram:ShipToTradeParty><ram:Name>${xe(bu.nom)}</ram:Name><ram:PostalTradeAddress><ram:LineOne>${xe(doc.livraison)}</ram:LineOne><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress></ram:ShipToTradeParty>` : ""}${doc.dateLiv ? `<ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${d102(doc.dateLiv)}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent>` : ""}</ram:ApplicableHeaderTradeDelivery>
<ram:ApplicableHeaderTradeSettlement><ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>${se.iban ? `<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>58</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${xe(se.iban.replace(/\s/g, ""))}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount></ram:SpecifiedTradeSettlementPaymentMeans>` : ""}${taxes}${doc.avoirDeNum ? "" : ""}<ram:SpecifiedTradePaymentTerms>${doc.ech ? `<ram:DueDateDateTime><udt:DateTimeString format="102">${d102(doc.ech)}</udt:DateTimeString></ram:DueDateDateTime>` : `<ram:Description>${xe(doc.conditions || "Paiement à réception")}</ram:Description>`}</ram:SpecifiedTradePaymentTerms>
<ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>${amt(T.ht)}</ram:LineTotalAmount><ram:TaxBasisTotalAmount>${amt(T.ht)}</ram:TaxBasisTotalAmount><ram:TaxTotalAmount currencyID="EUR">${amt(T.tva)}</ram:TaxTotalAmount><ram:GrandTotalAmount>${amt(T.ttc)}</ram:GrandTotalAmount>${T.acompte ? `<ram:TotalPrepaidAmount>${amt(T.acompte)}</ram:TotalPrepaidAmount>` : ""}<ram:DuePayableAmount>${amt(T.net)}</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation>${doc.avoirDeNum ? `<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${xe(doc.avoirDeNum)}</ram:IssuerAssignedID></ram:InvoiceReferencedDocument>` : ""}</ram:ApplicableHeaderTradeSettlement>
</rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>`;
}
function facturxXMP(doc) {
  const now = new Date().toISOString().slice(0, 19) + "Z";
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"><pdfaid:part>3</pdfaid:part><pdfaid:conformance>B</pdfaid:conformance></rdf:Description>
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xe((doc.type === "AV" ? "Avoir " : "Facture ") + doc.num)}</rdf:li></rdf:Alt></dc:title><dc:creator><rdf:Seq><rdf:li>${xe(S.nom)}</rdf:li></rdf:Seq></dc:creator></rdf:Description>
<rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/"><xmp:CreatorTool>${xe(CONFIG.branding.nom)}</xmp:CreatorTool><xmp:CreateDate>${now}</xmp:CreateDate><xmp:ModifyDate>${now}</xmp:ModifyDate></rdf:Description>
<rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/"><pdf:Producer>${xe(CONFIG.branding.nom)}</pdf:Producer></rdf:Description>
<rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#"><pdfaExtension:schemas><rdf:Bag><rdf:li rdf:parseType="Resource"><pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema><pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI><pdfaSchema:prefix>fx</pdfaSchema:prefix><pdfaSchema:property><rdf:Seq>${[["DocumentFileName", "name of the embedded XML invoice file"], ["DocumentType", "INVOICE"], ["Version", "The actual version of the Factur-X XML schema"], ["ConformanceLevel", "The conformance level of the embedded Factur-X data"]].map(([n, d]) => `<rdf:li rdf:parseType="Resource"><pdfaProperty:name>${n}</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>${d}</pdfaProperty:description></rdf:li>`).join("")}</rdf:Seq></pdfaSchema:property></rdf:li></rdf:Bag></pdfaExtension:schemas></rdf:Description>
<rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"><fx:DocumentType>INVOICE</fx:DocumentType><fx:DocumentFileName>factur-x.xml</fx:DocumentFileName><fx:Version>1.0</fx:Version><fx:ConformanceLevel>EN 16931</fx:ConformanceLevel></rdf:Description>
</rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
}

/* ---------- Lecture XML CII et UBL -> facture normalisée ---------- */
const ln = (el, name) => el ? [...el.getElementsByTagNameNS("*", name)] : [];
const l1 = (el, ...path) => { let cur = el; for (const p of path) { if (!cur) return null; cur = [...cur.children].find(c => c.localName === p) || null; } return cur; };
const tx = el => el ? el.textContent.trim() : "";
const toCents = v => { if (v == null || v === "") return 0; const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : Math.round(n * 100); };
const dIso = (v, fmt) => { v = (v || "").trim(); if (/^\d{8}$/.test(v)) return v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6, 8); return v.slice(0, 10); };
const rateC = v => Math.round(parseFloat(String(v || "0").replace(",", ".")) * 100) || 0;
function parseInvoiceXML(text) {
  const xml = new DOMParser().parseFromString(text, "application/xml"); const root = xml.documentElement;
  if (!root || root.getElementsByTagName("parsererror").length) throw new Error("XML illisible");
  if (root.localName === "CrossIndustryInvoice") return parseCII(root);
  if (root.localName === "Invoice" || root.localName === "CreditNote") return parseUBL(root);
  throw new Error("Format XML non reconnu (" + root.localName + ")");
}
function parseCII(r) {
  const doc = l1(r, "ExchangedDocument"); const tr = l1(r, "SupplyChainTradeTransaction"); const ag = l1(tr, "ApplicableHeaderTradeAgreement"); const st = l1(tr, "ApplicableHeaderTradeSettlement");
  const party = p => p ? { nom: tx(l1(p, "Name")), siren: (tx(l1(p, "SpecifiedLegalOrganization", "ID")) || "").replace(/\s/g, ""), tva: ln(p, "SpecifiedTaxRegistration").map(x => tx(l1(x, "ID"))).find(v => /^[A-Z]{2}/.test(v)) || "", adresse: [tx(l1(p, "PostalTradeAddress", "LineOne")), tx(l1(p, "PostalTradeAddress", "PostcodeCode")), tx(l1(p, "PostalTradeAddress", "CityName"))].filter(Boolean).join(" "), email: tx(l1(p, "URIUniversalCommunication", "URIID")) } : {};
  const sum = l1(st, "SpecifiedTradeSettlementHeaderMonetarySummation");
  const lignes = ln(tr, "IncludedSupplyChainTradeLineItem").map(li => ({ des: tx(l1(li, "SpecifiedTradeProduct", "Name")), qte: parseFloat(tx(l1(li, "SpecifiedLineTradeDelivery", "BilledQuantity")) || "1"), ht: toCents(tx(l1(li, "SpecifiedLineTradeSettlement", "SpecifiedTradeSettlementLineMonetarySummation", "LineTotalAmount"))), taux: rateC(tx(l1(li, "SpecifiedLineTradeSettlement", "ApplicableTradeTax", "RateApplicablePercent"))) }));
  const tva = [...(st ? st.children : [])].filter(c => c.localName === "ApplicableTradeTax").map(t => ({ taux: rateC(tx(l1(t, "RateApplicablePercent"))), base: toCents(tx(l1(t, "BasisAmount"))), montant: toCents(tx(l1(t, "CalculatedAmount"))), cat: tx(l1(t, "CategoryCode")) }));
  const sirenOf = p => { const s = p.siren; if (/^\d{14}$/.test(s)) p.siret = s; p.siren = (s || "").slice(0, 9); if (!/^\d{9}$/.test(p.siren) && /^FR\d{11}$/.test(p.tva)) p.siren = p.tva.slice(4); return p; };
  const typeCode = tx(l1(doc, "TypeCode"));
  return { format: "CII", type: typeCode === "381" ? "AV" : "FA", num: tx(l1(doc, "ID")), date: dIso(tx(l1(doc, "IssueDateTime", "DateTimeString"))), ech: dIso(tx(l1(st, "SpecifiedTradePaymentTerms", "DueDateDateTime", "DateTimeString"))), devise: tx(l1(st, "InvoiceCurrencyCode")) || "EUR",
    vendeur: sirenOf(party(l1(ag, "SellerTradeParty"))), acheteur: sirenOf(party(l1(ag, "BuyerTradeParty"))), lignes, tva,
    ht: toCents(tx(l1(sum, "TaxBasisTotalAmount")) || tx(l1(sum, "LineTotalAmount"))), tvaTot: toCents(ln(sum, "TaxTotalAmount").map(tx)[0]), ttc: toCents(tx(l1(sum, "GrandTotalAmount"))), net: toCents(tx(l1(sum, "DuePayableAmount"))),
    iban: tx(ln(st, "IBANID")[0]), cmd: tx(l1(ag, "BuyerOrderReferencedDocument", "IssuerAssignedID")), conf: 100 };
}
function parseUBL(r) {
  const credit = r.localName === "CreditNote"; const C = n => [...r.children].find(c => c.localName === n);
  const party = p => { if (!p) return {}; const P = l1(p, "Party") || p; const legal = l1(P, "PartyLegalEntity"); const tax = ln(P, "PartyTaxScheme").map(x => tx(l1(x, "CompanyID"))).find(Boolean) || ""; let siren = tx(l1(legal, "CompanyID")).replace(/\s/g, ""); const ep = tx(l1(P, "EndpointID")); if (!siren && /^\d{9,14}$/.test(ep)) siren = ep;
    const o = { nom: tx(l1(legal, "RegistrationName")) || tx(l1(P, "PartyName", "Name")), siren: siren.slice(0, 9), siret: siren.length === 14 ? siren : "", tva: tax, adresse: [tx(l1(P, "PostalAddress", "StreetName")), tx(l1(P, "PostalAddress", "PostalZone")), tx(l1(P, "PostalAddress", "CityName"))].filter(Boolean).join(" "), email: tx(l1(P, "Contact", "ElectronicMail")) };
    if (!/^\d{9}$/.test(o.siren) && /^FR\d{11}$/.test(o.tva)) o.siren = o.tva.slice(4); return o; };
  const lm = C("LegalMonetaryTotal"); const taxTot = C("TaxTotal");
  const lignes = ln(r, credit ? "CreditNoteLine" : "InvoiceLine").map(li => ({ des: tx(l1(li, "Item", "Name")), qte: parseFloat(tx([...li.children].find(c => /Quantity$/.test(c.localName))) || "1"), ht: toCents(tx(l1(li, "LineExtensionAmount"))), taux: rateC(tx(l1(li, "Item", "ClassifiedTaxCategory", "Percent"))) }));
  const tva = ln(taxTot, "TaxSubtotal").map(t => ({ taux: rateC(tx(l1(t, "TaxCategory", "Percent"))), base: toCents(tx(l1(t, "TaxableAmount"))), montant: toCents(tx(l1(t, "TaxAmount"))), cat: tx(l1(t, "TaxCategory", "ID")) }));
  return { format: "UBL", type: credit || tx(C(credit ? "CreditNoteTypeCode" : "InvoiceTypeCode")) === "381" ? "AV" : "FA", num: tx(C("ID")), date: dIso(tx(C("IssueDate"))), ech: dIso(tx(C("DueDate")) || tx(l1(C("PaymentMeans"), "PaymentDueDate"))), devise: tx(C("DocumentCurrencyCode")) || "EUR",
    vendeur: party(C("AccountingSupplierParty")), acheteur: party(C("AccountingCustomerParty")), lignes, tva, ht: toCents(tx(l1(lm, "TaxExclusiveAmount"))), tvaTot: toCents(tx(l1(taxTot, "TaxAmount"))), ttc: toCents(tx(l1(lm, "TaxInclusiveAmount"))), net: toCents(tx(l1(lm, "PayableAmount"))),
    iban: tx(ln(r, "PayeeFinancialAccount").map(x => l1(x, "ID"))[0]), cmd: tx(l1(C("OrderReference"), "ID")), conf: 100 };
}

/* ---------- Décompression (navigateur et Node) ---------- */
async function inflate(bytes, raw) {
  const ds = new DecompressionStream(raw ? "deflate-raw" : "deflate"); const w = ds.writable.getWriter(); w.write(bytes).catch(() => {}); w.close().catch(() => {});
  const chunks = []; const rd = ds.readable.getReader(); let total = 0;
  try { for (;;) { const { done, value } = await rd.read(); if (done) break; chunks.push(value); total += value.length; } } catch (e) { if (!total) throw e; }
  const out = new Uint8Array(total); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; } return out;
}
const latin1 = b => { let s = ""; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return s; };
const utf8 = b => new TextDecoder("utf-8").decode(b);

/* ---------- Archives ZIP ---------- */
async function unzip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("Archive ZIP illisible");
  const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true); const out = [];
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = utf8(bytes.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
    if (name.endsWith("/")) continue;
    const start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true); const comp = bytes.subarray(start, start + csize);
    try { out.push({ name: name.split("/").pop(), data: method === 0 ? comp.slice() : method === 8 ? await inflate(comp, true) : null }); } catch (e) { out.push({ name, data: null }); }
  }
  return out.filter(f => f.data);
}

/* ---------- Analyse d'un PDF : objets, flux, XML intégré, texte ---------- */
async function pdfParse(bytes) {
  const s = latin1(bytes); const objs = {};
  const re = /(\d+)\s+(\d+)\s+obj\b/g; let m; const pos = [];
  while ((m = re.exec(s))) pos.push([+m[1], m.index + m[0].length]);
  for (const [n, st] of pos) { const end = s.indexOf("endobj", st); objs[n] = { start: st, body: s.slice(st, end < 0 ? s.length : end) }; }
  const P = { s, bytes, objs, cache: {} };
  // objets compressés (ObjStm)
  for (const n in objs) { const b = objs[n].body; if (!/\/Type\s*\/ObjStm/.test(b.slice(0, 400))) continue;
    try { const data = latin1(await streamData(P, +n)); const N = +(b.match(/\/N\s+(\d+)/) || [])[1], first = +(b.match(/\/First\s+(\d+)/) || [])[1]; const hdr = data.slice(0, first).trim().split(/\s+/).map(Number);
      for (let i = 0; i < N; i++) { const on = hdr[2 * i], off = hdr[2 * i + 1], nextOff = i + 1 < N ? hdr[2 * i + 3] : data.length - first; if (!objs[on]) objs[on] = { body: data.slice(first + off, first + nextOff), inStm: true }; } } catch (e) { }
  }
  return P;
}
const dictOf = body => { const i = body.indexOf("stream"); return i >= 0 && !/endstream/.test(body.slice(0, i)) ? body.slice(0, i) : body; };
function resolveNum(P, v) { const r = String(v).match(/^(\d+)\s+\d+\s+R/); if (r) { const o = P.objs[r[1]]; return o ? parseFloat(o.body) : NaN; } return parseFloat(v); }
async function streamData(P, n) {
  if (P.cache[n]) return P.cache[n]; const o = P.objs[n]; if (!o || o.inStm) return null;
  const b = o.body; const si = b.search(/stream\r?\n/); if (si < 0) return null;
  const dict = b.slice(0, si); const startRel = si + (b[si + 6] === "\r" ? 8 : 7); const abs = o.start + startRel;
  let len = resolveNum(P, (dict.match(/\/Length\s+(\d+\s+\d+\s+R|\d+)/) || [])[1]);
  if (!(len > 0) || abs + len > P.bytes.length) { const e = P.s.indexOf("endstream", abs); len = e - abs; }
  let out = P.bytes.subarray(abs, abs + len);
  const fm = dict.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/); const filters = fm ? (fm[1].match(/\/\w+/g) || []).map(f => f.slice(1)) : [];
  try { for (const f of filters) { if (f === "FlateDecode" || f === "Fl") out = await inflate(out); else if (f === "ASCII85Decode" || f === "A85") out = a85(out); else if (f === "ASCIIHexDecode" || f === "AHx") out = ahx(out); else { out = new Uint8Array(0); break; } } } catch (e) { out = new Uint8Array(0); }
  P.cache[n] = out; return out;
}
function a85(b) { const s = latin1(b).replace(/^\s*<~/, "").split("~>")[0].replace(/\s/g, ""); const out = []; let i = 0;
  while (i < s.length) { if (s[i] === "z") { out.push(0, 0, 0, 0); i++; continue; } const ch = s.slice(i, i + 5); i += 5; const pad = 5 - ch.length; const c = (ch + "uuuu".slice(0, pad)); let v = 0; for (const x of c) v = v * 85 + (x.charCodeAt(0) - 33); const by = [v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255]; out.push(...by.slice(0, 4 - pad)); }
  return new Uint8Array(out); }
function ahx(b) { const h = latin1(b).replace(/[^0-9a-fA-F]/g, ""); const o = new Uint8Array(Math.floor(h.length / 2)); for (let i = 0; i < o.length; i++) o[i] = parseInt(h.substr(2 * i, 2), 16); return o; }
async function pdfEmbeddedXML(P) {
  const found = [];
  for (const n in P.objs) { const d = dictOf(P.objs[n].body).slice(0, 600); if (!/\/EmbeddedFile\b/.test(d) || /\/Filespec/.test(d)) continue; const data = await streamData(P, n); if (!data || !data.length) continue; const t = utf8(data); if (/CrossIndustryInvoice|<(\w+:)?Invoice\b|<(\w+:)?CreditNote\b/.test(t)) found.push(t.replace(/^﻿/, "")); }
  return found[0] || null;
}
/* CMap ToUnicode */
function parseCMap(t) {
  const map = {}; let bytes = 1; const hex = h => h.replace(/[<>\s]/g, "");
  const u = h => { h = hex(h); let s = ""; for (let i = 0; i + 4 <= h.length; i += 4) s += String.fromCharCode(parseInt(h.slice(i, i + 4), 16)); return s; };
  for (const blk of t.split("beginbfchar").slice(1)) { const body = blk.split("endbfchar")[0]; const re = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g; let m; while ((m = re.exec(body))) { bytes = m[1].length / 2; map[parseInt(m[1], 16)] = u(m[2]); } }
  for (const blk of t.split("beginbfrange").slice(1)) { const body = blk.split("endbfrange")[0]; const re = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]+>|\[[^\]]*\])/g; let m;
    while ((m = re.exec(body))) { bytes = m[1].length / 2; const a = parseInt(m[1], 16), b = parseInt(m[2], 16);
      if (m[3][0] === "[") { const arr = m[3].match(/<[0-9a-fA-F]+>/g) || []; for (let k = a; k <= b; k++) map[k] = u(arr[k - a] || ""); }
      else { const h = hex(m[3]); const base = parseInt(h.slice(-4), 16); const pre = h.length > 4 ? u(h.slice(0, -4)) : ""; for (let k = a; k <= b && k - a < 65536; k++) map[k] = pre + String.fromCharCode(base + k - a); } } }
  return { map, bytes };
}
const W1252 = { 128: "€", 130: "‚", 131: "ƒ", 132: "„", 133: "…", 134: "†", 135: "‡", 136: "ˆ", 137: "‰", 138: "Š", 139: "‹", 140: "Œ", 142: "Ž", 145: "‘", 146: "’", 147: "“", 148: "”", 149: "•", 150: "–", 151: "—", 152: "˜", 153: "™", 154: "š", 155: "›", 156: "œ", 158: "ž", 159: "Ÿ" };
function refOf(v) { const m = String(v || "").match(/(\d+)\s+\d+\s+R/); return m ? m[1] : null; }
function subDict(body, key) { // renvoie le texte du dictionnaire /key << ... >> (gère l'imbrication) ou la référence
  const i = body.search(new RegExp("/" + key + "\\b")); if (i < 0) return null; let j = i + key.length + 1; while (/\s/.test(body[j])) j++;
  if (body.startsWith("<<", j)) { let d = 0, k = j; for (; k < body.length; k++) { if (body.startsWith("<<", k)) { d++; k++; } else if (body.startsWith(">>", k)) { d--; k++; if (!d) break; } } return body.slice(j, k + 1); }
  const r = body.slice(j).match(/^(\d+\s+\d+\s+R)/); return r ? r[1] : body.slice(j).match(/^\[[^\]]*\]/)?.[0] || null;
}
const deref = (P, v) => { const r = refOf(v); return r && /^\s*\d+\s+\d+\s+R\s*$/.test(v) ? (P.objs[r] || {}).body || "" : v || ""; };
async function pdfText(bytes) {
  const P = await pdfParse(bytes); const fontCache = {};
  // pages dans l'ordre (arbre /Kids depuis le catalogue)
  const catN = Object.keys(P.objs).find(n => /\/Type\s*\/Catalog/.test(P.objs[n].body.slice(0, 2000)));
  const pages = []; const walk = (n, inh, depth) => { if (depth > 30) return; const b = dictOf((P.objs[n] || {}).body || ""); const res = subDict(b, "Resources") || inh;
    if (/\/Type\s*\/Pages/.test(b)) { const kids = (subDict(b, "Kids") || "").match(/\d+\s+\d+\s+R/g) || []; kids.forEach(k => walk(refOf(k), res, depth + 1)); } else if (/\/Type\s*\/Page\b/.test(b)) pages.push({ n, b, res }); };
  if (catN) walk(refOf(subDict(dictOf(P.objs[catN].body), "Pages")), null, 0);
  if (!pages.length) Object.keys(P.objs).forEach(n => { const b = dictOf(P.objs[n].body); if (/\/Type\s*\/Page\b/.test(b)) pages.push({ n, b, res: subDict(b, "Resources") }); });
  let all = [];
  for (const pg of pages.slice(0, 20)) {
    const res = deref(P, pg.res || ""); const fontsD = deref(P, subDict(res, "Font") || ""); const fonts = {};
    (fontsD.match(/\/([^\s\/<>\[\]()]+)\s+(\d+)\s+\d+\s+R/g) || []).forEach(x => { const m = x.match(/\/([^\s\/<>\[\]()]+)\s+(\d+)/); fonts[m[1]] = m[2]; });
    for (const fn in fonts) { const id = fonts[fn]; if (fontCache[id] !== undefined) continue; const fb = dictOf((P.objs[id] || {}).body || ""); const tu = refOf(subDict(fb, "ToUnicode")); let cm = null;
      if (tu) { const d = await streamData(P, tu); if (d) cm = parseCMap(latin1(d)); }
      fontCache[id] = { cm, two: !cm && /Identity-H|Type0/.test(fb) }; }
    const cref = subDict(pg.b, "Contents") || ""; const ids = (cref.match(/\d+\s+\d+\s+R/g) || []).map(refOf);
    let content = ""; for (const id of ids) { const d = await streamData(P, id); if (d) content += latin1(d) + "\n"; }
    const frags = runContent(content, fn => fontCache[fonts[fn]] || {}); all = all.concat(layoutLines(frags)); all.push("");
  }
  return all.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
function decodeStr(raw, F) { // raw = chaîne d'octets (latin1)
  if (F.cm) { const { map, bytes } = F.cm; let o = ""; for (let i = 0; i < raw.length; i += bytes) { let c = 0; for (let k = 0; k < bytes; k++) c = c * 256 + (raw.charCodeAt(i + k) || 0); o += map[c] ?? (bytes === 1 ? raw[i] : ""); } return o; }
  if (F.two) return ""; let o = ""; for (const ch of raw) { const c = ch.charCodeAt(0); o += W1252[c] || ch; } return o;
}
function runContent(c, fontOf) {
  const frags = []; let i = 0; const st = []; let font = {}, fs = 10, tm = [1, 0, 0, 1, 0, 0], lm = [1, 0, 0, 1, 0, 0], tl = 0, cur = null, ctm = [1, 0, 0, 1, 0, 0]; const gs = [];
  const mul = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
  const pos = () => { const m = mul(tm, ctm); return { x: m[4], y: m[5], sc: Math.hypot(m[2], m[3]) || 1 }; };
  const start = () => { const p = pos(); cur = { x: p.x, y: p.y, size: fs * p.sc, s: "" }; frags.push(cur); };
  const moveTo = (tx, ty) => { lm = mul([1, 0, 0, 1, tx, ty], lm); tm = lm.slice(); cur = null; };
  const show = raw => { if (!cur) start(); cur.s += decodeStr(raw, font); };
  const L = c.length;
  while (i < L) {
    const ch = c[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === "%") { while (i < L && c[i] !== "\n" && c[i] !== "\r") i++; continue; }
    if (ch === "(") { let d = 1, o = ""; i++; while (i < L && d) { const x = c[i]; if (x === "\\") { const n = c[i + 1]; if (/[0-7]/.test(n)) { let oc = n; let k = i + 2; while (k < i + 4 && /[0-7]/.test(c[k])) oc += c[k++]; o += String.fromCharCode(parseInt(oc, 8) & 255); i = k; continue; } o += { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[n] ?? (n === "\r" || n === "\n" ? "" : n); i += 2; continue; } if (x === "(") d++; if (x === ")") { d--; if (!d) { i++; break; } } o += x; i++; } st.push({ str: o }); continue; }
    if (ch === "<" && c[i + 1] !== "<") { const e = c.indexOf(">", i); let h = c.slice(i + 1, e).replace(/\s/g, ""); if (h.length % 2) h += "0"; let o = ""; for (let k = 0; k < h.length; k += 2) o += String.fromCharCode(parseInt(h.substr(k, 2), 16)); st.push({ str: o }); i = e + 1; continue; }
    if (ch === "[") { st.push({ mark: 1 }); i++; continue; }
    if (ch === "]") { const arr = []; while (st.length && !st[st.length - 1].mark) arr.unshift(st.pop()); st.pop(); st.push({ arr }); i++; continue; }
    if (ch === "<" || ch === ">") { i += 2; continue; }
    if (ch === "/") { let k = i + 1; while (k < L && !/[\s\/\[\]<>()%{}]/.test(c[k])) k++; st.push({ name: c.slice(i + 1, k) }); i = k; continue; }
    let k = i; while (k < L && !/[\s\/\[\]<>()%{}]/.test(c[k])) k++; if (k === i) { i++; continue; } const tok = c.slice(i, k); i = k;
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(tok)) { st.push({ num: parseFloat(tok) }); continue; }
    const nums = () => st.filter(x => x.num !== undefined).map(x => x.num);
    if (tok === "ID") { const e = c.indexOf("EI", i); i = e < 0 ? L : e + 2; st.length = 0; continue; }
    switch (tok) {
      case "BT": tm = [1, 0, 0, 1, 0, 0]; lm = tm.slice(); cur = null; break;
      case "ET": cur = null; break;
      case "q": gs.push(ctm.slice()); break; case "Q": ctm = gs.pop() || [1, 0, 0, 1, 0, 0]; break;
      case "cm": { const n = nums().slice(-6); if (n.length === 6) ctm = mul(n, ctm); break; }
      case "Tf": { const nm = st.filter(x => x.name).pop(); const n = nums().pop(); if (nm) font = fontOf(nm.name); if (n) fs = n; break; }
      case "TL": tl = nums().pop() || 0; break;
      case "Td": { const n = nums().slice(-2); moveTo(n[0], n[1]); break; }
      case "TD": { const n = nums().slice(-2); tl = -n[1]; moveTo(n[0], n[1]); break; }
      case "Tm": { const n = nums().slice(-6); if (n.length === 6) { lm = n; tm = n.slice(); cur = null; } break; }
      case "T*": moveTo(0, -tl); break;
      case "Tj": { const s0 = st.filter(x => x.str !== undefined).pop(); if (s0) show(s0.str); break; }
      case "'": { moveTo(0, -tl); const s0 = st.filter(x => x.str !== undefined).pop(); if (s0) show(s0.str); break; }
      case "\"": { moveTo(0, -tl); const s0 = st.filter(x => x.str !== undefined).pop(); if (s0) show(s0.str); break; }
      case "TJ": { const a = (st.filter(x => x.arr).pop() || { arr: [] }).arr; for (const x of a) { if (x.str !== undefined) show(x.str); else if (x.num !== undefined && x.num < -180 && cur) cur.s += " "; } break; }
    }
    st.length = 0;
  }
  return frags.filter(f => f.s.trim());
}
function layoutLines(frags) {
  frags.sort((a, b) => b.y - a.y || a.x - b.x); const lines = [];
  for (const f of frags) { const L = lines.find(l => Math.abs(l.y - f.y) < Math.max(2, f.size * 0.35)); if (L) L.f.push(f); else lines.push({ y: f.y, f: [f] }); }
  lines.sort((a, b) => b.y - a.y);
  return lines.map(l => { l.f.sort((a, b) => a.x - b.x); let o = "", endX = -1e9; for (const f of l.f) { const gap = f.x - endX; o += o && gap > f.size * 0.2 ? (gap > f.size * 3 ? "   " : " ") : ""; o += f.s; endX = f.x + f.s.length * f.size * 0.5; } return o.replace(/\s+$/, ""); });
}
/* pdf.js (si disponible) pour les PDF complexes */
async function pdfTextPdfJs(bytes) {
  const lib = await ensurePdfJs(); const pdf = await lib.getDocument({ data: bytes.slice() }).promise; let out = [];
  for (let p = 1; p <= Math.min(pdf.numPages, 20); p++) { const pg = await pdf.getPage(p); const tc = await pg.getTextContent(); const fr = tc.items.filter(it => it.str && it.str.trim()).map(it => ({ x: it.transform[4], y: it.transform[5], size: Math.hypot(it.transform[2], it.transform[3]) || 10, s: it.str })); out = out.concat(layoutLines(fr)); out.push(""); }
  return out.join("\n").trim();
}
async function extractPdf(bytes) {
  const P = await pdfParse(bytes); const xml = await pdfEmbeddedXML(P);
  if (xml) { try { const inv = parseInvoiceXML(xml); inv.format = "Factur-X (" + inv.format + ")"; inv.xml = xml; return inv; } catch (e) { console.warn(e); } }
  let text = ""; try { text = await pdfText(bytes); } catch (e) { console.warn("texte", e); }
  const bad = t => t.replace(/\s/g, "").length < 40 || (t.match(/[\u0000-\u0008\uFFFD]/g) || []).length > t.length * 0.05;
  if (bad(text)) { try { const t2 = await pdfTextPdfJs(bytes); if (!bad(t2) || t2.length > text.length) text = t2; } catch (e) { console.warn("pdf.js", e); } }
  const inv = parseInvoiceText(text); inv.format = "PDF"; inv.text = text; return inv;
}

/* ---------- Reconnaissance d'une facture à partir de son texte ---------- */
const MOISF = { janvier: 1, fevrier: 2, février: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, août: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12, décembre: 12 };
function findDates(t) {
  const out = []; let m; const re = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g;
  while ((m = re.exec(t))) { let y = +m[3]; if (y < 100) y += 2000; const d = +m[1], mo = +m[2]; if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y > 2000 && y < 2100) out.push({ i: m.index, iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` }); }
  const re2 = /\b(\d{1,2})(?:er)?\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})\b/gi;
  while ((m = re2.exec(t))) { const mo = MOISF[m[2].toLowerCase().replace("û", "u")]; if (mo) out.push({ i: m.index, iso: `${m[3]}-${String(mo).padStart(2, "0")}-${String(+m[1]).padStart(2, "0")}` }); }
  const re3 = /\b(20\d{2})-(\d{2})-(\d{2})\b/g; while ((m = re3.exec(t))) out.push({ i: m.index, iso: m[0] });
  return out.sort((a, b) => a.i - b.i);
}
const AMT_RE = /(-?\d{1,3}(?:[   .]\d{3})*(?:,\d{2})|-?\d+(?:[.,]\d{2}))(?!\d)\s*(?:€|EUR|euros?)?/g;
const parseAmt = s => { s = s.replace(/[€\s  ]|EUR|euros?/gi, ""); if (/,\d{2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); else if (/\.\d{2}$/.test(s)) s = s.replace(/,/g, ""); return Math.round(parseFloat(s) * 100); };
function amountsIn(line) { const r = []; let m; AMT_RE.lastIndex = 0; while ((m = AMT_RE.exec(line))) { const v = parseAmt(m[1]); if (!isNaN(v)) r.push(v); } return r; }
function parseInvoiceText(text) {
  const t = (text || "").replace(/\u00a0|\u202f/g, " ").replace(/\bT\s?V\s?A\b/g, "TVA"); const lines = t.split(/\n/).map(l => l.trim()).filter(Boolean); const low = t.toLowerCase(); const inv = { type: "FA", vendeur: {}, acheteur: {}, lignes: [], tva: [], conf: 0, warn: [] };
  if (/\bavoir\b|credit note/i.test(t.slice(0, 600))) inv.type = "AV";
  // identifiants
  const sirets = [...t.matchAll(/\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/g)].map(m => m[1].replace(/\s/g, ""));
  const sirens = [...t.matchAll(/(?:siren|rcs[^0-9\n]{0,25}|siret)\s*(?:n°|no|:)?\s*(\d{3}\s?\d{3}\s?\d{3})/gi)].map(m => m[1].replace(/\s/g, ""));
  const tvas = [...t.matchAll(/\b(FR\s?[0-9A-Z]{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/gi)].map(m => m[1].replace(/\s/g, "").toUpperCase());
  const ours = new Set([S.siren].filter(Boolean)); const cand = []; sirets.forEach(x => cand.push(x.slice(0, 9))); sirens.forEach(x => cand.push(x)); tvas.forEach(x => /^FR..\d{9}$/.test(x) && cand.push(x.slice(4)));
  const others = cand.filter(x => !ours.has(x)); const vs = others[0] || "";
  inv.vendeur.siren = vs; inv.vendeur.siret = sirets.find(x => x.startsWith(vs)) || ""; inv.vendeur.tva = tvas.find(x => x.endsWith(vs)) || tvas.find(x => !ours.has(x.slice(4))) || "";
  if (cand.some(x => ours.has(x))) inv.acheteur.siren = S.siren;
  // numéro
  const numRe = /(?:facture|invoice|avoir|n°\s*de\s*facture|num[ée]ro\s*(?:de\s*)?(?:facture|pi[eè]ce)?)\s*(?:n[°o]\.?|no\.?|num[ée]ro|#|:)?\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/_.]{2,24})/gi; let m;
  while ((m = numRe.exec(t))) { const v = m[1]; if (/\d/.test(v) && !/^\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}$/.test(v) && !/^(du|date)$/i.test(v)) { inv.num = v.replace(/[.:]$/, ""); break; } }
  // dates
  const dates = findDates(t);
  const near = (kw) => { const re = new RegExp(kw, "i"); for (let k = 0; k < lines.length; k++) if (re.test(lines[k])) { const d = findDates(lines[k]).concat(findDates(lines[k + 1] || "")); if (d.length) return d[0].iso; } return ""; };
  inv.date = near("date\\s*(de\\s*)?(la\\s*)?(facture|facturation|d'émission|émission)|facture\\s*du|date\\s*:") || (dates[0] || {}).iso || "";
  inv.ech = near("[ée]ch[ée]ance|[àa] payer avant|date\\s*limite|due\\s*date|payable\\s*le") || "";
  if (inv.ech && inv.ech < inv.date) inv.ech = "";
  // totaux
  const lastAmt = re => { let v = null; for (let k = 0; k < lines.length; k++) if (re.test(lines[k])) { const a = amountsIn(lines[k]); const n = a.length ? a[a.length - 1] : (amountsIn(lines[k + 1] || "")[0] ?? null); if (n != null) v = n; } return v; };
  inv.ttc = lastAmt(/total\s*t\.?t\.?c|montant\s*t\.?t\.?c|net\s*[àa]\s*payer|total\s*[àa]\s*payer|montant\s*total|total\s*(de\s*la\s*)?facture|total\s*due|amount\s*due/i);
  inv.ht = lastAmt(/total\s*h\.?t|montant\s*h\.?t|total\s*hors\s*tax|sous[-\s]?total|base\s*h\.?t/i);
  inv.tvaTot = lastAmt(/total\s*t\.?v\.?a|montant\s*(de\s*la\s*)?t\.?v\.?a|^t\.?v\.?a\b|tva\s*\(?\s*\d/i);
  // ventilation par taux
  const rates = [2000, 1000, 550, 210, 850];
  for (const l of lines) { const rm = l.match(/(?:tva|t\.v\.a\.?)[^0-9]{0,12}(20|10|5[,.]5|2[,.]1|8[,.]5)\s*%/i) || l.match(/\b(20|10|5[,.]5|2[,.]1|8[,.]5)\s*%/); if (!rm) continue; const taux = Math.round(parseFloat(rm[1].replace(",", ".")) * 100); const a = amountsIn(l.replace(rm[0], " ")); if (a.length >= 2) { const [base, mt] = a.length >= 3 ? [a[a.length - 2], a[a.length - 1]] : [a[0], a[1]]; if (Math.abs(Math.round(base * taux / 10000) - mt) <= 2 && !inv.tva.some(x => x.taux === taux)) inv.tva.push({ taux, base, montant: mt }); } }
  // cohérence
  if (inv.ht == null && inv.ttc != null && inv.tvaTot != null) inv.ht = inv.ttc - inv.tvaTot;
  if (inv.tvaTot == null && inv.ttc != null && inv.ht != null) inv.tvaTot = inv.ttc - inv.ht;
  if (inv.ttc == null && inv.ht != null && inv.tvaTot != null) inv.ttc = inv.ht + inv.tvaTot;
  if (inv.ttc == null) { const all = lines.flatMap(amountsIn); if (all.length) { inv.ttc = Math.max(...all); inv.warn.push("Total TTC déduit du plus grand montant : à vérifier."); } }
  if (!inv.tva.length && inv.ht && inv.tvaTot != null) { const r = inv.tvaTot / inv.ht; const taux = inv.tvaTot === 0 ? 0 : rates.reduce((b, x) => Math.abs(x / 10000 - r) < Math.abs(b / 10000 - r) ? x : b, 2000); inv.tva.push({ taux, base: inv.ht, montant: inv.tvaTot }); }
  if (!inv.tva.length && inv.ttc) { inv.tva.push({ taux: 2000, base: Math.round(inv.ttc / 1.2), montant: inv.ttc - Math.round(inv.ttc / 1.2) }); inv.ht = inv.tva[0].base; inv.tvaTot = inv.tva[0].montant; inv.warn.push("Taux de TVA non trouvé : 20 % proposé."); }
  if (inv.tva.length > 1) { const sb = inv.tva.reduce((a, x) => a + x.base, 0), sm = inv.tva.reduce((a, x) => a + x.montant, 0); if (inv.ht == null || Math.abs(sb - inv.ht) <= 2) { inv.ht = sb; inv.tvaTot = sm; } }
  inv.net = inv.ttc;
  // nom du fournisseur : ligne d'en-tête la plus probable
  const skip = /facture|invoice|avoir|date|page|client|t[ée]l|e-?mail|www\.|http|siret|siren|tv\s?a|^n°|adresse|devis|commande|r[ée]f|capital|rcs|factur[ée]|livr[ée]|^à\s/i;
  const segs = lines.slice(0, 14).flatMap((l, k) => l.split(/\s{3,}/).map(x => ({ x: x.trim(), k })));
  const scoreNom = ({ x, k }) => { if (x.length < 3 || x.length > 60 || !/[A-Za-zÀ-ÿ]{3}/.test(x) || skip.test(x) || amountsIn(x).length || /\b\d{5}\b|\b\d+\s*(bis|ter)?,?\s*(rue|av|avenue|bd|boulevard|place|chemin|all[ée]e|impasse|route|quai)\b/i.test(x) || /^(le|du|au)\s/i.test(x)) return -1;
    let sc = 20 - k; if (/\b(SARL|SAS|SASU|EURL|SA|SNC|SCI|SELARL|ETS|GROUPE|&|FILS|FR[ÈE]RES|SOCI[ÉE]T[ÉE])\b/i.test(x)) sc += 15; if (x === x.toUpperCase()) sc += 3; return sc; };
  inv.vendeur.nom = (segs.map(z => [scoreNom(z), z.x]).filter(z => z[0] >= 0).sort((a, b) => b[0] - a[0])[0] || [0, ""])[1];
  inv.vendeur.iban = (t.match(/\bFR\d{2}(?:\s?[0-9A-Z]{4}){5}\s?[0-9A-Z]{3}\b/) || [""])[0].replace(/\s/g, "");
  inv.iban = inv.vendeur.iban;
  // indice de confiance
  let c = 0; if (inv.ttc) c += 30; if (inv.ht != null && inv.tvaTot != null && Math.abs(inv.ht + inv.tvaTot - inv.ttc) <= 2) c += 25; if (inv.date) c += 15; if (inv.num) c += 15; if (inv.vendeur.siren) c += 15;
  inv.conf = c; return inv;
}

/* ---------- Fichier reçu -> facture normalisée ---------- */
async function readInvoiceFile(name, bytes) {
  const head = latin1(bytes.subarray(0, 8)); const low = name.toLowerCase();
  if (head.startsWith("%PDF") || low.endsWith(".pdf")) return extractPdf(bytes);
  if (head.startsWith("PK")) throw new Error("archive");
  const txt = utf8(bytes).replace(/^﻿/, "");
  if (/^\s*</.test(txt)) { const inv = parseInvoiceXML(txt); inv.xml = txt; return inv; }
  throw new Error("Format non reconnu (PDF, XML Factur-X / UBL / CII ou ZIP attendu)");
}
