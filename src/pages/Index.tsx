import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  apiLogin, apiRegister, apiMe, apiLogout,
  apiGetWiki, apiCreateArticle, apiUpdateArticle,
  apiGetUsers, apiSetRole, apiBanUser, apiUnbanUser,
  apiGetDebts, apiCreateDebt, apiUpdateDebt, apiCloseDebt, apiReopenDebt,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = "home" | "wiki" | "debts" | "profile" | "admin" | "contacts";
type Role = "user" | "moderator" | "admin" | "superadmin" | "owner";

interface User {
  id: number; username: string; display_name: string; role: Role;
  avatar_emoji: string; is_banned?: boolean; ban_reason?: string;
  created_at?: string; last_login?: string;
}
interface WikiArticle {
  id: number; slug: string; title: string; category: string; subcategory: string;
  icon: string; rarity: string; beli_price: number; robux_price: number;
  fragment_price: number; description: string; abilities?: string;
  is_published: boolean; views: number;
}
interface Debt {
  id: number; name: string; amount: number; type: "incoming" | "outgoing";
  due_date: string | null; status: "ok" | "urgent" | "overdue";
  note: string; created_at: string; is_closed: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_HIERARCHY: Record<Role, number> = { user:0, moderator:1, admin:2, superadmin:3, owner:4 };

const ROLE_META: Record<string, {label:string;color:string;emoji:string}> = {
  owner:      {label:"Владелец",    color:"bg-yellow-500/20 text-yellow-300 border-yellow-500/30", emoji:"👑"},
  superadmin: {label:"Суперадмин", color:"bg-red-500/20 text-red-400 border-red-500/30",           emoji:"🔴"},
  admin:      {label:"Админ",       color:"bg-purple-500/20 text-purple-400 border-purple-500/30", emoji:"🛡️"},
  moderator:  {label:"Модератор",   color:"bg-cyan-500/20 text-cyan-400 border-cyan-500/30",       emoji:"🔵"},
  user:       {label:"Пользователь",color:"bg-gray-500/20 text-gray-400 border-gray-500/30",       emoji:"👤"},
};

const RARITY_META: Record<string, {label:string;color:string;glow:string}> = {
  mythical:  {label:"Мифический",  color:"bg-yellow-500/20 text-yellow-300 border-yellow-500/30",  glow:"rgba(234,179,8,0.35)"},
  legendary: {label:"Легендарный", color:"bg-orange-500/20 text-orange-300 border-orange-500/30",  glow:"rgba(249,115,22,0.3)"},
  epic:      {label:"Эпический",   color:"bg-purple-500/20 text-purple-400 border-purple-500/30",  glow:"rgba(168,85,247,0.25)"},
  rare:      {label:"Редкий",      color:"bg-blue-500/20 text-blue-400 border-blue-500/30",        glow:"rgba(59,130,246,0.2)"},
  uncommon:  {label:"Необычный",   color:"bg-green-500/20 text-green-400 border-green-500/30",     glow:"rgba(34,197,94,0.15)"},
  common:    {label:"Обычный",     color:"bg-gray-500/20 text-gray-400 border-gray-500/30",        glow:"rgba(156,163,175,0.1)"},
};

const WIKI_TABS = [
  {key:"Devil Fruits", label:"Фрукты", icon:"🍎"},
  {key:"Swords",       label:"Мечи",   icon:"⚔️"},
  {key:"Weapons",      label:"Оружие", icon:"🔱"},
  {key:"Fighting Styles", label:"Стили боя", icon:"💥"},
  {key:"Races",        label:"Расы",   icon:"🧬"},
];

const navItems: {id:Section;label:string;icon:string;minRole?:Role}[] = [
  {id:"home",     label:"Главная",     icon:"Home"},
  {id:"wiki",     label:"Blox Fruits", icon:"BookOpen"},
  {id:"debts",    label:"Долги",       icon:"CreditCard"},
  {id:"profile",  label:"Профиль",     icon:"User"},
  {id:"admin",    label:"Управление",  icon:"Shield", minRole:"moderator"},
  {id:"contacts", label:"Контакты",    icon:"MessageCircle"},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function RoleBadge({role}:{role:string}) {
  const m = ROLE_META[role] || ROLE_META.user;
  return <Badge className={`${m.color} text-xs`}>{m.emoji} {m.label}</Badge>;
}

function DebtStatusBadge({status}:{status:string}) {
  if (status==="overdue") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Просрочен</Badge>;
  if (status==="urgent")  return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Срочно</Badge>;
  return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">В норме</Badge>;
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({onLogin}:{onLogin:(u:User)=>void}) {
  const [mode, setMode] = useState<"login"|"register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const res = mode==="login"
        ? await apiLogin(username, password)
        : await apiRegister(username, password, displayName || username);
      if (res.error) { setError(res.error); return; }
      localStorage.setItem('dw_token', res.token);
      onLogin(res.user);
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{background:"hsl(var(--background))"}}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]" style={{background:"hsl(262 83% 68%)"}} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]" style={{background:"hsl(188 95% 55%)"}} />
      </div>
      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-3xl neon-glow mx-auto mb-4" style={{background:"var(--gradient-main)"}}>D</div>
          <h1 className="text-3xl font-black gradient-text">DebtWiki</h1>
          <p className="text-muted-foreground text-sm mt-1">Система учёта · Blox Fruits вики</p>
        </div>
        <div className="glass-strong rounded-3xl p-7 gradient-border">
          <div className="flex gap-1 glass rounded-xl p-1 mb-6">
            {(["login","register"] as const).map(m => (
              <button key={m} onClick={()=>{setMode(m);setError("");}}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"text-white":"text-muted-foreground"}`}
                style={mode===m?{background:"var(--gradient-main)"}:{}}>
                {m==="login"?"Войти":"Регистрация"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {mode==="register" && (
              <input placeholder="Отображаемое имя" value={displayName} onChange={e=>setDisplayName(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors" />
            )}
            <input placeholder="Логин" value={username} onChange={e=>setUsername(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors" />
            <input type="password" placeholder="Пароль" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors" />
            {error && (
              <div className="glass rounded-xl px-4 py-3 text-sm text-red-400 border border-red-500/20 flex items-center gap-2">
                <Icon name="AlertCircle" size={14} />{error}
              </div>
            )}
            <Button onClick={submit} disabled={loading} className="w-full rounded-xl py-6 font-bold text-base"
              style={{background:"var(--gradient-main)",color:"#fff",border:"none"}}>
              {loading ? <Icon name="Loader" size={18} className="animate-spin"/> : mode==="login"?"Войти":"Создать аккаунт"}
            </Button>
          </div>
          {mode==="register" && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Первый пользователь получает роль <span className="text-yellow-300">Владельца 👑</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomeSection({me, setSection}:{me:User; setSection:(s:Section)=>void}) {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="relative rounded-3xl overflow-hidden p-10 noise-bg" style={{background:"var(--gradient-hero)"}}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{background:"hsl(262 83% 68%)",transform:"translate(30%,-30%)"}} />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-15 blur-3xl" style={{background:"hsl(188 95% 55%)",transform:"translate(-30%,30%)"}} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">Добро пожаловать, {me.display_name}</span>
          </div>
          <h1 className="text-5xl font-black mb-4 leading-tight">
            <span className="gradient-text">DebtWiki</span><br/>
            <span className="text-foreground">Всё в одном</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mb-8">
            Вики Blox Fruits, управление долгами и финансовыми обязательствами.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={()=>setSection("wiki")} className="rounded-xl px-6" style={{background:"var(--gradient-main)",color:"#fff",border:"none"}}>
              <Icon name="BookOpen" size={16} className="mr-2"/>Blox Fruits вики
            </Button>
            <Button onClick={()=>setSection("debts")} variant="outline" className="rounded-xl px-6 glass border-white/10 text-foreground hover:bg-white/5">
              <Icon name="CreditCard" size={16} className="mr-2"/>Долги
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Ваша роль", value:ROLE_META[me.role]?.label||me.role, icon:"Shield", color:"bg-purple-500/20 text-purple-400"},
          {label:"Просрочено", value:"—", icon:"AlertTriangle", color:"bg-red-500/20 text-red-400"},
          {label:"К получению", value:"—", icon:"TrendingUp", color:"bg-cyan-500/20 text-cyan-400"},
          {label:"Записей в вики", value:"50+", icon:"BookOpen", color:"bg-emerald-500/20 text-emerald-400"},
        ].map((s,i)=>(
          <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><Icon name={s.icon} size={22}/></div>
            <div><p className="text-muted-foreground text-sm">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Быстрый доступ</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {icon:"BookOpen", label:"Blox Fruits вики", color:"text-purple-400", section:"wiki" as Section},
            {icon:"Plus",     label:"Новый долг",       color:"text-cyan-400",   section:"debts" as Section},
            {icon:"BarChart3",label:"Управление",       color:"text-pink-400",   section:"admin" as Section},
            {icon:"User",     label:"Профиль",          color:"text-yellow-400", section:"profile" as Section},
            {icon:"MessageCircle",label:"Контакты",     color:"text-emerald-400",section:"contacts" as Section},
          ].map((item,i)=>(
            <button key={i} onClick={()=>setSection(item.section)}
              className="glass rounded-2xl p-5 flex flex-col items-center gap-3 hover:bg-white/5 transition-all hover:scale-[1.03] cursor-pointer text-center">
              <Icon name={item.icon} size={24} className={item.color}/>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Wiki ─────────────────────────────────────────────────────────────────────
function WikiSection({me}:{me:User}) {
  const [tab, setTab] = useState("Devil Fruits");
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [selected, setSelected] = useState<WikiArticle|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<WikiArticle|null>(null);

  const canEdit = ROLE_HIERARCHY[me.role] >= 1;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiGetWiki({category: tab, search: search||undefined});
    if (res.articles) setArticles(res.articles);
    setLoading(false);
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterRarity ? articles.filter(a=>a.rarity===filterRarity) : articles;
  const rarities = ["mythical","legendary","epic","rare","uncommon","common"];

  if (selected && !showForm) return (
    <ArticleDetail article={selected} onBack={()=>setSelected(null)} canEdit={canEdit}
      onEdit={()=>{setEditTarget(selected);setShowForm(true);}} onUpdate={()=>{load();setSelected(null);}} />
  );

  if (showForm) return (
    <ArticleForm article={editTarget} onClose={()=>{setShowForm(false);setEditTarget(null);}} onSave={()=>{load();setShowForm(false);setEditTarget(null);}} />
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black">Blox Fruits <span className="gradient-text">Wiki</span></h1>
          <p className="text-muted-foreground mt-1">{articles.length} записей в разделе</p>
        </div>
        {canEdit && (
          <Button onClick={()=>{setEditTarget(null);setShowForm(true);}} className="rounded-xl" style={{background:"var(--gradient-main)",color:"#fff",border:"none"}}>
            <Icon name="Plus" size={16} className="mr-2"/>Добавить запись
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {WIKI_TABS.map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setFilterRarity("");}}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab===t.key?"text-white neon-glow":"glass text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
            style={tab===t.key?{background:"var(--gradient-main)"}:{}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Search + rarity filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..."
            className="w-full glass rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {rarities.map(r=>{
            const m = RARITY_META[r];
            return (
              <button key={r} onClick={()=>setFilterRarity(r===filterRarity?"":r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterRarity===r?m.color:"glass text-muted-foreground border-white/5 hover:text-foreground"}`}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i)=><div key={i} className="glass rounded-2xl p-5 animate-pulse h-44"/>)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a=>{
            const rarity = RARITY_META[a.rarity]||RARITY_META.common;
            return (
              <div key={a.id} onClick={()=>setSelected(a)}
                className="glass rounded-2xl p-5 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                style={{boxShadow:`0 0 20px ${rarity.glow}`}}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">{a.icon}</span>
                  <Badge className={`${rarity.color} text-xs`}>{rarity.label}</Badge>
                </div>
                <h3 className="font-bold text-foreground text-lg group-hover:text-purple-300 transition-colors">{a.title}</h3>
                {a.subcategory && <p className="text-xs text-muted-foreground mt-0.5">{a.subcategory}</p>}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                <div className="flex gap-3 mt-3 text-xs flex-wrap">
                  {a.beli_price>0 && <span className="text-yellow-400">💰 {(a.beli_price/1000000).toFixed(1)}M</span>}
                  {a.robux_price>0 && <span className="text-green-400">💎 {a.robux_price} R$</span>}
                  {a.fragment_price>0 && <span className="text-cyan-400">🔮 {a.fragment_price}</span>}
                </div>
              </div>
            );
          })}
          {filtered.length===0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">🔍</p><p>Ничего не найдено</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Article Detail ───────────────────────────────────────────────────────────
function ArticleDetail({article, onBack, canEdit, onEdit, onUpdate}: {article:WikiArticle;onBack:()=>void;canEdit:boolean;onEdit:()=>void;onUpdate:()=>void}) {
  const rarity = RARITY_META[article.rarity]||RARITY_META.common;
  const abilities = article.abilities ? article.abilities.split(', ') : [];
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="ArrowLeft" size={16}/><span className="text-sm">Назад</span>
        </button>
        {canEdit && (
          <Button onClick={onEdit} size="sm" className="rounded-xl" style={{background:"var(--gradient-main)",color:"#fff",border:"none"}}>
            <Icon name="Pencil" size={14} className="mr-1"/>Редактировать
          </Button>
        )}
      </div>
      <div className="glass-strong rounded-3xl p-8 gradient-border" style={{boxShadow:`0 0 60px ${rarity.glow}`}}>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="text-7xl">{article.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-4xl font-black gradient-text">{article.title}</h1>
              <Badge className={rarity.color}>{rarity.label}</Badge>
            </div>
            {article.subcategory && <p className="text-sm text-cyan-400 mb-1">{article.subcategory}</p>}
            <p className="text-muted-foreground text-sm">{article.category}</p>
            <p className="text-foreground mt-3 leading-relaxed">{article.description}</p>
            <div className="flex gap-3 mt-4 flex-wrap">
              {article.beli_price>0 && <div className="glass rounded-xl px-4 py-2 text-sm"><span className="text-muted-foreground">Beli: </span><span className="text-yellow-400 font-bold">{article.beli_price.toLocaleString('ru-RU')}</span></div>}
              {article.robux_price>0 && <div className="glass rounded-xl px-4 py-2 text-sm"><span className="text-muted-foreground">Robux: </span><span className="text-green-400 font-bold">{article.robux_price} R$</span></div>}
              {article.fragment_price>0 && <div className="glass rounded-xl px-4 py-2 text-sm"><span className="text-muted-foreground">Фрагменты: </span><span className="text-cyan-400 font-bold">{article.fragment_price}</span></div>}
              {article.beli_price===0&&article.robux_price===0&&<div className="glass rounded-xl px-4 py-2 text-sm text-muted-foreground">Не продаётся</div>}
            </div>
          </div>
        </div>
      </div>
      {abilities.length>0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Способности / Атаки</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {abilities.map((ab,i)=>(
              <div key={i} className="glass rounded-xl p-4 text-center hover:bg-white/5 transition-all">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-sm font-medium text-foreground">{ab.trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="Eye" size={12}/><span>{article.views} просмотров</span>
      </div>
    </div>
  );
}

// ─── Article Form ─────────────────────────────────────────────────────────────
function ArticleForm({article, onClose, onSave}:{article:WikiArticle|null;onClose:()=>void;onSave:()=>void}) {
  const [form, setForm] = useState({
    slug: article?.slug||"", title: article?.title||"", category: article?.category||"Devil Fruits",
    subcategory: article?.subcategory||"", icon: article?.icon||"📄", rarity: article?.rarity||"common",
    beli_price: article?.beli_price||0, robux_price: article?.robux_price||0,
    fragment_price: article?.fragment_price||0, description: article?.description||"",
    abilities: article?.abilities||"",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.title.trim()) { setError("Укажите название"); return; }
    if (!form.slug.trim()) { setError("Укажите slug (латиница)"); return; }
    setLoading(true); setError("");
    const res = article
      ? await apiUpdateArticle(article.slug, form)
      : await apiCreateArticle(form);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onSave();
  };

  const field = (label:string, key: keyof typeof form, type="text") => (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <input type={type} value={String(form[key])} onChange={e=>setForm(f=>({...f,[key]:type==="number"?Number(e.target.value):e.target.value}))}
        className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors" />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="ArrowLeft" size={16}/></button>
        <h1 className="text-2xl font-black">{article?"Редактировать":"Добавить"} <span className="gradient-text">запись</span></h1>
      </div>
      <div className="glass-strong rounded-3xl p-6 gradient-border space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field("Название","title")}
          {field("Slug (URL-имя)","slug")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Категория</p>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground border border-white/8 focus:outline-none bg-transparent">
              {WIKI_TABS.map(t=><option key={t.key} value={t.key} className="bg-gray-900">{t.label}</option>)}
            </select>
          </div>
          {field("Подкатегория","subcategory")}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {field("Иконка (эмодзи)","icon")}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Редкость</p>
            <select value={form.rarity} onChange={e=>setForm(f=>({...f,rarity:e.target.value}))}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground border border-white/8 focus:outline-none bg-transparent">
              {Object.entries(RARITY_META).map(([k,v])=><option key={k} value={k} className="bg-gray-900">{v.label}</option>)}
            </select>
          </div>
          <div/>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {field("Цена Beli","beli_price","number")}
          {field("Цена Robux","robux_price","number")}
          {field("Фрагменты","fragment_price","number")}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Описание</p>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}
            className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"/>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Способности (через запятую)</p>
          <input value={form.abilities} onChange={e=>setForm(f=>({...f,abilities:e.target.value}))}
            placeholder="Ability 1, Ability 2, Ability 3"
            className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors"/>
        </div>
        {error && <div className="glass rounded-xl px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}
        <div className="flex gap-3">
          <Button onClick={save} disabled={loading} className="rounded-xl flex-1" style={{background:"var(--gradient-main)",color:"#fff",border:"none"}}>
            {loading?<Icon name="Loader" size={16} className="animate-spin mr-2"/>:<Icon name="Save" size={16} className="mr-2"/>}
            {article?"Сохранить":"Создать"}
          </Button>
          <Button onClick={onClose} variant="outline" className="rounded-xl glass border-white/10 text-foreground">Отмена</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Debts ────────────────────────────────────────────────────────────────────
function DebtsSection() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"incoming"|"outgoing">("all");
  const [showClosed, setShowClosed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt|null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiGetDebts({type:filter==="all"?undefined:filter, closed:showClosed});
    if (res.debts) setDebts(res.debts);
    setLoading(false);
  }, [filter, showClosed]);

  useEffect(()=>{load();},[load]);

  const close = async (id:number) => { await apiCloseDebt(id); showToast("Долг закрыт"); load(); };
  const reopen = async (id:number) => { await apiReopenDebt(id); showToast("Долг переоткрыт"); load(); };

  const incoming = debts.filter(d=>d.type==="incoming");
  const outgoing = debts.filter(d=>d.type==="outgoing");
  const totalIn = incoming.reduce((s,d)=>s+d.amount,0);
  const totalOut = outgoing.reduce((s,d)=>s+d.amount,0);

  if (showForm) return (
    <DebtForm debt={editDebt} onClose={()=>{setShowForm(false);setEditDebt(null);}} onSave={()=>{load();setShowForm(false);setEditDebt(null);showToast(editDebt?"Долг обновлён":"Долг добавлен");}} />
  );

  return (
    <div className="animate-fade-in space-y-6 relative">
      {toast && <div className="fixed top-4 right-4 z-50 glass-strong rounded-xl px-4 py-3 text-sm text-foreground border border-white/10 animate-fade-in">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black">Управление <span className="gradient-text">долгами</span></h1>
          <p className="text-muted-foreground mt-1">Учёт финансовых обязательств</p>
        </div>
        <Button onClick={()=>{setEditDebt(null);setShowForm(true);}} className="rounded-xl" style={{background:"var(--gradient-main)",color:"#fff",border:"none"}}>
          <Icon name="Plus" size={16} className="mr-2"/>Добавить
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-400">₽ {(totalOut/1000).toFixed(0)}к</p>
          <p className="text-xs text-muted-foreground mt-1">Мы должны</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-black gradient-text">₽ {(totalIn/1000).toFixed(0)}к</p>
          <p className="text-xs text-muted-foreground mt-1">Нам должны</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className={`text-2xl font-black ${totalIn-totalOut>=0?"text-emerald-400":"text-red-400"}`}>
            {totalIn-totalOut>=0?"+":""}₽ {Math.abs((totalIn-totalOut)/1000).toFixed(0)}к
          </p>
          <p className="text-xs text-muted-foreground mt-1">Баланс</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {(["all","incoming","outgoing"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter===f?"text-white neon-glow":"glass text-muted-foreground hover:text-foreground"}`}
            style={filter===f?{background:"var(--gradient-main)"}:{}}>
            {{all:"Все",incoming:"Нам должны",outgoing:"Мы должны"}[f]}
          </button>
        ))}
        <button onClick={()=>setShowClosed(v=>!v)}
          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${showClosed?"bg-purple-500/20 text-purple-400 border-purple-500/30":"glass text-muted-foreground border-white/5"}`}>
          {showClosed?"Скрыть закрытые":"Показать закрытые"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="glass rounded-2xl p-4 animate-pulse h-20"/>)}</div>
      ) : (
        <div className="space-y-3">
          {debts.map(debt=>(
            <div key={debt.id} className={`glass rounded-2xl p-5 flex items-center gap-4 transition-all group ${debt.is_closed?"opacity-50":""}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${debt.type==="incoming"?"bg-cyan-500/20 text-cyan-400":"bg-red-500/20 text-red-400"}`}>
                <Icon name={debt.type==="incoming"?"ArrowDownLeft":"ArrowUpRight"} size={18}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{debt.name}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {debt.due_date && <p className="text-xs text-muted-foreground">📅 {new Date(debt.due_date).toLocaleDateString("ru-RU",{day:"numeric",month:"long"})}</p>}
                  {debt.note && <p className="text-xs text-muted-foreground truncate max-w-40">· {debt.note}</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold">{debt.amount.toLocaleString("ru-RU")} ₽</p>
                <div className="mt-1">{debt.is_closed?<Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">Закрыт</Badge>:<DebtStatusBadge status={debt.status}/>}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={()=>{setEditDebt(debt);setShowForm(true);}} className="w-8 h-8 glass rounded-lg flex items-center justify-center text-cyan-400 hover:bg-cyan-500/10">
                  <Icon name="Pencil" size={13}/>
                </button>
                {debt.is_closed
                  ? <button onClick={()=>reopen(debt.id)} className="w-8 h-8 glass rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10"><Icon name="RotateCcw" size={13}/></button>
                  : <button onClick={()=>close(debt.id)} className="w-8 h-8 glass rounded-lg flex items-center justify-center text-yellow-400 hover:bg-yellow-500/10"><Icon name="CheckCheck" size={13}/></button>
                }
              </div>
            </div>
          ))}
          {debts.length===0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="CreditCard" size={40} className="mx-auto mb-3 opacity-30"/>
              <p>Долгов нет</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Debt Form ────────────────────────────────────────────────────────────────
function DebtForm({debt, onClose, onSave}:{debt:Debt|null;onClose:()=>void;onSave:()=>void}) {
  const [form, setForm] = useState({
    name: debt?.name||"", amount: debt?.amount||0,
    type: debt?.type||"incoming", due_date: debt?.due_date||"", note: debt?.note||"",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name.trim()) { setError("Укажите имя"); return; }
    if (!form.amount) { setError("Укажите сумму"); return; }
    setLoading(true); setError("");
    const res = debt
      ? await apiUpdateDebt(debt.id, {...form, due_date: form.due_date||null})
      : await apiCreateDebt({...form, due_date: form.due_date||null});
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onSave();
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="ArrowLeft" size={16}/></button>
        <h1 className="text-2xl font-black">{debt?"Редактировать":"Новый"} <span className="gradient-text">долг</span></h1>
      </div>
      <div className="glass-strong rounded-3xl p-6 gradient-border space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Имя / Организация</p>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Иван Иванов"
            className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Сумма (₽)</p>
            <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:Number(e.target.value)}))}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors"/>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Тип</p>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as "incoming"|"outgoing"}))}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground border border-white/8 focus:outline-none bg-transparent">
              <option value="incoming" className="bg-gray-900">Нам должны</option>
              <option value="outgoing" className="bg-gray-900">Мы должны</option>
            </select>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Срок оплаты</p>
          <input type="date" value={form.due_date||""} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}
            className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]"/>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Примечание</p>
          <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={2} placeholder="Необязательно"
            className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"/>
        </div>
        {error && <div className="glass rounded-xl px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}
        <div className="flex gap-3">
          <Button onClick={save} disabled={loading} className="flex-1 rounded-xl" style={{background:"var(--gradient-main)",color:"#fff",border:"none"}}>
            {loading?<Icon name="Loader" size={16} className="animate-spin mr-2"/>:<Icon name="Save" size={16} className="mr-2"/>}
            {debt?"Сохранить":"Добавить долг"}
          </Button>
          <Button onClick={onClose} variant="outline" className="rounded-xl glass border-white/10 text-foreground">Отмена</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileSection({me, onLogout}:{me:User;onLogout:()=>void}) {
  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-black">Личный <span className="gradient-text">профиль</span></h1>
      <div className="glass-strong rounded-3xl p-8 flex items-center gap-6 gradient-border">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl neon-glow shrink-0" style={{background:"var(--gradient-main)"}}>
          {me.avatar_emoji||"👤"}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{me.display_name}</h2>
          <p className="text-muted-foreground">@{me.username}</p>
          <div className="mt-2"><RoleBadge role={me.role}/></div>
        </div>
        <button onClick={onLogout} className="glass rounded-xl p-3 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm">
          <Icon name="LogOut" size={16}/>Выйти
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5"><p className="text-xs text-muted-foreground mb-1">ID</p><p className="font-mono text-lg font-bold gradient-text">#{me.id}</p></div>
        <div className="glass rounded-2xl p-5"><p className="text-xs text-muted-foreground mb-1">Уровень</p><p className="text-lg font-bold">{ROLE_META[me.role]?.emoji} {ROLE_META[me.role]?.label}</p></div>
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="font-bold mb-3">Права доступа</h3>
        <div className="space-y-2">
          {[
            {label:"Просмотр вики", ok:true},
            {label:"Редактирование вики", ok:ROLE_HIERARCHY[me.role]>=1},
            {label:"Бан пользователей", ok:ROLE_HIERARCHY[me.role]>=1},
            {label:"Управление пользователями", ok:ROLE_HIERARCHY[me.role]>=2},
            {label:"Выдача ролей", ok:ROLE_HIERARCHY[me.role]>=2},
            {label:"Полный контроль", ok:ROLE_HIERARCHY[me.role]>=3},
          ].map((p,i)=>(
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{p.label}</span>
              <Icon name={p.ok?"CheckCircle":"XCircle"} size={16} className={p.ok?"text-emerald-400":"text-red-400/50"}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Admin ────────────────────────────────────────────────────────────────────
function AdminSection({me}:{me:User}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionUser, setActionUser] = useState<User|null>(null);
  const [banReason, setBanReason] = useState("");
  const [toast, setToast] = useState("");

  const myLevel = ROLE_HIERARCHY[me.role];
  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const load = useCallback(async()=>{
    setLoading(true);
    const res = await apiGetUsers();
    if (res.users) setUsers(res.users); else setError(res.error||"Ошибка");
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const setRole = async(uid:number,role:string)=>{
    const r=await apiSetRole(uid,role);
    if (r.ok) { showToast("Роль изменена"); load(); } else showToast(r.error||"Ошибка");
  };
  const ban = async(uid:number)=>{
    const r=await apiBanUser(uid,banReason||"Нарушение правил");
    if (r.ok) { showToast("Заблокирован"); setBanReason(""); setActionUser(null); load(); } else showToast(r.error||"Ошибка");
  };
  const unban = async(uid:number)=>{
    const r=await apiUnbanUser(uid);
    if (r.ok) { showToast("Разблокирован"); load(); } else showToast(r.error||"Ошибка");
  };

  const availableRoles = (["user","moderator","admin","superadmin","owner"] as Role[]).filter(r=>ROLE_HIERARCHY[r]<myLevel);

  return (
    <div className="animate-fade-in space-y-6 relative">
      {toast && <div className="fixed top-4 right-4 z-50 glass-strong rounded-xl px-4 py-3 text-sm border border-white/10 animate-fade-in">{toast}</div>}
      <h1 className="text-3xl font-black">Управление <span className="gradient-text">пользователями</span></h1>
      {error && <div className="glass rounded-xl p-4 text-red-400 text-sm border border-red-500/20">{error}</div>}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="glass rounded-2xl p-4 animate-pulse h-20"/>)}</div>
      ) : (
        <div className="space-y-3">
          {users.map(u=>{
            const uLevel = ROLE_HIERARCHY[u.role as Role]??0;
            const canAct = myLevel>uLevel && u.id!==me.id;
            const isExpanded = actionUser?.id===u.id;
            return (
              <div key={u.id} className={`glass rounded-2xl overflow-hidden transition-all ${u.is_banned?"border border-red-500/20":""}`}>
                <div className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 text-lg" style={{background:"var(--gradient-main)",color:"#fff"}}>
                    {(u.display_name||u.username)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{u.display_name}</p>
                      {u.id===me.id && <span className="text-xs text-muted-foreground">(вы)</span>}
                      {u.is_banned && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Заблокирован</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                  <div className="shrink-0"><RoleBadge role={u.role}/></div>
                  {canAct && (
                    <button onClick={()=>setActionUser(isExpanded?null:u)} className="glass rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all shrink-0">
                      <Icon name={isExpanded?"ChevronUp":"ChevronDown"} size={16}/>
                    </button>
                  )}
                </div>
                {isExpanded && canAct && (
                  <div className="border-t border-white/6 p-4 space-y-4 bg-white/2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">ИЗМЕНИТЬ РОЛЬ</p>
                      <div className="flex gap-2 flex-wrap">
                        {availableRoles.map(r=>(
                          <button key={r} onClick={()=>setRole(u.id,r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-[1.05] ${u.role===r?ROLE_META[r].color:"glass text-muted-foreground border-white/5 hover:text-foreground"}`}>
                            {ROLE_META[r].emoji} {ROLE_META[r].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">ДЕЙСТВИЯ</p>
                      {u.is_banned ? (
                        <button onClick={()=>unban(u.id)} className="glass rounded-lg px-4 py-2 text-sm text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all">
                          ✅ Разблокировать
                        </button>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <input value={banReason} onChange={e=>setBanReason(e.target.value)} placeholder="Причина..."
                            className="glass rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-red-500/50 flex-1"/>
                          <button onClick={()=>ban(u.id)} className="glass rounded-lg px-4 py-2 text-sm text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all whitespace-nowrap">
                            🚫 Забанить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Contacts ─────────────────────────────────────────────────────────────────
function ContactsSection() {
  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-black">Контакты и <span className="gradient-text">поддержка</span></h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-strong rounded-3xl p-6 gradient-border">
          <h2 className="text-xl font-bold mb-4">Написать нам</h2>
          <div className="space-y-3">
            <input placeholder="Ваше имя" className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors"/>
            <input type="email" placeholder="Email" className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors"/>
            <textarea placeholder="Опишите вашу проблему..." rows={4} className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"/>
            <Button className="w-full rounded-xl" style={{background:"var(--gradient-main)",color:"#fff",border:"none"}}>
              <Icon name="Send" size={16} className="mr-2"/>Отправить
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {[
            {icon:"Phone",        title:"Телефон",       value:"+7 (902) 669-51-52",    color:"text-purple-400 bg-purple-500/10"},
            {icon:"Mail",         title:"Email",         value:"support@debtwiki.ru",    color:"text-cyan-400 bg-cyan-500/10"},
            {icon:"Clock",        title:"Время работы",  value:"Ежедневно, 16:30–00:00", color:"text-pink-400 bg-pink-500/10"},
            {icon:"MessageSquare",title:"Telegram",      value:"@debtwiki_support",      color:"text-yellow-400 bg-yellow-500/10"},
          ].map((c,i)=>(
            <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}><Icon name={c.icon} size={18}/></div>
              <div><p className="text-xs text-muted-foreground">{c.title}</p><p className="font-medium">{c.value}</p></div>
            </div>
          ))}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={18} className="text-cyan-400 mt-0.5 shrink-0"/>
              <div><p className="font-semibold text-sm mb-1">Поддержка</p><p className="text-xs text-muted-foreground">Для вопросов о вики, ролях и долгах — пишите в Telegram.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function Index() {
  const [me, setMe] = useState<User|null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(()=>{
    const token = localStorage.getItem('dw_token');
    if (token) {
      apiMe().then(res=>{ if (res.user) setMe(res.user); setAuthChecked(true); }).catch(()=>setAuthChecked(true));
    } else { setAuthChecked(true); }
  },[]);

  const handleLogout = async()=>{ await apiLogout(); setMe(null); };

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"hsl(var(--background))"}}>
      <div className="w-12 h-12 rounded-2xl neon-glow animate-pulse" style={{background:"var(--gradient-main)"}}/>
    </div>
  );
  if (!me) return <LoginScreen onLogin={setMe}/>;

  const myLevel = ROLE_HIERARCHY[me.role];
  const visibleNav = navItems.filter(n=>!n.minRole||ROLE_HIERARCHY[n.minRole]<=myLevel);

  const sectionMap: Record<Section,React.ReactNode> = {
    home:     <HomeSection me={me} setSection={setActiveSection}/>,
    wiki:     <WikiSection me={me}/>,
    debts:    <DebtsSection/>,
    profile:  <ProfileSection me={me} onLogout={handleLogout}/>,
    admin:    myLevel>=1?<AdminSection me={me}/>:<div className="p-8 text-muted-foreground">Нет доступа</div>,
    contacts: <ContactsSection/>,
  };

  return (
    <div className="min-h-screen" style={{background:"hsl(var(--background))"}}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]" style={{background:"hsl(262 83% 68%)"}}/>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-8 blur-[100px]" style={{background:"hsl(188 95% 55%)"}}/>
      </div>
      <div className="flex min-h-screen relative z-10">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-strong border-r border-white/6 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen?"translate-x-0":"-translate-x-full"}`}>
          <div className="p-6 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg neon-glow" style={{background:"var(--gradient-main)"}}>D</div>
              <div>
                <p className="font-black text-foreground leading-none">DebtWiki</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Blox Fruits · Долги</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleNav.map(item=>{
              const isActive = activeSection===item.id;
              return (
                <button key={item.id} onClick={()=>{setActiveSection(item.id);setMobileMenuOpen(false);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive?"text-white neon-glow":"text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                  style={isActive?{background:"var(--gradient-main)"}:{}}>
                  <Icon name={item.icon} size={18}/>{item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/6">
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0" style={{background:"var(--gradient-main)",color:"#fff"}}>
                {(me.display_name||me.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{me.display_name}</p>
                <p className="text-[10px] text-muted-foreground">{ROLE_META[me.role]?.emoji} {ROLE_META[me.role]?.label}</p>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 transition-colors">
                <Icon name="LogOut" size={14}/>
              </button>
            </div>
          </div>
        </aside>
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={()=>setMobileMenuOpen(false)}/>}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 glass border-b border-white/6 px-6 py-4 flex items-center gap-4">
            <button onClick={()=>setMobileMenuOpen(true)} className="md:hidden glass rounded-lg p-2 text-muted-foreground">
              <Icon name="Menu" size={18}/>
            </button>
            <div className="flex-1">
              <h2 className="font-semibold">{visibleNav.find(n=>n.id===activeSection)?.label}</h2>
              <p className="text-xs text-muted-foreground">13 апреля 2026</p>
            </div>
            <button className="glass rounded-xl p-2.5 text-muted-foreground hover:text-foreground transition-all">
              <Icon name="Bell" size={18}/>
            </button>
          </header>
          <div className="p-6 max-w-5xl">
            {sectionMap[activeSection]}
          </div>
        </main>
      </div>
    </div>
  );
}