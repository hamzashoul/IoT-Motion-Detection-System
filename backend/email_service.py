import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

EMAIL_SENDER   = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_RECEIVER = os.getenv("EMAIL_RECEIVER")

def send_motion_alert():
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🚨 Alerte Mouvement Détecté !"
        msg["From"]    = EMAIL_SENDER
        msg["To"]      = EMAIL_RECEIVER

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        html = f"""
        <html>
          <body style="font-family: sans-serif; padding: 20px; background: #f4f6f9;">
            <div style="max-width: 500px; margin: auto; background: #fff;
                        border-radius: 12px; padding: 30px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #e63946;">🚨 Mouvement Détecté !</h2>
              <p style="color: #333;">Ton capteur PIR a détecté un mouvement.</p>
              <div style="background: #f8d7da; border-radius: 8px;
                          padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24;">
                  <strong>🕐 Heure :</strong> {now}<br/>
                  <strong>📡 Device :</strong> ESP32-PIR<br/>
                  <strong>📍 Topic :</strong> home/pir/motion
                </p>
              </div>
              <p style="color: #666; font-size: 13px;">
                Connecte-toi au dashboard pour plus de détails.
              </p>
              <a href="http://localhost:3000"
                 style="display: inline-block; padding: 10px 20px;
                        background: #4361ee; color: #fff;
                        border-radius: 8px; text-decoration: none;">
                Voir le Dashboard
              </a>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP("smtp.office365.com", 587) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, EMAIL_RECEIVER, msg.as_string())

        print("Email envoyé ✅")

    except Exception as e:
        print(f"Erreur email: {e}")