import React from "react";
import { categorySmContent } from "../../mock/category-sm";
import CategorySmBox from "./CategorySmBox";
import { useCategoryGrid } from "../../hooks/useCategoryGrid";
import CategoryLgBox from "./CategoryLgBox";
import SectionTitle from "../UI/SectionTitle";

const Category = () => {
  const { categories, loading, error } = useCategoryGrid();

  return (
    <div className="flex flex-col items-center my-4 md:my-8">
      <SectionTitle title={"CategoryOfGoods"} />

      {/* 📱 sm and md break point */}
      <div className="flex flex-wrap justify-around items-center lg:hidden">
        {categorySmContent.map((categoryItem) => {
          return (
            <CategorySmBox
              bgc={categoryItem.bgc}
              imgSrc={categoryItem.imgSrc}
              categoryTitle={categoryItem.categoryTitle}
              href={categoryItem.href}
              key={categoryItem.categoryTitle}
            />
          );
        })}
      </div>

      {/* 💻lg break point */}
      <div className="hidden lg:grid gap-4 grid-cols-12 w-full xl:max-w-[2100px] mx-auto">
        {loading ? (
          <div className="col-span-12 flex justify-center items-center h-40">
            <p className="text-lg text-gray-500">Carregando categorias...</p>
          </div>
        ) : error ? (
          <div className="col-span-12 flex justify-center items-center h-40">
            <p className="text-lg text-red-500">Erro ao carregar categorias</p>
          </div>
        ) : (
          categories.map(
            ({
              name,
              title,
              description,
              styles,
              href,
              imgSrc,
              imgWidth,
              imgHeight,
              isCentered,
            }) => {
              return (
                <CategoryLgBox
                  key={name}
                  name={name}
                  title={title}
                  description={description || ''}
                  styles={styles}
                  href={href || '/'}
                  imgSrc={imgSrc || ''}
                  imgWidth={imgWidth}
                  imgHeight={imgHeight}
                  isCentered={isCentered}
                />
              );
            }
          )
        )}
      </div>
    </div>
  );
};

export default Category;
