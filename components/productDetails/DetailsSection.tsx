import React from "react";
import StarRatingComponent from "react-star-rating-component";
import { useLanguage } from "../../hooks/useLanguage";
import { IProduct } from "../../lib/types/products";
import CallToAction from "./CallToAction";

interface Props {
  product: IProduct;
}
const DetailsSection: React.FC<Props> = ({ product }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-palette-card md:bg-transparent w-[100vw] md:w-full lg:flex-1 px-5 lg:pl-8 flex-grow self-center lg:self-start mt-8 md:mt-0 !-mx-[1rem] lg:ltr:ml-4 lg:rtl:mr-4 py-5 md:py-0 rounded-tl-[4rem] rounded-tr-[3rem] flex flex-col z-10">
      <h2 className="text-palette-mute whitespace-normal text-center rtl:md:text-right ltr:md:text-left text-2xl md:text-3xl lg:text-4xl font-bold">
        {product.name}
      </h2>
      <hr className="mt-1 hidden md:block" />
      <div className="flex flex-col gap-6 relative">
        <div className="flex-grow mt-6">
          <div className="flex items-center self-center">
            {/* @ts-ignore */}
            <StarRatingComponent
              name="product_rate"
              starCount={5}
              value={5}
            />
            <p className="text-sm text-palette-mute rtl:mr-2 ltr:ml-2">
              {/* {product.starRating} {t.stars} */}
            </p>
          </div>
          <h3 className="text-lg mt-2">{t.details}</h3>
          <div className="mt-4 space-y-3">
            {/* Marca primeiro - em sua própria linha */}
            <div className="flex flex-col">
              <h5 className="text-palette-mute text-sm font-medium py-1">Marca:</h5>
              <p className="text-base text-palette-text" style={{ direction: "ltr" }}>{product.brand}</p>
            </div>
            
            {/* Descrição do banco de dados - quebra em múltiplas linhas */}
            {product.description && (
              <div className="flex flex-col">
                <h5 className="text-palette-mute text-sm font-medium py-1">{t.description || "Descrição"}:</h5>
                <p className="text-base text-palette-text leading-relaxed break-words" style={{ direction: "ltr" }}>
                  {product.description}
                </p>
              </div>
            )}
            
            {/* Detalhes técnicos, se existirem */}
            {product.details && product.details.length > 0 && (
              <div className="flex flex-col gap-2">
                {product.details.map((detail, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    {Object.keys(detail).map((key) => {
                      const typedKey = key as keyof typeof detail;
                      const detailsValue = Array.isArray(detail[typedKey])
                        ? [...(detail[typedKey] as any[])].join(" - ")
                        : detail[typedKey] === true
                        ? t.true
                        : detail[typedKey] === false
                        ? t.false
                        : detail[typedKey];
                      return (
                        <div className="flex flex-col" key={key + idx}>
                          <h5 className="text-palette-mute text-sm font-medium py-1">{t[key]}:</h5>
                          <p className="text-base text-palette-text" style={{ direction: "ltr" }}>
                            {detailsValue}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <CallToAction product={product} />
      </div>
    </div>
  );
};

export default DetailsSection;
