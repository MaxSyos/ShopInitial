import { useEffect } from "react";
import { useProducts } from "../hooks/useProducts";
import ProductList from "../components/productList/ProductList";
import { mapBackendProductsToIProducts } from '../utilities/mapBackendProduct';

const NewestProduct = () => {
  const { newestProducts, loadNewestProducts, loading } = useProducts();

  const mappedProducts = mapBackendProductsToIProducts(newestProducts as any);

  useEffect(() => {
    loadNewestProducts(20); // ou o limite desejado
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex flex-wrap">
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <ProductList productList={mappedProducts} />
      )}
    </div>
  );
};

export default NewestProduct;
