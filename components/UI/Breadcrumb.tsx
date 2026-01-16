import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { IBreadcrumb } from "../../lib/types/breadcrumb";
import { useLanguage } from "../../hooks/useLanguage";
import { BsShop } from "react-icons/bs";

const convertBreadcrumb = (str: string) => {
  return str
    .replace(/-/g, " ")
    .replace(/oe/g, "ö")
    .replace(/ae/g, "ä")
    .replace(/ue/g, "ü");
};

interface BreadcrumbProps {
  categoryName?: string;
  subCategoryName?: string;
  productName?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ categoryName, subCategoryName, productName }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const breadcrumbs: IBreadcrumb[] = [
    { breadcrumb: t.mainPage, href: "/" },
  ];
  if (categoryName) {
    breadcrumbs.push({ breadcrumb: categoryName, href: router.asPath.split("/").slice(0, 3).join("/") });
  }
  if (subCategoryName) {
    breadcrumbs.push({ breadcrumb: subCategoryName, href: router.asPath.split("/").slice(0, 4).join("/") });
  }
  if (productName) {
    breadcrumbs.push({ breadcrumb: productName, href: router.asPath });
  }

  return (
    <div className="flex text-[11px] sm:text-sm text-palette-mute dark:text-slate-300 mt-4 md:-mt-4 mb-3 md:my-none overflow-auto whitespace-nowrap">
      <nav className="flex py-3 px-2 sm:px-5 leading-6">
        <ul className="flex items-center space-x-1 md:space-x-3">
          {breadcrumbs.map((breadcrumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <li className="flex items-center" key={breadcrumb.href}>
                {i !== 0 && <span>/</span>}
                {isLast ? (
                  <span className="inline-block px-2 font-semibold">{breadcrumb.breadcrumb}</span>
                ) : (
                  <Link href={breadcrumb.href}>
                    <a className="inline-block px-2">
                      {breadcrumb.breadcrumb}
                    </a>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Breadcrumb;
