"""Вики Blox Fruits: статьи, фрукты, предметы"""
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

SEED_FRUITS = [
    ('leopard','Leopard','Devil Fruits','🐆','mythical',0,2500,3000,'Один из самых редких мифических зоан-фруктов. Превращает пользователя в человека-леопарда с невероятной скоростью и силой.','Scratch, Predator Hunt, Leopard Barrage, Full Beast Mode'),
    ('dragon','Dragon','Devil Fruits','🐉','mythical',0,2700,3500,'Мифический зоан-фрукт дракона. Один из самых мощных фруктов с огромным уроном.','Dragon Breath, Thunder Clap, Dragon Transformation, Dragon Rush'),
    ('dough','Dough','Devil Fruits','🍩','legendary',2800000,2400,0,'Легендарный параметийский фрукт теста. Один из лучших для PvP.','Dough Fist, Dough Whip, Dough Shield, Sticky Dough'),
    ('soul','Soul','Devil Fruits','💀','legendary',3200000,2550,0,'Параметийский фрукт души. Кража HP у противников.','Soul Slash, Soul Shockwave, Heavenly Judgment, Life Drain'),
    ('venom','Venom','Devil Fruits','☠️','legendary',3000000,2300,0,'Параметийский фрукт яда. Мощный AoE с постепенным уроном.','Venom Snake, Venom Spit, Poisonous Cloud, Venom Dragon'),
    ('buddha','Buddha','Devil Fruits','🪷','legendary',1200000,1200,0,'Зоан-фрукт Будды. Лучший для фарма боссов.','Shift, Shockwave, Buddha Leap, Burning Buddha'),
    ('spirit','Spirit','Devil Fruits','👻','legendary',3400000,2650,0,'Высокий урон и уникальные механики.','Spirit Slash, Specter Dash, Soul Drain, Phantom Clone'),
    ('ice','Ice','Devil Fruits','❄️','rare',350000,700,0,'Параметийский фрукт льда. Отличный для начинающих.','Ice Spike, Iceberg Avalanche, Ice Age, Ice Wolf'),
    ('flame','Flame','Devil Fruits','🔥','rare',250000,550,0,'Классический огненный фрукт.','Fire Fist, Fire Column, White Fire, Flame Bazooka'),
    ('light','Light','Devil Fruits','✨','legendary',2900000,2350,0,'Параметийский фрукт света. Один из быстрейших.','Shining Flight, Divine Arrow, Reflection, Laser'),
    ('shadow','Shadow','Devil Fruits','🌑','legendary',2700000,2100,0,'Фрукт тени. Уникальные механики стелса и атаки из темноты.','Shadow Clone, Umbra Slash, Dark Vortex, Night Cloak'),
    ('quake','Quake','Devil Fruits','🌊','legendary',1000000,1000,0,'Параметийский фрукт землетрясения. Массовый урон и сейсмические удары.','Quake Punch, Air Crack, Tidal Wave, Seismic Jump'),
    ('gravity','Gravity','Devil Fruits','⚫','epic',2500000,2000,0,'Фрукт гравитации. Контроль пространства и AoE-урон.','Gravitational Void, Meteor Rain, Astral Pull, Black Hole'),
    ('rumble','Rumble','Devil Fruits','⚡','legendary',2100000,1700,0,'Параметийский фрукт молнии. Высокая мобильность.','Lightning Rush, Thunder Bomb, Sky Judgment, Discharge'),
    ('phoenix','Phoenix','Devil Fruits','🦅','mythical',0,2000,2500,'Мифический зоан-фрукт феникса. Исцеление и огненные атаки.','Phoenix Rise, Blue Flames, Rebirth Fire, Flame Dive'),
]

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(conn, token: str):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.username, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'role': row[2]}

