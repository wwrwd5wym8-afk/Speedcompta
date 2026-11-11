/* ============================================================
   Paramètres › Langues : langue de l'interface (par utilisateur) et langue des états financiers,
   du conseil et des documents (par dossier). Dictionnaire intégré FR → EN / ES / DE / IT,
   table des traductions modifiable (ajout de termes, correction), traduction de l'écran
   et des PDF générés.
   ============================================================ */
const LG_LANGS = { fr: ["Français", "🇫🇷"], en: ["English", "🇬🇧"], es: ["Español", "🇪🇸"], de: ["Deutsch", "🇩🇪"], it: ["Italiano", "🇮🇹"] };
const LG_RAW = `Bilan|Balance sheet|Balance|Bilanz|Stato patrimoniale
Compte de résultat|Income statement|Cuenta de resultados|Gewinn- und Verlustrechnung|Conto economico
Annexe|Notes to the financial statements|Memoria|Anhang|Nota integrativa
États financiers|Financial statements|Estados financieros|Jahresabschluss|Bilancio d'esercizio
Comptes annuels|Annual accounts|Cuentas anuales|Jahresabschluss|Bilancio annuale
Actif|Assets|Activo|Aktiva|Attivo
Passif|Liabilities and equity|Pasivo|Passiva|Passivo
Actif immobilisé|Fixed assets|Activo no corriente|Anlagevermögen|Immobilizzazioni
Actif circulant|Current assets|Activo corriente|Umlaufvermögen|Attivo circolante
Total actif|Total assets|Total activo|Summe Aktiva|Totale attivo
Total passif|Total liabilities and equity|Total pasivo|Summe Passiva|Totale passivo
Total général|Grand total|Total general|Gesamtsumme|Totale generale
Immobilisations incorporelles|Intangible assets|Inmovilizado intangible|Immaterielle Vermögensgegenstände|Immobilizzazioni immateriali
Immobilisations corporelles|Property, plant and equipment|Inmovilizado material|Sachanlagen|Immobilizzazioni materiali
Immobilisations financières|Financial assets|Inversiones financieras|Finanzanlagen|Immobilizzazioni finanziarie
Frais d'établissement|Start-up costs|Gastos de establecimiento|Gründungskosten|Costi di impianto
Concessions, brevets, logiciels|Concessions, patents, software|Concesiones, patentes, software|Konzessionen, Patente, Software|Concessioni, brevetti, software
Fonds commercial|Goodwill|Fondo de comercio|Geschäftswert|Avviamento
Autres immobilisations incorporelles|Other intangible assets|Otro inmovilizado intangible|Sonstige immaterielle Vermögensgegenstände|Altre immobilizzazioni immateriali
Terrains|Land|Terrenos|Grundstücke|Terreni
Constructions|Buildings|Construcciones|Gebäude|Fabbricati
Installations techniques, matériel|Plant and machinery|Instalaciones técnicas y maquinaria|Technische Anlagen und Maschinen|Impianti e macchinari
Autres immobilisations corporelles|Other tangible assets|Otro inmovilizado material|Andere Sachanlagen|Altre immobilizzazioni materiali
Immobilisations en cours|Assets under construction|Inmovilizado en curso|Anlagen im Bau|Immobilizzazioni in corso
Participations|Equity investments|Participaciones|Beteiligungen|Partecipazioni
Autres immobilisations financières|Other financial assets|Otras inversiones financieras|Sonstige Finanzanlagen|Altre immobilizzazioni finanziarie
Stocks|Inventories|Existencias|Vorräte|Rimanenze
Matières premières, approvisionnements|Raw materials and supplies|Materias primas|Roh-, Hilfs- und Betriebsstoffe|Materie prime
En-cours de production|Work in progress|Productos en curso|Unfertige Erzeugnisse|Prodotti in corso di lavorazione
Produits intermédiaires et finis|Finished goods|Productos terminados|Fertige Erzeugnisse|Prodotti finiti
Marchandises|Goods for resale|Mercaderías|Waren|Merci
Avances et acomptes versés sur commandes|Advances paid on orders|Anticipos a proveedores|Geleistete Anzahlungen|Acconti versati
Clients et comptes rattachés|Trade receivables|Clientes|Forderungen aus Lieferungen und Leistungen|Crediti verso clienti
Autres créances|Other receivables|Otros deudores|Sonstige Forderungen|Altri crediti
Capital souscrit non appelé|Subscribed capital uncalled|Capital suscrito no exigido|Ausstehende Einlagen|Crediti verso soci
Valeurs mobilières de placement|Marketable securities|Inversiones financieras a corto plazo|Wertpapiere|Titoli
Disponibilités|Cash and cash equivalents|Efectivo|Flüssige Mittel|Disponibilità liquide
Charges constatées d'avance|Prepaid expenses|Gastos anticipados|Aktive Rechnungsabgrenzung|Risconti attivi
Capitaux propres|Equity|Patrimonio neto|Eigenkapital|Patrimonio netto
Capital social ou individuel|Share capital|Capital social|Gezeichnetes Kapital|Capitale sociale
Capital social|Share capital|Capital social|Gezeichnetes Kapital|Capitale sociale
Primes d'émission, de fusion, d'apport|Share premium|Prima de emisión|Kapitalrücklage|Riserva sovrapprezzo
Réserve légale|Legal reserve|Reserva legal|Gesetzliche Rücklage|Riserva legale
Réserves statutaires|Statutory reserves|Reservas estatutarias|Satzungsmäßige Rücklagen|Riserve statutarie
Réserves réglementées|Regulated reserves|Reservas especiales|Sonderrücklagen|Riserve regolamentate
Autres réserves|Other reserves|Otras reservas|Andere Gewinnrücklagen|Altre riserve
Report à nouveau|Retained earnings|Remanente|Gewinnvortrag|Utili portati a nuovo
Résultat de l'exercice|Net income for the year|Resultado del ejercicio|Jahresergebnis|Utile (perdita) dell'esercizio
Subventions d'investissement|Investment grants|Subvenciones de capital|Investitionszuschüsse|Contributi in conto capitale
Provisions réglementées|Regulated provisions|Provisiones reglamentadas|Sonderposten mit Rücklageanteil|Fondi regolamentati
Provisions pour risques et charges|Provisions for liabilities and charges|Provisiones para riesgos y gastos|Rückstellungen|Fondi per rischi e oneri
Provisions|Provisions|Provisiones|Rückstellungen|Fondi
Dettes|Liabilities|Deudas|Verbindlichkeiten|Debiti
Emprunts et dettes auprès des établissements de crédit|Bank borrowings|Deudas con entidades de crédito|Verbindlichkeiten gegenüber Kreditinstituten|Debiti verso banche
Emprunts et dettes financières divers|Other borrowings|Otras deudas financieras|Sonstige Finanzverbindlichkeiten|Altri debiti finanziari
Avances et acomptes reçus sur commandes|Advances received on orders|Anticipos de clientes|Erhaltene Anzahlungen|Acconti ricevuti
Dettes fournisseurs et comptes rattachés|Trade payables|Proveedores|Verbindlichkeiten aus Lieferungen und Leistungen|Debiti verso fornitori
Dettes fiscales et sociales|Tax and social security liabilities|Deudas fiscales y sociales|Steuer- und Sozialverbindlichkeiten|Debiti tributari e previdenziali
Dettes sur immobilisations|Payables on fixed assets|Proveedores de inmovilizado|Verbindlichkeiten aus Anlagenkäufen|Debiti per immobilizzazioni
Autres dettes|Other liabilities|Otras deudas|Sonstige Verbindlichkeiten|Altri debiti
Produits constatés d'avance|Deferred income|Ingresos anticipados|Passive Rechnungsabgrenzung|Risconti passivi
Brut|Gross|Bruto|Brutto|Lordo
Amortissements et dépréciations|Depreciation and impairment|Amortizaciones y deterioros|Abschreibungen und Wertberichtigungen|Ammortamenti e svalutazioni
Net|Net|Neto|Netto|Netto
Exercice N|Year N|Ejercicio N|Geschäftsjahr N|Esercizio N
Exercice N-1|Year N-1|Ejercicio N-1|Geschäftsjahr N-1|Esercizio N-1
Variation|Change|Variación|Veränderung|Variazione
Produits d'exploitation|Operating income|Ingresos de explotación|Betriebliche Erträge|Valore della produzione
Ventes de marchandises|Sales of goods|Ventas de mercaderías|Umsatzerlöse aus Waren|Vendite di merci
Production vendue de biens|Sales of manufactured goods|Ventas de productos|Umsatzerlöse aus Erzeugnissen|Vendite di prodotti
Production vendue de services|Sales of services|Prestaciones de servicios|Umsatzerlöse aus Dienstleistungen|Prestazioni di servizi
Production vendue|Production sold|Producción vendida|Verkaufte Produktion|Produzione venduta
Chiffre d'affaires net|Net revenue|Importe neto de la cifra de negocios|Nettoumsatz|Ricavi netti
Chiffre d'affaires|Revenue|Cifra de negocios|Umsatz|Fatturato
Production stockée|Change in inventories of finished goods|Variación de existencias de productos|Bestandsveränderungen|Variazione delle rimanenze di prodotti
Production immobilisée|Own work capitalised|Trabajos realizados para el inmovilizado|Andere aktivierte Eigenleistungen|Incrementi di immobilizzazioni per lavori interni
Subventions d'exploitation|Operating grants|Subvenciones a la explotación|Betriebszuschüsse|Contributi in conto esercizio
Reprises sur amortissements, dépréciations et provisions|Reversals of depreciation and provisions|Reversión de deterioros y provisiones|Auflösung von Abschreibungen und Rückstellungen|Riprese di valore e utilizzo fondi
Autres produits|Other income|Otros ingresos|Sonstige Erträge|Altri ricavi
Total des produits d'exploitation|Total operating income|Total ingresos de explotación|Summe betriebliche Erträge|Totale valore della produzione
Charges d'exploitation|Operating expenses|Gastos de explotación|Betriebliche Aufwendungen|Costi della produzione
Achats de marchandises|Purchases of goods for resale|Compras de mercaderías|Wareneinkauf|Acquisti di merci
Variation de stock de marchandises|Change in inventories of goods|Variación de existencias de mercaderías|Bestandsveränderung Waren|Variazione delle rimanenze di merci
Achats de matières premières et autres approvisionnements|Purchases of raw materials and supplies|Compras de materias primas|Materialaufwand|Acquisti di materie prime
Autres achats et charges externes|Other purchases and external expenses|Otros gastos externos|Sonstige betriebliche Aufwendungen|Servizi e altri costi esterni
Impôts, taxes et versements assimilés|Taxes and duties|Tributos|Steuern und Abgaben|Imposte e tasse
Salaires et traitements|Wages and salaries|Sueldos y salarios|Löhne und Gehälter|Salari e stipendi
Charges sociales|Social security charges|Cargas sociales|Soziale Abgaben|Oneri sociali
Dotations aux amortissements|Depreciation and amortisation|Dotación a la amortización|Abschreibungen|Ammortamenti
Dotations aux dépréciations|Impairment charges|Dotación por deterioro|Wertberichtigungen|Svalutazioni
Dotations aux provisions|Additions to provisions|Dotación a provisiones|Zuführung zu Rückstellungen|Accantonamenti
Autres charges|Other expenses|Otros gastos|Sonstige Aufwendungen|Oneri diversi
Total des charges d'exploitation|Total operating expenses|Total gastos de explotación|Summe betriebliche Aufwendungen|Totale costi della produzione
Résultat d'exploitation|Operating profit|Resultado de explotación|Betriebsergebnis|Risultato operativo
Produits financiers|Financial income|Ingresos financieros|Finanzerträge|Proventi finanziari
Charges financières|Financial expenses|Gastos financieros|Finanzaufwendungen|Oneri finanziari
Résultat financier|Financial result|Resultado financiero|Finanzergebnis|Risultato finanziario
Résultat courant avant impôts|Profit before tax and exceptional items|Resultado antes de impuestos|Ergebnis der gewöhnlichen Geschäftstätigkeit|Risultato prima delle imposte
Produits exceptionnels|Exceptional income|Ingresos excepcionales|Außerordentliche Erträge|Proventi straordinari
Charges exceptionnelles|Exceptional expenses|Gastos excepcionales|Außerordentliche Aufwendungen|Oneri straordinari
Résultat exceptionnel|Exceptional result|Resultado excepcional|Außerordentliches Ergebnis|Risultato straordinario
Participation des salariés aux résultats|Employee profit-sharing|Participación de los trabajadores|Mitarbeiterbeteiligung|Partecipazione dei dipendenti
Impôts sur les bénéfices|Income tax|Impuesto sobre beneficios|Steuern vom Einkommen und Ertrag|Imposte sul reddito
Impôt sur les sociétés|Corporate income tax|Impuesto sobre sociedades|Körperschaftsteuer|Imposta sulle società
Total des produits|Total income|Total ingresos|Summe Erträge|Totale proventi
Total des charges|Total expenses|Total gastos|Summe Aufwendungen|Totale costi
Bénéfice ou perte|Profit or loss|Beneficio o pérdida|Gewinn oder Verlust|Utile o perdita
Résultat net|Net income|Resultado neto|Jahresüberschuss|Utile netto
Bénéfice|Profit|Beneficio|Gewinn|Utile
Perte|Loss|Pérdida|Verlust|Perdita
Soldes intermédiaires de gestion|Intermediate management balances|Saldos intermedios de gestión|Zwischenergebnisse|Margini intermedi
Marge commerciale|Gross trading margin|Margen comercial|Handelsspanne|Margine commerciale
Production de l'exercice|Production for the year|Producción del ejercicio|Gesamtleistung|Produzione dell'esercizio
Consommation en provenance de tiers|Consumption from third parties|Consumos de terceros|Vorleistungen|Consumi da terzi
Valeur ajoutée|Value added|Valor añadido|Wertschöpfung|Valore aggiunto
Excédent brut d'exploitation|EBITDA|Resultado bruto de explotación|EBITDA|Margine operativo lordo
Capacité d'autofinancement|Self-financing capacity|Capacidad de autofinanciación|Cashflow|Autofinanziamento
Tableau des flux de trésorerie|Cash flow statement|Estado de flujos de efectivo|Kapitalflussrechnung|Rendiconto finanziario
Flux de trésorerie liés à l'activité|Cash flows from operating activities|Flujos de efectivo de explotación|Cashflow aus laufender Geschäftstätigkeit|Flusso dell'attività operativa
Flux de trésorerie liés aux opérations d'investissement|Cash flows from investing activities|Flujos de efectivo de inversión|Cashflow aus Investitionstätigkeit|Flusso dell'attività di investimento
Flux de trésorerie liés aux opérations de financement|Cash flows from financing activities|Flujos de efectivo de financiación|Cashflow aus Finanzierungstätigkeit|Flusso dell'attività di finanziamento
Variation de trésorerie|Net change in cash|Variación del efectivo|Veränderung der flüssigen Mittel|Variazione delle disponibilità liquide
Trésorerie d'ouverture|Opening cash|Efectivo al inicio|Anfangsbestand Zahlungsmittel|Disponibilità iniziali
Trésorerie de clôture|Closing cash|Efectivo al cierre|Endbestand Zahlungsmittel|Disponibilità finali
Trésorerie|Cash|Tesorería|Liquidität|Liquidità
Trésorerie nette|Net cash|Tesorería neta|Nettoliquidität|Liquidità netta
Besoin en fonds de roulement|Working capital requirement|Necesidades de fondo de maniobra|Working-Capital-Bedarf|Fabbisogno di capitale circolante
Fonds de roulement|Working capital|Fondo de maniobra|Working Capital|Capitale circolante netto
Endettement|Debt|Endeudamiento|Verschuldung|Indebitamento
Dettes financières|Financial debt|Deudas financieras|Finanzverbindlichkeiten|Debiti finanziari
Effectif|Headcount|Plantilla|Mitarbeiterzahl|Organico
Délai clients|Days sales outstanding|Plazo de cobro|Kundenziel|Giorni clienti
Délai fournisseurs|Days payables outstanding|Plazo de pago|Lieferantenziel|Giorni fornitori
Taux de marge|Margin rate|Tasa de margen|Margenquote|Tasso di margine
Rentabilité|Profitability|Rentabilidad|Rentabilität|Redditività
Tableau de bord|Dashboard|Panel de control|Dashboard|Cruscotto
Indicateurs clés|Key indicators|Indicadores clave|Kennzahlen|Indicatori chiave
Alertes|Alerts|Alertas|Warnungen|Avvisi
Commentaire|Comment|Comentario|Kommentar|Commento
Recommandations|Recommendations|Recomendaciones|Empfehlungen|Raccomandazioni
Seuil|Threshold|Umbral|Schwellenwert|Soglia
Conséquences|Consequences|Consecuencias|Folgen|Conseguenze
Accueil|Home|Inicio|Startseite|Home
Dossiers|Files|Expedientes|Mandate|Pratiche
Dossier permanent|Permanent file|Expediente permanente|Dauerakte|Fascicolo permanente
Comptabilité|Accounting|Contabilidad|Buchhaltung|Contabilità
Conseil|Advisory|Asesoría|Beratung|Consulenza
Juridique|Legal|Jurídico|Recht|Legale
Audit|Audit|Auditoría|Prüfung|Revisione
Paie|Payroll|Nóminas|Lohnabrechnung|Paghe
Contacts|Contacts|Contactos|Kontakte|Contatti
Paramètres|Settings|Configuración|Einstellungen|Impostazioni
Facturation clients|Customer invoicing|Facturación a clientes|Kundenrechnungen|Fatturazione clienti
Achats / Fournisseurs|Purchases / Suppliers|Compras / Proveedores|Einkauf / Lieferanten|Acquisti / Fornitori
Banque|Bank|Banco|Bank|Banca
TVA & impôts|VAT & taxes|IVA e impuestos|USt. & Steuern|IVA e imposte
Rapports|Reports|Informes|Berichte|Report
Formation|Training|Formación|Schulung|Formazione
Coffre-fort documentaire|Document vault|Archivo documental|Dokumententresor|Archivio documenti
GED|DMS|Gestión documental|DMS|Gestione documentale
Explorateur de documents|Document explorer|Explorador de documentos|Dokumenten-Explorer|Esplora documenti
Dossier client|Client folder|Carpeta del cliente|Mandantenordner|Cartella cliente
Accès rapide|Quick access|Acceso rápido|Schnellzugriff|Accesso rapido
Récents|Recent|Recientes|Zuletzt verwendet|Recenti
Corbeille|Recycle bin|Papelera|Papierkorb|Cestino
Documents générés|Generated documents|Documentos generados|Erzeugte Dokumente|Documenti generati
Modifié le|Date modified|Fecha de modificación|Änderungsdatum|Ultima modifica
Taille|Size|Tamaño|Größe|Dimensione
Statut|Status|Estado|Status|Stato
Trier|Sort|Ordenar|Sortieren|Ordina
Afficher|View|Ver|Ansicht|Visualizza
Détails|Details|Detalles|Details|Dettagli
Contrôle de gestion|Management control|Control de gestión|Controlling|Controllo di gestione
Gestion d'entreprise|Business management|Gestión empresarial|Unternehmensführung|Gestione aziendale
Gestion du patrimoine|Wealth management|Gestión patrimonial|Vermögensverwaltung|Gestione patrimoniale
Comptes groupés|Grouped accounts|Cuentas agrupadas|Gruppenkonten|Conti di gruppo
Consolidation|Consolidation|Consolidación|Konsolidierung|Consolidamento
Fusion|Merger|Fusión|Verschmelzung|Fusione
Espace éditeur|Publisher area|Área del editor|Herausgeberbereich|Area editore
Rechercher|Search|Buscar|Suchen|Cerca
Enregistrer|Save|Guardar|Speichern|Salva
Annuler|Cancel|Cancelar|Abbrechen|Annulla
Supprimer|Delete|Eliminar|Löschen|Elimina
Modifier|Edit|Editar|Bearbeiten|Modifica
Paramétrer|Configure|Configurar|Konfigurieren|Configura
Fermer|Close|Cerrar|Schließen|Chiudi
Valider|Confirm|Validar|Bestätigen|Conferma
Exporter|Export|Exportar|Exportieren|Esporta
Importer|Import|Importar|Importieren|Importa
Imprimer|Print|Imprimir|Drucken|Stampa
Nouveau|New|Nuevo|Neu|Nuovo
Date|Date|Fecha|Datum|Data
Libellé|Description|Concepto|Bezeichnung|Descrizione
Compte|Account|Cuenta|Konto|Conto
Débit|Debit|Debe|Soll|Dare
Crédit|Credit|Haber|Haben|Avere
Solde|Balance|Saldo|Saldo|Saldo
Montant|Amount|Importe|Betrag|Importo
Total|Total|Total|Summe|Totale
Journal|Journal|Diario|Journal|Giornale
Grand livre|General ledger|Libro mayor|Hauptbuch|Libro mastro
Balance générale|Trial balance|Balance de sumas y saldos|Summen- und Saldenliste|Bilancio di verifica
Clients|Customers|Clientes|Kunden|Clienti
Fournisseurs|Suppliers|Proveedores|Lieferanten|Fornitori
Factures|Invoices|Facturas|Rechnungen|Fatture
Facture|Invoice|Factura|Rechnung|Fattura
Devis|Quote|Presupuesto|Angebot|Preventivo
Avoir|Credit note|Factura rectificativa|Gutschrift|Nota di credito
Échéance|Due date|Vencimiento|Fälligkeit|Scadenza
Quantité|Quantity|Cantidad|Menge|Quantità
Prix unitaire HT|Unit price excl. VAT|Precio unitario sin IVA|Einzelpreis netto|Prezzo unitario IVA esclusa
Total HT|Total excl. VAT|Total sin IVA|Summe netto|Totale imponibile
Total TTC|Total incl. VAT|Total con IVA|Summe brutto|Totale IVA inclusa
TVA|VAT|IVA|USt.|IVA
Conditions de paiement|Payment terms|Condiciones de pago|Zahlungsbedingungen|Condizioni di pagamento
Exercice|Financial year|Ejercicio|Geschäftsjahr|Esercizio
Exercice clos le|Financial year ended|Ejercicio cerrado el|Geschäftsjahr zum|Esercizio chiuso al
Règles et méthodes comptables|Accounting policies|Normas de registro y valoración|Bilanzierungs- und Bewertungsmethoden|Criteri di valutazione
Faits marquants de l'exercice|Significant events of the year|Hechos relevantes del ejercicio|Wesentliche Ereignisse des Geschäftsjahres|Fatti di rilievo dell'esercizio
Engagements hors bilan|Off-balance sheet commitments|Compromisos fuera de balance|Außerbilanzielle Verpflichtungen|Impegni fuori bilancio
Rapport de gestion|Management report|Informe de gestión|Lagebericht|Relazione sulla gestione
Situation de la société|Company's situation|Situación de la sociedad|Lage der Gesellschaft|Situazione della società
Affectation du résultat|Appropriation of profit|Aplicación del resultado|Ergebnisverwendung|Destinazione dell'utile
pas d'exercice précédent|no previous year|sin ejercicio anterior|kein Vorjahr|nessun esercizio precedente
Chiffre d'affaires mensuel|Monthly revenue|Cifra de negocios mensual|Monatsumsatz|Fatturato mensile
Commentaire du conseiller|Advisor's comment|Comentario del asesor|Kommentar des Beraters|Commento del consulente
Personnaliser|Customize|Personalizar|Anpassen|Personalizza
Délai clients (jours)|Days sales outstanding|Plazo de cobro (días)|Kundenziel (Tage)|Giorni clienti
Délai fournisseurs (jours)|Days payables outstanding|Plazo de pago (días)|Lieferantenziel (Tage)|Giorni fornitori
Toutes les alertes →|All alerts →|Todas las alertas →|Alle Warnungen →|Tutti gli avvisi →
Alertes de seuils|Threshold alerts|Alertas de umbrales|Schwellenwarnungen|Avvisi di soglia
Flux de trésorerie|Cash flows|Flujos de efectivo|Cashflows|Flussi di cassa
États flash|Flash reports|Informes flash|Kurzberichte|Report flash
Comptabilité analytique|Cost accounting|Contabilidad analítica|Kostenrechnung|Contabilità analitica
Exports PDF et Excel|PDF and Excel exports|Exportaciones PDF y Excel|PDF- und Excel-Exporte|Esportazioni PDF ed Excel
Modifier la liasse|Edit the tax return|Editar la declaración|Steuererklärung bearbeiten|Modifica la dichiarazione
Documents|Documents|Documentos|Dokumente|Documenti
Historique des exports|Export history|Historial de exportaciones|Exportverlauf|Cronologia esportazioni
Comptes provisoires.|Provisional accounts.|Cuentas provisionales.|Vorläufiger Abschluss.|Conti provvisori.
Conseil aux particuliers|Personal advisory|Asesoría a particulares|Privatkundenberatung|Consulenza ai privati
Comptes annuels (PDF)|Annual accounts (PDF)|Cuentas anuales (PDF)|Jahresabschluss (PDF)|Bilancio (PDF)
Diaporama|Slideshow|Presentación|Diashow|Presentazione
Formations|Training courses|Formaciones|Schulungen|Corsi
Présentation du logiciel|Software presentation|Presentación del software|Softwarepräsentation|Presentazione del software
Langues|Languages|Idiomas|Sprachen|Lingue
Maintenance|Maintenance|Mantenimiento|Wartung|Manutenzione
E-mail marketing|E-mail marketing|E-mail marketing|E-Mail-Marketing|E-mail marketing
Tableau de bord e-commerce|E-commerce dashboard|Panel de comercio electrónico|E-Commerce-Dashboard|Cruscotto e-commerce
Canaux et connexions|Channels and connections|Canales y conexiones|Kanäle und Verbindungen|Canali e connessioni
Import des ventes|Sales import|Importación de ventas|Verkaufsimport|Importazione vendite
Catalogue et stock|Catalogue and stock|Catálogo y stock|Katalog und Lager|Catalogo e magazzino
Site vitrine|Showcase website|Sitio web|Website|Sito vetrina
Ventes HT|Sales excl. VAT|Ventas sin IVA|Umsatz netto|Vendite IVA esclusa
Ventes TTC|Sales incl. VAT|Ventas con IVA|Umsatz brutto|Vendite IVA inclusa
Commandes|Orders|Pedidos|Bestellungen|Ordini
Panier moyen TTC|Average basket incl. VAT|Cesta media con IVA|Durchschnittlicher Warenkorb|Carrello medio
Commissions|Fees|Comisiones|Provisionen|Commissioni
Situation financière|Financial position|Situación financiera|Finanzlage|Situazione finanziaria
Points forts|Strengths|Puntos fuertes|Stärken|Punti di forza
Points de vigilance|Points of attention|Puntos de atención|Achtungspunkte|Punti di attenzione`;
function lgBase() { const D = {}; LG_RAW.split("\n").forEach(r => { const [fr, en, es, de, it] = r.split("|"); D[fr] = { en, es, de, it }; }); return D; }
let LG_CACHE = null, LG_KEY = "";
function lgDict() { const ov = (psRoot().i18n || {}); const loc = (S && S.i18n) || {}; const k = JSON.stringify([ov, loc]).length + ":" + Object.keys(ov).length + ":" + Object.keys(loc).length; if (LG_CACHE && LG_KEY === k + JSON.stringify(ov).slice(0, 50)) return LG_CACHE; const D = lgBase(); [ov, loc].forEach(O => Object.entries(O).forEach(([fr, t]) => { D[fr] = Object.assign({}, D[fr] || {}, t); })); const M = {}; Object.entries(D).forEach(([fr, t]) => { M[fr.toLowerCase()] = t; }); LG_CACHE = { D, M, keys: Object.keys(D).filter(x => x.length >= 6).sort((a, b) => b.length - a.length) }; LG_KEY = k + JSON.stringify(ov).slice(0, 50); return LG_CACHE; }
function lgCfg() { const S2 = (S && S.langs) || {}; let ui = "fr"; try { ui = localStorage.getItem("sc:lang") || (CONFIG.langDef || "fr"); } catch (e) { } return { ui, etats: S2.etats || "fr", conseil: S2.conseil || "fr", docs: S2.docs || "fr" }; }
const LG_ETATS = new Set(["etats", "exports", "liasseEdit", "tftFr", "balrev", "consult", "documents", "rapGest"]); const LG_CONS = new Set(["cnsDash", "cnsAlert", "finance", "conseil", "cdgBoard", "cdgRep", "prev", "budget"]);
function lgScopeLang(view) { const c = lgCfg(); view = view || UI.view; if (LG_ETATS.has(view)) return c.etats; if (LG_CONS.has(view) || /^cns|^cdg|^fin/.test(view || "")) return c.conseil; return c.ui; }
function lgT(s, lang) { if (!lang || lang === "fr" || s == null) return s; const str = String(s); const t = str.trim(); if (!t || t.length > 400 || /^[\d\s.,%€+\-−()\/]+$/.test(t)) return s; const { M, keys, D } = lgDict(); const up = t === t.toUpperCase() && /[A-ZÉ]/.test(t); const look = x => { const e = M[x.toLowerCase()]; return e && e[lang]; };
  let r = look(t); if (!r) { const m = t.match(/^(.*?)(\s*\((?:[IVX]+|[A-Z]|[IVX]+\s*-\s*[IVX]+)\)\s*:?)$/); if (m && look(m[1])) r = look(m[1]) + m[2]; }
  if (!r) { const m = t.match(/^(.*?)(\s*[:·-]\s*.*)$/); if (m && m[1].length > 3 && look(m[1])) r = look(m[1]) + m[2]; }
  if (!r) { const m = t.match(/^(Total|TOTAL)\s+(.+)$/); if (m && look(m[2])) r = ({ en: "Total", es: "Total", de: "Summe", it: "Totale" }[lang] || "Total") + " " + look(m[2]); }
  if (!r && t.length < 140) { let out = t, hit = false, rep = 0; for (const k of keys) { if (out.length < k.length) continue; const i = out.toLowerCase().indexOf(k.toLowerCase()); if (i >= 0 && (i === 0 || /[\s(«"']/.test(out[i - 1])) && (i + k.length === out.length || /[\s),.:;»"']/.test(out[i + k.length]))) { const tr = D[k][lang]; if (tr) { out = out.slice(0, i) + "\u0001" + tr + "\u0002" + out.slice(i + k.length); hit = true; rep += k.replace(/[^A-Za-zÀ-ÿ]/g, "").length; } } } const all = t.replace(/[^A-Za-zÀ-ÿ]/g, "").length; if (hit && rep >= all * 0.85) r = out.replace(/[\u0001\u0002]/g, ""); }
  if (!r) return s; if (up) r = r.toUpperCase(); return str.replace(t, r); }
/* ---------- traduction de l'écran ---------- */
function lgDom() { const c = lgCfg(); const rail = document.querySelector(".rail"); const main = document.querySelector(".main-in") || document.querySelector("main"); const top = document.querySelector(".top, .topbar");
  const pass = (root, lang) => { if (!root || !lang || lang === "fr") return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode && /SCRIPT|STYLE|TEXTAREA|OPTION/.test(n.parentNode.nodeName) || n.parentNode.closest && n.parentNode.closest("[contenteditable],.mono,.no-tr,iframe") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }); const L = []; while (w.nextNode()) L.push(w.currentNode); L.forEach(n => { const v = n.nodeValue; if (!v.trim()) return; const r = lgT(v, lang); if (r !== v) n.nodeValue = r; }); root.querySelectorAll("input[placeholder]").forEach(i => { const r = lgT(i.placeholder, lang); if (r !== i.placeholder) i.placeholder = r; }); root.querySelectorAll("option").forEach(o => { if (o.closest(".no-tr")) return; const r = lgT(o.textContent, lang); if (r !== o.textContent) o.textContent = r; }); };
  pass(rail, c.ui); pass(top, c.ui); pass(main, lgScopeLang()); document.documentElement.lang = lgScopeLang() || "fr"; }
(function () { const _m = modAfterRender; modAfterRender = function () { if (_m) _m.apply(this, arguments); try { lgDom(); } catch (e) { } }; })();
/* ---------- traduction des PDF ---------- */
let LG_PDF = null;
(function () { if (typeof MiniPDF !== "undefined") { const _t = MiniPDF.prototype.text; MiniPDF.prototype.text = function (x, y, s, o) { return _t.call(this, x, y, LG_PDF ? lgT(s, LG_PDF) : s, o); }; }
  if (typeof Report !== "undefined") { const _p = Report.prototype.para; Report.prototype.para = function (t, o) { return _p.call(this, LG_PDF ? lgT(t, LG_PDF) : t, o); }; }
})();
(function () { const _r = typeof Report !== "undefined" && Report.prototype.newPage; if (!_r) return; Report.prototype.newPage = function (section, sub, form) { if (!LG_PDF) { const v = UI.view; const l = (LG_ETATS.has(v) || LG_CONS.has(v) || /^cns|^cdg/.test(v || "")) ? lgScopeLang() : lgCfg().docs; if (l && l !== "fr") { this._lg = l; LG_PDF = l; setTimeout(() => { if (LG_PDF === l) LG_PDF = null; }, 0); } } return _r.call(this, section, sub, form); }; })();
/* ---------- écran de paramétrage ---------- */
VIEWS.langs = () => { const c = lgCfg(); const st = UI.sub.lg ||= { l: "en", q: "" }; const { D } = lgDict(); const ov = psRoot().i18n || {}; const loc = (S && S.i18n) || {}; const q = (st.q || "").toLowerCase();
  const sel = (k, v, lbl, sub) => `<label class="f lg-c"><span><b>${lbl}</b><small>${sub}</small></span><select class="in" data-ch="lgSet" data-k="${k}">${Object.entries(LG_LANGS).map(([x, [n, f]]) => `<option value="${x}" ${v === x ? "selected" : ""}>${f} ${n}</option>`).join("")}</select></label>`;
  const rows = Object.keys(D).filter(fr => !q || (fr + " " + Object.values(D[fr]).join(" ")).toLowerCase().includes(q)).sort((a, b) => a.localeCompare(b, "fr"));
  return `<div class="pg-h"><div><div class="eyebrow">Paramètres · ${esc(S.nom || "")}</div><h1>Langues</h1><p class="lead">Choisissez la langue de l'interface et, pour ce dossier, celle des états financiers, du conseil et des documents. Les traductions sont modifiables et vous pouvez ajouter vos propres termes.</p></div></div>
  <section class="panel"><div class="panel-b"><div class="lg-grid">${sel("ui", c.ui, "Interface", "votre affichage (pour vous seul, sur ce navigateur)")}${sel("etats", c.etats, "États financiers", "bilan, compte de résultat, annexe, flux, rapport de gestion")}${sel("conseil", c.conseil, "Conseil", "tableau de bord, alertes, pilotage")}${sel("docs", c.docs, "Autres documents", "PDF et documents exportés")}</div>${isAdmin() ? `<label class="f" style="max-width:320px;margin-top:10px">Langue par défaut des nouveaux utilisateurs<select class="in" data-ch="lgDef">${Object.entries(LG_LANGS).map(([x, [n, f]]) => `<option value="${x}" ${(CONFIG.langDef || "fr") === x ? "selected" : ""}>${f} ${n}</option>`).join("")}</select></label>` : ""}<p class="small muted" style="margin-top:8px">Exemple : interface en français, états financiers et tableau de bord en anglais pour un actionnaire étranger. Les montants et les comptes ne sont jamais modifiés, seuls les libellés sont traduits.</p></div></section>
  <section class="panel" style="margin-top:14px"><div class="panel-h"><h2>Traductions</h2><div class="row" style="gap:8px"><input class="in sm" style="max-width:240px" placeholder="🔎 Rechercher un terme" value="${esc(st.q || "")}" data-ch="lgQ"><button class="btn sm" data-act="lgAdd">＋ Ajouter un terme</button><button class="btn sm" data-act="lgCsv">⇩ Exporter (CSV)</button><label class="btn sm">⇪ Importer (CSV)<input type="file" hidden accept=".csv,.txt" data-ch="lgImp"></label></div></div>
  <div class="tw" style="max-height:560px;overflow:auto"><table class="t lg-t no-tr"><thead><tr><th style="width:26%">Français</th>${Object.keys(LG_LANGS).filter(x => x !== "fr").map(x => `<th>${LG_LANGS[x][1]} ${LG_LANGS[x][0]}</th>`).join("")}<th style="width:40px"></th></tr></thead><tbody>${rows.map(fr => `<tr><td><b class="small">${esc(fr)}</b>${ov[fr] || loc[fr] ? ' <span class="pill n" style="font-size:10px">modifié</span>' : ""}</td>${["en", "es", "de", "it"].map(l => `<td><input class="in sm" value="${esc(D[fr][l] || "")}" data-ch="lgTr" data-fr="${esc(fr)}" data-l="${l}"></td>`).join("")}<td>${ov[fr] || loc[fr] ? `<button class="btn sm ghost" data-act="lgReset" data-fr="${esc(fr)}" title="Revenir à la traduction d'origine">↺</button>` : ""}</td></tr>`).join("")}</tbody></table></div><div class="panel-b small muted">${isAdmin() ? "Vos traductions s'appliquent à tous les dossiers." : "Vos traductions s'appliquent à ce dossier."} Les termes sont reconnus sur les écrans et dans les PDF générés.</div></section>`; };
function lgTrW() { if (isAdmin()) { const R = psRootW(); return R.i18n ||= {}; } return S.i18n ||= {}; }
function lgTrSave() { LG_CACHE = null; if (isAdmin()) { if (typeof psAuto === "function") psAuto("i18n", "Traductions"); } else Store.touch(); }
Object.assign(F2ACT, {
  lgAdd: () => openModal({ type: "lgAdd", d: { fr: "", en: "", es: "", de: "", it: "" } }),
  lgAddOk: () => { const d = UI.modal.d; const fr = String(d.fr || "").trim(); if (!fr) { toast("Saisissez le terme en français."); return; } const W = lgTrW(); W[fr] = { en: d.en || "", es: d.es || "", de: d.de || "", it: d.it || "" }; lgTrSave(); closeModal(); UI.sub.lg.q = fr; render(); },
  lgReset: el => { const fr = el.dataset.fr; const W = lgTrW(); delete W[fr]; if (S.i18n) delete S.i18n[fr]; lgTrSave(); render(); },
  lgCsv: () => { const { D } = lgDict(); const q = s => '"' + String(s || "").replace(/"/g, '""') + '"'; const csv = "﻿fr;en;es;de;it\r\n" + Object.keys(D).map(fr => [fr, D[fr].en, D[fr].es, D[fr].de, D[fr].it].map(q).join(";")).join("\r\n"); deliverFile("traductions.csv", new TextEncoder().encode(csv), "csv", null, { cat: "Paramètres", lib: "Traductions" }); }
});
Object.assign(F2CHG, {
  lgSet: el => { const k = el.dataset.k; if (k === "ui") { try { localStorage.setItem("sc:lang", el.value); } catch (e) { } } else { (S.langs ||= {})[k] = el.value; Store.touch(); } toast("Langue enregistrée."); render(); },
  lgDef: el => { const R = psRootW(); R.langDef = el.value; if (typeof psAuto === "function") psAuto("langDef", "Langue par défaut"); CONFIG.langDef = el.value; render(); },
  lgQ: el => { UI.sub.lg.q = el.value; render(); },
  lgTr: el => { const fr = el.dataset.fr; const W = lgTrW(); const { D } = lgDict(); W[fr] = Object.assign({}, D[fr] || {}, W[fr] || {}, { [el.dataset.l]: el.value }); lgTrSave(); },
  lgImp: async el => { const f = el.files[0]; el.value = ""; if (!f) return; const t = (await f.text()).replace(/^﻿/, ""); const R = typeof ecCSV === "function" ? ecCSV(t) : t.split(/\r?\n/).map(l => l.split(";")); const h = R[0].map(x => x.trim().toLowerCase()); const ix = l => h.indexOf(l); if (ix("fr") < 0) { toast("Colonne « fr » introuvable."); return; } const W = lgTrW(); let n = 0; R.slice(1).forEach(r => { const fr = (r[ix("fr")] || "").trim(); if (!fr) return; const o = {}; ["en", "es", "de", "it"].forEach(l => { if (ix(l) >= 0 && r[ix(l)]) o[l] = r[ix(l)].trim(); }); W[fr] = Object.assign(W[fr] || {}, o); n++; }); lgTrSave(); render(); toast(n + " traduction(s) importée(s)."); }
});
(function () { const _r = renderModal; renderModal = function () { const d = UI.modal; if (!d || d.type !== "lgAdd") return _r.apply(this, arguments); const D2 = d.d; return modalFrame("Ajouter un terme", `<div class="grid g2">${[["fr", "Français"], ["en", "Anglais"], ["es", "Espagnol"], ["de", "Allemand"], ["it", "Italien"]].map(([k, l]) => `<label class="f">${l}<input class="in" data-m="${k}" value="${esc(D2[k] || "")}"></label>`).join("")}</div>`, `<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="lgAddOk">Ajouter</button>`); }; })();
(function () { const N = NAV2.find(n => n[0] === "params"); if (N) { if (!N[2].includes("langs")) N[2].push("langs"); N[3] = (N[3] || []).filter(s => s[0] !== "langs"); if (!N[3].length) N[3].push(["params", "Paramètres du dossier"]); const i = N[3].findIndex(s => s[0] === "maint"); N[3].splice(i < 0 ? N[3].length : i, 0, ["langs", "Langues"]); } })();
(function () { const st = document.createElement("style"); st.textContent = `.lg-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.lg-c{background:#F7FAFA;border:1px solid var(--line,#E3ECEB);border-radius:12px;padding:12px}.lg-c span{display:flex;flex-direction:column;margin-bottom:6px}.lg-c small{color:#6B7A7A;font-size:11.5px;font-weight:400}.lg-t td{padding:4px 6px}@media(max-width:1000px){.lg-grid{grid-template-columns:1fr 1fr}}`; document.head.appendChild(st); })();
