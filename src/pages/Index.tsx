import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Section = "home" | "debts" | "profile" | "admin" | "contacts" | "wiki";

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "debts", label: "Долги", icon: "CreditCard" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "admin", label: "Админ", icon: "Shield" },
  { id: "contacts", label: "Контакты", icon: "MessageCircle" },
  { id: "wiki", label: "База знаний", icon: "BookOpen" },
];

const debts = [
  { id: 1, name: "Алексей Морозов", amount: 45000, due: "2026-04-20", status: "overdue", type: "outgoing" },
  { id: 2, name: "ООО «Старт»", amount: 120000, due: "2026-04-28", status: "urgent", type: "incoming" },
  { id: 3, name: "Мария Иванова", amount: 8500, due: "2026-05-10", status: "ok", type: "outgoing" },
  { id: 4, name: "Иван Петров", amount: 31000, due: "2026-05-15", status: "ok", type: "incoming" },
  { id: 5, name: "Сергей Кузнецов", amount: 67000, due: "2026-04-22", status: "overdue", type: "incoming" },
];

const articles = [
  { title: "Как правильно оформить долговую расписку", category: "Юридические вопросы", reads: 1240 },
  { title: "Сроки исковой давности по долгам", category: "Законодательство", reads: 890 },
  { title: "Реструктуризация долгов: пошаговый гид", category: "Финансы", reads: 654 },
  { title: "Досудебное урегулирование споров", category: "Юридические вопросы", reads: 423 },
  { title: "Как вести учёт финансовых обязательств", category: "Инструменты", reads: 1102 },
  { title: "Налоговые аспекты прощения долга", category: "Налоги", reads: 388 },
];

const notifications = [
  { text: "Долг Алексея Морозова просрочен на 3 дня", type: "error", time: "10 мин назад" },
  { text: "Сергей Кузнецов: платёж через 2 дня", type: "warning", time: "1 час назад" },
  { text: "ООО «Старт» погасило часть долга", type: "success", time: "3 часа назад" },
];

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon name={icon} size={22} />
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-foreground text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function DebtStatusBadge({ status }: { status: string }) {
  if (status === "overdue") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Просрочен</Badge>;
  if (status === "urgent") return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Срочно</Badge>;
  return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">В норме</Badge>;
}

