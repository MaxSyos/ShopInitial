import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProductDetails from "../../../../../components/productDetails";
import mapBackendProduct from "../../../../../utilities/mapBackendProduct";
import { IProduct } from "../../../../../lib/types/products";
import axios from "axios";

const ProductDetailsPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug || typeof slug !== "string") return;
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${slug}`
        );
        if (res.data) {
          setProduct(mapBackendProduct(res.data));
        } else {
          setProduct(null);
          setError("Produto não encontrado.");
        }
      } catch (err) {
        setProduct(null);
        setError("Produto não encontrado.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // Proteção extra: só renderiza algo se o slug estiver definido corretamente
  if (!slug || typeof slug !== "string") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-palette-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return <div>Produto não encontrado.</div>;
  }

  return (
    <div>
      <ProductDetails product={product} products={[]} />
    </div>
  );
};

export default ProductDetailsPage;
