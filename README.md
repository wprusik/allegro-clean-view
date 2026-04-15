# allegro-classic-view

Repo zawiera dwa warianty rozszerzenia:

- `firefox/` - wersja do Mozilla Firefox
- `chrome/` - wersja do Google Chrome

Obie wersje uruchamiaja skrypt tylko na URL:

- `https://allegro.pl/produkt/*`

## Struktura

- `firefox/manifest.json`
- `firefox/content.js`
- `chrome/manifest.json`
- `chrome/content.js`

## Pakowanie - Firefox

1. Przejdz do katalogu projektu.
2. Spakuj zawartosc folderu `firefox` do archiwum ZIP (bez dodatkowego katalogu nadrzednego):

```powershell
Compress-Archive -Path .\firefox\* -DestinationPath .\allegro-classic-view-firefox.zip -Force
```

3. Zmien rozszerzenie pliku na `.xpi` (opcjonalnie lokalnie).  
W AMO mozesz wrzucic tez ZIP, a Mozilla podpisze dodatek.

## Podpisanie i wydanie - Firefox (AMO)

1. Wejdz do Firefox Add-ons Developer Hub: `https://addons.mozilla.org/developers/`
2. Utworz nowy dodatek i przeslij paczke z `firefox/` (ZIP/XPI).
3. Mozilla wykona walidacje i podpisze dodatek.
4. Po akceptacji publikujesz wersje produkcyjna.

## Pakowanie - Chrome

1. Przejdz do katalogu projektu.
2. Spakuj zawartosc folderu `chrome` do archiwum ZIP (bez dodatkowego katalogu nadrzednego):

```powershell
Compress-Archive -Path .\chrome\* -DestinationPath .\allegro-classic-view-chrome.zip -Force
```

## Podpisanie i wydanie - Chrome Web Store

1. Wejdz do Chrome Web Store Developer Dashboard: `https://chrome.google.com/webstore/devconsole`
2. Utworz nowy item i przeslij ZIP z `chrome/`.
3. Google podpisuje rozszerzenie automatycznie podczas publikacji.
4. Po review publikujesz wersje.

## Release checklist

1. Zwieksz `version` w `firefox/manifest.json` i `chrome/manifest.json`.
2. Zbuduj nowe paczki ZIP.
3. Wyslij nowe wersje do AMO i Chrome Web Store.
