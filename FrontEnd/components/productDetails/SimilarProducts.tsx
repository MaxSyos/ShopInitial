import React from "react";
import { IProduct } from "../../lib/types/products";
import CarouselBox from "../UI/CarouselBox/CarouselBox";
import ProductCard from "../UI/card/Card";

interface Props {
  products: IProduct[];
}
const SimilarProducts: React.FC<Props> = ({ products }) => {
  return (
    <div>
      <CarouselBox title="similarProducts" full={true}>
        {(products || []).map((product) => (
          <ProductCard key={product?.slug?.current || product?.id || product?.name} product={product} />
        ))}
      </CarouselBox>
    </div>
  );
};

export default SimilarProducts;
