ALTER TABLE t_p77368943_wiki_bf_debts_starve.wiki_articles ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50) DEFAULT '';

CREATE TABLE IF NOT EXISTS t_p77368943_wiki_bf_debts_starve.debts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    due_date DATE,
    type VARCHAR(10) NOT NULL DEFAULT 'incoming',
    status VARCHAR(20) NOT NULL DEFAULT 'ok',
    note TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_closed BOOLEAN DEFAULT FALSE
);