function HomeSection() {
  return (
    <div className="animate-fade-in space-y-10">
      <div className="relative rounded-3xl overflow-hidden p-10 noise-bg" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "hsl(262 83% 68%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-15 blur-3xl" style={{ background: "hsl(188 95% 55%)", transform: "translate(-30%, 30%)" }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">Система активна</span>
          </div>
          <h1 className="text-5xl font-black mb-4 leading-tight">
            <span className="gradient-text">DebtWiki</span>
            <br />
            <span className="text-foreground">Учёт обязательств</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mb-8">
            Финансовая вики-система для управления долгами, отслеживания платежей и контроля финансовых обязательств.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button className="rounded-xl px-6" style={{ background: "var(--gradient-main)", color: "#fff", border: "none" }}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить долг
            </Button>
            <Button variant="outline" className="rounded-xl px-6 glass border-white/10 text-foreground hover:bg-white/5">
              <Icon name="FileText" size={16} className="mr-2" />
              База знаний
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Активных долгов" value="24" icon="CreditCard" color="bg-purple-500/20 text-purple-400" />
        <StatCard label="Просрочено" value="3" icon="AlertTriangle" color="bg-red-500/20 text-red-400" />
        <StatCard label="К получению" value="₽ 218к" icon="TrendingUp" color="bg-cyan-500/20 text-cyan-400" />
        <StatCard label="Выплачено" value="₽ 94к" icon="CheckCircle" color="bg-emerald-500/20 text-emerald-400" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Уведомления</h2>
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div key={i} className={`glass rounded-xl p-4 flex items-start gap-4 border-l-2 ${n.type === "error" ? "border-l-red-500" : n.type === "warning" ? "border-l-yellow-500" : "border-l-emerald-500"}`}>
              <Icon
                name={n.type === "error" ? "XCircle" : n.type === "warning" ? "Clock" : "CheckCircle"}
                size={18}
                className={`mt-0.5 shrink-0 ${n.type === "error" ? "text-red-400" : n.type === "warning" ? "text-yellow-400" : "text-emerald-400"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{n.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Быстрый доступ</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: "FilePlus", label: "Новый долг", color: "text-purple-400" },
            { icon: "Send", label: "Напомнить должнику", color: "text-cyan-400" },
            { icon: "BarChart3", label: "Отчёт за месяц", color: "text-pink-400" },
            { icon: "Users", label: "Все контрагенты", color: "text-yellow-400" },
            { icon: "Calendar", label: "График платежей", color: "text-emerald-400" },
            { icon: "Download", label: "Экспорт данных", color: "text-blue-400" },
          ].map((item, i) => (
            <button key={i} className="glass rounded-2xl p-5 flex flex-col items-center gap-3 hover:bg-white/5 transition-all duration-200 hover:scale-[1.03] cursor-pointer text-center">
              <Icon name={item.icon} size={24} className={item.color} />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DebtsSection() {
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing">("all");
  const filtered = debts.filter(d => filter === "all" || d.type === filter);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black">
            Управление <span className="gradient-text">долгами</span>
          </h1>
          <p className="text-muted-foreground mt-1">Учёт финансовых обязательств</p>
        </div>
        <Button className="rounded-xl" style={{ background: "var(--gradient-main)", color: "#fff", border: "none" }}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-400">₽ 112к</p>
          <p className="text-xs text-muted-foreground mt-1">Мы должны</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-black gradient-text">₽ 218к</p>
          <p className="text-xs text-muted-foreground mt-1">Нам должны</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">+₽ 106к</p>
          <p className="text-xs text-muted-foreground mt-1">Баланс</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "incoming", "outgoing"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? "text-white neon-glow" : "glass text-muted-foreground hover:text-foreground"}`}
            style={filter === f ? { background: "var(--gradient-main)" } : {}}
          >
            {{ all: "Все", incoming: "Нам должны", outgoing: "Мы должны" }[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(debt => (
          <div key={debt.id} className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/5 transition-all duration-200 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${debt.type === "incoming" ? "bg-cyan-500/20 text-cyan-400" : "bg-red-500/20 text-red-400"}`}>
              <Icon name={debt.type === "incoming" ? "ArrowDownLeft" : "ArrowUpRight"} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{debt.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Срок: {new Date(debt.due).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-foreground">{debt.amount.toLocaleString("ru-RU")} ₽</p>
              <div className="mt-1"><DebtStatusBadge status={debt.status} /></div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-8 h-8 glass rounded-lg flex items-center justify-center text-cyan-400 hover:bg-cyan-500/10">
                <Icon name="Send" size={14} />
              </button>
              <button className="w-8 h-8 glass rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5">
                <Icon name="MoreHorizontal" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSection() {
  const history = [
    { date: "12 апр 2026", action: "Добавлен долг", entity: "Алексей Морозов", amount: "+45 000 ₽" },
    { date: "10 апр 2026", action: "Получена оплата", entity: "ООО «Старт»", amount: "+30 000 ₽" },
    { date: "08 апр 2026", action: "Отправлено напоминание", entity: "Сергей Кузнецов", amount: "" },
    { date: "05 апр 2026", action: "Закрыт долг", entity: "Анна Белова", amount: "18 500 ₽" },
    { date: "03 апр 2026", action: "Добавлен долг", entity: "ООО «Старт»", amount: "+90 000 ₽" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-black">
        Личный <span className="gradient-text">профиль</span>
      </h1>

      <div className="glass-strong rounded-3xl p-8 flex items-center gap-6 gradient-border">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl neon-glow shrink-0" style={{ background: "var(--gradient-main)" }}>
          👤
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Администратор</h2>
          <p className="text-muted-foreground">admin@debtwiki.ru</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Суперадмин</Badge>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Финансист</Badge>
          </div>
        </div>
        <button className="glass rounded-xl p-3 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <Icon name="Settings" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-3xl font-black gradient-text">87</p>
          <p className="text-xs text-muted-foreground mt-1">Операций</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-emerald-400">12</p>
          <p className="text-xs text-muted-foreground mt-1">Закрыто долгов</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-cyan-400">34</p>
          <p className="text-xs text-muted-foreground mt-1">Контрагентов</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">История действий</h2>
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={i} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{h.action}</p>
                <p className="text-xs text-muted-foreground">{h.entity}</p>
              </div>
              {h.amount && <span className="text-sm font-semibold text-cyan-400 shrink-0">{h.amount}</span>}
              <span className="text-xs text-muted-foreground shrink-0">{h.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminSection() {
  const users = [
    { name: "Александр Новиков", role: "Менеджер", status: "active", operations: 23 },
    { name: "Елена Смирнова", role: "Финансист", status: "active", operations: 41 },
    { name: "Дмитрий Власов", role: "Наблюдатель", status: "inactive", operations: 5 },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-black">
        Панель <span className="gradient-text">администратора</span>
      </h1>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="Activity" size={18} className="text-cyan-400" />
          <span className="font-semibold">Состояние системы</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Сервер", value: "Онлайн", ok: true },
            { label: "База данных", value: "Онлайн", ok: true },
            { label: "Уведомления", value: "Активны", ok: true },
            { label: "Бэкапы", value: "Вчера", ok: false },
          ].map((s, i) => (
            <div key={i} className="bg-white/3 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-emerald-400" : "bg-yellow-400"}`} />
                <p className="text-sm font-medium">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Пользователи</h2>
          <Button size="sm" className="rounded-xl" style={{ background: "var(--gradient-main)", color: "#fff", border: "none" }}>
            <Icon name="UserPlus" size={14} className="mr-2" />
            Добавить
          </Button>
        </div>
        <div className="space-y-3">
          {users.map((u, i) => (
            <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.role} · {u.operations} операций</p>
              </div>
              <Badge className={u.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                {u.status === "active" ? "Активен" : "Неактивен"}
              </Badge>
              <button className="glass rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
                <Icon name="MoreHorizontal" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: "Bell", title: "Уведомления", desc: "Настройка напоминаний и сроков", color: "text-purple-400" },
          { icon: "Database", title: "Бэкапы", desc: "Резервное копирование данных", color: "text-cyan-400" },
          { icon: "Lock", title: "Безопасность", desc: "Роли доступа и аутентификация", color: "text-pink-400" },
          { icon: "FileText", title: "Отчёты", desc: "Экспорт и шаблоны документов", color: "text-yellow-400" },
        ].map((item, i) => (
          <button key={i} className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/5 transition-all hover:scale-[1.02] text-left">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Icon name={item.icon} size={20} className={item.color} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground ml-auto shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactsSection() {
  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-black">
        Контакты и <span className="gradient-text">поддержка</span>
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-strong rounded-3xl p-6 gradient-border">
          <h2 className="text-xl font-bold mb-4">Написать нам</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Ваше имя"
              className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <textarea
              placeholder="Опишите вашу проблему..."
              rows={4}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
            />
            <Button className="w-full rounded-xl" style={{ background: "var(--gradient-main)", color: "#fff", border: "none" }}>
              <Icon name="Send" size={16} className="mr-2" />
              Отправить сообщение
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: "Mail", title: "Email поддержки", value: "support@debtwiki.ru", color: "text-purple-400 bg-purple-500/10" },
            { icon: "Phone", title: "Телефон", value: "+7 (800) 555-01-23", color: "text-cyan-400 bg-cyan-500/10" },
            { icon: "Clock", title: "Режим работы", value: "Пн–Пт, 9:00–18:00", color: "text-pink-400 bg-pink-500/10" },
            { icon: "MessageSquare", title: "Telegram", value: "@debtwiki_support", color: "text-yellow-400 bg-yellow-500/10" },
          ].map((c, i) => (
            <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                <Icon name={c.icon} size={18} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.title}</p>
                <p className="font-medium text-foreground">{c.value}</p>
              </div>
            </div>
          ))}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={18} className="text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm mb-1">Часто задаваемые вопросы</p>
                <p className="text-xs text-muted-foreground">Ответы доступны в базе знаний вики.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WikiSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const categories = [...new Set(articles.map(a => a.category))];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-black">
        База <span className="gradient-text">знаний</span>
      </h1>

      <div className="relative">
        <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Поиск по статьям..."
          className="w-full glass-strong rounded-2xl pl-11 pr-4 py-4 text-foreground placeholder:text-muted-foreground border border-white/8 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSearchQuery(cat)}
            className="glass rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((a, i) => (
          <div key={i} className="glass rounded-2xl p-5 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
            <div className="flex items-start justify-between gap-3 mb-3">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">{a.category}</Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Icon name="Eye" size={12} />
                {a.reads}
              </div>
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-purple-300 transition-colors leading-snug">
              {a.title}
            </h3>
            <div className="flex items-center gap-1 mt-3 text-xs text-cyan-400">
              <span>Читать статью</span>
              <Icon name="ArrowRight" size={12} />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-40" />
          <p>Статьи не найдены</p>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sectionMap: Record<Section, React.ReactNode> = {
    home: <HomeSection />,
    debts: <DebtsSection />,
    profile: <ProfileSection />,
    admin: <AdminSection />,
    contacts: <ContactsSection />,
    wiki: <WikiSection />,
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]" style={{ background: "hsl(262 83% 68%)" }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-8 blur-[100px]" style={{ background: "hsl(188 95% 55%)" }} />
      </div>

      <div className="flex min-h-screen relative z-10">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-strong border-r border-white/6 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg neon-glow" style={{ background: "var(--gradient-main)" }}>D</div>
              <div>
                <p className="font-black text-foreground leading-none">DebtWiki</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Система учёта долгов</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? "text-white neon-glow" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                  style={isActive ? { background: "var(--gradient-main)" } : {}}
                >
                  <Icon name={item.icon} size={18} />
                  {item.label}
                  {item.id === "debts" && (
                    <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/6">
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0" style={{ background: "var(--gradient-main)", color: "#fff" }}>А</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">Администратор</p>
                <p className="text-[10px] text-muted-foreground truncate">Онлайн</p>
              </div>
              <Icon name="LogOut" size={14} className="text-muted-foreground shrink-0" />
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 glass border-b border-white/6 px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden glass rounded-lg p-2 text-muted-foreground hover:text-foreground"
            >
              <Icon name="Menu" size={18} />
            </button>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">
                {navItems.find(n => n.id === activeSection)?.label}
              </h2>
              <p className="text-xs text-muted-foreground">13 апреля 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative glass rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <Icon name="Bell" size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              </button>
              <button className="glass rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <Icon name="Search" size={18} />
              </button>
            </div>
          </header>

          <div className="p-6 max-w-4xl">
            {sectionMap[activeSection]}
          </div>
        </main>
      </div>
    </div>
  );
}