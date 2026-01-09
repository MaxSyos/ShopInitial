import type { NextPage } from "next";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { client } from "../../../../lib/client";
import { IProduct } from "../../../../lib/types/products";
import ProductList from "../../../../components/productList/ProductList";
import { ITitlePathsParams } from "../../../../lib/types/pagePathsParams";

const brandPage: NextPage<{
  products: IProduct[];
}> = ({ products: initialProducts }) => {
  const router = useRouter();
  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [currentKey, setCurrentKey] = useState<string>("");

  // Recarregar produtos quando a rota mudar
  useEffect(() => {
    if (!router.isReady) return;

    const { title, subCategory, category } = router.query;
    
    // Validar se os parâmetros existem e não são arrays
    if (!title || !subCategory || !category || Array.isArray(title) || Array.isArray(subCategory)) {
      return;
    }

    setLoading(true);
    
    // Criar chave única para forçar re-render do ProductList
    const newKey = `${category}-${subCategory}-${title}`;
    setCurrentKey(newKey);

    const fetchProducts = async () => {
      try {
        console.log(`Buscando produtos: category=${category}, subCategory=${subCategory}, title=${title}`);
        const productQuery = `*[_type=='product' && category[1]=="${subCategory}" && category[2]=="${title}"] | order(_createdAt desc)`;
        const fetchedProducts = await client.fetch(productQuery);
        console.log(`Produtos encontrados: ${fetchedProducts.length}`);
        setProducts(fetchedProducts || []);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router.isReady, router.query.title, router.query.subCategory, router.query.category]);

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary"></div>
      </div>
    );
  }

  return (
    <div key={currentKey}>
      <ProductList key={currentKey} productList={products} />
    </div>
  );
};

export default brandPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const query = `*[_type=="product"]{
    "category":category[0],
    "subCategory":category[1],
    "title":category[2],
  }`;
  const products = await client.fetch(query);
  const paths = products.map((product: ITitlePathsParams) => ({
    params: {
      category: product.category,
      subCategory: product.subCategory,
      title: product.title,
    },
  }));
  return {
    fallback: "blocking",
    paths,
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const title = context.params?.title;
  const subCategory = context.params?.subCategory;
  const productQuery = `*[_type=='product'&& category[1]=="${subCategory}" && category[2]=="${title}"]`;

  const products = await client.fetch(productQuery);

  return {
    props: {
      products: products,
    },
  };
};
