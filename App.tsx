
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppView, Service, BookingState, Appointment, ChatMessage } from './types';
import { SERVICES } from './constants';
import { supabase } from './src/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CustomerLoginScreen: React.FC<{ onLogin: (phone: string) => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [phone, setPhone] = useState('');

  const formatPhone = (v: string) => {
    const numbers = v.replace(/\D/g, '').slice(0, 11);

    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors justify-center">
      <button onClick={onBack} className="absolute top-6 left-6 size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
      <div className="text-center mb-8">
        <div className="size-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-4xl">smartphone</span></div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Identifique-se</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Informe seu celular para ver seus agendamentos.</p>
      </div>
      <div className="space-y-4">
        <input
          value={phone}
          onChange={handlePhoneChange}
          className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400 text-center text-lg tracking-widest font-mono"
          placeholder="(00) 0 0000-0000"
          type="tel"
        />
        <button
          onClick={() => {
            const raw = phone.replace(/\D/g, '');
            if (raw.length > 8) onLogin(raw);
            else alert('Telefone inválido');
          }}
          className="w-full bg-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 text-white"
        >
          Ver Agendamentos
        </button>
      </div>
    </div>
  );
};

const AdminClientsScreen: React.FC<{ onBack: () => void; onChat: (id: string, name: string) => void }> = ({ onBack, onChat }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingClient, setEditingClient] = useState<any | null>(null);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) console.error('Error fetching clients:', error);
    else if (data) setClients(data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${name}?`)) {
      supabase.from('clients').delete().eq('id', id)
        .then(({ error }) => {
          if (error) alert('Erro ao excluir: ' + error.message);
          else fetchClients();
        });
    }
  };

  const handleUpdate = () => {
    if (!editingClient) return;
    supabase.from('clients').update({
      name: editingClient.name,
      phone: editingClient.phone
    })
      .eq('id', editingClient.id)
      .then(({ error }) => {
        if (error) alert('Erro ao atualizar: ' + error.message);
        else {
          setEditingClient(null);
          fetchClients();
        }
      });
  };

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors relative">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Clientes Cadastrados</h2>
        <div className="size-10"></div>
      </header>
      <div className="p-4 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-white/5 sticky top-[73px] z-40">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-gray-100 dark:bg-surface-dark p-3 rounded-lg border-transparent text-sm text-slate-900 dark:text-white"
        />
      </div>
      <main className="p-4 space-y-2 flex-1 pb-24">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col gap-4 transition-colors">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 font-bold uppercase">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>
              </div>
              <div className="text-xs text-gray-400">
                #{c.id}
              </div>
            </div>
            <div className="flex gap-2 border-t border-gray-100 dark:border-white/5 pt-3">
              <button onClick={() => onChat(String(c.id), c.name)} className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-500/20">
                <span className="material-symbols-outlined text-sm">chat</span> Chat
              </button>
              <button onClick={() => setEditingClient(c)} className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200 dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-sm">edit</span> Editar
              </button>
              <button onClick={() => handleDelete(c.id, c.name)} className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-500/20">
                <span className="material-symbols-outlined text-sm">delete</span> Excluir
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Editar Cliente</h3>
            <div className="space-y-4">
              <input
                value={editingClient.name}
                onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                className="w-full bg-gray-100 dark:bg-background-dark p-3 rounded-lg text-slate-900 dark:text-white"
                placeholder="Nome"
              />
              <input
                value={editingClient.phone}
                onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                className="w-full bg-gray-100 dark:bg-background-dark p-3 rounded-lg text-slate-900 dark:text-white"
                placeholder="Telefone"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingClient(null)} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
                <button onClick={handleUpdate} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Utilities ---

const getNextDays = (count: number) => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayNum: d.getDate(),
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      isToday: i === 0,
      isDisabled: d.getDay() === 0, // Disable Sundays
      monthName: d.toLocaleDateString('pt-BR', { month: 'long' }),
      year: d.getFullYear()
    });
  }
  return days;
};

const formatDateToBRL = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const SuccessOverlay: React.FC = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/90 backdrop-blur-md animate-fade-in px-6">
    <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-scale-up border border-gray-100 dark:border-white/10 max-w-sm w-full">
      <div className="size-24 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-6 animate-bounce-custom">
        <span className="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">check_circle</span>
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">Agendamento feito com sucesso!</h2>
      <p className="text-gray-500 dark:text-gray-400 font-medium">Seu horário está reservado.</p>
    </div>
  </div>
);

// --- Screens Components ---

const LandingScreen: React.FC<{ onStart: () => void; onAdmin: () => void }> = ({ onStart, onAdmin }) => (
  <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark overflow-hidden transition-colors">
    <div className="relative w-full h-[55vh] min-h-[400px] overflow-hidden rounded-b-[2.5rem]">
      <div className="absolute inset-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAd9ZmeHOyg42x7v0k0qNhO9-cK785skXNL_S6do6DDC5G5lb-B1ftMgparS2gwUG7ooRV9_XnYkvC2WZZ3h6WU51kIeASA39uINq6la0Z2BqcF95tIMTnhUvI53fWECSvsvtVxppcZ1GOwUw6UWFvSqKuLladxkOuS4hVaIXBzMzlgig19A6E7vUZldSxux-DbJw8JvmeWvIeb5TG4wpmT6nQXz1DuxMGJqlWmMR7ZL7TvUrEyVCFEkLV0gpxfI_wLl3Y0FdU2ks-t")' }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/60 dark:via-background-dark/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full p-8 pb-12 flex flex-col items-center justify-end h-full z-10">
        <div className="mb-6 h-16 w-16 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(212,17,50,0.3)]">
          {/* <span className="material-symbols-outlined text-primary text-[32px]">content_cut</span> */}
          <img src="/logo.png" alt="Logo RS Barbearia" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-slate-900 dark:text-white tracking-tight text-4xl font-extrabold leading-tight text-center mb-3">RS Barbearia</h1>
        <p className="text-gray-600 dark:text-gray-300 text-base text-center max-w-xs opacity-90">Seu estilo, no seu tempo.<br />Agende seu corte em segundos.</p>
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-start px-6 pt-8 pb-8 gap-4 w-full max-w-md mx-auto">
      <button onClick={onStart} className="group relative flex w-full items-center justify-center rounded-xl h-14 bg-primary hover:bg-primary-dark transition-all shadow-lg shadow-primary/25">
        <span className="text-white text-lg font-bold">Agendar</span>
      </button>
      <button onClick={onAdmin} className="flex w-full items-center justify-center gap-2 rounded-lg h-12 text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[20px]">storefront</span>
        <span className="text-sm font-semibold">Painel do Barbeiro</span>
      </button>
    </div>
  </div>
);

const HomeScreen: React.FC<{
  onAgendar: () => void;
  onChat: () => void;
  onPerfil: () => void;
  onMais: () => void;
}> = ({ onAgendar, onChat, onPerfil, onMais }) => (
  <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark transition-colors">
    <header className="sticky top-0 z-50 flex items-center justify-center bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-gray-200 dark:border-white/5 gap-2 transition-colors">
      <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
      <h2 className="text-lg font-bold leading-tight tracking-tight text-center text-slate-900 dark:text-white">RS Barbearia</h2>
    </header>
    <main className="flex-1 flex flex-col px-4 pt-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Vamos agendar o seu<br />corte?</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={onAgendar} className="relative group flex flex-col items-start justify-end p-4 h-40 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
          <div className="absolute inset-0 z-0">
            <img alt="Agendamento" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbUv_-lMKHndUn4JTalhq50b_lZxMNuTjD0Tq15Kr4PZuSonpCNqY9r-GzE6A4RUVeOl947gmKD38S8XxgRrPpRjzO3nd2RH7EY5ZLdn0RTcUF-geos6tbYAqxaCCkZu4xxwYwIBwJ0cP1L_43YG1lBjMg_FZGjS84dSsAxG06H6DVq7St4chZBRIXF5kOEjFsOJI4m1humE6qwmH69brUzIHQd7YR2aUl3gbIy1r8rOXQq_8gwB_G9C7tLBBjeVNZLM4fAenpibIo" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="mb-1 rounded-full bg-primary p-2 text-white">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </div>
            <span className="text-left text-sm font-bold leading-tight text-white">Fazer o meu agendamento</span>
          </div>
        </button>
        <button onClick={onChat} className="relative group flex flex-col items-start justify-end p-4 h-40 w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/5 active:scale-[0.98] transition-all">
          <div className="absolute inset-0 z-0">
            <img alt="Barbeiro" className="h-full w-full object-cover" src="/renan.png" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="mb-1 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </div>
            <span className="text-left text-sm font-bold leading-tight text-white">Falar com o Barbeiro</span>
          </div>
        </button>
      </div>
      <div className="flex flex-col flex-1 items-start gap-4 text-slate-800 dark:text-white px-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">Horários de Funcionamento</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Seg - Sex: 09:00 - 20:00</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sáb: 09:00 - 18:00</p>
          </div>
        </div>
        <div className="flex items-start gap-3 mt-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined">location_on</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">Endereço</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Rua Osman Loureiro, 33</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Centro, Água Branca - AL</p>
          </div>
        </div>
      </div>
    </main>
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg pt-2 transition-colors">
      <div className="flex items-center justify-around px-2 pb-6">
        <button onClick={onAgendar} className="flex flex-1 flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined text-[24px] filled">calendar_month</span>
          <span className="text-[10px] font-medium uppercase">Agendar</span>
        </button>
        <button onClick={onPerfil} className="flex flex-1 flex-col items-center gap-1 text-gray-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[24px]">calendar_month</span>
          <span className="text-[10px] font-medium uppercase">Meus Agendamentos</span>
        </button>
        <button onClick={onMais} className="flex flex-1 flex-col items-center gap-1 text-gray-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[24px]">logout</span>
          <span className="text-[10px] font-medium uppercase">Sair</span>
        </button>
      </div>
    </nav>
  </div>
);

const SelectServicesScreen: React.FC<{
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onNext: () => void;
  onBack: () => void;
  services: Service[];
}> = ({ booking, setBooking, onNext, onBack, services }) => {
  const toggleService = (service: Service) => {
    setBooking(prev => {
      const exists = prev.selectedServices.find(s => s.id === service.id);
      if (exists) {
        return { ...prev, selectedServices: prev.selectedServices.filter(s => s.id !== service.id) };
      }
      return { ...prev, selectedServices: [...prev.selectedServices, service] };
    });
  };

  const totalPrice = booking.selectedServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/5 flex items-center p-4 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Serviços</h2>
      </header>
      <main className="flex-1 p-4 pb-32 max-w-md mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-slate-900 dark:text-white">Escolha o Serviço</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Selecione um ou mais serviços para o seu agendamento.</p>
        </div>
        <div className="mb-8 space-y-4">
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={booking.customerPhone}
            onChange={(e) => {
              const val = e.target.value;
              setBooking(prev => ({ ...prev, customerPhone: val }));
              if (val.length >= 8) {
                // Debounce lookup could be better, but simple is ok for now
                // Debounce lookup could be better, but simple is ok for now
                supabase.from('clients')
                  .select('name')
                  .eq('phone', val)
                  .single()
                  .then(({ data }) => {
                    if (data && data.name) {
                      setBooking(prev => ({ ...prev, customerName: data.name }));
                    }
                  });
              }
            }}
            className="w-full rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder:text-gray-400"
          />
          <input
            type="text"
            placeholder="Seu nome completo"
            value={booking.customerName}
            onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
            className="w-full rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-4">
          {services.map(service => (
            <label key={service.id} className={`relative flex gap-4 p-4 rounded-xl bg-white dark:bg-surface-dark border transition-all cursor-pointer ${booking.selectedServices.some(s => s.id === service.id) ? 'border-primary' : 'border-gray-200 dark:border-transparent'} shadow-sm hover:shadow-md`}>
              <img src={service.imageUrl} className="size-20 rounded-lg object-cover bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{service.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mt-1">{service.description}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-primary font-bold text-sm">R$ {service.price.toFixed(2)}</span>
                  <span className="text-gray-500 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {service.duration} min</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={booking.selectedServices.some(s => s.id === service.id)}
                onChange={() => toggleService(service)}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </main>
      <footer className="fixed bottom-0 w-full bg-white/95 dark:bg-surface-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 p-5 pb-8 transition-colors">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400 text-xs">Total estimado</span>
            <span className="text-2xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
          </div>
          <button
            disabled={booking.selectedServices.length === 0 || !booking.customerName}
            onClick={onNext}
            className="flex-1 bg-primary text-white font-bold py-3.5 px-6 rounded-lg shadow-lg disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      </footer>
    </div>
  );
};

const SelectDateTimeScreen: React.FC<{
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onNext: () => void;
  onBack: () => void;
}> = ({ booking, setBooking, onNext, onBack }) => {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const nextDays = useMemo(() => getNextDays(14), []);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [settings, setSettings] = useState<{ start: string, end: string, interval: number, lunchStart?: string, lunchEnd?: string, minNotice: number }>({ start: '09:00', end: '19:00', interval: 30, minNotice: 60 });

  useEffect(() => {
    const initData = async () => {
      // Fetch Blocks
      const { data: blocks } = await supabase.from('blocked_slots').select('*');
      if (blocks) setBlockedSlots(blocks);

      // Fetch Appointments
      const { data: apps } = await supabase.from('appointments').select('*').neq('status', 'CANCELLED');
      if (apps) {
        setExistingAppointments(apps.map((a: any) => ({
          ...a,
          date: a.appointment_date,
          time: a.appointment_time
        })));
      }

      // Fetch Settings
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData) {
        const s: any = {};
        settingsData.forEach((r: any) => s[r.key] = r.value);
        setSettings({
          start: s.start_time || '09:00',
          end: s.end_time || '19:00',
          interval: parseInt(s.interval_minutes) || 30,
          lunchStart: s.lunch_start,
          lunchEnd: s.lunch_end,
          minNotice: parseInt(s.min_scheduling_notice_minutes) || 60
        });
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (!settings.start || !settings.end) return;

    const selectedDateStr = nextDays[selectedDateIndex].dateStr;

    // Generate times dynamically based on settings
    const times = [];
    let [h, m] = settings.start.split(':').map(Number);
    const [endH, endM] = settings.end.split(':').map(Number);
    const endTotal = endH * 60 + endM;

    while (true) {
      const totalMins = h * 60 + m;
      if (totalMins >= endTotal) break;

      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      let isLunch = false;
      if (settings.lunchStart && settings.lunchEnd) {
        const [lsH, lsM] = settings.lunchStart.split(':').map(Number);
        const [leH, leM] = settings.lunchEnd.split(':').map(Number);
        const lunchStartMins = lsH * 60 + lsM;
        const lunchEndMins = leH * 60 + leM;
        if (totalMins >= lunchStartMins && totalMins < lunchEndMins) {
          isLunch = true;
        }
      }

      // Check for past time if today
      const now = new Date();
      const isToday = selectedDateStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      let isPast = false;

      if (isToday) {
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const noticeBuffer = settings.minNotice;

        if (totalMins <= currentMins + noticeBuffer) {
          isPast = true;
        }
      }

      if (!isLunch && !isPast) {
        times.push(timeStr);
      }

      m += settings.interval;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
      }
    }

    // Filter out blocked slots
    const dayBlocks = blockedSlots.filter(b => b.date === selectedDateStr).map(b => b.time);

    // Filter out existing appointments
    const dayAppointments = existingAppointments
      .filter(a => a.date === selectedDateStr && a.status !== 'CANCELLED')
      .map(a => a.time);

    const unexpected = [...dayBlocks, ...dayAppointments];

    setAvailableTimes(times.filter(t => !unexpected.includes(t)));

  }, [selectedDateIndex, blockedSlots, settings, existingAppointments]);

  const handleTimeSelect = (time: string) => {
    setBooking({ ...booking, selectedDate: nextDays[selectedDateIndex].dateStr, selectedTime: time });
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="p-4 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-background-dark flex items-center justify-between transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <span className="font-bold text-slate-900 dark:text-white">Escolha o Horário</span>
        <div className="size-10"></div>
      </header>
      <main className="p-6">
        <h3 className="text-slate-900 dark:text-white font-bold mb-4">Dias Disponíveis</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 mb-6">
          {nextDays.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDateIndex(i)}
              className={`min-w-[70px] p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${selectedDateIndex === i
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5 text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                }`}
            >
              <span className="text-[10px] font-bold uppercase">{d.weekDay}</span>
              <span className="text-xl font-bold">{d.dayNum}</span>
            </button>
          ))}
        </div>

        <h3 className="text-slate-900 dark:text-white font-bold mb-4">Horários Livres</h3>
        <div className="grid grid-cols-4 gap-3">
          {availableTimes.map((t) => (
            <button
              key={t}
              onClick={() => handleTimeSelect(t)}
              className={`p-3 rounded-xl border font-bold text-sm transition-all ${booking.selectedTime === t && booking.selectedDate === nextDays[selectedDateIndex].dateStr
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white'
                : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5 text-slate-900 dark:text-white hover:border-gray-300 dark:hover:border-white/20'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </main>
      <footer className="p-4 mt-auto border-t border-gray-200 dark:border-white/5 bg-white dark:bg-background-dark transition-colors">
        <button
          onClick={onNext}
          disabled={!booking.selectedTime}
          className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          Continuar
        </button>
      </footer>
    </div>
  );
};

const AdminFinanceScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [stats, setStats] = useState<any>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    revenueHistory: [],
    serviceDistribution: []
  });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]); // New state for processing daily stats
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Produto');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses'>('dashboard');

  const loadData = async () => {
    // 1. Fetch Expenses
    const { data: expData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (expData) setExpenses(expData);

    // 2. Fetch Appointments for Stats
    const { data: appData } = await supabase
      .from('appointments')
      .select('*, services:appointment_services(service:services(name))')
      .eq('status', 'COMPLETED');

    if (appData) {
      // Map nested structure
      const mappedApps = appData.map((a: any) => ({
        ...a,
        date: a.appointment_date,
        services: a.services.map((s: any) => ({ name: s.service.name }))
      }));

      setAppointments(mappedApps); // Set for daily processing

      // Calculate Stats
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const monthlyRevenue = mappedApps
        .filter((a: any) => a.appointment_date.startsWith(currentMonth))
        .reduce((sum: number, a: any) => sum + a.total_price, 0);

      const monthlyExpenses = (expData || [])
        .filter((e: any) => e.date.startsWith(currentMonth))
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      const distMap: any = {};
      mappedApps.forEach((a: any) => {
        a.services.forEach((s: any) => {
          distMap[s.name] = (distMap[s.name] || 0) + 1;
        });
      });
      const serviceDistribution = Object.entries(distMap).map(([name, count]) => ({ name, count }));

      const historyMap: any = {};
      mappedApps.forEach((a: any) => {
        const Month = a.appointment_date.substring(0, 7);
        historyMap[Month] = (historyMap[Month] || 0) + a.total_price;
      });
      const revenueHistory = Object.entries(historyMap)
        .map(([month, total]) => ({ month, total }))
        .sort((a: any, b: any) => a.month.localeCompare(b.month))
        .slice(-6);

      setStats({
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyRevenue - monthlyExpenses,
        serviceDistribution,
        revenueHistory
      });
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddExpense = async () => {
    if (!desc || !amount) return alert('Preencha descrição e valor');
    const { error } = await supabase.from('expenses').insert({
      description: desc,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString().split('T')[0]
    });

    if (error) alert('Erro ao adicionar: ' + error.message);
    else {
      setDesc(''); setAmount('');
      loadData();
      alert('Despesa adicionada!');
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Deletar despesa?')) return;
    supabase.from('expenses').delete().eq('id', id).then(() => loadData());
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Calculate Daily Services
  const todayStr = new Date().toISOString().split('T')[0]; // Using local date string logic might be better but for simplified demo
  // Correct date string matching ensuring timezone doesn't mess up (simple string comparison from DB)
  // Actually the DB stores YYYY-MM-DD. Let's assume the system time is close enough or use the same util.

  const todayAppointments = appointments.filter(a => a.date === todayStr && a.status === 'COMPLETED');
  const servicesToday: { [key: string]: number } = {};
  todayAppointments.forEach(app => {
    app.services.forEach((s: any) => {
      servicesToday[s.name] = (servicesToday[s.name] || 0) + 1;
    });
  });
  const servicesTodayList = Object.entries(servicesToday).map(([name, count]) => ({ name, count }));

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Financeiro</h2>
        <div className="size-10"></div>
      </header>

      <main className="p-4 space-y-6 max-w-2xl mx-auto w-full pb-20">
        {/* Tabs */}
        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-surface-dark shadow text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-surface-dark shadow text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Despesas
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5">
                <span className="text-[10px] uppercase text-gray-500 font-bold">Entradas (Mês)</span>
                <p className="text-xl font-bold text-green-500 dark:text-green-400">R$ {stats.revenue.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5">
                <span className="text-[10px] uppercase text-gray-500 font-bold">Saídas (Mês)</span>
                <p className="text-xl font-bold text-red-500 dark:text-red-400">R$ {stats.expenses.toFixed(2)}</p>
              </div>
              <div className="hidden md:block bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5">
                <span className="text-[10px] uppercase text-gray-500 font-bold">Lucro (Mês)</span>
                <p className={`text-xl font-bold ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>R$ {stats.profit.toFixed(2)}</p>
              </div>
              <div className="col-span-2 md:col-span-3 bg-gradient-to-r from-gray-50 to-white dark:from-surface-dark dark:to-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 flex justify-between items-center md:hidden">
                <div>
                  <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold">Lucro Líquido</span>
                  <p className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>R$ {stats.profit.toFixed(2)}</p>
                </div>
                <span className="material-symbols-outlined text-4xl opacity-10 dark:opacity-20 text-slate-900 dark:text-white">account_balance_wallet</span>
              </div>
            </div>



            {/* Daily Services Breakdown */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Serviços Hoje ({todayAppointments.length} Atendimentos)</h3>
                <span className="text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {servicesTodayList.length === 0 ? (
                  <p className="text-xs text-gray-400 col-span-2 italic">Nenhum serviço concluído hoje.</p>
                ) : (
                  servicesTodayList.map(item => (
                    <div key={item.name} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                      <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{item.name}</span>
                      <span className="text-xs font-black bg-white dark:bg-black/20 size-6 rounded-full flex items-center justify-center shadow-sm">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Histórico de Receita (6 Meses)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" fontSize={10} tick={{ fill: '#888' }} />
                    <YAxis fontSize={10} tick={{ fill: '#888' }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="total" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Serviços Mais Realizados</h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.serviceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {stats.serviceDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
        }

        {
          activeTab === 'expenses' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/10 space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Nova Despesa</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição (ex: Luz)" className="bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder:text-gray-400" />
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor (R$)" className="bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder:text-gray-400" />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-sm">
                  <option value="Produto">Produto</option>
                  <option value="Contas">Contas (Luz/Água)</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Outro">Outro</option>
                </select>
                <button onClick={handleAddExpense} className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold p-3 rounded-lg transition-colors">Adicionar</button>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm px-1">Histórico</h3>
                {expenses.map(exp => (
                  <div key={exp.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">payments</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{exp.description}</p>
                        <p className="text-xs text-gray-400">{exp.date} • {exp.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-500 dark:text-red-400">- R$ {exp.amount.toFixed(2)}</span>
                      <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && <p className="text-center text-gray-400 py-10">Nenhuma despesa registrada.</p>}
              </div>
            </div>
          )
        }
      </main >
    </div >
  );
};

const AdminBlockScheduleScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);

  const fetchBlocks = async () => {
    const { data } = await supabase.from('blocked_slots').select('*');
    if (data) setBlockedSlots(data);
  };

  useEffect(() => { fetchBlocks(); }, []);

  const handleBlock = async () => {
    if (!date || !time) return alert('Selecione data e hora');
    const { error } = await supabase.from('blocked_slots').insert({
      date,
      time,
      reason: reason || 'Bloqueado pelo Admin'
    });

    if (error) {
      alert('Erro ao bloquear: ' + error.message);
    } else {
      setDate(''); setTime(''); setReason('');
      fetchBlocks();
      alert('Horário bloqueado!');
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Liberar este horário?')) return;
    supabase.from('blocked_slots').delete().eq('id', id)
      .then(() => fetchBlocks());
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Bloquear Agenda</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full">
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl space-y-3 border border-gray-200 dark:border-white/10 transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white">Novo Bloqueio</h3>
          <input type="date" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" value={date} onChange={e => setDate(e.target.value)} />
          <input type="time" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" value={time} onChange={e => setTime(e.target.value)} />
          <input type="text" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="Motivo (opcional)" value={reason} onChange={e => setReason(e.target.value)} />
          <button onClick={handleBlock} className="w-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 py-3 rounded-lg font-bold border border-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors">Bloquear Horário</button>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Bloqueios Ativos</h3>
          {blockedSlots.map(b => (
            <div key={b.id} className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/5 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{new Date(b.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {b.time}</p>
                <p className="text-xs text-gray-500">{b.reason}</p>
              </div>
              <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-500 dark:hover:text-white transition-colors"><span className="material-symbols-outlined">delete</span></button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const ReviewScreen: React.FC<{
  booking: BookingState;
  onConfirm: () => void;
  onBack: () => void;
}> = ({ booking, onConfirm, onBack }) => {
  const totalPrice = booking.selectedServices.reduce((sum, s) => sum + s.price, 0);
  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col pb-24 transition-colors">
      <header className="sticky top-0 z-50 flex items-center p-4 bg-white/95 dark:bg-background-dark/95 border-b border-gray-200 dark:border-white/5 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined text-gray-600 dark:text-white">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Revisar Agendamento</h2>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Confira os detalhes</h1>
          <p className="text-sm text-gray-500 mt-1">Verifique as informações antes de confirmar.</p>
        </div>
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 flex gap-4 items-center">
            <div className="size-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">person</span></div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold">Cliente</span>
              <p className="font-medium text-sm text-slate-900 dark:text-white">{booking.customerName} • {booking.customerPhone}</p>
            </div>
          </div>
          <div className="p-4 flex gap-4 items-center border-t border-gray-100 dark:border-white/5 transition-colors">
            <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">calendar_month</span></div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold">Data e Hora</span>
              <p className="font-medium text-sm text-slate-900 dark:text-white">{formatDateToBRL(booking.selectedDate)} • {booking.selectedTime}</p>
            </div>
          </div>
        </section>
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 p-5 shadow-sm transition-colors">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-slate-900 dark:text-white"><span className="material-symbols-outlined text-primary text-xl">receipt_long</span> Resumo</h3>
          <div className="space-y-4">
            {booking.selectedServices.map(s => (
              <div key={s.id} className="flex justify-between text-sm text-slate-900 dark:text-white">
                <div>
                  <p className="font-bold">{s.name}</p>
                  <span className="text-xs text-gray-500">{s.duration} min</span>
                </div>
                <p className="font-bold">R$ {s.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="my-5 border-t border-gray-200 dark:border-white/10 border-dashed"></div>
          <div className="flex justify-between items-center">
            <p className="text-gray-500 font-medium">Total a pagar</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">R$ {totalPrice.toFixed(2)}</p>
          </div>
        </section>
      </main>
      <footer className="fixed bottom-0 w-full p-4 bg-white/95 dark:bg-background-dark border-t border-gray-200 dark:border-white/5 z-40 transition-colors">
        <button onClick={onConfirm} className="w-full bg-primary h-14 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
          <span>Confirmar Agendamento</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
};

const MyAppointmentsScreen: React.FC<{
  appointments: Appointment[];
  onBack: () => void;
  onNew: () => void;
  onRefresh: () => void;
}> = ({ appointments, onBack, onNew, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return appointments.filter(app => {
      // Date comparison
      if (app.date > currentDate) return activeTab === 'upcoming';
      if (app.date < currentDate) return activeTab === 'past';

      // If date is today, check time
      const [h, m] = app.time.split(':').map(Number);
      const appTime = h * 60 + m;

      if (activeTab === 'upcoming') {
        return appTime > currentTime;
      } else {
        return appTime <= currentTime;
      }
    }).sort((a, b) => { // Sort
      if (activeTab === 'upcoming') {
        // Ascending for upcoming
        return (a.date + a.time).localeCompare(b.date + b.time);
      } else {
        // Descending for past
        return (b.date + b.time).localeCompare(a.date + a.time);
      }
    });
  }, [appointments, activeTab]);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-20 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><span className="material-symbols-outlined text-gray-600 dark:text-white">arrow_back_ios_new</span></button>
        <h1 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Meus Agendamentos</h1>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full flex-1">
        <div className="flex bg-gray-100 dark:bg-surface-dark p-1 rounded-xl transition-colors">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`}
          >
            Próximos
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'past' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
          >
            Anteriores
          </button>
        </div>
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            {activeTab === 'upcoming' ? 'Agendamentos Futuros' : 'Histórico'}
          </h2>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-surface-dark/30 rounded-3xl border border-gray-200 dark:border-white/5 border-dashed transition-colors">
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-700 mb-2">event_busy</span>
              <p className="text-gray-500 text-sm">Nenhum agendamento {activeTab === 'upcoming' ? 'marcado' : 'encontrado'}.</p>
            </div>
          ) : (
            filteredAppointments.map(app => (
              <div key={app.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 mb-4 overflow-hidden shadow-sm relative hover:border-primary/20 dark:hover:border-white/10 transition-all">
                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl tracking-wider uppercase ${app.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/20 text-green-700 dark:text-green-400'
                  }`}>{app.status}</div>
                <div className="p-4 flex gap-4">
                  <div className={`size-16 rounded-xl flex flex-col items-center justify-center border transition-colors ${activeTab === 'past' ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                    }`}>
                    <span className="text-[10px] font-bold uppercase text-gray-500">Dia</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{app.date.split('-')[2]}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{app.services[0].name} {app.services.length > 1 ? `+ ${app.services.length - 1} serviço` : ''}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_month</span> {formatDateToBRL(app.date)}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {app.time}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02] transition-colors">
                  <span className="font-bold text-slate-900 dark:text-white">R$ {app.totalPrice.toFixed(2)}</span>
                  {activeTab === 'upcoming' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Deseja realmente cancelar este agendamento?')) {
                          fetch(`/api/appointments/${app.id}`, { method: 'DELETE' })
                            .then(() => onRefresh());
                        }
                      }}
                      className="text-primary text-xs font-bold uppercase flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span> Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
        <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/20 text-center shadow-sm">
          <div className="p-4 bg-primary/10 rounded-2xl inline-flex text-primary mb-4 shadow-inner"><span className="material-symbols-outlined text-[32px]">add_circle</span></div>
          <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">Novo Agendamento</h3>
          <p className="text-sm text-gray-500 mb-6 px-4">Precisa de um trato no visual? Escolha um novo serviço e horário.</p>
          <button onClick={onNew} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">Agendar Horário</button>
        </div>
      </main>
    </div>
  );
};

// --- Chat Screens ---

const AdminChatListScreen: React.FC<{ onBack: () => void; onSelectChat: (clientId: string, clientName: string) => void }> = ({ onBack, onSelectChat }) => {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const fetchConvos = async () => {
      // Fetch all messages and group by client on frontend mostly for simplicity (or use a view in Supabase in real app)
      // We'll fetch all unique clients from messages

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, clients!chat_messages_client_id_fkey(name, phone)')
        .order('sent_at', { ascending: false });

      if (data) {
        const convos: any[] = [];
        const clientIds = new Set();

        data.forEach((msg: any) => {
          if (msg.client_id && !clientIds.has(msg.client_id)) {
            clientIds.add(msg.client_id);
            convos.push({
              id: String(msg.client_id),
              name: msg.clients?.name || 'Unknown',
              phone: msg.clients?.phone || '',
              last_message: msg.sent_at,
              // msg_count: ... 
            });
          }
        });
        setConversations(convos);
      }
    };

    fetchConvos();
    const interval = setInterval(fetchConvos, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Conversas</h2>
        <div className="size-10"></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">Nenhuma conversa iniciada.</div>
        ) : (conversations.map(c => (
          <button key={c.id} onClick={() => onSelectChat(c.id, c.name)} className="w-full bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 flex gap-4 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
            <div className="size-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg font-bold border border-primary/20">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-900 dark:text-white truncate">{c.name}</h3>
                <span className="text-[10px] text-gray-400">{new Date(c.last_message).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.phone}</p>
            </div>
          </button>
        )))}
      </main>
    </div>
  );
};

const ChatScreen: React.FC<{
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onRegister: (identity: { name: string, phone: string }) => void;
  onBack: () => void;
  currentUserRole: 'CUSTOMER' | 'BARBER';
  customerIdentity?: { name: string; phone: string };
  chatClientId?: string; // For Admin
}> = ({ messages, onSendMessage, onRegister, onBack, currentUserRole, customerIdentity, chatClientId }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Local state for identifying customer if not provided
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // Determine if we need identity. 
  // If Customer role and no identity provided via props, show form.
  const needsIdentity = currentUserRole === 'CUSTOMER' && !customerIdentity?.phone;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, needsIdentity]);

  const handleStartChat = () => {
    if (!tempName || !tempPhone) {
      alert("Por favor, informe seu nome e telefone para iniciar o chat.");
      return;
    }
    onRegister({ name: tempName, phone: tempPhone });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const otherPersonName = currentUserRole === 'CUSTOMER' ? 'Renan Sandes' : (customerIdentity?.name || 'Cliente');
  const otherPersonRole = currentUserRole === 'CUSTOMER' ? 'Barbeiro' : 'Cliente';

  if (needsIdentity) {
    return (
      <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full justify-center transition-colors">
        <button onClick={onBack} className="absolute top-6 left-6 size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <div className="text-center mb-8">
          <div className="size-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20"><span className="material-symbols-outlined text-4xl filled">chat</span></div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quase lá!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Para falar com o barbeiro, precisamos saber quem é você.</p>
        </div>
        <div className="space-y-4">
          <input value={tempName} onChange={e => setTempName(e.target.value)} className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Seu Nome" />
          <input value={tempPhone} onChange={e => setTempPhone(e.target.value)} className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Seu Telefone (WhatsApp)" />
          <button onClick={handleStartChat} className="w-full bg-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 text-white">Iniciar Chat</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark h-screen flex flex-col transition-colors">
      <header className="p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center gap-3 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="size-10 rounded-full bg-gray-200 dark:bg-surface-dark border border-gray-200 dark:border-white/5 flex items-center justify-center overflow-hidden">
          <img src={currentUserRole === 'CUSTOMER' ? "/renan.png" : "/logo.png"} alt="Avatar" className="h-full w-full object-cover" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">{otherPersonName}</h2>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500"></span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{otherPersonRole} Online</span>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gray-50 dark:bg-background-dark transition-colors">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === currentUserRole ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === currentUserRole
              ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
              : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-white/5 shadow-sm'
              }`}>
              {msg.text}
              <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === currentUserRole ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="p-4 bg-white/95 dark:bg-surface-dark/50 border-t border-gray-200 dark:border-white/5 pb-8 transition-colors">
        <div className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-100 dark:bg-surface-dark border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary text-slate-900 dark:text-white placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined filled">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};



const AdminSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [interval, setInterval] = useState('30');
  const [lunchStart, setLunchStart] = useState('');
  const [lunchEnd, setLunchEnd] = useState('');
  const [minNotice, setMinNotice] = useState('60');

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const s: any = {};
        data.forEach((r: any) => s[r.key] = r.value);
        setStartTime(s.start_time || '09:00');
        setEndTime(s.end_time || '19:00');
        setInterval(s.interval_minutes || '30');
        setLunchStart(s.lunch_start || '');
        setLunchEnd(s.lunch_end || '');
        setMinNotice(s.min_scheduling_notice_minutes || '60');
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    const updates = [
      { key: 'start_time', value: startTime },
      { key: 'end_time', value: endTime },
      { key: 'interval_minutes', value: interval },
      { key: 'lunch_start', value: lunchStart },
      { key: 'lunch_end', value: lunchEnd },
      { key: 'min_scheduling_notice_minutes', value: minNotice }
    ];

    // Upsert all
    const { error } = await supabase.from('settings').upsert(updates);

    if (error) alert('Erro ao salvar: ' + error.message);
    else alert('Configurações salvas!');
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Configuração da Agenda</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-white/10 space-y-4 transition-colors">
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Horário de Abertura</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Horário de Fechamento</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Intervalo entre Cortes (min)</label>
            <select value={interval} onChange={e => setInterval(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white">
              <option value="15">15 minutos</option>
              <option value="20">20 minutos</option>
              <option value="30">30 minutos</option>
              <option value="40">40 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
            </select>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Início do Almoço (Opcional)</label>
            <input type="time" value={lunchStart} onChange={e => setLunchStart(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Fim do Almoço (Opcional)</label>
            <input type="time" value={lunchEnd} onChange={e => setLunchEnd(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Antecedência Mínima para Agendar (minutos)</label>
            <input
              type="number"
              value={minNotice}
              onChange={e => setMinNotice(e.target.value)}
              className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white"
              placeholder="Ex: 60"
            />
          </div>
          <button onClick={handleSave} className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 mt-4">Salvar Configurações</button>
        </div>
      </main>
    </div>
  );
};



const LoginScreen: React.FC<{ onLogin: () => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [remember, setRemember] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError('Preencha todos os campos'); return; }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error('Login error:', error.message);
      setError(error.message === 'Invalid login credentials' ? 'Email ou senha inválidos' : 'Erro ao fazer login');
    } else if (data.user) {
      if (remember) {
        // Supabase persists by default, but we can respect the checkbox logic if we wanted to manipulate storage
        // For now, we rely on standard persistence or just setting our local flag if needed for other logic
        localStorage.setItem('admin_auth', 'true');
      }
      onLogin();
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-white transition-colors"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Login</h2>
      </div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Painel Administrativo</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie sua barbearia com facilidade e profissionalismo.</p>
      </div>
      <div className="flex flex-col items-center mb-10">
        <div className="size-24 rounded-full bg-white dark:bg-surface-dark border-4 border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden relative group shadow-lg transition-colors">
          {/* <span className="material-symbols-outlined text-4xl text-gray-500">person</span> */}
          <img src="/renan.png" className="h-full w-full object-cover" />
          <div className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full border-2 border-white dark:border-background-dark shadow-md"><span className="material-symbols-outlined text-xs text-white">photo_camera</span></div>
        </div>
        <span className="text-primary text-sm font-bold mt-3">Renan Sandes</span>
      </div>
      <div className="space-y-4 mb-10">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">alternate_email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-surface-dark border-transparent h-14 pl-12 pr-4 focus:ring-primary focus:border-primary transition-all text-sm text-slate-900 dark:text-white placeholder:text-gray-400 shadow-sm"
            placeholder="E-mail profissional"
            type="email"
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-surface-dark border-transparent h-14 pl-12 pr-4 focus:ring-primary focus:border-primary transition-all text-sm text-slate-900 dark:text-white placeholder:text-gray-400 shadow-sm"
            placeholder="Senha"
            type="password"
          />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="remember" className="text-sm text-gray-500 dark:text-gray-400">Manter conectado</label>
        </div>

        {error && <p className="text-red-500 text-sm font-bold text-center mb-4">{error}</p>}
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary h-14 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        <span>{loading ? 'Entrando...' : 'Acessar Painel'}</span> <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  );
};

const AdminDashboard: React.FC<{
  appointments: Appointment[];
  onLogout: () => void;
  onOpenChat: () => void;
  onManageServices: () => void;
  onBlockSchedule: () => void;
  onSettings: () => void;
  onFinance: () => void;
  onRefresh: () => void;
  onClients: () => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}> = ({ appointments, onLogout, onOpenChat, onManageServices, onBlockSchedule, onSettings, onFinance, onRefresh, onClients, setAppointments }) => {
  const availableDays = useMemo(() => getNextDays(7), []);
  const [selectedDateStr, setSelectedDateStr] = useState(availableDays[0].dateStr);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const selectedDayApps = appointments.filter(a => a.date === selectedDateStr);

  // Separate Pending (Normal) from Completed
  const pendingApps = selectedDayApps.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');

  const totalRevenue = appointments.reduce((sum, app) => sum + app.totalPrice, 0);

  const stats = useMemo(() => {
    const count = pendingApps.length; // Count only pending for "Agenda" or maybe all? Let's show all count in header maybe
    const revenue = selectedDayApps.reduce((sum, app) => sum + app.totalPrice, 0); // Revenue counts all
    return { count, revenue };
  }, [selectedDayApps, pendingApps]);

  const handleUpdateStatus = (id: string, status: string) => {
    // Optimistic Update
    setAppointments(prev => prev.map(app =>
      app.id === id ? { ...app, status } : app
    ));
    setActiveMenuId(null);

    supabase.from('appointments').update({ status }).eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error(error);
          onRefresh(); // Revert if error (simple way)
        }
      });
  };

  const handleDeleteAppointment = (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja cancelar o agendamento de ${name}? O horário ficará disponível novamente.`)) return;

    supabase.from('appointments').delete().eq('id', id)
      .then(({ error }) => {
        if (error) alert('Erro ao cancelar');
        else onRefresh();
      });
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/90 dark:bg-background-dark/90 flex items-center justify-between backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm flex items-center justify-center p-1">
            <img src="/renan.png" alt="Admin" className="h-full w-full object-cover rounded-full" />
          </div>
          <div>
            <h2 className="font-bold leading-none text-slate-900 dark:text-white">Agenda</h2>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Renan Sandes</span>
          </div>
        </div>
        <button onClick={onLogout} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 transition-colors">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>
      <main className="p-4 pb-24 max-w-md mx-auto w-full">
        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={onClients}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <span className="material-symbols-outlined filled">group</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Clientes</h3>
              <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Gerenciar</p>
            </div>
          </button>

          <button
            onClick={onManageServices}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <span className="material-symbols-outlined filled">content_cut</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Serviços</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Editar/Add</p>
            </div>
          </button>

          <button
            onClick={onOpenChat}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined filled">chat</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Chat</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Conversas</p>
            </div>
          </button>

          <button
            onClick={onFinance}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined filled">payments</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Financeiro</h3>
              <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Relatórios</p>
            </div>
          </button>

          <button
            onClick={onBlockSchedule}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <span className="material-symbols-outlined filled">event_busy</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Bloquear</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Fechar Horários</p>
            </div>
          </button>

          <button
            onClick={onSettings}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <span className="material-symbols-outlined filled">settings</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Configurar</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Agenda Details</p>
            </div>
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
          {availableDays.map(d => (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDateStr(d.dateStr)}
              className={`p-3 rounded-xl min-w-[70px] text-center flex flex-col transition-all border ${selectedDateStr === d.dateStr
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-surface-dark text-gray-500 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                }`}
            >
              <span className={`text-[10px] uppercase font-bold mb-1 ${selectedDateStr === d.dateStr ? 'opacity-90' : 'opacity-60'}`}>
                {d.isToday ? 'Hoje' : d.label}
              </span>
              <span className={`text-xl font-bold ${selectedDateStr === d.dateStr ? 'text-white' : 'text-slate-900 dark:text-gray-300'}`}>{d.dayNum}</span>
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-gray-200 dark:border-white/5 text-center shadow-sm transition-colors">
            <span className="text-4xl font-black text-slate-900 dark:text-white">{stats.count}</span>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-2 tracking-widest">Agendados</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-gray-200 dark:border-white/5 text-center shadow-sm transition-colors">
            <span className="text-4xl font-black text-slate-900 dark:text-white">R$ {stats.revenue.toFixed(0)}</span>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-2 tracking-widest">Previsão de Faturamento do dia</p>
          </div>
        </div>

        <h3 className="text-[11px] text-gray-500 font-bold uppercase mb-5 tracking-widest px-1 flex justify-between items-center">
          <span>Cronograma</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full normal-case text-[10px]">{pendingApps.length} agendamentos</span>
        </h3>

        {/* Appointment List */}
        <div className="space-y-4">
          {pendingApps.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-surface-dark/40 rounded-3xl border border-gray-200 dark:border-white/5 border-dashed transition-colors">
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-700 mb-2">event_busy</span>
              <p className="text-gray-500 text-sm">Sem compromissos pendentes.</p>
            </div>
          ) : (
            pendingApps.map((app) => (
              <div key={app.id} className="group relative bg-white dark:bg-surface-dark p-5 rounded-3xl border-l-4 border-primary border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
                      {app.time}
                    </span>
                    <span className="text-gray-500 text-[10px] font-bold uppercase mt-0.5">
                      {app.services.reduce((total, s) => total + s.duration, 0)} min de duração
                    </span>
                  </div>
                  <span className="bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-green-500/20">
                    {app.status === 'CONFIRMED' ? 'Confirmado' : app.status}
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="size-12 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/5 flex items-center justify-center overflow-hidden shadow-inner transition-colors">
                    <span className="material-symbols-outlined text-gray-600 text-2xl">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">{app.customerName}</h4>
                    <p className="text-xs text-gray-500 font-medium truncate opacity-80">
                      {app.services.map(s => s.name).join(' + ')}
                    </p>
                  </div>

                  {/* <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === app.id ? null : app.id)}
                      className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {activeMenuId === app.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/5 z-10 overflow-hidden animate-fade-in">
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium text-green-600"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span> Concluir
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium text-red-500"
                        >
                          <span className="material-symbols-outlined text-lg">cancel</span> Cancelar
                        </button>
                      </div>
                    )}
                  </div> */}
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <a
                    href={`https://wa.me/55${app.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`*Essa mensagem é pra lembrar do seu agendamento!*

*Data:* ${app.date.split('-').reverse().join('/')}
*Horário:* ${app.time}
*Serviço:* ${app.services.map(s => s.name).join(', ')}
*Valor:* R$ ${app.totalPrice.toFixed(2).replace('.', ',')}
*Cliente:* ${app.customerName}

Dúvidas, responder a essa mensagem!`)}`}
                    target="_blank"
                    className="flex-1 h-10 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-500 flex items-center justify-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wide border border-green-500/20"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    WhatsApp
                  </a>
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                    className="flex-1 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wide border border-primary/20"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Concluir
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja cancelar?')) handleUpdateStatus(app.id, 'CANCELLED');
                    }}
                    className="size-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors border border-red-500/20"
                    title="Cancelar Agendamento"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Completed Section */}
        <div className="mt-8 space-y-4 opacity-70">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500">task_alt</span>
            Concluídos Hoje ({selectedDayApps.filter(a => a.status === 'COMPLETED').length})
          </h3>
          <div className="space-y-3">
            {selectedDayApps.filter(a => a.status === 'COMPLETED').map(app => (
              <div key={app.id} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-transparent flex justify-between items-center group grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                    {app.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white strike-through decoration-slate-900/30">{app.customerName}</p>
                    <p className="text-xs text-gray-500">{app.services.map(s => s.name).join(', ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{app.time}</p>
                  <p className="text-xs text-green-500 font-bold">Concluído</p>
                </div>
              </div>
            ))}
            {selectedDayApps.filter(a => a.status === 'COMPLETED').length === 0 && (
              <p className="text-sm text-gray-400 italic">Nenhum atendimento concluído hoje.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Admin Services Screen ---
const AdminServicesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service>>({});
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) console.error(error);
    else if (data) {
      setServices(data.map((s: any) => ({
        ...s,
        imageUrl: s.image_url
      })));
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleSave = async () => {
    if (!editingService.name || !editingService.price) return;
    setLoading(true);

    const payload = {
      name: editingService.name,
      description: editingService.description,
      price: editingService.price,
      duration: editingService.duration,
      image_url: editingService.imageUrl,
      is_active: true
    };

    let error;
    if (editingService.id) {
      const { error: err } = await supabase
        .from('services')
        .update(payload)
        .eq('id', editingService.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('services')
        .insert(payload);
      error = err;
    }

    setLoading(false);
    if (error) {
      console.error(error);
      alert('Erro ao salvar serviço');
    } else {
      setIsEditing(false);
      setEditingService({});
      fetchServices();
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este serviço?')) return;
    // Soft delete
    supabase.from('services').update({ is_active: false }).eq('id', id)
      .then(() => fetchServices());
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors">
        <div className="flex items-center mb-8">
          <button onClick={() => setIsEditing(false)} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">{editingService.id ? 'Editar Serviço' : 'Novo Serviço'}</h2>
        </div>
        <div className="space-y-4">
          <input className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Nome do Serviço" value={editingService.name || ''} onChange={e => setEditingService({ ...editingService, name: e.target.value })} />
          <textarea className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 h-24 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Descrição" value={editingService.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} />
          <div className="flex gap-2">
            <input type="number" className="flex-1 bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Preço (R$)" value={editingService.price || ''} onChange={e => setEditingService({ ...editingService, price: parseFloat(e.target.value) })} />
            <input type="number" className="flex-1 bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Duração (min)" value={editingService.duration || ''} onChange={e => setEditingService({ ...editingService, duration: parseInt(e.target.value) })} />
          </div>
          <input className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="URL da Imagem" value={editingService.imageUrl || ''} onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })} />

          <button onClick={handleSave} disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20">
            {loading ? 'Salvando...' : 'Salvar Serviço'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Gerenciar Serviços</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-4 max-w-md mx-auto w-full pb-24">
        {services.map(s => (
          <div key={s.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex gap-4 items-center transition-colors">
            <img src={s.imageUrl} className="size-16 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" />
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs">R$ {s.price.toFixed(2)} • {s.duration} min</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setEditingService(s); setIsEditing(true); }} className="size-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-blue-500 dark:text-blue-400 transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
              <button onClick={() => handleDelete(s.id)} className="size-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-red-500 dark:text-red-400 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
            </div>
          </div>
        ))}
      </main>
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => { setEditingService({}); setIsEditing(true); }} className="size-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-95">
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>
    </div>
  );
};

// --- Theme Logic ---

// --- Main App Logic ---

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [currentUserRole, setCurrentUserRole] = useState<'CUSTOMER' | 'BARBER'>('CUSTOMER');

  // Notification refs
  const prevAppCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const [services, setServices] = useState<Service[]>([]);

  // Check for persistent login
  useEffect(() => {
    // Check local storage flag OR Supabase session
    const isAuth = localStorage.getItem('admin_auth');

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session || isAuth === 'true') {
        setCurrentUserRole('BARBER');
        setView('ADMIN_DASHBOARD');
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setCurrentUserRole('BARBER');
        setView('ADMIN_DASHBOARD');
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('admin_auth');
        setView('LANDING');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Request Notification Permission for Admin
  useEffect(() => {
    if (currentUserRole === 'BARBER' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [currentUserRole]);

  /* Refactored fetchServicesList to be reused */
  const fetchServicesList = async () => {
    const { data } = await supabase.from('services').select('*').eq('is_active', true);
    if (data) {
      setServices(data.map((s: any) => ({
        ...s,
        id: String(s.id),
        imageUrl: s.image_url
      })));
    }
  };

  useEffect(() => {
    fetchServicesList();
  }, []);


  const [booking, setBooking] = useState<BookingState>({
    customerName: '',
    customerPhone: '',
    selectedServices: [],
    selectedDate: '',
    selectedTime: '',
  });

  const [selectedChatClient, setSelectedChatClient] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    // Fetch chat messages
    // If Admin and selectedChatClient, fetch for that client
    // If Customer, fetch by their phone (booking state) OR maybe we need a session state for customer phone?
    // For simplicity: Customer sees all messages if no phone tied (demo) or filtered by phone if known

    // Admin View Logic:
    let query = '';
    if (currentUserRole === 'BARBER' && selectedChatClient) {
      query = `?clientId=${selectedChatClient.id}`;
    } else if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
      query = `?phone=${booking.customerPhone}`;
    }

    const fetchChat = async () => {
      let query = supabase.from('chat_messages').select('*').order('sent_at', { ascending: true });
      if (currentUserRole === 'BARBER' && selectedChatClient) {
        query = query.eq('client_id', selectedChatClient.id);
      } else if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
        // We need client ID from phone
        const { data: client } = await supabase.from('clients').select('id').eq('phone', booking.customerPhone).single();
        if (client) query = query.eq('client_id', client.id);
        else return; // user not found yet
      }

      const { data, error } = await query;
      if (data) {
        const mapped = data.map((m: any) => ({
          id: String(m.id),
          text: m.message_text,
          sender: m.sender_type,
          timestamp: new Date(m.sent_at)
        }));
        setChatMessages(mapped);
      }
    };
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [selectedChatClient, currentUserRole, booking.customerPhone]);

  // Dynamically set today's date for mock data
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const fetchAppointments = useCallback(async () => {
    let query = supabase
      .from('appointments')
      .select(`
            *,
            services:appointment_services(
                service:services(*)
            ),
            clients(name, phone)
        `);

    // Client-side filtering for customer (or do it in RLS/query filter if simple)
    // Actually we can filter by client phone join, but for now fetch all and filter is safer if we don't have perfect join filtering setup

    const { data, error } = await query;

    if (data) {
      let newApps = data.map((a: any) => ({
        id: String(a.id),
        date: a.appointment_date,
        time: a.appointment_time ? a.appointment_time.slice(0, 5) : '',
        status: a.status,
        totalPrice: a.total_price,
        customerName: a.clients?.name || 'Cliente',
        customerPhone: a.clients?.phone || '',
        services: a.services.map((s: any) => ({
          ...s.service,
          imageUrl: s.service.image_url
        }))
      }));

      if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
        newApps = newApps.filter((app: Appointment) => app.customerPhone === booking.customerPhone);
      }

      // Check new appointments
      if (currentUserRole === 'BARBER' && !isFirstLoadRef.current) {
        if (newApps.length > prevAppCountRef.current) {
          if (Notification.permission === 'granted') {
            new Notification("Novo Agendamento!");
          }
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => { });
        }
      }

      setAppointments(newApps);
      prevAppCountRef.current = newApps.length;
      isFirstLoadRef.current = false;
    }
  }, [currentUserRole, booking.customerPhone]);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const handleRegisterIdentity = (identity: { name: string, phone: string }) => {
    setBooking(prev => ({ ...prev, customerName: identity.name, customerPhone: identity.phone }));
  };

  const handleSendMessage = async (text: string, identity?: { name: string, phone: string }) => {
    if (identity) {
      setBooking(prev => ({ ...prev, customerName: identity.name, customerPhone: identity.phone }));
    }

    const phoneToSend = identity?.phone || booking.customerPhone;
    const nameToSend = identity?.name || booking.customerName;

    let cId = selectedChatClient?.id;

    // Resolve Client ID
    if (!cId) {
      // Look up by phone
      const { data: client } = await supabase.from('clients').select('id').eq('phone', phoneToSend).single();
      if (client) {
        cId = client.id;
      } else {
        // Create
        const { data: newClient } = await supabase.from('clients').insert({ name: nameToSend, phone: phoneToSend }).select().single();
        if (newClient) cId = newClient.id;
      }
    }

    if (!cId) return;

    await supabase.from('chat_messages').insert({
      client_id: cId,
      sender_type: currentUserRole,
      message_text: text,
      sent_at: new Date().toISOString()
    });

    // Re-fetch handled by polling or subscription (polling in this case)
  };

  const handleFinishBooking = async () => {
    // 1. Find or Create Client
    let clientId: number | undefined;
    const { data: clientData } = await supabase.from('clients').select('id').eq('phone', booking.customerPhone).single();
    if (clientData) {
      clientId = clientData.id;
    } else {
      const { data: newClient, error: clientError } = await supabase.from('clients').insert({ name: booking.customerName, phone: booking.customerPhone }).select().single();
      if (clientError || !newClient) { alert('Erro ao salvar cliente'); return; }
      clientId = newClient.id;
    }

    // 2. Create Appointment
    const { data: appData, error: appError } = await supabase.from('appointments').insert({
      client_id: clientId,
      appointment_date: booking.selectedDate,
      appointment_time: booking.selectedTime,
      total_price: booking.selectedServices.reduce((sum, s) => sum + s.price, 0),
      status: 'PENDING'
    }).select().single();

    if (appError || !appData) { alert('Erro ao agendar: ' + (appError?.message || '')); return; }

    // 3. Insert Services
    const serviceInserts = booking.selectedServices.map(s => ({
      appointment_id: appData.id,
      service_id: s.id,
      price_at_booking: s.price
    }));
    await supabase.from('appointment_services').insert(serviceInserts);

    // Success
    setShowSuccess(true);
    setBooking(prev => ({
      ...prev,
      selectedServices: [],
      selectedDate: '',
      selectedTime: '',
    }));
    fetchAppointments();
    setTimeout(() => {
      setShowSuccess(false);
      setView('MY_APPOINTMENTS');
    }, 3000);
  };

  const renderView = () => {
    switch (view) {
      case 'LANDING':
        return <LandingScreen onStart={() => setView('HOME')} onAdmin={() => setView('LOGIN')} />;
      case 'HOME':
        return <HomeScreen
          onAgendar={() => {
            fetchServicesList(); // Refresh info
            setView('SELECT_SERVICES');
          }}
          onChat={() => { setCurrentUserRole('CUSTOMER'); setView('CHAT'); }}
          onPerfil={() => {
            setView('CUSTOMER_LOGIN');
          }}
          onMais={() => setView('LANDING')}
        />;
      case 'SELECT_SERVICES':
        return <SelectServicesScreen
          booking={booking}
          setBooking={setBooking}
          onNext={() => setView('SELECT_DATE_TIME')}
          onBack={() => setView('HOME')}
          services={services}
        />;
      case 'SELECT_DATE_TIME':
        return <SelectDateTimeScreen
          booking={booking}
          setBooking={setBooking}
          onNext={() => setView('REVIEW')}
          onBack={() => setView('SELECT_SERVICES')}
        />;
      case 'REVIEW':
        return <ReviewScreen
          booking={booking}
          onConfirm={handleFinishBooking}
          onBack={() => setView('SELECT_DATE_TIME')}
        />;
      case 'MY_APPOINTMENTS':
        return <MyAppointmentsScreen
          appointments={appointments}
          onBack={() => setView('HOME')}
          onNew={() => setView('SELECT_SERVICES')}
          onRefresh={fetchAppointments}
        />;
      case 'LOGIN':
        return <LoginScreen onLogin={() => { setCurrentUserRole('BARBER'); setView('ADMIN_DASHBOARD'); }} onBack={() => setView('LANDING')} />;
      case 'ADMIN_DASHBOARD':
        return <AdminDashboard
          appointments={appointments}
          onLogout={() => {
            localStorage.removeItem('admin_auth');
            supabase.auth.signOut();
            setView('LANDING');
          }}
          onOpenChat={() => { setCurrentUserRole('BARBER'); setView('ADMIN_CHAT_LIST'); }}
          onManageServices={() => setView('ADMIN_SERVICES')}
          onBlockSchedule={() => setView('ADMIN_BLOCK_SCHEDULE')}
          onSettings={() => setView('ADMIN_SETTINGS')}
          onFinance={() => setView('ADMIN_FINANCE')}

          onRefresh={fetchAppointments}
          onClients={() => setView('ADMIN_CLIENTS')}
          setAppointments={setAppointments}
        />;
      case 'ADMIN_SERVICES':
        return <AdminServicesScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_BLOCK_SCHEDULE':
        return <AdminBlockScheduleScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_SETTINGS':
        return <AdminSettingsScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_FINANCE':
        return <AdminFinanceScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_CHAT_LIST':
        return <AdminChatListScreen
          onBack={() => setView('ADMIN_DASHBOARD')}
          onSelectChat={(cId, cName) => {
            setSelectedChatClient({ id: cId, name: cName });
            setView('CHAT');
          }}
        />;
      case 'CHAT':
        return <ChatScreen
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onRegister={handleRegisterIdentity}
          currentUserRole={currentUserRole}
          customerIdentity={{ name: booking.customerName, phone: booking.customerPhone }}
          chatClientId={selectedChatClient?.id}
          onBack={() => {
            if (currentUserRole === 'BARBER') setView('ADMIN_CHAT_LIST');
            else setView('HOME');
          }}
        />;
      case 'CUSTOMER_LOGIN':
        return <CustomerLoginScreen
          onLogin={(phone) => {
            setBooking(prev => ({ ...prev, customerPhone: phone }));
            setView('MY_APPOINTMENTS');
          }}
          onBack={() => setView('HOME')}
        />;
      case 'ADMIN_CLIENTS':
        return <AdminClientsScreen
          onBack={() => setView('ADMIN_DASHBOARD')}
          onChat={(cId, cName) => {
            setSelectedChatClient({ id: cId, name: cName });
            setCurrentUserRole('BARBER');
            setView('CHAT');
          }}
        />;
      default:
        return <LandingScreen onStart={() => setView('HOME')} onAdmin={() => setView('LOGIN')} />;
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white font-display transition-colors duration-300">
      {showSuccess && <SuccessOverlay />}
      {renderView()}
    </div>
  );
};

export default App;
