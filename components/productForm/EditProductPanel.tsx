import React, { useEffect, useState } from 'react';
import api from '../../lib/axiosClient';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  images?: { url: string }[];
}

const EditProductPanel: React.FC<{ onSelect: (id: string | null) => void }> = ({ onSelect }) => {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (q = '') => {
    try {
      setLoading(true);
      const res = await api.get('/products', { params: { limit: 100, search: q } });
      setItems(res.data.items || []);
    } catch (err) {
      console.error('Erro ao listar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(search);
  };

  return (
    <div className="bg-palette-card rounded-lg p-4 shadow-sm max-h-[70vh] overflow-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-palette-base">Editar Produtos</h2>
      </div>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="flex-1 px-3 py-2 border rounded bg-palette-fill text-palette-base text-sm"
        />
        <button className="px-4 py-2 bg-palette-primary text-white rounded text-sm">Buscar</button>
      </form>

      {loading ? (
        <p className="text-sm text-palette-mute">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((p) => (
            <div key={p.id} className="p-3 border rounded bg-palette-fill flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <img src={p.images?.[0]?.url || '/placeholder.png'} alt={p.name} className="w-full sm:w-20 h-20 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{p.name}</div>
                <div className="text-xs text-palette-mute mt-1">R$ {p.price.toFixed(2)}</div>
                <div className="text-xs text-palette-mute">Estoque: {p.stock}</div>
              </div>
              <div className="w-full sm:w-auto flex justify-end">
                <button onClick={() => handleSelect(p.id)} className="px-3 py-1 bg-palette-primary text-white rounded text-sm">Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditProductPanel;
