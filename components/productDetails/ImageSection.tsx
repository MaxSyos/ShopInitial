import Image from "next/image";
import React, { useState } from "react";
import { urlFor } from "../../lib/client";
import { IProduct, TImage } from "../../lib/types/products";
import ProductPageActions from "./ProductPageActions";

interface Props {
  imgArray: TImage[];
  product: IProduct;
}
const ImageSection: React.FC<Props> = ({ imgArray, product }) => {
  const [selectedImg, setSelectedImg] = useState(0);
  function onClickHandler(index: number) {
    setSelectedImg(index);
  }
  return (
    <div className="flex flex-col items-center rounded-lg w-full">
      <ProductPageActions product={product} />
      <div className="flex flex-col items-center w-full gap-4">
        <div className="flex flex-grow w-full justify-center">
          <Image
            src={
              (typeof imgArray[selectedImg] === "string"
                ? imgArray[selectedImg]
                : urlFor(imgArray[selectedImg]).url()) as string
            }
            alt="product img"
            width={500}
            height={500}
            className="object-contain md:drop-shadow-xl dark:bg-palette-card max-w-full h-auto"
          />
        </div>

        <div className="flex mt-2 md:p-4 w-full overflow-auto gap-2 justify-center">
          {imgArray.map((imgItem: any, index: number) => {
            return (
              <div
                key={imgItem._key || imgItem}
                className={`flex items-center justify-center p-2 md:p-4 rounded-lg border-2 transition-all duration-300 ease-in-out min-w-[80px] cursor-pointer ${
                  index === selectedImg
                    ? "border-palette-primary shadow-md bg-palette-card/60"
                    : "border-transparent hover:border-palette-border"
                }`}
                onClick={() => onClickHandler(index)}
              >
                <Image
                  src={
                    typeof imgItem === "string"
                      ? imgItem
                      : urlFor(imgItem).url()
                  }
                  width={70}
                  height={70}
                  alt="product img"
                  className="object-contain"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImageSection;
