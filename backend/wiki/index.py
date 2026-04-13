"""Вики Blox Fruits: фрукты, мечи, оружие, расы, стили боя"""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p77368943_wiki_bf_debts_starve')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

ROLE_HIERARCHY = {'user': 0, 'moderator': 1, 'admin': 2, 'superadmin': 3, 'owner': 4}

# slug, title, category, subcategory, icon, rarity, beli, robux, frags, desc, abilities
SEED_DATA = [
    # ── DEVIL FRUITS ──────────────────────────────────────────────────────────
    ('leopard','Leopard','Devil Fruits','Параметия','🐆','mythical',0,2500,3000,'Один из самых редких мифических зоан-фруктов. Превращает пользователя в человека-леопарда с невероятной скоростью и силой.','Scratch, Predator Hunt, Leopard Barrage, Full Beast Mode'),
    ('dragon','Dragon','Devil Fruits','Зоан','🐉','mythical',0,2700,3500,'Мифический зоан-фрукт дракона. Один из самых мощных фруктов с огромным уроном.','Dragon Breath, Thunder Clap, Dragon Transformation, Dragon Rush'),
    ('phoenix','Phoenix','Devil Fruits','Зоан','🦅','mythical',0,2000,2500,'Мифический зоан-фрукт феникса. Исцеление и огненные атаки.','Phoenix Rise, Blue Flames, Rebirth Fire, Flame Dive'),
    ('dough','Dough','Devil Fruits','Параметия','🍩','legendary',2800000,2400,0,'Легендарный параметийский фрукт теста. Один из лучших для PvP благодаря высокому урону и защите.','Dough Fist, Dough Whip, Dough Shield, Sticky Dough'),
    ('soul','Soul','Devil Fruits','Параметия','💀','legendary',3200000,2550,0,'Параметийский фрукт души. Уникальная механика кражи HP у противников.','Soul Slash, Soul Shockwave, Heavenly Judgment, Life Drain'),
    ('venom','Venom','Devil Fruits','Параметия','☠️','legendary',3000000,2300,0,'Параметийский фрукт яда. Мощный AoE с постоянным уроном.','Venom Snake, Venom Spit, Poisonous Cloud, Venom Dragon'),
    ('buddha','Buddha','Devil Fruits','Зоан','🪷','legendary',1200000,1200,0,'Зоан-фрукт Будды. Лучший фрукт для фарма боссов и мобов.','Shift, Shockwave, Buddha Leap, Burning Buddha'),
    ('spirit','Spirit','Devil Fruits','Параметия','👻','legendary',3400000,2650,0,'Один из новейших фруктов. Высокий урон и уникальные механики.','Spirit Slash, Specter Dash, Soul Drain, Phantom Clone'),
    ('light','Light','Devil Fruits','Параметия','✨','legendary',2900000,2350,0,'Параметийский фрукт света. Один из самых быстрых.','Shining Flight, Divine Arrow, Reflection, Concentrated Laser'),
    ('shadow','Shadow','Devil Fruits','Параметия','🌑','legendary',2700000,2100,0,'Фрукт тени. Уникальные механики стелса и атаки из темноты.','Shadow Clone, Umbra Slash, Dark Vortex, Night Cloak'),
    ('quake','Quake','Devil Fruits','Параметия','🌊','legendary',1000000,1000,0,'Параметийский фрукт землетрясения. Массовый урон и сейсмические удары.','Quake Punch, Air Crack, Tidal Wave, Seismic Jump'),
    ('rumble','Rumble','Devil Fruits','Параметия','⚡','legendary',2100000,1700,0,'Параметийский фрукт молнии. Высокая мобильность.','Lightning Rush, Thunder Bomb, Sky Judgment, Discharge'),
    ('gravity','Gravity','Devil Fruits','Параметия','⚫','epic',2500000,2000,0,'Фрукт гравитации. Контроль пространства и AoE-урон.','Gravitational Void, Meteor Rain, Astral Pull, Black Hole'),
    ('ice','Ice','Devil Fruits','Параметия','❄️','rare',350000,700,0,'Параметийский фрукт льда. Отличный выбор для начинающих с механикой заморозки.','Ice Spike, Iceberg Avalanche, Ice Age, Ice Wolf'),
    ('flame','Flame','Devil Fruits','Параметия','🔥','rare',250000,550,0,'Классический огненный фрукт. Хорош для прокачки.','Fire Fist, Fire Column, White Fire, Flame Bazooka'),
    # ── SWORDS ───────────────────────────────────────────────────────────────
    ('dark-blade','Dark Blade','Swords','Легендарный меч','⚔️','mythical',0,1200,0,'Меч Михока — самый мощный меч в Blox Fruits. Получается только от Mihawk или через геймпасс.','Dark Slash, Dark Rush, Soul Guitar'),
    ('yama','Yama','Swords','Легендарный меч','🗡️','legendary',0,0,500,'Один из лучших мечей для фарма. Огромный радиус атаки.','Great Divide, Death Step Slash, Infernal Slash'),
    ('tushita','Tushita','Swords','Небесный меч','✨','legendary',0,0,0,'Небесный меч с высоким уроном. Требует квест для получения.','Heavenly Slash, Celestial Pierce, Divine Barrage'),
    ('true-triple-katana','True Triple Katana','Swords','Легендарный меч','⚔️','legendary',0,0,0,'Улучшенная версия Triple Katana с тремя клинками.','Three Sword Style, Santoryu Rush, Tornado Slash'),
    ('cursed-dual-katana','Cursed Dual Katana','Swords','Проклятый меч','🔮','epic',0,0,0,'Проклятый меч с уникальным стилем. Требует квест.','Cursed Strike, Dual Slash, Phantom Blade'),
    ('pole-v2','Pole (Second Form)','Swords','Посох','🪄','epic',0,0,0,'Посох с разблокированной второй формой. Электрические атаки.','Thunder Thrust, Pole Barrage, Electric Slash'),
    ('gravity-cane','Gravity Cane','Swords','Трость','⚫','rare',0,0,0,'Гравитационная трость. Тянет противников к себе.','Gravity Pull, Crush, Orbital Strike'),
    # ── WEAPONS ──────────────────────────────────────────────────────────────
    ('trident','Trident','Weapons','Копья','🔱','epic',0,0,0,'Трезубец с мощными атаками дальнего боя.','Trident Throw, Sea Stab, Tidal Surge'),
    ('shark-anchor','Shark Anchor','Weapons','Якорь','⚓','epic',0,0,0,'Огромный якорь с массовым уроном.','Anchor Slam, Spin Smash, Tidal Crush'),
    ('pipe','Pipe','Weapons','Дубины','🔧','rare',0,0,0,'Обычная труба. Простое оружие для начинающих.','Pipe Smash, Pipe Spin, Ground Slam'),
    ('slingshot','Slingshot','Weapons','Дальнобойное','🏹','common',0,0,0,'Рогатка с дальним боем.','Rock Shot, Rapid Fire, Power Shot'),
    ('kabucha','Kabucha','Weapons','Дальнобойное','🎯','rare',0,0,0,'Один из лучших вариантов оружия дальнего боя.','Energy Blast, Rapid Shots, Explosive Round'),
    # ── FIGHTING STYLES ──────────────────────────────────────────────────────
    ('death-step','Death Step','Fighting Styles','Ноги','💀','legendary',0,0,0,'Топовый стиль боя. Быстрые и мощные удары ногами. Требует Superhuman + квест.','Hellfire Kick, Death Rush, Barrage of Death'),
    ('superhuman','Superhuman','Fighting Styles','Руки','💪','legendary',0,0,0,'Лучший рукопашный стиль. Открывает Death Step и Godhuman.','Superhuman Combo, Thunderclap, Beast Rush'),
    ('godhuman','Godhuman','Fighting Styles','Элитный','👊','mythical',0,0,0,'Высший стиль боя в Blox Fruits. Требует Death Step + Water Kung Fu + Superhuman + Sharkman Karate.','Holy Combo, Godly Barrage, Thunder Clap'),
    ('electric-claw','Electric Claw','Fighting Styles','Электро','⚡','legendary',0,0,0,'Электрический стиль боя. Молниеносные атаки.','Claw Strike, Thunderstorm, Lightning Dash'),
    ('dark-step','Dark Step','Fighting Styles','Ноги','🌑','rare',150000,0,0,'Тёмный стиль боя. Хорош для начального PvP.','Dark Rush, Shadow Kick, Darkness Barrage'),
    ('water-kung-fu','Water Kung Fu','Fighting Styles','Вода','💧','uncommon',0,0,0,'Водный стиль кунг-фу. Нужен для Godhuman.','Whirlpool, Water Kick, Tsunami Slam'),
    ('sharkman-karate','Sharkman Karate','Fighting Styles','Вода','🦈','epic',0,0,0,'Стиль боя акулы. Необходим для Godhuman.','Shark Barrage, Vacuum Crush, Water Body'),
    ('soru','Soru','Fighting Styles','Скорость','🏃','rare',0,0,0,'Стиль боя Сору для скоростного передвижения и атак.','Flash Step, Soru Rush, Vanish Strike'),
    # ── RACES V3 ─────────────────────────────────────────────────────────────
    ('human-v3','Human V3','Races','V3','🧑','common',0,0,0,'Человек V3. Особые бонусы к урону и скорости. Открывается через квест.','Focus, Instinct+, Damage Boost'),
    ('sky-v3','Sky (Angel) V3','Races','V3','👼','rare',0,0,0,'Небесный ангел V3. Усиленный полёт и атаки с небес.','Angel Leap, Sky Barrage, Holy Rain'),
    ('fish-v3','Fish V3','Races','V3','🐟','rare',0,0,0,'Рыба V3. Лучший плавун и водные атаки.','Aqua Dash, Deep Dive, Water Burst'),
    ('mink-v3','Mink V3','Races','V3','🐾','rare',0,0,0,'Зверолюд V3. Электро Дору и скоростные атаки.','Electro, Mink Dash, Thunder Rush'),
    ('cyborg-v3','Cyborg V3','Races','V3','🤖','epic',0,0,0,'Киборг V3. Лазерные атаки и бронезащита.','Laser Blast, Iron Skin, Cyborg Rush'),
    ('ghoul-v3','Ghoul V3','Races','V3','💀','epic',0,0,0,'Упырь V3. Дренаж жизни и тёмные атаки.','Life Drain, Dark Aura, Ghoul Roar'),
    # ── RACES V4 ─────────────────────────────────────────────────────────────
    ('human-v4','Human V4 (2026)','Races','V4','🌟','legendary',0,0,0,'Человек V4 — обновление 2026. Новые пробуждения и усиленный Instinct.','True Instinct, Power Surge, Final Focus'),
    ('sky-v4','Sky (Angel) V4 (2026)','Races','V4','✨','legendary',0,0,0,'Ангел V4 — обновление 2026. Небесная трансформация с крыльями.','Divine Wings, Holy Storm, Heavenly Descent'),
    ('fish-v4','Fish V4 (2026)','Races','V4','🌊','legendary',0,0,0,'Рыба V4 — обновление 2026. Форма морского дракона.','Sea Dragon, Tsunami Wave, Ocean Fury'),
    ('mink-v4','Mink V4 (2026)','Races','V4','⚡','legendary',0,0,0,'Зверолюд V4 — обновление 2026. Полная форма молнии.','Full Electro, Mink Fury, Thunder God'),
    ('cyborg-v4','Cyborg V4 (2026)','Races','V4','🔴','legendary',0,0,0,'Киборг V4 — обновление 2026. Полное превращение в машину.','Mech Form, Hyper Laser, Nuclear Core'),
    ('ghoul-v4','Ghoul V4 (2026)','Races','V4','🖤','legendary',0,0,0,'Упырь V4 — обновление 2026. Абсолютная форма тьмы.','Death Form, Soul Harvest, Dark Explosion'),
]

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

