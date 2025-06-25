import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProductDetails from "../../../../../components/productDetails";
import { useProducts } from "../../../../../hooks/useProducts";
import mapBackendProduct from "../../../../../utilities/mapBackendProduct";
import { IProduct } from "../../../../../lib/types/products";

const ProductDetailsPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { selectedProduct, products, loadProductById, loading } = useProducts();
  const items = products.items;
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug && typeof slug === "string") {
      loadProductById(slug).then((result: any) => {
        if (!result && !selectedProduct) setNotFound(true);
        else setNotFound(false);
      });
    }
  }, [slug]);

  if (loading) {
    return <div>Carregando produto...</div>;
  }

  // Mapeia o produto selecionado e a lista para o formato IProduct
  const mappedProduct: IProduct | null = selectedProduct ? mapBackendProduct(selectedProduct) : (items[0] ? mapBackendProduct(items[0]) : null);
  const mappedItems: IProduct[] = items.map(mapBackendProduct);

  if (notFound || !mappedProduct) {
    return <div>Produto não encontrado.</div>;
  }

  // Exibe normalmente mesmo se não houver subcategoria
  return (
    <div>
      <ProductDetails product={mappedProduct} products={mappedItems} />
    </div>
  );
};

export default ProductDetailsPage;
