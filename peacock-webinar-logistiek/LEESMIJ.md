# Webinar-landingspagina Logistiek & Transport: zo zet je hem live

| Bestand | Wat is het |
|---|---|
| `1-tekst-landingspagina.md` | Alle teksten los, inclusief SEO-titel en metabeschrijving |
| `2-wordpress-code.html` | De code die je in WordPress plakt (opmaak, pagina en formulier in één) |
| `voorbeeld.html` | Voorbeeld om in je browser te openen. De header en footer zijn nagebootst. |
| `kopieer-code.html` | **Makkelijkste manier:** open in je browser, vul datum en tijd in en klik op *Kopieer code* |
| `2-wordpress-code.txt` | Dezelfde code als platte tekst, om te openen in Kladblok en te kopiëren |

---

## Stap 1: datum en tijd invullen

> Gebruik je `kopieer-code.html`? Dan vul je datum en tijd daar in en kun je deze stap overslaan.

Open `2-wordpress-code.html` in een teksteditor (Kladblok, TextEdit of VS Code) en gebruik **Zoeken en vervangen** (Ctrl+H):

| Zoek | Vervang door (voorbeeld) |
|---|---|
| `[DATUM]` | `Donderdag 22 oktober 2026` |
| `[TIJD]` | `15:00 – 15:45 uur` |

Beide komen 5 keer voor. Check ook of de link `/privacyverklaring/` naar jullie privacyverklaring wijst.

## Stap 2: pagina aanmaken

1. **Pagina's → Nieuwe pagina**, titel bijvoorbeeld *Webinar logistiek*. De titel wordt op de pagina automatisch verborgen, want de hero heeft al een kop.
2. Kies onder *Sjabloon* een sjabloon **zonder zijbalk**, bij voorkeur **volledige breedte** ("Full width").
3. Slug: `webinar-logistiek-ai-capture-studio`.
4. Vul de SEO-titel en metabeschrijving in uit `1-tekst-landingspagina.md` (Yoast of Rank Math).

## Stap 3: code plakken

- **Blokeditor (Gutenberg):** klik op **+** → **Aangepaste HTML** (Custom HTML) → plak het hele bestand → **Voorbeeld** om te controleren.
- **Elementor:** sleep een **HTML**-widget in een sectie met *Volledige breedte* en zonder padding, en plak de code.
- **Klassieke editor:** plak in het tabblad **Tekst**, niet in *Visueel*.

Je moet hiervoor **Beheerder** zijn. Bij andere rollen haalt WordPress de `<style>`-, `<script>`- en formuliercode weg.

> **Wordt de pagina smal of afgeknipt?** Dan staat je thema geen volle breedte toe. Zoek in de code `<div id="pck-webinar"` en voeg `class="pck-boxed"` toe: `<div id="pck-webinar" class="pck-boxed" ...>`. De pagina past zich dan aan de contentbreedte aan.

## Stap 4: aanmeldingen ontvangen (kies één optie)

### Optie A: direct live, zonder koppeling (standaard)
Doe niets. Klikt een bezoeker op *Ja, ik meld me aan*, dan opent zijn of haar e-mailprogramma met een ingevulde mail naar **info@peacock-ia.nl**. Die moet de bezoeker nog wel zelf versturen, dus gebruik dit alleen als tijdelijke oplossing. Wil je een ander adres, pas dan in de code `FALLBACK_EMAIL` aan.

### Optie B: Power Automate (aanbevolen)
Aanmeldingen komen dan automatisch binnen, bijvoorbeeld in een SharePoint-lijst of Dataverse, met een bevestigingsmail.

1. Maak in Power Automate een **Instant cloud flow** met de trigger **When an HTTP request is received**.
2. Zet *Who can trigger the flow?* op **Anyone**.
3. Plak dit bij *Request Body JSON Schema*:

```json
{
  "type": "object",
  "properties": {
    "webinar": { "type": "string" },
    "datum": { "type": "string" },
    "tijd": { "type": "string" },
    "voornaam": { "type": "string" },
    "achternaam": { "type": "string" },
    "email": { "type": "string" },
    "bedrijf": { "type": "string" },
    "functie": { "type": "string" },
    "telefoon": { "type": "string" },
    "documenten": { "type": "string" },
    "akkoord_privacy": { "type": "boolean" },
    "pagina": { "type": "string" },
    "utm_source": { "type": "string" },
    "utm_medium": { "type": "string" },
    "utm_campaign": { "type": "string" },
    "aangemeld_op": { "type": "string" }
  },
  "required": ["voornaam", "achternaam", "email", "bedrijf"]
}
```

4. Voeg je acties toe, bijvoorbeeld: item maken in een SharePoint-lijst, bevestigingsmail met de Teams-link sturen, melding in een Teams-kanaal.
5. Sla op en kopieer de **HTTP URL** van de trigger.
6. Zoek in de code `var ENDPOINT = "";` en plak de URL tussen de aanhalingstekens:
   `var ENDPOINT = "https://...";`
7. **Test het één keer zelf.** Na een geslaagde aanmelding ziet de bezoeker "Je bent aangemeld!". Gaat het mis, dan krijgt de bezoeker een foutmelding met het e-mailadres als alternatief.

De flow-URL staat zichtbaar in de broncode van de pagina. Dat is normaal voor dit soort formulieren, maar controleer in de flow dat `email` gevuld is voordat je iets verstuurt. Spambots vangt het formulier grotendeels af met een onzichtbaar veld (honeypot).

### Optie C: eigen formulierplugin (Gravity Forms, Contact Form 7, WPForms)
Vervang in de code alles van `<form class="pck-form"` tot en met `</form>` door:

```html
<div class="pck-plugin">[jouw-formulier-shortcode]</div>
```

De invoervelden en de verzendknop krijgen automatisch de Peacock-opmaak.

## Stap 5: controleren

- Bekijk de pagina op desktop **en** mobiel.
- Meld jezelf één keer aan.
- **Google Tag Manager / GA4:** na elke aanmelding stuurt de pagina het event `webinar_aanmelding` naar de `dataLayer`. Stel dat in als conversie.
- **UTM-tags** (bijv. `?utm_source=linkedin`) worden bij optie B meegestuurd, zodat je ziet welke campagne aanmeldingen oplevert.

## Aanpassen

- **Teksten:** direct in de HTML aan te passen. Zoek op de zin die je wilt wijzigen.
- **Kleuren:** staan bovenaan de code als variabelen (`--pck-navy`, `--pck-blue`, `--pck-green`, `--pck-magenta`), volgens de Corporate Identity 2024.
- **Lettertype:** de pagina neemt automatisch het lettertype van de site over (TeX Gyre Adventor).
- **Code opnieuw bewerken:** laat geen lege regels in de code achter. De klassieke editor maakt daar alinea's van, en die breken de opmaak.