def seed_if_empty(conn):
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.wiki_articles")
    count = cur.fetchone()[0]
    if count == 0:
        for f in SEED_DATA:
            cur.execute(
                f"INSERT INTO {SCHEMA}.wiki_articles (slug, title, category, subcategory, icon, rarity, beli_price, robux_price, fragment_price, description, abilities) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (slug) DO NOTHING", f
            )
        conn.commit()
    cur.close()

def handler(event: dict, context) -> dict:
    """Вики Blox Fruits: фрукты, мечи, оружие, расы, стили боя"""
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
        seed_if_empty(conn)
        me = get_user_by_token(conn, token)

        # GET / — список статей
        if method == 'GET' and ('/article/' not in path):
            category = qs.get('category', '')
            subcategory = qs.get('subcategory', '')
            search = qs.get('search', '')

            cur = conn.cursor()
            sql = (f"SELECT id, slug, title, category, subcategory, icon, rarity, beli_price, robux_price, "
                   f"fragment_price, description, is_published, views "
                   f"FROM {SCHEMA}.wiki_articles WHERE is_published = TRUE")
            params = []
            if category:
                sql += " AND category = %s"; params.append(category)
            if subcategory:
                sql += " AND subcategory = %s"; params.append(subcategory)
            if search:
                sql += " AND (LOWER(title) LIKE %s OR LOWER(description) LIKE %s)"
                params.extend([f'%{search.lower()}%', f'%{search.lower()}%'])
            sql += " ORDER BY CASE rarity WHEN 'mythical' THEN 0 WHEN 'legendary' THEN 1 WHEN 'epic' THEN 2 WHEN 'rare' THEN 3 WHEN 'uncommon' THEN 4 ELSE 5 END, title"
            cur.execute(sql, params)
            rows = cur.fetchall()
            cur.close()

            articles = [{'id': r[0], 'slug': r[1], 'title': r[2], 'category': r[3], 'subcategory': r[4],
                         'icon': r[5], 'rarity': r[6], 'beli_price': r[7], 'robux_price': r[8],
                         'fragment_price': r[9], 'description': r[10], 'is_published': r[11], 'views': r[12]} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'articles': articles})}

        # GET /article/<slug>
        if method == 'GET' and '/article/' in path:
            slug = path.split('/article/')[-1].strip('/')
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, slug, title, category, subcategory, icon, rarity, beli_price, robux_price, fragment_price, description, abilities, views "
                f"FROM {SCHEMA}.wiki_articles WHERE slug = %s", (slug,)
            )
            row = cur.fetchone()
            if not row:
                cur.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Статья не найдена'})}
            cur.execute(f"UPDATE {SCHEMA}.wiki_articles SET views = views + 1 WHERE slug = %s", (slug,))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'article': {
                'id': row[0], 'slug': row[1], 'title': row[2], 'category': row[3], 'subcategory': row[4],
                'icon': row[5], 'rarity': row[6], 'beli_price': row[7], 'robux_price': row[8],
                'fragment_price': row[9], 'description': row[10], 'abilities': row[11], 'views': row[12]
            }})}

        # POST /article — создать (mod+)
        if method == 'POST' and path.endswith('/article'):
            if not me or ROLE_HIERARCHY.get(me['role'], 0) < 1:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа. Нужна роль модератора+'})}
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.wiki_articles (slug,title,category,subcategory,icon,rarity,beli_price,robux_price,fragment_price,description,abilities,created_by) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (body.get('slug'), body.get('title'), body.get('category','Devil Fruits'),
                 body.get('subcategory',''), body.get('icon','📄'), body.get('rarity','common'),
                 body.get('beli_price',0), body.get('robux_price',0), body.get('fragment_price',0),
                 body.get('description',''), body.get('abilities',''), me['id'])
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': new_id})}

        # PUT /article/<slug>
        if method == 'PUT' and '/article/' in path:
            if not me or ROLE_HIERARCHY.get(me['role'], 0) < 1:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}
            slug = path.split('/article/')[-1].strip('/')
            editable = ('title','category','subcategory','icon','rarity','beli_price','robux_price',
                        'fragment_price','description','abilities','is_published')
            fields, vals = [], []
            for k in editable:
                if k in body:
                    fields.append(f"{k} = %s"); vals.append(body[k])
            if not fields:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных'})}
            vals += [me['id'], slug]
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.wiki_articles SET {', '.join(fields)}, updated_by=%s, updated_at=NOW() WHERE slug=%s", vals)
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
