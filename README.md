something to be added

- React frontend
- Go backend
- Docker
- Postgres DB
- SMTP


Co działa.
- Dodawanie terminów
- Wyświetlanie terminów w kalendarzu
- Zmiana widoków
- Logowanie i rejestracja
- Użytkownik może dodawać terminów jako zalogowany i anonimowy (API Key)
- Wyświetlanie własnych terminów
- Wypełnienie danych na podstawie zalogowanego użytkownika

Do zrobienia
- Administrator
- SMTP

## App Diagram

- Nginx
- React Frontend
- PostgreSQL Database
- Golang Backend
- SMTP server

## Running in docker compose (localhost | testing purposes)

```bash
docker compose up --build
```

## Running in docker swarm (production)

W pierwszej kolejności trzeba wybudować obrazy. Docker Swarm nie wspiera budowania jako jeden z kroków wdrożenia.
```bash
docker build -t calendar_app_frontend ./frontend
docker build -t calendar_app_backend ./backend
```

Inicjalizacja Docker Swarm
```bash
docker swarm init
```

Wdrożenie stack'a
```bash
docker stack deploy -c docker-swarm.yml calendar_app
```

Usuwanie stack'a
```bash
docker stack rm calendar_app
```

