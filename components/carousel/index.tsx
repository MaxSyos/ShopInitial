import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import Slide from "./Slide";
import { sliderContent } from "../../mock/slider";
import { NextArrow, PrevArrow } from "./Arrows";
import { HiOutlineChevronRight, HiOutlineChevronLeft } from "react-icons/hi";

type CarouselItem = {
  id: string | number;
  title?: string | null;
  description?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  isActive?: boolean;
};

const Carousel = () => {
  const [items, setItems] = useState<CarouselItem[] | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchCarousel() {
      try {
        const res = await fetch(`/api/content/carousel`);
        if (!res.ok) throw new Error("failed to fetch carousel");
        const data = await res.json();
        const images: CarouselItem[] = (data.items || []).filter((it: any) => it.isActive !== false).map((it: any) => ({
          id: it.id || it.ID || it.order || Math.random(),
          title: it.title || "",
          description: it.description || "",
          imageUrl: it.imageUrl || it.url || "",
          linkUrl: it.linkUrl || "/",
          isActive: it.isActive,
        }));

        if (mounted && images.length > 0) setItems(images);
      } catch (err) {
        // fallback to mock data
        if (mounted) setItems(sliderContent as any);
      }
    }

    fetchCarousel();

    return () => {
      mounted = false;
    };
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    cssEase: "linear",
    nextArrow: <NextArrow to="next" />,
    prevArrow: <PrevArrow to="prev" />,
    appendDots: (dots: string) => (
      <div className="bg-transparent !pb-[40px]">
        <ul> {dots} </ul>
      </div>
    ),
  };

  const slides = (items || sliderContent).map((slideContent: any, idx: number) => {
    // Slide expects props: title, description, bgImg, url
    const bgImg = slideContent.imageUrl ? `url('${slideContent.imageUrl}')` : slideContent.bgImg || "";
    return (
      <Slide
        key={slideContent.id || slideContent.ID || idx}
        title={slideContent.title || slideContent.titleKey || ""}
        description={slideContent.description || slideContent.descriptionKey || ""}
        bgImg={bgImg}
        url={slideContent.linkUrl || slideContent.url || "/"}
      />
    );
  });

  return (
    <div className="relative">
      {/* @ts-ignore */}
      <Slider {...settings}>{slides}</Slider>
      <>
        <div className="absolute top-1/2 right-4 md:right-3 lg:right-8 shadow-lg rounded-full bg-palette-card/80 p-1 drop-shadow-lg text-[0.8rem] md:text-[1.8rem]">
          <HiOutlineChevronRight />
        </div>
        <div className="absolute top-1/2 left-4  md:left-3 lg:left-8 shadow-lg rounded-full bg-palette-card/80 p-1 drop-shadow-lg text-[0.8rem] md:text-[1.8rem]">
          <HiOutlineChevronLeft />
        </div>
      </>
    </div>
  );
};

export default Carousel;