def seed_if_empty(conn):
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.wiki_articles")
    count = cur.fetchone()[0]
    if count == 0:
        for f in SEED_FRUITS:
            cur.execute(
                f"INSERT INTO {SCHEMA}.wiki_articles (slug, title, category, icon, rarity, beli_price, robux_price, fragment_price, description, abilities) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (slug) DO NOTHING",
                f
            )
        conn.commit()
    cur.close()

def handler(event: dict, context) -> dict:
    """Вики статьи и Devil Fruits Blox Fruits"""
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
        seed_if_empty(conn)
        me = get_user_by_token(conn, token)

        # GET / или /articles — список статей
        if method == 'GET' and (path == '/' or path.endswith('/articles') or path.endswith('/wiki')):
            category = (event.get('queryStringParameters') or {}).get('category', '')
            search = (event.get('queryStringParameters') or {}).get('search', '')

            cur = conn.cursor()
            sql = f"SELECT id, slug, title, category, icon, rarity, beli_price, robux_price, fragment_price, description, is_published, views FROM {SCHEMA}.wiki_articles WHERE is_published = TRUE"
            params = []
            if category:
                sql += " AND category = %s"
                params.append(category)
            if search:
                sql += " AND (LOWER(title) LIKE %s OR LOWER(description) LIKE %s)"
                params.extend([f'%{search.lower()}%', f'%{search.lower()}%'])
            sql += " ORDER BY rarity DESC, title"
            cur.execute(sql, params)
            rows = cur.fetchall()
            cur.close()

            articles = [
                {
                    'id': r[0], 'slug': r[1], 'title': r[2], 'category': r[3], 'icon': r[4],
                    'rarity': r[5], 'beli_price': r[6], 'robux_price': r[7], 'fragment_price': r[8],
                    'description': r[9], 'is_published': r[10], 'views': r[11]
                } for r in rows
            ]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'articles': articles})}

        # GET /article/<slug>
        if method == 'GET' and '/article/' in path:
            slug = path.split('/article/')[-1].strip('/')
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, slug, title, category, icon, rarity, beli_price, robux_price, fragment_price, description, abilities, views FROM {SCHEMA}.wiki_articles WHERE slug = %s",
                (slug,)
            )
            row = cur.fetchone()
            if not row:
                cur.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Статья не найдена'})}
            cur.execute(f"UPDATE {SCHEMA}.wiki_articles SET views = views + 1 WHERE slug = %s", (slug,))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'article': {
                    'id': row[0], 'slug': row[1], 'title': row[2], 'category': row[3], 'icon': row[4],
                    'rarity': row[5], 'beli_price': row[6], 'robux_price': row[7], 'fragment_price': row[8],
                    'description': row[9], 'abilities': row[10], 'views': row[11]
                }
            })}

        # POST /article — создать (mod+)
        if method == 'POST' and path.endswith('/article'):
            if not me or ROLE_HIERARCHY.get(me['role'], 0) < 1:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа. Нужна роль модератора или выше'})}
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.wiki_articles (slug, title, category, icon, rarity, beli_price, robux_price, fragment_price, description, abilities, created_by) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (body.get('slug'), body.get('title'), body.get('category','Devil Fruits'),
                 body.get('icon','📄'), body.get('rarity','common'),
                 body.get('beli_price',0), body.get('robux_price',0), body.get('fragment_price',0),
                 body.get('description',''), body.get('abilities',''), me['id'])
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': new_id})}

        # PUT /article/<slug> — редактировать (mod+)
        if method == 'PUT' and '/article/' in path:
            if not me or ROLE_HIERARCHY.get(me['role'], 0) < 1:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}
            slug = path.split('/article/')[-1].strip('/')
            fields = []
            vals = []
            for key in ('title','category','icon','rarity','beli_price','robux_price','fragment_price','description','abilities','is_published'):
                if key in body:
                    fields.append(f"{key} = %s")
                    vals.append(body[key])
            if not fields:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных для обновления'})}
            vals.append(me['id'])
            vals.append(slug)
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.wiki_articles SET {', '.join(fields)}, updated_by = %s, updated_at = NOW() WHERE slug = %s", vals)
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
