UPDATE t_p77368943_wiki_bf_debts_starve.wiki_articles SET subcategory = CASE
  WHEN slug IN ('leopard','dragon','phoenix') THEN 'Зоан'
  ELSE 'Параметия'
END WHERE category = 'Devil Fruits' AND (subcategory IS NULL OR subcategory = '');