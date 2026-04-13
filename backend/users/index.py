"""Управление пользователями: список, смена роли, бан/разбан"""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p77368943_wiki_bf_debts_starve')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

ROLE_HIERARCHY = {'user': 0, 'moderator': 1, 'admin': 2, 'superadmin': 3, 'owner': 4}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.username, u.display_name, u.role, u.is_banned "
        f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'display_name': row[2], 'role': row[3], 'is_banned': row[4]}

def handler(event: dict, context) -> dict:
    """Управление пользователями (список, роли, бан)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    token = event.get('headers', {}).get('X-Session-Token') or event.get('headers', {}).get('x-session-token', '')
    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    conn = get_conn()
    try:
        me = get_user_by_token(conn, token) if token else None

        # GET / — список всех пользователей (только admin+)
        if method == 'GET' and (path.endswith('/users') or path == '/'):
            if not me or ROLE_HIERARCHY.get(me['role'], 0) < 1:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

            cur = conn.cursor()
            cur.execute(
                f"SELECT id, username, display_name, role, avatar_emoji, created_at, last_login, is_banned, ban_reason "
                f"FROM {SCHEMA}.users ORDER BY id"
            )
            rows = cur.fetchall()
            cur.close()
            users = [
                {
                    'id': r[0], 'username': r[1], 'display_name': r[2], 'role': r[3],
                    'avatar_emoji': r[4],
                    'created_at': r[5].isoformat() if r[5] else None,
                    'last_login': r[6].isoformat() if r[6] else None,
                    'is_banned': r[7], 'ban_reason': r[8]
                } for r in rows
            ]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users})}

        # POST /set-role
        if method == 'POST' and path.endswith('/set-role'):
            if not me or ROLE_HIERARCHY.get(me['role'], 0) < 2:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

            target_id = body.get('user_id')
            new_role = body.get('role')

            if new_role not in ROLE_HIERARCHY:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неверная роль'})}

            # Нельзя выдать роль выше своей
            if ROLE_HIERARCHY.get(new_role, 0) >= ROLE_HIERARCHY.get(me['role'], 0):
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя выдать роль выше своей'})}

            # Нельзя менять роль owner
            cur = conn.cursor()
            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (target_id,))
            row = cur.fetchone()
            if not row:
                cur.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь не найден'})}
            if row[0] == 'owner' and me['role'] != 'owner':
                cur.close()
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя менять роль владельца'})}

            cur.execute(f"UPDATE {SCHEMA}.users SET role = %s WHERE id = %s", (new_role, target_id))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # POST /ban
        if method == 'POST' and path.endswith('/ban'):
            if not me or ROLE_HIERARCHY.get(me['role'], 0) < 1:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

            target_id = body.get('user_id')
            reason = body.get('reason', 'Нарушение правил')

            cur = conn.cursor()
            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (target_id,))
            row = cur.fetchone()
            if not row:
                cur.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь не найден'})}
            if ROLE_HIERARCHY.get(row[0], 0) >= ROLE_HIERARCHY.get(me['role'], 0):
                cur.close()
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя забанить пользователя с такой же или выше ролью'})}

            cur.execute(f"UPDATE {SCHEMA}.users SET is_banned = TRUE, ban_reason = %s WHERE id = %s", (reason, target_id))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # POST /unban
        if method == 'POST' and path.endswith('/unban'):
            if not me or ROLE_HIERARCHY.get(me['role'], 0) < 1:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

            target_id = body.get('user_id')
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET is_banned = FALSE, ban_reason = NULL WHERE id = %s", (target_id,))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
