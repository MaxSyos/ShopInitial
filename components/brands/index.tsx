import React from "react";
import BrandBox from "./BrandBox";
import { brandContent } from "../../mock/brand";
import Slider from "react-slick";
import SectionTitle from "../UI/SectionTitle";

const SliderComponent = Slider as any;

const Brands = () => {
  const settings = {
    infinite: true,
    speed: 6000,
    slidesToShow: 8,
    slidesToScroll: 4,
    autoplay: true,
    autoplaySpeed: 8000,
    cssEase: "linear",
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 6,
          slidesToScroll: 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 4,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
        },
      },
    ],
  };
  return (
    <div className="p-1 my-4 md:my-8 text-center">
      <SectionTitle title={"popularBrands"} />
      {/* eslint-disable-next-line react/no-children-prop */}
      <SliderComponent {...settings} children={brandContent.map((brandItem) => (
        <BrandBox
          key={brandItem.id}
          brandName={brandItem.name}
          imageSrc={brandItem.imgSrc}
        />
      ))} />
    </div>
  );
};

export default Brands;
