import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useProducts } from "../../hooks/useProducts";
import ProductList from "../../components/productList/ProductList";
import { mapBackendProductsToIProducts } from "../../utilities/mapBackendProduct";

const CategoryPage: NextPage = () => {
  const router = useRouter();
  const { category } = router.query;
  const { products: { items }, loadProductsByCategory, loading } = useProducts();

  const mappedProducts = items ? mapBackendProductsToIProducts(items) : [];

  useEffect(() => {
    if (category && typeof category === "string") {
      loadProductsByCategory(category);
    }
    // eslint-disable-next-line
  }, [category]);

  return (
    <div>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <ProductList productList={mappedProducts} />
      )}
    </div>
  );
};

export default CategoryPage;
