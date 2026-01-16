import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProductDetails from "../../../../../components/productDetails";
import mapBackendProduct from "../../../../../utilities/mapBackendProduct";
import { IProduct } from "../../../../../lib/types/products";
import { axiosInstance } from "../../../../../lib/axiosConfig";
import prisma from "../../../../../lib/prisma";
import { GetServerSideProps } from "next";

interface Props {
  initialProduct?: IProduct | null;
  similarProducts?: IProduct[];
  category?: string;
}

const ProductDetailsPage: React.FC<Props> = ({ initialProduct = null, similarProducts = [], category }) => {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState<IProduct | null>(initialProduct || null);
  const [similar, setSimilar] = useState<IProduct[]>(similarProducts);
  const [loading, setLoading] = useState<boolean>(initialProduct ? false : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProduct(initialProduct);
    setSimilar(similarProducts);
  }, [initialProduct, similarProducts]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug || typeof slug !== "string") return;
      if (initialProduct && initialProduct.slug?.current === slug) return; // already have the correct product
      setLoading(true);
      setError(null);
      console.log('ProductDetailsPage: fetching product for slug=', slug);
      try {
        const res = await axiosInstance.get(`/products/${slug}`);
        console.log('ProductDetailsPage: fetch response', res && res.data);
        if (res.data) {
          const mapped = mapBackendProduct(res.data);
          setProduct(mapped);
          // Buscar similares
          try {
            const similarRes = await axiosInstance.get(`/products?category=${mapped.category[0]}&limit=10`);
            const similars = similarRes.data.filter((p: any) => p.slug !== slug).map(mapBackendProduct);
            setSimilar(similars);
          } catch (simErr) {
            console.warn('Error fetching similar products', simErr);
          }
        } else {
          setProduct(null);
          console.warn('ProductDetailsPage: produto nao encontrado, response had no data', res);
          setError("Produto não encontrado.");
        }
      } catch (err) {
        console.error('ProductDetailsPage: error fetching product', err, (err as any)?.response?.status, (err as any)?.response?.data);
        setProduct(null);
        setError("Produto não encontrado.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, initialProduct]);

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
    <div key={slug}>
      <ProductDetails product={product} products={similar} />
    </div>
  );
};

export default ProductDetailsPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, category } = context.query;
  if (!slug || Array.isArray(slug)) {
    return { props: { initialProduct: null, similarProducts: [], category: null } };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: String(slug) },
      include: { images: true, brand: true, category: true, reviews: true },
    });

    if (!product) {
      return { props: { initialProduct: null } };
    }

    // buscar ofertas ativas para este produto e mesclar desconto
    try {
      const offers = await prisma.offer.findMany({ where: { productId: product.id, isActive: true } });
      const now = new Date();
      const validOffer = offers.find((o: any) => {
        const start = o.startDate ? new Date(o.startDate) : null;
        const end = o.endDate ? new Date(o.endDate) : null;
        const valid = (!start || start <= now) && (!end || end >= now);
        return valid;
      });
      if (validOffer) {
        // anexa o desconto diretamente no objeto do produto antes do mapeamento
        (product as any).discount = validOffer.discount;
        (product as any).isOffer = true;
      }
    } catch (offerErr) {
      console.warn('getServerSideProps: erro ao buscar ofertas para produto', offerErr);
    }

    const mapped = mapBackendProduct(product as any);

    // Buscar produtos similares (mesma categoria, excluindo o atual)
    let similarProducts: IProduct[] = [];
    try {
      const similar = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
        },
        include: { images: true, brand: true, category: true, reviews: true },
        take: 10,
      });
      similarProducts = similar.map((p: any) => mapBackendProduct(p));
    } catch (similarErr) {
      console.warn('getServerSideProps: erro ao buscar produtos similares', similarErr);
    }

    return { props: { initialProduct: mapped, similarProducts, category } };
  } catch (error) {
    console.error("getServerSideProps product fetch error:", error);
    return { props: { initialProduct: null, similarProducts: [], category: null } };
  }
};
