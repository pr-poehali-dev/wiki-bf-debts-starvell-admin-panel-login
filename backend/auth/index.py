"""Аутентификация: регистрация, вход, выход, проверка сессии"""
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p77368943_wiki_bf_debts_starve')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    salt = 'debtwiki_salt_2026'
    return hashlib.sha256((password + salt).encode()).hexdigest()

def make_token() -> str:
    return secrets.token_hex(32)

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.username, u.display_name, u.role, u.avatar_emoji, u.is_banned, u.ban_reason "
        f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'display_name': row[2], 'role': row[3], 'avatar_emoji': row[4], 'is_banned': row[5], 'ban_reason': row[6]}

def handler(event: dict, context) -> dict:
    """Обработчик аутентификации"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    token = event.get('headers', {}).get('X-Session-Token') or event.get('headers', {}).get('x-session-token', '')

    conn = get_conn()

    try:
        action = body.get('action', '')

        # POST /register or action=register
        if method == 'POST' and (path.endswith('/register') or action == 'register'):
            username = (body.get('username') or '').strip().lower()
            password = body.get('password') or ''
            display_name = (body.get('display_name') or username).strip()

            if len(username) < 3:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Логин минимум 3 символа'})}
            if len(password) < 4:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль минимум 4 символа'})}

            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = %s", (username,))
            if cur.fetchone():
                cur.close()
                return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Логин уже занят'})}

            # First user gets owner role
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users")
            count = cur.fetchone()[0]
            role = 'owner' if count == 0 else 'user'

            pwd_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, password_hash, display_name, role) VALUES (%s, %s, %s, %s) RETURNING id",
                (username, pwd_hash, display_name, role)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            cur.close()

            new_token = make_token()
            expires = datetime.now() + timedelta(days=30)
            cur2 = conn.cursor()
            cur2.execute(
                f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (user_id, new_token, expires)
            )
            conn.commit()
            cur2.close()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'token': new_token,
                'user': {'id': user_id, 'username': username, 'display_name': display_name, 'role': role, 'avatar_emoji': '👤'}
            })}

        # POST /login or action=login (default for POST /)
        if method == 'POST' and (path.endswith('/login') or action == 'login' or (action == '' and not path.endswith('/register') and not path.endswith('/logout') and not path.endswith('/me'))):
            username = (body.get('username') or '').strip().lower()
            password = body.get('password') or ''
            pwd_hash = hash_password(password)

            cur = conn.cursor()
            cur.execute(
                f"SELECT id, username, display_name, role, avatar_emoji, is_banned, ban_reason FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s",
                (username, pwd_hash)
            )
            row = cur.fetchone()
            if not row:
                cur.close()
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

            user_id, uname, dname, urole, emoji, is_banned, ban_reason = row
            if is_banned:
                cur.close()
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': f'Аккаунт заблокирован: {ban_reason or "нарушение правил"}'})}

            cur.execute(f"UPDATE {SCHEMA}.users SET last_login = NOW() WHERE id = %s", (user_id,))
            conn.commit()
            cur.close()

            new_token = make_token()
            expires = datetime.now() + timedelta(days=30)
            cur2 = conn.cursor()
            cur2.execute(
                f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (user_id, new_token, expires)
            )
            conn.commit()
            cur2.close()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'token': new_token,
                'user': {'id': user_id, 'username': uname, 'display_name': dname, 'role': urole, 'avatar_emoji': emoji}
            })}

        # GET /me
        if path.endswith('/me') and method == 'GET':
            if not token:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            user = get_user_by_token(conn, token)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        # POST /logout
        if path.endswith('/logout') and method == 'POST':
            if token:
                cur = conn.cursor()
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
                cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()