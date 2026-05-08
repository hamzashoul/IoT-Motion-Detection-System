from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import engine, get_db
from models import MotionEvent
from auth import verify_password, create_token, get_current_user, require_admin, USERS, pwd_context
from mqtt_client import start_mqtt, set_loop
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel
import asyncio
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()
mqtt_client = None

@app.on_event("startup")
async def startup():
    global mqtt_client
    set_loop(asyncio.get_event_loop())
    mqtt_client = start_mqtt(manager)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {"status": "IoT Backend running 🚀"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = USERS.get(form_data.username)
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    token = create_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}

@app.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"username": current_user["username"], "role": current_user["role"]}

# ── User Management (Admin only) ─────────────────────

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"

@app.get("/users")
def get_users(current_user: dict = Depends(require_admin)):
    return [{"username": u, "role": USERS[u]["role"]} for u in USERS]

@app.post("/users")
def create_user(user: UserCreate, current_user: dict = Depends(require_admin)):
    if user.username in USERS:
        raise HTTPException(status_code=400, detail="Utilisateur déjà existant")
    USERS[user.username] = {
        "username": user.username,
        "password": pwd_context.hash(user.password),
        "role": user.role
    }
    return {"message": f"Utilisateur {user.username} créé ✅"}

@app.delete("/users/{username}")
def delete_user(username: str, current_user: dict = Depends(require_admin)):
    if username == "admin":
        raise HTTPException(status_code=400, detail="Impossible de supprimer l'admin")
    if username not in USERS:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    del USERS[username]
    return {"message": f"Utilisateur {username} supprimé ✅"}

# ── Events ───────────────────────────────────────────

@app.get("/events")
def get_events(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    events = db.query(MotionEvent).order_by(MotionEvent.timestamp.desc()).all()
    return events

@app.get("/events/latest")
def get_latest(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    event = db.query(MotionEvent).order_by(MotionEvent.timestamp.desc()).first()
    return event

@app.get("/events/count")
def get_count(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    count = db.query(MotionEvent).filter(MotionEvent.motion == True).count()
    return {"total_motions": count}

@app.get("/events/stats")
def get_stats(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    total = db.query(MotionEvent).filter(MotionEvent.motion == True).count()
    today = datetime.utcnow().date()
    today_count = (
        db.query(MotionEvent)
        .filter(MotionEvent.motion == True)
        .filter(func.date(MotionEvent.timestamp) == today)
        .count()
    )
    last_event = db.query(MotionEvent).order_by(MotionEvent.timestamp.desc()).first()
    return {
        "total": total,
        "today": today_count,
        "last_seen": last_event.timestamp if last_event else None
    }

@app.get("/events/by-hour")
def get_by_hour(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    since = datetime.utcnow() - timedelta(hours=24)
    results = (
        db.query(
            func.strftime("%H:00", MotionEvent.timestamp).label("hour"),
            func.count(MotionEvent.id).label("count")
        )
        .filter(MotionEvent.motion == True)
        .filter(MotionEvent.timestamp >= since)
        .group_by(func.strftime("%H:00", MotionEvent.timestamp))
        .all()
    )
    return [{"hour": r.hour, "count": r.count} for r in results]

@app.get("/events/by-day")
def get_by_day(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    results = (
        db.query(
            func.strftime("%Y-%m-%d", MotionEvent.timestamp).label("day"),
            func.count(MotionEvent.id).label("count")
        )
        .filter(MotionEvent.motion == True)
        .group_by(func.strftime("%Y-%m-%d", MotionEvent.timestamp))
        .order_by(func.strftime("%Y-%m-%d", MotionEvent.timestamp))
        .all()
    )
    return [{"day": r.day, "count": r.count} for r in results]