Apikacja jest napisana w architekturze mikroserwisowej i w sposób skonteneryzowany. 

Serwisy:
- **Frontend** 
	Ten kontener posiada 2 kroki przy tworzeniu. W pierwszej kolejności budowana jest aplikacja **ReactJS**, a następnie wybudowane artefakty są przenoszone do instancji **Nginx**, gdzie są hostowane dla klienta
	
- **Backend**
	Napisany w Golang odpowiada za odbieranie zapytań API z frontendu, a następnie wykonaniu akcji na podstawie otrzymanego zapytania i wysłaniu powiadomienia do użytkownika
	
- **PostgreSQL**
	Relacyjna baza danych, do której trafiają zapisane wyniki zapytań
	
- **SMTP**
	Odpowiada za wysyłanie powiadomień

Porty:
- Frontend - 3000
- Backend - 5000
- PostgreSQL - 5432

# Konfiguracja środowiska

Aplikacja jest napisana w sposób skonteneryzowany więc jedyne co jest potrzebne do jej uruchomienia to silnik **Docker**. 

Po uruchomieniu aplikacji powinna ona być dostępna pod adresem `http://localhost:3000`

Możliwe są dwa rodzaje wdrożenia aplikacji
- Testowe - Docker Compose
- Produkcyjne - Docker Swarm

```ad-info
Komendy są wykonywane w korzeniu (root) repozytorium, więc po sklonowaniu należy zrobić `cd hairdresser-calendar-app`
```

Do uruchomienia aplikacji wymagany jest plik `.env`, który zawiera wszystkie zmienne środowiskowe do poprawnego działania kontenera

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER="<placeholder>"
SMTP_PASS="<placeholder>"
ADMIN_EMAIL="<placeholder>"
ADMIN_PASSWORD="<placeholder>"
POSTGRES_USER="<placeholder>"
POSTGRES_PASSWORD="<placeholder>"
```

Credentiale do korzystania z smtp Gmail'a możemy utworzyć pod tym linkiem
https://myaccount.google.com/apppasswords

### Wdrożenie testowe

Tutaj możemy już skorzystać z funkcjonalności ułatwiających budowanie aplikacji

```bash
# Uruchomienie aplikacji
# opcjonalnie -d żeby odłączyć logi od terminala
docker compose up --build

# Wyłączenie aplikacji
docker compose down
```

### Wdrożenie produkcyjne

Docker swarm nie wspiera budowania obrazów jako kroku wdrożenia więc musimy to zrobić zanim uruchomimy aplikację.

Wdrożenie za pomocą swarm umożliwia nam skalowanie naszego "klastra" kontenerów w sposób podobny jak Kubernetes, natomiast K8s wydaje się przesadnym i zbyt drogim rozwiązaniem pod ewentualny ruch jaki będzie otrzymywać ta aplikacja.

```bash
# Budowa obrazów
docker build -t calendar_app_frontend ./frontend
docker build -t calendar_app_backend ./backend

# Inicjalizacja docker swarm
docker swarm init

# Uruchomienie aplikacji (postawienie stack'a)
docker stack deploy -c docker-swarm.yml calendar_app

# Wyłączenie aplikacji
docker stack rm calendar_app
```

# Podsumowanie Funcjonalności

**Wymagania Funkcjonalne Systemu Rezerwacji Terminów**

*   [x] **Wyświetlanie Kalendarza:**

    *   [x] 1.1. System powinien prezentować kalendarz w sposób przejrzysty, umożliwiając użytkownikowi łatwą orientację w czasie.
    *   [x] 1.2. System powinien oferować możliwość przełączania się pomiędzy różnymi widokami kalendarza:
        *   [x] 1.2.1. Widok dzienny: prezentacja terminów dla jednego dnia.
        *   [x] 1.2.2. Widok tygodniowy: prezentacja terminów dla jednego tygodnia.
        *   [x] 1.2.3. Widok miesięczny: prezentacja terminów dla jednego miesiąca.
    *   [x] 1.3. System powinien wizualnie rozróżniać terminy zajęte i wolne.

*   [x] **Rezerwacja Terminów:**

    *   [x] 2.1. Użytkownik powinien mieć możliwość zaznaczenia konkretnego, wolnego terminu w kalendarzu.
    *   [x] 2.2. Po zaznaczeniu terminu, system powinien wyświetlić formularz umożliwiający wprowadzenie następujących danych:
        *   [x] 2.2.1. Imię
        *   [x] 2.2.2. Nazwisko
        *   [x] 2.2.3. Adres email
        *   [x] 2.2.4. (Opcjonalnie) Dodatkowe informacje/uwagi
    *   [x] 2.3. Przed potwierdzeniem rezerwacji, system powinien sprawdzić, czy dany termin jest nadal dostępny.
    *   [x] 2.4. Po pomyślnej rezerwacji, system powinien wyświetlić komunikat potwierdzający rezerwację.

*   [ ] **Zarządzanie Rezerwacjami (Funkcje Administracyjne):**

    *   [x] 3.1. Administrator systemu powinien mieć dostęp do panelu administracyjnego.
    *   [x] 3.2. W panelu administracyjnym, administrator powinien mieć możliwość przeglądania listy wszystkich rezerwacji.
    *   [x] 3.3. Dla każdej rezerwacji, administrator powinien mieć możliwość:
        *   [x] 3.3.1. Edycji danych rezerwacji (np. imię, nazwisko, email).
        *   [x] 3.3.2. Anulowania rezerwacji.
    *   [x] 3.4. System powinien automatycznie wysyłać potwierdzenia rezerwacji na adres email podany przez użytkownika podczas rezerwacji.
        *   [x] 3.4.1. Potwierdzenie powinno zawierać szczegóły rezerwacji (data, godzina, imię, nazwisko).
        *   [ ] 3.4.2. Potwierdzenie powinno zawierać opcję anulowania rezerwacji (np. link do anulowania).
    *   [x] 3.5. System powinien automatycznie wysyłać powiadomienie do administratora o nowej rezerwacji. (Opcjonalne)
       

# Aplikacja mobilna

Podgląd aplikacji jest zrobiony przez webowy emulator Androida dostępny pod portem 6080.

Uruchomienie stacku
```
docker compose up
```

Emulator powinien być dostępny pod adresem `http://localhost:6080`

Połączenie emulatora z serwerem `react-native`
```
docker exec calendar_app_mobile adb connect calendar_app_emulator:5555
```

Wybudowanie pliku apk (tą komende też odpalamy żeby przetestować nowe zmiany w kodzie)
```
docker exec calendar_app_mobile npx react-native run-android
```

Przez brak możliwości konfiguracji domyślnego hosta react-native (znany błąd) trzeba to zrobić ręcznie

1. W emulatorze klikamy `CTRL+M`
<img width="370" height="591" alt="image" src="https://github.com/user-attachments/assets/24dbfac3-af1f-4771-b238-41f90253c3f4" />

2. Wchodzimy w `Settings` i na samym dole `Debug server host & port for device`
3. Wpisujemy `localhost:8081` i resetujemy aplikacje (tak jak normalnie na telefonie). To trzeba zrobić tylko raz przy nowym uruchomienu emulatora. Potem każda budowa aplikacji działa już normalnie
