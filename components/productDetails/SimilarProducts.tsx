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
          <div key={product?.slug?.current || product?.id || product?.name} className="mx-2">
            <ProductCard product={product} />
          </div>
        ))}
      </CarouselBox>
    </div>
  );
};

export default SimilarProducts;
