# Wizarding Clock Server
- Proposed Tech Stack
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
  -v wcdata:/app/db 'docker.io/s1r1usblack/wizarding-clock-server:[TAG("dev","release")]' 
```
- Docker Compose
```
name: Wizarding Clock Server

services:
  wc-server:
    container_name: Wizarding-Clock-Server
    image: docker.io/s1r1usblack/wizarding-clock-server:[TAG("dev","release")]
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