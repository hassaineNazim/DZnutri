import os
from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class EmailSchema(BaseModel):
    email: List[EmailStr]

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM = os.getenv("MAIL_FROM", "noreply@dznutri.com"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_password_reset_email(email: EmailStr, token: str):


    html = f"""
    <p>Bonjour,</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Votre code de réinitialisation est :</p>
    <h2 style="color: #4CAF50;">{token}</h2>
    <p>Ce code est valide pour 15 minutes.</p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    """

    if not os.getenv("MAIL_USERNAME") or not os.getenv("MAIL_PASSWORD"):
        print(f"============================================")
        print(f"user :  {email}")
        print(f"Token: {token}")
        print(f"============================================")
        return

    message = MessageSchema(
        subject="Réinitialisation de mot de passe DZNutri",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
