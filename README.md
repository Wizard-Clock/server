![wizarding-clock-high-resolution-logo-transparent](https://github.com/user-attachments/assets/3b8b5683-b1c4-47c6-b440-2779809c3135)
<p align="center"> 
  <br/>  
  <a href="https://opensource.org/license/agpl-v3"><img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg?color=3F51B5&style=for-the-badge&label=License&logoColor=000000&labelColor=ececec" alt="License: AGPLv3"></a>
  </a>
  <br/>  
</p>

# Wizarding Clock Server
### Tech Stack
- Runtime: Node.js
    - Auth Service: Passport.js
    - Routing: Express.js
- DB: sqllite 3
- Testing:
    - Mocha w/ Chai
### For more info see wiki [here](https://github.com/Wizard-Clock/server/wiki)!

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
    volumes:
      - wcdata:/app/db
    restart: always
    
volumes:
  wcdata:
```
