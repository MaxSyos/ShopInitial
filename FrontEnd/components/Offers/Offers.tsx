import React from "react";
import CarouselBox from "../UI/CarouselBox/CarouselBox";
import { useSelector } from "react-redux";
import { IProduct } from "../../lib/types/products";
import CarouselBoxCard from "../UI/CarouselBox/CarouselBoxCard";
import { useLanguage } from "../../hooks/useLanguage";

const Offers = () => {
  const { t } = useLanguage();
  const offerProducts = useSelector(
    (state: any) => state.specialOfferProductsList.specialOfferProducts
  );

  if (!offerProducts || offerProducts.length === 0) {
    return null;
  }

  return (
    <div className="md:mt-10 w-full xl:max-w-[2100px] mx-auto">
      <CarouselBox title="offers" className="bg-offersBG" href="/offers">
        {offerProducts.map((product: IProduct) => (
          <CarouselBoxCard key={product.id || product.name} product={product} />
        ))}
      </CarouselBox>
    </div>
  );
};

export default Offers;
