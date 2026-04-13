"""Управление долгами: CRUD, статусы, фильтрация"""
import json
import os
from datetime import date
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p77368943_wiki_bf_debts_starve')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(conn, token: str):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.username, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id "
        f"WHERE s.token = %s AND s.expires_at > NOW()", (token,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'role': row[2]}

def debt_to_dict(r):
    due = r[4]
    today = date.today()
    status = r[5]
    if not r[10] and due:
        if due < today:
            status = 'overdue'
        elif (due - today).days <= 3:
            status = 'urgent'
        else:
            status = 'ok'
    return {
        'id': r[0], 'name': r[1], 'amount': float(r[2]), 'type': r[3],
        'due_date': r[4].isoformat() if r[4] else None,
        'status': status, 'note': r[6],
        'created_at': r[7].isoformat() if r[7] else None,
        'is_closed': r[10]
    }

def handler(event: dict, context) -> dict:
    """CRUD управление долгами"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    token = event.get('headers', {}).get('X-Session-Token') or event.get('headers', {}).get('x-session-token', '')
    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    qs = event.get('queryStringParameters') or {}

    conn = get_conn()
    try:
        me = get_user_by_token(conn, token)
        if not me:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

        # GET / — список долгов
        if method == 'GET' and '/debt/' not in path:
            debt_type = qs.get('type', '')
            show_closed = qs.get('closed', 'false') == 'true'
            cur = conn.cursor()
            sql = (f"SELECT id, name, amount, type, due_date, status, note, created_at, updated_at, created_by, is_closed "
                   f"FROM {SCHEMA}.debts WHERE 1=1")
            params = []
            if not show_closed:
                sql += " AND is_closed = FALSE"
            if debt_type:
                sql += " AND type = %s"; params.append(debt_type)
            sql += " ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date, id DESC"
            cur.execute(sql, params)
            rows = cur.fetchall()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'debts': [debt_to_dict(r) for r in rows]})}

        # GET /debt/<id>
        if method == 'GET' and '/debt/' in path:
            debt_id = path.split('/debt/')[-1].strip('/')
            cur = conn.cursor()
            cur.execute(f"SELECT id,name,amount,type,due_date,status,note,created_at,updated_at,created_by,is_closed FROM {SCHEMA}.debts WHERE id=%s", (debt_id,))
            row = cur.fetchone()
            cur.close()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Долг не найден'})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'debt': debt_to_dict(row)})}

        # POST / — создать долг
        if method == 'POST' and '/debt/' not in path and not path.endswith('/close') and not path.endswith('/reopen'):
            name = (body.get('name') or '').strip()
            amount = body.get('amount')
            if not name or not amount:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите имя и сумму'})}
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.debts (name, amount, type, due_date, note, created_by) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                (name, amount, body.get('type','incoming'), body.get('due_date') or None, body.get('note',''), me['id'])
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': new_id})}

        # PUT /debt/<id> — редактировать
        if method == 'PUT' and '/debt/' in path and not path.endswith('/close') and not path.endswith('/reopen'):
            debt_id = path.split('/debt/')[-1].strip('/')
            editable = ('name','amount','type','due_date','note','status')
            fields, vals = [], []
            for k in editable:
                if k in body:
                    fields.append(f"{k} = %s")
                    vals.append(body[k] if body[k] != '' else None)
            if not fields:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных'})}
            vals.append(debt_id)
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.debts SET {', '.join(fields)}, updated_at=NOW() WHERE id=%s", vals)
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # POST /debt/<id>/close — закрыть долг
        if method == 'POST' and path.endswith('/close'):
            parts = path.split('/')
            debt_id = parts[-2]
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.debts SET is_closed=TRUE, updated_at=NOW() WHERE id=%s", (debt_id,))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # POST /debt/<id>/reopen — переоткрыть долг
        if method == 'POST' and path.endswith('/reopen'):
            parts = path.split('/')
            debt_id = parts[-2]
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.debts SET is_closed=FALSE, updated_at=NOW() WHERE id=%s", (debt_id,))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
