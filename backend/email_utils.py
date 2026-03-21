import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "geevinrv19@gmail.com"
SMTP_PASS = "ajyxagossubtrdsq"
ADMIN_EMAIL = "geevinrv19@gmail.com"


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def _send(to: str, subject: str, html: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(SMTP_USER, to, msg.as_string())


def send_otp_email(to: str, otp: str, username: str):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
      <h2 style="color:#2463eb;margin-bottom:8px;">Verify your email</h2>
      <p style="color:#374151;">Hi <b>{username}</b>, use the OTP below to verify your account.</p>
      <div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#111827;background:#fff;border:2px solid #2463eb;border-radius:8px;padding:16px;text-align:center;margin:24px 0;">{otp}</div>
      <p style="color:#6b7280;font-size:13px;">This code expires in <b>10 minutes</b>. Do not share it with anyone.</p>
    </div>"""
    _send(to, "Your AeroAuth verification code", html)


def send_reset_email(to: str, otp: str, username: str):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
      <h2 style="color:#2463eb;margin-bottom:8px;">Reset your password</h2>
      <p style="color:#374151;">Hi <b>{username}</b>, use the OTP below to reset your password.</p>
      <div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#111827;background:#fff;border:2px solid #2463eb;border-radius:8px;padding:16px;text-align:center;margin:24px 0;">{otp}</div>
      <p style="color:#6b7280;font-size:13px;">This code expires in <b>10 minutes</b>. If you didn't request this, ignore this email.</p>
    </div>"""
    _send(to, "AeroAuth password reset code", html)


def send_admin_new_user(username: str, email: str):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
      <h2 style="color:#2463eb;">New user registered</h2>
      <p><b>Username:</b> {username}</p>
      <p><b>Email:</b> {email}</p>
    </div>"""
    _send(ADMIN_EMAIL, f"New registration: {username}", html)
