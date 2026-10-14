# Reel Portfolio

Lekka strona do przeglądania portfolio Big Bear Film. Logowanie istniejącym kontem Reel jest wymagane przed pobraniem jakiegokolwiek filmu lub opisu.

## Działanie

- Aktualne materiały z Reel, bez statycznej kopii danych w repozytorium.
- Kategorie oraz zależne filtry marki, roku i tagów, wyszukiwanie i sortowanie.
- Widok siatki lub listy, odtwarzanie YouTube/Vimeo i kopiowanie estetycznego linku.
- Wyłącznie odczyt portfolio. Brak edycji, kontaktów, sprzedaży i innych modułów CRM.
- Dane sesji przechowywane w `sessionStorage` danej karty; hasła nie są zapisywane przez stronę.
- Miniatury ładowane leniwie z istniejących adresów. Strona nie tworzy plików w Supabase Storage.

## GitHub Pages

Ustaw **Settings → Pages → Source: Deploy from a branch → main → /(root)**. Strona publikuje się automatycznie po zmianie plików. Nie wymaga instalacji pakietów ani budowania.

Repozytorium może być publiczne — zawiera wyłącznie kod, grafiki strony i publiczną konfigurację klienta. Żadne filmy, opisy portfolio, hasła ani uprzywilejowane klucze nie są zapisane w repozytorium. Dostęp do portfolio kontroluje serwer.

## Backend

Osobna funkcja Edge `reel-portfolio` działa w istniejącym projekcie Supabase Reel. Korzysta z istniejących kont i uprawnień do przestrzeni. Weryfikuje sesję Reel albo token dotychczasowego konta Supabase; żądania anonimowe nie otrzymują portfolio. Klucz serwisowy jest odczytywany wyłącznie ze środowiska serwera.

Ta funkcja nie zmienia istniejącej funkcji `reel-gateway`, tabel, polityk, kont ani ustawień Cashflow.

## Podgląd lokalny

Uruchom `python3 -m http.server 8080` w katalogu strony i otwórz `http://localhost:8080`.

## Testy

`node --test tests/portfolio.test.mjs` sprawdza zależne filtry, polskie wyszukiwanie i bezpieczne adresy odtwarzania.
