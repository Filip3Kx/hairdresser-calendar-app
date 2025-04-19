something to be added

- React frontend
- Go backend
- Docker
- Postgres DB
- SMTP


Co działa.
- Dodawanie bookingów
- Wyświetlanie bookingów w kalendarzu
- Zmiana widoków
- Logowanie i rejestracja
- Użytkownik może dodawać bookingi jako zalogowany i anonimowy (API Key)
- Wyświetlanie własnych bookingów

Do zrobienia
- Wypełnienie danych na podstawie zalogowanego usera
- Administrator
- SMTP

## Running in docker compose (localhost | testing purposes)

```bash
docker compose up --build
```

## Running in docker swarm (production)

Build the images first - docker swarm doesn't support building as a part of the deployment
```bash
docker build -t calendar_app_frontend ./frontend
docker build -t calendar_app_backend ./backend
```

Initialize the swarm
```bash
docker swarm init
```

Deploy the stack
```bash
docker stack deploy -c docker-swarm.yml calendar_app
```

Remove the stack
```bash
docker stack rm calendar_app
```

