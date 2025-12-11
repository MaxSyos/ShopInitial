import type { NextPage } from "next";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useDispatch } from "react-redux";
import { useProducts } from "../hooks/useProducts";
import { specialOfferProductsActions } from "../store/specialOfferProducts-slice";
import { newestProductsActions } from "../store/newestProduct-slice";
import { mapBackendProductsToIProducts } from "../utilities/mapBackendProduct";

import Benefits from "../components/Benefits";
import Carousel from "../components/carousel";
const Offers = dynamic(() => import("../components/Offers/Offers"));
const Category = dynamic(() => import("../components/category/Category"));
const Newest = dynamic(() => import("../components/newest/Newest"));
const Brands = dynamic(() => import("../components/brands"));
const Banners = dynamic(() => import("../components/banners"), { ssr: false });

const Home: NextPage = () => {
  const dispatch = useDispatch();
  const { products, newestProducts, loadProducts, loadNewestProducts } = useProducts();

  useEffect(() => {
    // Carrega todos os produtos para ofertas
    loadProducts();
    // Carrega os produtos mais novos - agora feito direto no componente Newest
    // loadNewestProducts(10); // REMOVIDO - Newest component agora faz fetch direto
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    console.log('🔍 Index - newestProducts:', newestProducts);
    console.log('🔍 Index - products:', products);
  }, [newestProducts, products]);
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      // Mapeia produtos do backend para o formato do frontend
      const mappedProducts = mapBackendProductsToIProducts(products as any);
      // Filtra produtos com desconto para ofertas
      const offersProducts = mappedProducts.filter((item) => item.discount);
      dispatch(specialOfferProductsActions.addProducts(offersProducts));
    }
  }, [dispatch, products]);

  useEffect(() => {
    if (newestProducts.length > 0) {
      // Mapeia produtos novos do backend para o formato do frontend
      const mappedNewestProducts = mapBackendProductsToIProducts(newestProducts as any);
      dispatch(newestProductsActions.addProducts(mappedNewestProducts));
    }
  }, [dispatch, newestProducts]);

  return (
    <div>
      <Carousel />
      <Benefits />
      <Offers />
      <Category />
      <Newest />
      <Banners />
      <Brands />
    </div>
  );
};

export default Home;

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
