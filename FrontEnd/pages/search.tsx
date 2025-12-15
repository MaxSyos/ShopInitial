import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/UI/Breadcrumb';
import ProductCard from '../components/UI/card/Card';
import { mapBackendProductsToIProducts } from '../utilities/mapBackendProduct';
import Pagination from '../components/UI/Pagination';

const SearchPage: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { q } = router.query;

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 16;

  useEffect(() => {
    if (q && typeof q === 'string') {
      fetchSearchResults(q, currentPage);
    }
  }, [q, currentPage]);

  const fetchSearchResults = async (query: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&page=${page}`
      );
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
        setTotal(data.total || 0);
      } else {
        setError(data.error || t.errorLoading || 'Erro ao carregar resultados');
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError(t.errorLoading || 'Erro ao carregar resultados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // Mapeia os produtos
  const mappedProducts = mapBackendProductsToIProducts(products);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {t.searchResults || 'Resultados da busca'}: "{q}"
        </h1>
        <span className="text-sm text-gray-500">
          {t.found || 'Encontrado'}: {total} {t.products || 'produtos'}
        </span>
      </div>

      {loading && (!products || products.length === 0) ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-palette-primary"></div>
        </div>
      ) : mappedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mappedProducts.map((product) => (
              <ProductCard key={product.slug.current} product={product} />
            ))}
          </div>

          {total > PAGE_SIZE && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalItems={total}
                itemsPerPage={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">
            {t.noResults || 'Nenhum produto encontrado para sua busca.'}
          </p>
          <a
            href="/products"
            className="mt-4 inline-block text-palette-primary hover:underline"
          >
            {t.backToProducts || 'Voltar para produtos'}
          </a>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
