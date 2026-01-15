import React from "react";
import Link from "next/link";
import { useLanguage } from "../../../hooks/useLanguage";
import { NextArrow, PrevArrow } from "./CarouselBoxArrows";
import Slider from "react-slick";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

interface Props {
  title: string;
  className?: string;
  href?: string;
  children?: React.ReactNode;
  full?: boolean;
}
const CarouselBox: React.FC<Props> = ({
  title,
  className,
  children,
  href,
  full,
}) => {
  const { t } = useLanguage();

  const settings = {
    className: ` px-4 ${full ? "bg-palette-fill" : "bg-[#37bccef9]"}`,
    infinite: true,
    speed: 600,
    centerPadding: full ? "100px" : "60px",
    slidesToShow: full ? 3 : 5,
    slidesToScroll: full ? 4 : 5,
    // initialSlide: 0,
    swipeToSlide: true,
    // rtl: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1324,
        settings: {
          slidesToShow: full ? 3 : 4,
          slidesToScroll: full ? 3 : 4,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: full ? 2 : 3,
          slidesToScroll: full ? 2 : 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: full ? 2 : 2,
          slidesToScroll: full ? 2 : 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div
      className={`w-[100%] mx-auto my-8 flex rounded-md ${
        full ? "flex-col" : "bg-[#37bccef9]"
      }`}
    >
      <div
        className={`flex flex-col items-center justify-around flex-grow text-sm sm:text-base  bg-cover bg-no-repeat bg-center rounded-md backdrop-blur-md ${className}`}
      >
        <h2
          className={`text-lg  sm:text-xl font-bold ${
            full
              ? "text-palette-base self-start"
              : "text-palette-primary text-center"
          } `}
        >
          {t[`${title}`]}
        </h2>
        {!full ? (
          <Link href={`/offers`}>
            <a className="text-palette-primary/80 dark:text-rose-300 text-sm font-bold py-2 px-6 -mb-4 shadow-lg block rounded-lg backdrop-filter backdrop-blur-[10px] bg-palette-card/80">
              {t.seeAll}
            </a>
          </Link>
        ) : null}
      </div>
      <div
        className={`relative ${
          full ? "w-full mt-4" : "w-[55%] sm:w-[75%] md:w-[85%]"
        }`}
      >
        <Slider {...settings}>{children}</Slider>
        <div>
          <div className="absolute top-[45%] right-4 md:right-1 shadow-lg rounded-full bg-palette-card p-1 drop-shadow-lg text-[0.8rem] md:text-[1.8rem]">
            <HiOutlineChevronRight style={{ color: "gray" }} />
          </div>
          <div className="absolute top-[45%] left-4 md:-left-1 shadow-lg rounded-full bg-palette-card p-1 drop-shadow-lg text-[0.8rem] md:text-[1.8rem]">
            <HiOutlineChevronLeft style={{ color: "gray" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselBox;
