# Universe Sandbox

Interaktywna symulacja grawitacyjna N-body w przeglądarce. Twórz ciała niebieskie, obserwuj ich orbity i kolizje w czasie rzeczywistym.

**[Wypróbuj online](https://oszypczy.github.io/UniverseSandbox/)**

## Jak używać

### Tworzenie ciał

- **Kliknij i przeciągnij** - utwórz ciało o wybranym rozmiarze (odległość przeciągnięcia = promień)
- **Podwójne kliknięcie** - utwórz ciało o domyślnym rozmiarze
- **Kliknij na ciało** - otwórz edytor właściwości (masa, rozmiar, prędkość)

### Sterowanie

| Klawisz | Akcja                         |
| ------- | ----------------------------- |
| Space   | Pauza / Wznów                 |
| R       | Reset symulacji               |
| Tab     | Przełącz tryb Edycja / Kamera |
| Delete  | Usuń zaznaczone ciało         |
| H       | Pokaż / ukryj HUD             |
| ?       | Pokaż / ukryj skróty          |

### Tryby

- **Edycja** - twórz i edytuj ciała, obracaj kamerę
- **Kamera** - swobodna nawigacja (pan, zoom, obrót)

## Fizyka

- Grawitacja Newtonowska między wszystkimi ciałami
- Kolizje łączą ciała (zachowanie pędu i objętości)
- Status układu: "Związany" (orbity) lub "Niezwiązany" (ucieczka)

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

## Technologie

React, TypeScript, Three.js, Vite
