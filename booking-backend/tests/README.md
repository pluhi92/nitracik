# Integračné testy - Nitráčik Backend

## ⚠️ Bezpečnosť - Produkcia je chránená!

Tieto testy **NIKDY** nepoužijú produkčnú databázu. Pred spustením testov sa overuje:
- Buď je nastavená `TEST_DATABASE_URL`
- Alebo `DB_NAME` obsahuje slovo "test"

Ak nie je splnená ani jedna podmienka, testy sa **NEspustia**.

## Inštalácia

```bash
cd booking-backend/tests
npm install
```

## Konfigurácia

Vytvorte súbor `booking-backend/.env` s testovacou databázou:

```env
# Povinné pre testy
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/nitracik_test
```

**Alebo** nastavte `DB_NAME` obsahujúce "test":

```env
DB_NAME=nitracik_test
```

## Spustenie testov

```bash
# Všetky testy
npm test

# Sledovanie zmien
npm run test:watch

# S pokrytim
npm run test:coverage
```

## Štruktúra

- `setup.js` - Databázové utility a kontrola prostredia
- `booking.test.js` - Testy pre logiku permanentiek
- `package.json` - Lokálne závislosti pre testy

## Čistenie dát

Testy automaticky čistia vytvorené dáta po každom teste (v `afterEach`).
Prefix `test_` sa používa pre identifikáciu testovacích záznamov.
