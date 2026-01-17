import React from "react";
import { IProduct } from "../../lib/types/products";
import Breadcrumb from "../UI/Breadcrumb";
import ImageSection from "./ImageSection";
import DetailsSection from "./DetailsSection";
import Benefits from "../Benefits";
import SimilarProducts from "./SimilarProducts";

interface Props {
  product: IProduct | null | undefined;
  products: IProduct[] | null | undefined;
}
const ProductDetails: React.FC<Props> = ({ product, products }) => {
  // Log para depuração

  if (!product) {
    return <div className="text-center py-12">Carregando produto...</div>;
  }
  const similarProductsList = Array.isArray(products)
    ? products.filter(
        (similarProduct) =>
          similarProduct &&
          similarProduct.slug &&
          product &&
          product.slug &&
          similarProduct.slug.current !== product.slug.current
      ).slice(0, 10)
    : [];

  return (
    <div className="flex flex-col">
      <Breadcrumb productName={product.name} />
      <div className="w-full xl:max-w-[2100px] mx-auto px-4 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-start mt-8 relative">
          <div className="flex justify-center">
            <ImageSection imgArray={product.image} product={product} />
          </div>
          <div className="w-full">
            <DetailsSection product={product} />
          </div>
        </div>
        <div className="border-2 my-8">
          <Benefits />
        </div>
        <SimilarProducts products={similarProductsList} />
      </div>
    </div>
  );
};

export default ProductDetails;
