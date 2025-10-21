import React, { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/UI/Breadcrumb';
import ProductCard from '../components/UI/card/Card';
import { mapBackendProductsToIProducts } from '../utilities/mapBackendProduct';
import Pagination from '../components/UI/Pagination';
/* import SortSelect from '../components/UI/SortSelect'; */
/* import FilterSidebar from '../components/UI/FilterSidebar'; */

const ProductsPage: React.FC<{ initialProducts?: any }> = ({ initialProducts }) => {
  const { t } = useLanguage();
  const { 
    products, 
    total, 
    page, 
    limit, 
    loading, 
    error,
    loadProducts 
  } = useProducts();

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    minPrice: undefined,
    maxPrice: undefined,
    categoryId: undefined,
    brandId: undefined,
  });

  useEffect(() => {
    // Chama o backend SEM filtros, paginação ou ordenação, pois o backend não suporta
    loadProducts();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as 'asc' | 'desc');
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Mapeia os produtos do backend para o formato do frontend
  // Se não houver produtos no state (first load), usa initialProducts trazido do servidor
  const backendItems = Array.isArray(products?.items) && products.items.length > 0 ? products.items : (initialProducts?.items || []);
  const mappedProducts = Array.isArray(backendItems) ? mapBackendProductsToIProducts(backendItems) : [];

  console.log('Produtos recebidos no componente:', products);

  if (loading && (!products?.items || products.items.length === 0)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-palette-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {t.products}
        </h1>
      </div>
      {/* Filtros podem ser colocados aqui, acima do grid, se necessário */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-200 h-80 rounded-lg"></div>
          ))}
        </div>
      ) : Array.isArray(mappedProducts) && mappedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mappedProducts.map((product) => (
              <ProductCard key={product.slug.current} product={product} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / limit)}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">
            {t.noProductsFound}
          </h2>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;

export async function getServerSideProps() {
  try {
    const prismaModule = await import('../lib/prisma');
    const prisma = (prismaModule as any).default || (prismaModule as any).prisma;

    const page = 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where: {}, skip, take: limit, include: { images: true, brand: true, category: true }, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({}),
    ]);

    // Serialize by stringifying/parsing to convert Date objects (including nested ones) to ISO strings
    const safeItems = JSON.parse(JSON.stringify(items));

    return { props: { initialProducts: { items: safeItems, total, page, limit } } };
  } catch (error) {
    console.error('getServerSideProps products error:', error);
    return { props: { initialProducts: { items: [], total: 0, page: 1, limit: 20 } } };
  }
}
