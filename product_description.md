# Huidige Productbeschrijving: Kerst Tetris App

Dit document bevat de volledige beschrijving en werking van de huidige "Kerst Tetris" applicatie.

## 1. Product Overzicht
De applicatie is een web-based Tetris-spel met een sterk Kerstthema, ontwikkeld door "VanHier". Het doel is om een feestelijke en competitieve ervaring te bieden waarbij gebruikers kunnen strijden voor prijzen tijdens de feestdagen. Het spel bevat authentieke Tetris-mechanics, gebruikeraunthenticatie, en een live leaderboard.

### Belangrijkste Kenmerken
- **Thema:** Volledig Kerst-uiterlijk met sneeuweffecten, kerstverlichting, en feestelijke kleuren (Ice Cyan, Santa Red, Gingerbread Gold, etc.).
- **Events:**
    - **Countdown:** Een teller die aftelt naar 31 december.
    - **Prijzen:**
        - **Top 3 Winnaars:** Ontvangen een exclusief prijzenpakket op 31 december.
        - **5 Random Winnaars:** Worden getrokken uit alle deelnemers op 1 januari.

## 2. Gebruikersstroom (User Flow)

### A. Welkomstscherm
- **Visueel:** Achtergrond met vallende sneeuw, grote "KERST TETRIS" titel, en "VanHier Presenteert" branding.
- **Inhoud:**
    - Uitleg van de spelregels (pijltjestoetsen besturing).
    - Informatie over de prijzen en trekkingen.
    - Waarschuwing dat email-verificatie vereist is.
- **Acties:**
    - "NIEUW ACCOUNT AANMAKEN" (Registratie)
    - "AL EEN ACCOUNT? INLOGGEN" (Login)

### B. Authenticatie
- **Registratie:** Gebruikers moeten zich registreren met Naam, Email, en Woonplaats.
- **Verificatie:** Een bevestigingsmail is vereist om scores op te kunnen slaan.
- **Login:** Bestaande gebruikers kunnen inloggen om hun sessie te hervatten.

### C. Titelscherm (Dashboard)
- Wordt getoond na inloggen.
- **Countdown Timer:** Live aftellen naar het nieuwjaarsevenement.
- **Leaderboard Preview:** Toont de huidige top 10 spelers.
- **Start Knop:** "START SPEL" om de game te starten.
- **Extra:** Info knop voor "Ghost & Strafpunten" uitleg.

### D. Gameplay (Het Spel)
- **Besturing:**
    - Pijl Links/Rechts: Blok verplaatsen.
    - Pijl Omhoog: Roteren.
    - Pijl Omlaag: Sneller laten vallen (Soft Drop).
- **Mechanics:**
    - **Grid:** Standaard 10 breed x 20 hoog.
    - **Levels:** Level 1 t/m 10. Snelheid (zwaartekracht) neemt exponentieel toe.
    - **Ghost Piece:**
        - Een visuele hulp die toont waar het blok landt.
        - **Strafpunten Systeem:**
            - **Level 1-2:** Ghost is gratis en aan.
            - **Level 3-6:** Ghost is **verboden** (uitgeschakeld).
            - **Level 7-10:** Ghost mag aan, maar kost punten per geplaatst blok (penalty).
    - **Score:** Punten voor lijnen (100, 300, 500, 800 voor Tetris) vermenigvuldigd met level.
    - **Sneeuwploeg:** Elke 110 seconden wordt het sneeuweffect op de achtergrond "geploegd" (gereset).

### E. Game Over & Highscores
- Bij Game Over wordt de score direct naar de database (Supabase) gestuurd.
- Het leaderboard wordt geüpdatet.
- Speler ziet of ze een nieuwe highscore hebben behaald.

## 3. Technische Architectuur

### Frontend
- **Framework:** React 18 met TypeScript (Vite build tool).
- **Styling:** Tailwind CSS voor styling en animaties (glas-effecten, gradients).
- **Status Beheer:** React `useState` en `useRef` voor game loop en state.

### Backend & Data
- **Service:** Supabase (Backend-as-a-Service).
- **Database:** PostgreSQL.
- **Identiteit:** Supabase Auth (Email/Wachtwoord).
- **Tabellen:**
    - `profiles` of `users`: Koppeling tussen auth uuid en gebruikersnaam/stad.
    - `scores`: Opslag van highscores per gebruiker.

### Bestanden Structuur
- `App.tsx`: Hoofdcontroller, bevat de game loop (`requestAnimationFrame`), state management, en routing tussen schermen.
- `components/`:
    - `GameBoard.tsx`: Renderen van het tetris grid.
    - `SnowEffect.tsx`: Canvas-gebaseerd sneeuweffect.
    - `TitleScreen.tsx`: Dashboard met countdown en startknop.
    - `LeaderboardModal.tsx`, `HUD.tsx`, `GhostInfoPanel.tsx`: UI elementen.
- `constants.ts`: Definities van blokken (Tetromino's), kleuren, en bordafmetingen.
- `services/supabase.ts`: API calls voor auth en database interactie.

## 4. Specifieke Game Logica
- **Gravity:** `getGravityForLevel` berekent valsnelheid (van 1000ms tot 150ms).
- **Ghost Rules:** `isGhostAllowedForLevel` bepaalt de regels voor de hulp-indicator.
- **Level Up:** Gebeurt elke 10 lijnen.
- **Touch Controls:** Veeg-gestures geïmplementeerd voor mobiel gebruik.
