# Interactieve productdemo – AI Capture Studio

Een in code nagebouwde versie van de Document Understanding App. Er is geen video
nodig: de demo speelt vanzelf een rondleiding af met een bewegende cursor, klikken,
typen, uploaden, AI-verwerking en ondertiteling (dezelfde teksten als in de video).
Bezoekers kunnen pauzeren, naar een hoofdstuk springen of op **Zelf proberen**
klikken en zelf door de app klikken.

| Hoofdstuk | Wat je ziet |
|---|---|
| Intro | Logo en het procesdiagram met de 7 stappen |
| Start & mail | Startpagina, een nieuwe mail wordt live geclassificeerd |
| Uploaden | Documenttype kiezen, factuur erin slepen, uploaden |
| AI-verwerking | De wachtrij doorloopt de verwerkingsstappen (layout → GPT) |
| Valideren | Kopvelden en factuurregels met confidence, valideren en wegschrijven |
| Bonnetje | Gekreukt bonnetje op foto; twee fouten worden in de tabel verbeterd |
| Nieuw type | Nieuw documenttype; AI-suggesties stellen velden en tabelkolommen voor uit een voorbeeldfactuur |
| Instellen | Automatische validatie, een validatieregel die handmatige controle afdwingt, team met leden |
| Dashboard | Tellers, grafiek per dag en de kosten van de AI-verwerking |

Duur: ongeveer 3 minuten 15. Werkt op desktop en mobiel (op kleine schermen zoomt
de demo in en volgt hij de cursor).

## Bestanden

- `index.html` – de demopagina (met `?embed=1` alleen de speler, voor een iframe)
- `demo.js`, `demo.css` – de demo zelf, zonder externe bibliotheken
- `assets/` – logo en foto van het bonnetje (uit de video gehaald)
- `ai-capture-studio-demo.html` – alles in één bestand (om te mailen of los te openen)
- `build_standalone.py` – maakt dat ene bestand opnieuw na een wijziging

## Op de website zetten

Upload eerst de map `product-demo` naar de webserver, bijvoorbeeld naar de hoofdmap
van de site, zodat `https://jouwdomein.nl/product-demo/` werkt.

### Optie 1: iframe (aanbevolen, volledig los van de websitestijl)

In WordPress: voeg een blok **Aangepaste HTML** toe en plak:

```html
<iframe id="acs-demo" src="/product-demo/?embed=1&theme=dark&cta=/contact/"
        title="Demo AI Capture Studio" loading="lazy"
        allow="fullscreen"
        style="width:100%;border:0;aspect-ratio:16/10"></iframe>
<script>
  // past de hoogte van het iframe automatisch aan
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'acs-demo:height') {
      document.getElementById('acs-demo').style.height = e.data.height + 'px';
    }
  });
</script>
```

Gebruik `theme=light` op een lichte pagina en `theme=dark` op een donkere.

### Optie 2: direct in de pagina

```html
<div data-acs-demo data-theme="dark" data-cta-url="/contact/"></div>
<script src="/product-demo/demo.js" defer></script>
```

De stijl zit volledig onder `.acs`, dus hij botst niet met het thema (getest met het
Mahadeva AI-thema).

### Optie 3: één los bestand

`ai-capture-studio-demo.html` bevat alles, inclusief de afbeeldingen. Je kunt
het mailen, dubbelklikken om te openen, of als losse pagina uploaden.

## Instellingen

Als data-attribuut op `<div data-acs-demo>`, of als URL-parameter op `index.html`:

| Data-attribuut | URL-parameter | Standaard | Betekenis |
|---|---|---|---|
| `data-cta-url` | `cta` | `/contact/` | Link van de knop op het eindscherm |
| `data-cta-label` | `ctaLabel` | `Plan jouw demo` | Tekst van die knop |
| `data-theme` | `theme` | `auto` | `light`, `dark` of `auto` (volgt het systeem) |
| `data-autoplay` | `autoplay` | `true` | Automatisch starten zodra de demo in beeld komt |
| `data-chapter` | `chapter` | `0` | Starten bij hoofdstuk (0 = intro, 4 = valideren, 6 = nieuw type, …) |
| `data-user-name` | – | `Lisa Jansen` | Naam van de ingelogde gebruiker in de app |
| `data-user-email` | – | `lisa@bedrijf.nl` | E-mailadres onder die naam |
| `data-product-name` | – | `AI Capture Studio` | Productnaam op intro en eindscherm |

