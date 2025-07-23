# Wizarding Clock Server
- Tech Stack
    - DB: sqllite 3
    - Runtime: Node.js
        - Auth Service: Passport.js
    - Backend Routing: Express.js

## Docker Instructions
- Docker Run
```
docker run
  -d
  --name='Wizarding-Clock-Server'
  --pids-limit 2048
  -e TZ="America/Chicago"
  -e DATABASE_NAME="CHANGEME.db"
  -e JWT_SECRET="CHANGEMEPLEASE"
  -e DISCORD_WEBHOOK_URL="https://CHANGEMEPLEASE"
  -p '8080:8080/tcp' 
  -v wcdata:/app/db 'ghcr.io/wizard-clock/wizarding-clock-server:("dev","latest")' 
```
- Docker Compose
```
name: Wizarding Clock Server

services:
  wc-server:
    container_name: Wizarding-Clock-Server
    image: ghcr.io/wizard-clock/wizarding-clock-server:("dev","latest")
    ports:
      - 8080:8080
    environment:
      DATABASE_NAME: CHANGEME.db
      JWT_SECRET: CHANGEMEPLEASE
      DISCORD_WEBHOOK_URL: https://CHANGEMEPLEASE
    volumes:
      - wcdata:/app/db
    restart: always
    
volumes:
  wcdata:
```