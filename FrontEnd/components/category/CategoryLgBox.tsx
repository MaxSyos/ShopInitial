import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useLanguage } from "../../hooks/useLanguage";

interface Props {
  name: string;
  title: string;
  description: string;
  styles: {
    backgroundColor: string;
    flexDirection: string;
    paddingInline: string;
    paddingBlock: string;
    textAlign?: string;
    gridColumn: string;
  };
  isCentered?: boolean;
  href: string;
  imgSrc: string;
  imgWidth: number;
  imgHeight: number;
}
const CategoryLgBox: React.FC<Props> = ({
  name,
  title,
  description,
  styles,
  isCentered,
  href,
  imgSrc,
  imgWidth,
  imgHeight,
}) => {
  const { t } = useLanguage();

  return (
    <div
      key={title}
      className={`flex ${isCentered ? 'justify-center' : 'justify-around'} items-center rounded-lg shadow-lg overflow-hidden h-full min-h-40`}
      style={styles as React.CSSProperties}
    >
      <div className={`${isCentered ? 'text-center' : 'flex-1'}`}>
        <h3 className="text-lg lg:text-xl 2xl:text-2xl font-bold">{t[`${title}`]}</h3>
        <p className="text-sm mt-2 opacity-90">{t[`${description}`]}</p>
        <Link href={href}>
          <a className="inline-block py-2 px-4 2xl:px-6 mt-4 bg-palette-primary hover:scale-105 transition-transform duration-300 shadow-xl text-sm 2xl:text-base text-palette-side rounded-lg font-semibold">
            {t.seeAllProducts}
          </a>
        </Link>
      </div>
      <Image
        src={imgSrc}
        alt={name}
        width={imgWidth}
        height={imgHeight}
        className="drop-shadow-lg hover:scale-95 transition-transform duration-300 flex-shrink-0"
      />
    </div>
  );
};

export default CategoryLgBox;
