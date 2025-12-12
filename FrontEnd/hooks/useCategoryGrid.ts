import { useState, useEffect } from 'react';

interface CategoryGridData {
  id: string;
  name: string;
  title: string;
  description: string | null;
  href: string | null;
  imgSrc: string | null;
  imgWidth: number;
  imgHeight: number;
  backgroundColor: string | null;
  flexDirection: string | null;
  paddingBlock: string | null;
  paddingInline: string | null;
  gridColumn: string | null;
  isCentered: boolean;
  isSmall: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryWithStyles extends Omit<CategoryGridData, 'backgroundColor' | 'flexDirection' | 'paddingBlock' | 'paddingInline' | 'gridColumn'> {
  styles: {
    backgroundColor: string | null;
    flexDirection: string;
    paddingBlock: string;
    paddingInline: string;
    gridColumn: string;
  };
}

export const useCategoryGrid = () => {
  const [categories, setCategories] = useState<CategoryWithStyles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/content/categories');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar categorias: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Transformar dados do banco para o formato esperado pelo componente
        const formattedCategories: CategoryWithStyles[] = (data.items || [])
          .filter((item: CategoryGridData) => item.isActive)
          .sort((a: CategoryGridData, b: CategoryGridData) => a.order - b.order)
          .map((item: CategoryGridData) => ({
            id: item.id,
            name: item.name,
            title: item.title,
            description: item.description,
            href: item.href || '/',
            imgSrc: item.imgSrc || '',
            imgWidth: item.imgWidth,
            imgHeight: item.imgHeight,
            isCentered: item.isCentered,
            isSmall: item.isSmall,
            order: item.order,
            isActive: item.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            styles: {
              backgroundColor: item.backgroundColor,
              flexDirection: item.flexDirection || 'row',
              paddingBlock: item.paddingBlock || '1rem',
              paddingInline: item.paddingInline || '1rem',
              gridColumn: item.gridColumn || 'span 3 / span 3',
            },
          }));

        setCategories(formattedCategories);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        // Fallback: retornar array vazio ao invés de quebrar
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
