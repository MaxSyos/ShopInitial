import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axiosClient';
import { toast } from 'react-toastify';
import PrivateRoute from '../components/auth/PrivateRoute';
import Breadcrumb from '../components/UI/Breadcrumb';
import Benefits from '../components/Benefits';
import { MdDelete, MdEdit } from 'react-icons/md';
import { maskCPF, maskWhatsApp, unmaskCPF, unmaskWhatsApp, isValidCPFFormat, isValidWhatsAppFormat } from '../utilities/masks';

const ProfilePage: React.FC = () => {
  const { user } = useAuth(true, '/login');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get('/auth/me');
        const serverUser = resp?.data?.user || user || {};
        if (serverUser?.name) setName(serverUser.name);
        if (serverUser?.cpf) setCpf(maskCPF(serverUser.cpf));
        if (serverUser?.whatsapp) setWhatsapp(maskWhatsApp(serverUser.whatsapp, true));
      } catch (err) {
        // fallback para dados já presentes no `user`
        if (user?.name) setName(user.name);
        // @ts-ignore
        if (user?.cpf) setCpf(maskCPF(user.cpf));
        // @ts-ignore
        if (user?.whatsapp) setWhatsapp(maskWhatsApp(user.whatsapp, true));
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setLoadingAddresses(true);
    try {
      const resp = await api.get('/addresses');
      setAddresses(resp.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao carregar endereços');
    } finally {
      setLoadingAddresses(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.warn('Nome é obrigatório');
    
    // Validate CPF if provided
    if (cpf && !isValidCPFFormat(cpf)) {
      return toast.error('CPF inválido. Deve conter 11 dígitos');
    }
    
    // Validate WhatsApp if provided
    if (whatsapp && !isValidWhatsAppFormat(whatsapp)) {
      return toast.error('WhatsApp inválido. Deve conter 11 ou 13 dígitos');
    }
    
    setSaving(true);
    try {
      await api.put('/auth/update', { 
        name,
        cpf: cpf ? unmaskCPF(cpf) : '',
        whatsapp: whatsapp ? unmaskWhatsApp(whatsapp) : ''
      });
      toast.success('Dados atualizados');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.warn('Preencha todos os campos de senha');
    }
    if (newPassword !== confirmPassword) {
      return toast.warn('As senhas não correspondem');
    }
    setChanging(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Senha alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Erro ao alterar senha';
      toast.error(msg);
    } finally {
      setChanging(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm('Deseja remover este endereço?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Endereço removido');
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover endereço');
    }
  }

  return (
    <PrivateRoute>
      <div>
        <Breadcrumb />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-3xl font-bold text-palette-text mb-8">Perfil</h1>

          {/* Seção: Dados da Conta */}
          <section className="mb-8 p-6 bg-palette-card rounded-lg shadow-md border border-palette-border">
            <h2 className="text-xl font-semibold text-palette-text mb-6">Dados da Conta</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-palette-text mb-2">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-text mb-2">Email</label>
                <input
                  value={user?.email}
                  disabled
                  className="w-full px-4 py-3 border border-palette-border bg-palette-dark text-palette-mute rounded-lg cursor-not-allowed opacity-75"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-text mb-2">CPF</label>
                <input
                  type="tel"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="XXX.XXX.XXX-XX"
                  maxLength={14}
                  className="w-full px-4 py-3 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                />
                {cpf && !isValidCPFFormat(cpf) && (
                  <p className="text-red-500 text-xs mt-1">CPF inválido. Deve conter 11 dígitos</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-text mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value, true))}
                  placeholder="(+55) 11 99999-9999"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                />
                {whatsapp && !isValidWhatsAppFormat(whatsapp) && (
                  <p className="text-red-500 text-xs mt-1">WhatsApp inválido. Deve conter 11 ou 13 dígitos</p>
                )}
              </div>
              <div className="pt-2">
                <button
                  disabled={saving}
                  className="px-6 py-2 bg-palette-primary text-palette-side font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </section>

          {/* Seção: Alterar Senha */}
          <section className="mb-8 p-6 bg-palette-card rounded-lg shadow-md border border-palette-border">
            <h2 className="text-xl font-semibold text-palette-text mb-6">Alterar Senha</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-palette-text mb-2">Senha Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-text mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-text mb-2">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                />
              </div>
              <div className="pt-2">
                <button
                  disabled={changing}
                  className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {changing ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </section>

          {/* Seção: Endereços */}
          <section className="p-6 bg-palette-card rounded-lg shadow-md border border-palette-border">
            <h2 className="text-xl font-semibold text-palette-text mb-6">Endereços</h2>
            {loadingAddresses ? (
              <div className="flex justify-center items-center min-h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-palette-primary"></div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-palette-mute mb-4">Nenhum endereço cadastrado</p>
                <button
                  onClick={() => window.location.href = '/shipping-address'}
                  className="px-4 py-2 bg-palette-primary text-palette-side font-medium rounded-lg hover:opacity-90"
                >
                  Adicionar Endereço
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((a) => (
                  <div key={a.id} className="border border-palette-border rounded-lg p-4 flex justify-between items-start bg-palette-fill hover:bg-palette-dark transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold text-palette-text">
                        {a.street}, {a.number} {a.complement ? `- ${a.complement}` : ''}
                      </div>
                      <div className="text-sm text-palette-mute">
                        {a.city} / {a.state} — {a.postalCode}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => (window.location.href = `/shipping-address?edit=${a.id}`)}
                        className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        title="Editar"
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(a.id)}
                        className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Excluir"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default ProfilePage;
