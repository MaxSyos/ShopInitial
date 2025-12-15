import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLanguage } from "../../hooks/useLanguage";
import { useWindowDimensions } from "../../hooks/useWindowDimensions";
import Link from "next/link";
import ProductCard from "../UI/card/Card";
import { IProduct } from "../../lib/types/products";
import SectionTitle from "../UI/SectionTitle";
import { productService } from "../../lib/services/productService";
import { mapBackendProductsToIProducts } from "../../utilities/mapBackendProduct";
import { newestProductsActions } from "../../store/newestProduct-slice";
import { AppDispatch } from "../../store";

const Newest: React.FC = () => {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);

  // determine columns based on exact widths requested
  const cols = width >= 1280 ? 4 : width >= 935 ? 3 : width >= 715 ? 2 : width >= 470 ? 1 : 1;
  // show up to 4 rows
  const numProductToShow = cols * 4;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Buscar todos os produtos (endpoint público). Usamos um limit alto
        // para obter todos os produtos para renderização no componente.
        // Não requer autorização.
        const resp = await productService.getProducts({ page: 1, limit: 1000 });
        let items = resp?.items || [];
        console.log('Newest - productService.getProducts resp:', { resp });

        // fallback: se a lista vier vazia por qualquer razão, tentar endpoint específico de newest
        if ((!items || items.length === 0)) {
          try {
            console.warn('Newest - no items from getProducts, trying getNewestProducts fallback');
            const fallback = await productService.getNewestProducts(100);
            items = fallback || [];
            console.log('Newest - fallback getNewestProducts items count:', items.length);
          } catch (fbErr) {
            console.warn('Newest - fallback getNewestProducts failed', fbErr);
          }
        }
        // fetch active offers and merge discount into products
        let offers: any[] = [];
        try {
          const offResp = await fetch('/api/content/offers');
          if (offResp.ok) {
            const offJson = await offResp.json();
            offers = offJson?.items || [];
          }
        } catch (e) {
          console.warn('Newest - could not fetch offers', e);
        }

        // Apply offers to items (match by productId). Check isActive and date range
        const now = new Date();
        const itemsWithOffers = items.map((p: any) => {
          const offer = offers.find((o: any) => o.productId === p.id && o.isActive);
          if (offer) {
            const start = offer.startDate ? new Date(offer.startDate) : null;
            const end = offer.endDate ? new Date(offer.endDate) : null;
            const valid = (!start || start <= now) && (!end || end >= now);
            if (valid) {
              return { ...p, discount: offer.discount, isOffer: true };
            }
          }
          return { ...p, discount: (p as any).discount ?? null, isOffer: (p as any).isOffer ?? false };
        });

        const mapped: IProduct[] = mapBackendProductsToIProducts(itemsWithOffers as any);
        if (!mounted) return;
        setProducts(mapped);
        // também atualiza o slice global para consistência
        dispatch(newestProductsActions.addProducts(mapped));
      } catch (err: any) {
        console.error('Newest - erro ao carregar produtos:', err?.message || err);
        if (!mounted) return;
        setError(err?.message || 'Erro ao carregar produtos');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [dispatch, numProductToShow]);

  if (loading && products.length === 0) {
    return (
      <div className="mx-auto my-4 md:my-8 flex flex-col xl:max-w-[2130px]">
        <SectionTitle title="newest" />
        <div className="grid gap-6 sm:gap-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: numProductToShow }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-700 h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto my-4 md:my-8 flex flex-col xl:max-w-[2130px]">
        <SectionTitle title="newest" />
        <div className="text-center text-red-400">{error}</div>
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <div className="mx-auto my-4 md:my-8 flex flex-col xl:max-w-[2130px]">
      <SectionTitle title="newest" />

      <div className="grid gap-6 sm:gap-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {products.slice(0, numProductToShow).map((product: IProduct) => (
          <ProductCard key={product.slug?.current || product.id || product.name} product={product} />
        ))}
      </div>

      <div className="text-center">
        <Link href="/products">
          <a className="inline-block py-3 px-8 md:px-12 mt-4 text-sm md:text-base bg-palette-primary text-palette-side rounded-xl shadow-lg">
            {t.seeAllProducts}
          </a>
        </Link>
      </div>
    </div>
  );
};

export default Newest;


