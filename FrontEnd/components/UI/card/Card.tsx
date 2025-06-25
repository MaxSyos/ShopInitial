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
  // Monta a URL amigável baseada nas categorias e id
  const categories = product.category.length >= 3
    ? product.category
    : [...product.category, ...Array(3 - product.category.length).fill('categoria')];
  const productUrl = `/${categories[0]}/${categories[1]}/${categories[2]}/${product.id}`;

  // Seleciona a primeira imagem da lista ou usa uma imagem padrão
  const imageUrl = Array.isArray(product.image) && product.image.length > 0
    ? product.image[0]
    : '/images/default-product.jpg';

  return (
    <div className="shadow-xl my-1 md:my-4 bg-palette-card rounded-xl flex flex-col relative min-h-[340px] min-w-[220px] max-w-[320px] max-h-[420px] w-full">
      <Link href={productUrl}>
        <a className="flex flex-col items-center relative w-full h-full">
          <div className="w-full relative bg-slate-400/30 px-1 md:px-6 py-2 rounded-t-xl flex flex-col justify-between items-center min-h-[300px] max-h-[300px]">
            <div className="flex items-center h-full w-full justify-center min-h-[280px] max-h-[300px]">
              <Image
                src={imageUrl}
                width={280}
                height={300}
                alt={product.name}
                className="drop-shadow-xl object-contain hover:scale-110 transition-transform duration-300 ease-in-out !py-2"
                style={{ width: '100%', height: '100%', objectFit: 'contain', aspectRatio: '280/300' }}
              />
            </div>
            {product?.discount ? (
              <span className="w-8 sm:w-auto block absolute -top-2 -right-2">
                <Image
                  src="/images/discount-icon/discount.webp"
                  width={40}
                  height={40}
                  alt="discount-icon"
                />
              </span>
            ) : null}
          </div>
          <div className="flex flex-col justify-between flex-grow w-full px-1 md:px-3 py-2 md:py-4">
            <div className="flex justify-center flex-col flex-grow overflow-hidden">
              <div className="self-center">
                {/* Estrelas de avaliação (5 no máximo) */}
                <div className="flex items-center">
                  {[...Array(5)].map((_, index) => (
                    <span
                      key={index}
                      className={`text-xl ${index < (product.starRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-sm sm:text-[12px] md:text-sm text-center text-palette-mute">
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
