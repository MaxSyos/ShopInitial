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
  const category = product.category && product.category.length > 0 ? product.category[0] : "categoria";
  const subCategory = product.subCategory ? product.subCategory : "all";
  const titleSlug = product.name ? product.name.replace(/\s+/g, "-").toLowerCase() : product.slug?.current || product.id;
  const slug = product.slug?.current || product.id;
  const productUrl = `/${category}/${subCategory}/${titleSlug}/${slug}`;

  const imageUrl = Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : "/images/default-product.jpg";

  return (
    <div className="shadow-lg bg-palette-card rounded-lg flex flex-col relative w-full h-full overflow-hidden transition-all hover:shadow-xl">
      <Link href={productUrl}>
        <a className="flex flex-col w-full h-full relative">
          {/* Área da imagem - proporção quadrada compacta */}
          <div className="w-full bg-slate-400/20 relative flex items-center justify-center aspect-square overflow-hidden rounded-t-lg">
            {/* Badge de desconto - posicionado dentro, canto superior direito */}
            {product?.discount ? (
              <span className="absolute top-2 right-2 z-20">
                <Image
                  src="/images/discount-icon/discount.webp"
                  width={45}
                  height={45}
                  alt="discount-icon"
                  className="drop-shadow-lg"
                />
              </span>
            ) : null}

            {/* Imagem do produto */}
            <Image
              src={imageUrl}
              width={250}
              height={250}
              alt={product.name}
              className="object-contain hover:scale-105 transition-transform duration-300 ease-in-out p-2"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Seção de informações do produto */}
          <div className="flex flex-col flex-grow w-full px-3 py-4 gap-3">
            {/* Avaliação em estrelas - pequenas */}
            <div className="flex items-center justify-center gap-0.5">
              {[...Array(5)].map((_, index) => (
                <span
                  key={index}
                  className={`text-xs ${index < (product.starRating || 0) ? "text-yellow-400" : "text-gray-400"}`}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Título do produto - grande e destacado */}
            <h3 className="text-lg md:text-xl text-center text-palette-mute font-bold line-clamp-2 leading-tight">
              {product.name}
            </h3>

            {/* Preço - destaque final */}
            <div className="mt-auto">
              <ProductPrice price={product.price} discount={product.discount} />
            </div>
          </div>
        </a>
      </Link>

      {/* Ações (favorito, compartilhar, carrinho) */}
      <CardActions product={product} />
    </div>
  );
};

export default Card;