## Zelf proberen

Met **Zelf proberen** bedienen bezoekers de app zelf. Onder de speler verschijnt een lijst
met opdrachten die afvinken zodra ze gedaan zijn:

1. Upload een document en kijk hoe de AI het uitleest
2. Controleer een document en valideer het
3. Maak een nieuw documenttype aan
4. Laat de AI velden voorstellen met AI-suggesties
5. Upload een document van je eigen documenttype
6. Richt een validatieregel in
7. Geef een collega toegang via een team
8. Bekijk wat de AI-verwerking kost

Alles werkt echt binnen de demo. Wat de AI uitleest hangt af van de velden die je
instelt: voeg je bijvoorbeeld het veld "IBAN" toe, dan leest de AI bij het volgende
document ook het IBAN uit. Validatieregels worden echt gecontroleerd (een factuur boven
de ingestelde grens gaat naar handmatige controle), filters in de wachtrij werken en
Exporteren (CSV) downloadt echt een bestand. Er zijn vijf voorbeeldbestanden: twee
facturen, een rekeningoverzicht, een bonnetje en een contract.

## Aanpassen

- **Ondertitels en verloop**: de functies `chIntro`, `chStart`, … onderaan `demo.js`.
  Elke `P.caption('…')` is een ondertitel; elke `P.click(…)`/`P.type(…)` een actie.
- **Voorbeelddata** (leveranciers, facturen, mails): `SUPPLIERS`, `seedDocs()` en
  `seedMails()` in `demo.js`.
- **Voorbeeldbestanden** voor uploaden en AI-suggesties: `SAMPLES` en de functies
  `srcInvoice`, `srcTechSupply`, `srcStatement`, `srcReceipt` en `srcContract`.
- **Opdrachten** in "Zelf proberen": `GOALS` in `demo.js`.
- Draai daarna `python3 build_standalone.py` om het losse bestand bij te werken.

Lokaal bekijken: start in de hoofdmap van de repository `python3 -m http.server` en
open `http://localhost:8000/product-demo/`.

## Afbeelding voor de website

`assets/ai-capture-studio-kantoor.jpg` (en `.webp`, kleiner) is een 1920×1080 sfeerbeeld:
het kantoor uit de promovideo met collega's aan hun bureau, en op de voorgrond een curved
monitor met het validatiescherm van de app. Het kantoor is een echt videobeeld; monitor,
bureau en toetsenbord zijn in 3D gerenderd, met de app als haarscherp schermbeeld.

```html
<picture>
  <source srcset="/product-demo/assets/ai-capture-studio-kantoor.webp" type="image/webp">
  <img src="/product-demo/assets/ai-capture-studio-kantoor.jpg" width="1920" height="1080"
       alt="Een collega werkt aan zijn bureau, op de voorgrond toont een curved monitor AI Capture Studio" loading="lazy">
</picture>
```

### Afbeelding bij de tekst over veiligheid

`assets/ai-capture-studio-veiligheid.jpg` (4:3, 1440×1080, voor naast een tekstblok) en
`ai-capture-studio-veiligheid-breed.jpg` (16:9, 1920×1080), ook als `.webp`. Een bureau met
monitor uit de promovideo; op het scherm houdt een ingestelde validatieregel een factuur
boven € 5.000 automatisch tegen: "Handmatige controle vereist".

```html
<picture>
  <source srcset="/product-demo/assets/ai-capture-studio-veiligheid.webp" type="image/webp">
  <img src="/product-demo/assets/ai-capture-studio-veiligheid.jpg" width="1440" height="1080"
       alt="AI Capture Studio houdt een factuur boven de ingestelde grens automatisch tegen voor handmatige controle" loading="lazy">
</picture>
```

## Goed om te weten

- Het is een simulatie met fictieve voorbeelddata. In "Zelf proberen" kiezen
  bezoekers een voorbeeldbestand; eigen bestanden worden niet verwerkt.
- De foto van het bonnetje komt uit de video en toont een echte Action-bon. Wil je dat
  niet, vervang dan `assets/receipt.jpg` en de gegevens in `receiptDoc()`.
- Bezoekers die "beweging beperken" aan hebben staan, krijgen een startknop in plaats
  van automatisch afspelen.
