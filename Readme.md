# 🏠 IoT Motion Detection System

Système de détection de mouvement IoT complet utilisant ESP32, MQTT, FastAPI et React.

---

## 📐 Architecture

```
[PIR Wokwi] → [ESP32] → [HiveMQ Cloud] → [FastAPI] → [SQLite]
                                                ↓
                                    [React Dashboard]
```

---

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Hardware | ESP32 + PIR + OLED + LED + Buzzer (Wokwi) |
| Communication | MQTT → HiveMQ Cloud (TLS) |
| Backend | Python + FastAPI + SQLite |
| Authentification | JWT + Multi-rôles (Admin/Viewer) |
| Frontend | React.js + Recharts |
| Temps réel | WebSockets |
| Déploiement | Docker Compose |

---

## 📁 Structure du Projet

```
IOT-project/
├── backend/
│   ├── main.py
│   ├── mqtt_client.py
│   ├── database.py
│   ├── models.py
│   ├── auth.py
│   ├── email_service.py
│   ├── .env                 ← À créer (voir plus bas)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── App.js
│   ├── Dockerfile
│   └── package.json
├── IOT-project.ino          ← Code Arduino ESP32
├── diagram.json             ← Schéma Wokwi
├── wokwi.toml               ← Config simulateur
├── libraries.txt            ← Librairies Arduino
├── docker-compose.yml
└── .gitignore
```

---

## ⚙️ Installation

### Prérequis

- [Python 3.11+](https://python.org)
- [Node.js 18+](https://nodejs.org)
- [Arduino CLI](https://arduino.cc/en/software)
- [VS Code + Extension Wokwi](https://marketplace.visualstudio.com/items?itemName=wokwi.wokwi-vscode)
- Compte [HiveMQ Cloud](https://hivemq.com/mqtt-cloud-broker/) (gratuit)

---

### 1️⃣ Hardware — Arduino CLI

```bash
# Autoriser les scripts PowerShell (Windows uniquement)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Installer le support ESP32
arduino-cli core update-index --additional-urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

arduino-cli core install esp32:esp32 --additional-urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

# Installer les librairies Arduino
arduino-cli lib install "PubSubClient"
arduino-cli lib install "Adafruit SSD1306"
arduino-cli lib install "Adafruit GFX Library"

# Compiler le projet
arduino-cli compile --fqbn esp32:esp32:esp32 IOT-project.ino --output-dir build
```

---

### 2️⃣ Backend — Python

```bash
# Aller dans le dossier backend
cd backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows :
venv\Scripts\activate
# Mac/Linux :
source venv/bin/activate

# Installer les dépendances
pip install fastapi
pip install uvicorn
pip install paho-mqtt
pip install sqlalchemy
pip install aiofiles
pip install python-jose[cryptography]
pip install passlib[bcrypt]
pip install python-multipart
pip install bcrypt==4.0.1
pip install websockets
pip install python-dotenv

# Lancer le backend
uvicorn main:app --reload
```

---

### 3️⃣ Frontend — React

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install axios
npm install recharts
npm install lucide-react
npm install jspdf
npm install jspdf-autotable
npm install html2canvas

# Lancer le frontend
npm start
```

---

## 🔐 Configuration (.env)

Crée un fichier `.env` dans le dossier `backend/` :

```env
MQTT_BROKER=YOUR_HIVEMQ_BROKER.hivemq.cloud
MQTT_PORT=8883
MQTT_USER=YOUR_MQTT_USER
MQTT_PASSWORD=YOUR_MQTT_PASSWORD
MQTT_TOPIC=home/pir/motion
SECRET_KEY=your-secret-key-here
EMAIL_SENDER=your-email@outlook.com
EMAIL_PASSWORD=your-email-password
EMAIL_RECEIVER=receiver@gmail.com
```

> ⚠️ Ne jamais committer le fichier `.env` sur GitHub !

Pour générer une clé secrète sécurisée :

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🎮 Simulation Wokwi (VS Code)

```bash
# Activer la licence Wokwi gratuite
# Ctrl+Shift+P → "Wokwi: Request a Free License"

# Compiler le firmware
arduino-cli compile --fqbn esp32:esp32:esp32 IOT-project.ino --output-dir build

# Lancer la simulation
# Ouvrir diagram.json → Ctrl+Shift+P → "Wokwi: Start Simulator"
```

---

## 🌐 Accès

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

> 📱 Pour accéder depuis un téléphone sur le même réseau WiFi, remplace `localhost` par l'IP locale de ton PC (ex: `192.168.1.15`)

---

## 👤 Comptes par Défaut

| Username | Password | Rôle |
|----------|----------|------|
| admin | admin123 | 👑 Admin |
| viewer | viewer123 | 👁️ Viewer |

> ⚠️ Change ces mots de passe en production !

---

## ✅ Fonctionnalités

- ✅ Simulation ESP32 + PIR + OLED + LED + Buzzer (Wokwi)
- ✅ Communication MQTT sécurisée → HiveMQ Cloud (TLS)
- ✅ Backend FastAPI + SQLite + REST API complète
- ✅ Authentification JWT + Gestion multi-rôles (Admin/Viewer)
- ✅ Alertes WebSocket en temps réel
- ✅ Dashboard React avec statistiques par heure/jour
- ✅ Gestion des utilisateurs (créer/supprimer)
- ✅ Variables d'environnement sécurisées (.env)
- ✅ Interface responsive mobile 📱
- ✅ Export rapport PDF

---

## 📄 Licence

MIT License — Free to use and modify.