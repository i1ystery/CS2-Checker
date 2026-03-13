## CS2 Checker

Webová aplikace pro sledování statistik hráčů v **Counter‑Strike 2** s vizualizacemi heatmap. Umožňuje:

- vyhledat hráče podle Faceit nicku nebo URL profilu,
- zobrazit detailní statistiky, historii zápasů,
- nahrát demo soubory a generovat heatmapy zabití/smrtí na jednotlivých mapách.

V tomto projektu používám knihovnu [demoparser](https://github.com/LaihoE/demoparser) od **LaihoE** pro parsování CS2 demo souborů.

---

### Požadavky

- **Node.js** 18 nebo novější — stáhnete z [https://nodejs.org](https://nodejs.org)
- **Faceit API Key** (zdarma) — viz níže

Databázi není potřeba instalovat. Aplikace používá **SQLite**, která se vytvoří automaticky při prvním spuštění (soubor v adresáři `backend/data`).

---

### Získání Faceit API klíče

1. Otevřete [developers.faceit.com](https://developers.faceit.com/) a přihlaste se svým Faceit účtem.  
2. V sekci **App Studio** vytvořte novou aplikaci.  
3. Vygenerujte **Server side API Key**.  
4. Zkopírujte klíč – použijete ho v konfiguraci backendu (`backend/.env`).  

---

### Instalace a spuštění

#### 1. Klonování repozitáře

```bash
git clone <repository-url>
cd CS2-Checker
```

#### 2. Backend

```bash
cd backend
xcopy .env.example .env
npm install
```

Do souboru `backend/.env` doplňte svůj Faceit API key místo `your_faceit_api_key_here`.

#### 3. Frontend

```bash
cd frontend
xcopy .env.example .env.local
npm install
```

Výchozí nastavení `API_URL=http://localhost:4000` by mělo pro lokální spuštění fungovat bez úprav.

---

### Spuštění aplikace

Otevřete dva terminály:

**Terminál 1 – Backend**

```bash
cd backend
npm run dev
```

**Terminál 2 – Frontend**

```bash
cd frontend
npm run dev
```

Aplikace poběží na adrese: `http://localhost:3000`

---

### Jak aplikaci používat

1. Na úvodní stránce vyhledejte hráče podle Faceit nicku nebo URL profilu.  
2. Na profilu uvidíte celkové statistiky (ELO, K/D, HS%, Win Rate) a poslední zápasy.  
3. U konkrétního zápasu otevřete **matchroom** na Faceitu, stáhněte demo a nahrajte `.dem` soubor do aplikace.  
4. Aplikace pomocí knihovny **demoparser** zpracuje demo a zobrazí heatmapy zabití/smrtí.  
5. Parsed data se ukládají lokálně do SQLite, takže další načtení stejného zápasu je okamžité.

