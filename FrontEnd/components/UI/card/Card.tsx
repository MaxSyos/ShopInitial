import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IProduct } from "../../../lib/types/products";
import CardActions from "./CardActions";
import ProductPrice from "../ProductPrice";

interface Props {
  product: IProduct;
}

const Card: React.FC<Props> = ({ product }) => {
  console.log('🎯 Card - product discount:', product.discount);
  const category = product.category && product.category.length > 0 ? product.category[0] : "categoria";
  const subCategory = product.subCategory ? product.subCategory : "all";
  const titleSlug = product.name ? product.name.replace(/\s+/g, "-").toLowerCase() : product.slug?.current || product.id;
  const slug = product.slug?.current || product.id;
  const productUrl = `/${category}/${subCategory}/${titleSlug}/${slug}`;

  const imageUrl = Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : "/images/default-product.jpg";

  return (
    <div className="shadow-xl my-1 md:my-4 bg-palette-card rounded-xl flex flex-col relative min-h-[340px] min-w-[220px] max-w-[320px] max-h-[420px] w-full overflow-hidden">
      <Link href={productUrl}>
        <a className="flex flex-col items-center relative w-full h-full">
          <div className="w-full relative bg-slate-400/30 px-1 md:px-6 py-2 rounded-t-xl flex flex-col justify-between items-center min-h-[220px] max-h-[260px] md:min-h-[300px] md:max-h-[300px]">
            <div className="flex items-center h-full w-full justify-center min-h-[200px] max-h-[260px] md:min-h-[280px] md:max-h-[300px] relative">
              {/* Badge de desconto: posicionado dentro do container da imagem para não vazar */}
              {product?.discount !== null && product?.discount !== undefined && product?.discount > 0 ? (
                <span className="absolute top-3 right-3 z-20 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                  <Image
                    src="/images/discount-icon/discount.webp"
                    width={40}
                    height={40}
                    alt="discount-icon"
                  />
                </span>
              ) : null}

              <Image
                src={imageUrl}
                width={280}
                height={300}
                alt={product.name}
                className="drop-shadow-xl object-contain hover:scale-110 transition-transform duration-300 ease-in-out !py-2"
                style={{ width: "100%", height: "100%", objectFit: "contain", aspectRatio: "280/300" }}
              />
            </div>
          </div>

          <div className="flex flex-col justify-between flex-grow w-full px-1 md:px-3 py-2 md:py-4">
            <div className="flex justify-center -mt-4 flex-col flex-grow overflow-hidden">
              <div className="self-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, index) => (
                    <span
                      key={index}
                      className="text-xl text-yellow-400"
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="text-base sm:text-sm md:text-lg text-center text-palette-mute font-medium truncate">
                {product.name}
              </h3>
            </div>

            <ProductPrice price={product.price} discount={product.discount} />
          </div>
        </a>
      </Link>

      <CardActions product={product} />
    </div>
  );
};

export default Card;
