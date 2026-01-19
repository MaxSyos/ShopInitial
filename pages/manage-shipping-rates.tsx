import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useLanguage } from '../hooks/useLanguage';
import { IUserInfoRootState } from '../lib/types/user';
import { toast } from 'react-toastify';
import api from '../lib/axiosClient';
import Breadcrumb from '../components/UI/Breadcrumb';
import Benefits from '../components/Benefits';
import PrivateRoute from '../components/auth/PrivateRoute';
import { MdEdit, MdDelete, MdCalculate } from 'react-icons/md';

const DEFAULT_CEP = '39400115'; // CEP padrão fixo (sem hífen para API)
const RESTRICTED_CEP_START = 39400000;
const RESTRICTED_CEP_END = 39409999;

interface ShippingRate {
  id?: string;
  quantityUpTo: number;
  height: number;
  width: number;
  length: number;
  weight: number;
  sedexValue?: number;
  pacValue?: number;
}

const ManageShippingRatesPage: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [newRate, setNewRate] = useState<ShippingRate>({
    quantityUpTo: 10,
    height: 0,
    width: 0,
    length: 0,
    weight: 0,
    sedexValue: 0,
    pacValue: 0,
  });

  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );

  // Verificar se é ADMIN
  useEffect(() => {
    if (!userInfo) {
      router.push('/login');
      return;
    }

    if (userInfo.role !== 'ADMIN') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      router.push('/');
      return;
    }

    const timer = setTimeout(() => {
      fetchRates();
    }, 100);

    return () => clearTimeout(timer);
  }, [userInfo]);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/shipping-rates');
      const data = Array.isArray(response.data) ? response.data : response.data.rates || [];
      setRates(data);
    } catch (error: any) {
      console.error('[ManageShippingRates] Error fetching rates:', error);
      toast.error('Erro ao carregar tabelas de frete');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingRate(null);
    setNewRate({
      quantityUpTo: 10,
      height: 0,
      width: 0,
      length: 0,
      weight: 0,
      sedexValue: 0,
      pacValue: 0,
    });
    setIsEditing(true);
  };

  const handleEdit = (rate: ShippingRate) => {
    setEditingRate(rate);
    setNewRate(rate);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingRate(null);
    setNewRate({
      quantityUpTo: 10,
      height: 0,
      width: 0,
      length: 0,
      weight: 0,
      sedexValue: 0,
      pacValue: 0,
    });
  };

  const handleCalculateShipping = async () => {
    if (!newRate.height || !newRate.width || !newRate.length || !newRate.weight) {
      toast.error('Preencha as dimensões e peso (Altura, Largura, Comprimento, Peso)');
      return;
    }

    try {
      setCalculating(true);
      const response = await api.post('/admin/calculate-shipping', {
        height: newRate.height,
        width: newRate.width,
        length: newRate.length,
        weight: newRate.weight,
        cep: DEFAULT_CEP,
      });

      const { sedex, pac } = response.data;
      setNewRate((prev) => ({
        ...prev,
        sedexValue: sedex,
        pacValue: pac,
      }));
      toast.success('Frete calculado com sucesso via Correios!');
    } catch (error: any) {
      console.error('Erro ao calcular frete:', error);
      toast.error(error?.response?.data?.error || 'Erro ao calcular frete com Correios');
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveRate = async () => {
    if (!newRate.quantityUpTo || newRate.height <= 0 || newRate.width <= 0 || newRate.length <= 0 || newRate.weight <= 0) {
      toast.error('Preencha todos os campos obrigatórios com valores válidos');
      return;
    }

    try {
      if (editingRate?.id) {
        // Atualizar
        await api.patch(`/admin/shipping-rates/${editingRate.id}`, newRate);
        toast.success('Tabela de frete atualizada com sucesso!');
      } else {
        // Criar nova
        await api.post('/admin/shipping-rates', newRate);
        toast.success('Tabela de frete criada com sucesso!');
      }
      fetchRates();
      handleCancel();
    } catch (error: any) {
      console.error('Erro ao salvar frete:', error);
      toast.error(error?.response?.data?.error || 'Erro ao salvar tabela de frete');
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta tabela de frete?')) {
      return;
    }

    try {
      await api.delete(`/admin/shipping-rates/${id}`);
      toast.success('Tabela de frete deletada com sucesso!');
      fetchRates();
    } catch (error: any) {
      console.error('Erro ao deletar frete:', error);
      toast.error('Erro ao deletar tabela de frete');
    }
  };

  if (loading) {
    return (
      <PrivateRoute>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-palette-primary"></div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Gerenciar Valor de Envio</h1>
            <button
              onClick={handleAddNew}
              disabled={isEditing}
              className="px-4 py-2 bg-palette-primary text-palette-side rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              + Adicionar Nova Tabela
            </button>
          </div>

          {/* Formulário de adição/edição */}
          {isEditing && (
            <div className="bg-palette-card p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-bold mb-4">
                {editingRate?.id ? 'Editar Tabela de Frete' : 'Adicionar Nova Tabela de Frete'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade Até (peças) *</label>
                  <input
                    type="number"
                    min="1"
                    value={newRate.quantityUpTo || ''}
                    onChange={(e) => setNewRate({ ...newRate, quantityUpTo: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Altura (cm) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newRate.height || ''}
                    onChange={(e) => setNewRate({ ...newRate, height: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: 15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Largura (cm) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newRate.width || ''}
                    onChange={(e) => setNewRate({ ...newRate, width: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: 20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Comprimento (cm) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newRate.length || ''}
                    onChange={(e) => setNewRate({ ...newRate, length: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: 25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Peso (kg) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newRate.weight || ''}
                    onChange={(e) => setNewRate({ ...newRate, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: 1.8"
                  />
                </div>
              </div>

              {/* Seção de cálculo de frete */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MdCalculate size={18} />
                  Calcular Valor de Envio via Correios
                </h3>

                <p className="text-sm text-palette-mute mb-3">
                  CEP Padrão Fixo: <span className="font-mono font-bold">39400-115</span>
                </p>

                <button
                  onClick={handleCalculateShipping}
                  disabled={calculating || !newRate.height || !newRate.width || !newRate.length}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {calculating ? 'Consultando Correios...' : 'Calcular Frete via Correios'}
                </button>
              </div>

              {/* Valores calculados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor SEDEX (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newRate.sedexValue || ''}
                    onChange={(e) => setNewRate({ ...newRate, sedexValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: 45.90"
                  />
                  <p className="text-xs text-palette-mute mt-1">Preenchido automaticamente após calcular</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Valor PAC (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newRate.pacValue || ''}
                    onChange={(e) => setNewRate({ ...newRate, pacValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: 23.50"
                  />
                  <p className="text-xs text-palette-mute mt-1">Preenchido automaticamente após calcular</p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRate}
                  className="px-4 py-2 bg-palette-primary text-palette-side rounded-lg hover:opacity-90 transition"
                >
                  {editingRate?.id ? 'Atualizar' : 'Criar'} Tabela de Frete
                </button>
              </div>
            </div>
          )}

          {/* Tabela de taxas */}
          <div className="overflow-x-auto bg-palette-card rounded-lg shadow-md">
            <table className="w-full text-sm">
              <thead className="bg-palette-fill border-b border-palette-mute">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Até (peças)</th>
                  <th className="px-4 py-3 text-left font-semibold">Dimensões (A×L×C)</th>
                  <th className="px-4 py-3 text-left font-semibold">Peso (kg)</th>
                  <th className="px-4 py-3 text-left font-semibold">Valor SEDEX</th>
                  <th className="px-4 py-3 text-left font-semibold">Valor PAC</th>
                  <th className="px-4 py-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-palette-mute">
                      Nenhuma tabela de frete cadastrada
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id} className="border-b border-palette-mute hover:bg-palette-fill/50 transition">
                      <td className="px-4 py-3 font-medium">até {rate.quantityUpTo} peças</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {rate.height}×{rate.width}×{rate.length} cm
                      </td>
                      <td className="px-4 py-3 font-medium">{rate.weight} kg</td>
                      <td className="px-4 py-3 font-medium">
                        R$ {(rate.sedexValue || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        R$ {(rate.pacValue || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => handleEdit(rate)}
                          disabled={isEditing}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:opacity-75 disabled:opacity-50 transition"
                          title="Editar"
                        >
                          <MdEdit size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => rate.id && handleDeleteRate(rate.id)}
                          disabled={isEditing}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:opacity-75 disabled:opacity-50 transition"
                          title="Deletar"
                        >
                          <MdDelete size={16} />
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default ManageShippingRatesPage;
