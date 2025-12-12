import React, { useEffect, useState } from "react";
import BannerBox from "./banner-box/BannerBox";
import { bannerContent } from "../../mock/banner";
import SectionTitle from "../UI/SectionTitle";

type BannerItem = {
  id?: string | number;
  title?: string;
  description?: string;
  buttonText?: string;
  imgSrc?: string;
  imgWidth?: number;
  imgHeight?: number;
  numberOfDiscountDate?: number;
  href?: string;
  isActive?: boolean;
};

const Banner = () => {
  const [items, setItems] = useState<BannerItem[] | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchBanners() {
      try {
        const res = await fetch("/api/content/banners");
        if (!res.ok) throw new Error("failed to fetch banners");
        const data = await res.json();
        const banners: BannerItem[] = (data.items || []).filter((b: any) => b.isActive !== false).map((b: any) => ({
          id: b.id || b.ID || b.order || Math.random(),
          title: b.title || "",
          description: b.description || "",
          buttonText: b.buttonText || "see",
          imgSrc: b.imageUrl || b.imgSrc || "",
          imgWidth: b.imgWidth || 980,
          imgHeight: b.imgHeight || 500,
          numberOfDiscountDate: b.numberOfDiscountDate || 0,
          href: b.linkUrl || b.href || "/",
        }));

        if (mounted && banners.length > 0) setItems(banners);
      } catch (err) {
        if (mounted) setItems(bannerContent as any);
      }
    }

    fetchBanners();

    return () => {
      mounted = false;
    };
  }, []);

  const list = items || bannerContent;

  return (
    <div className="flex items-center flex-col w-full xl:max-w-[2100px] my-4 md:my-8 mx-auto">
      <SectionTitle title={"specialSale"} />
      <div className="grid gap-4 grid-cols-6 lg:grid-cols-12">
        {list.map((item) => {
          const key = item.id || item.title || Math.random();
          return (
            <BannerBox
              title={item.title || ""}
              description={item.description || ""}
              numberOfDiscountDate={item.numberOfDiscountDate || 0}
              href={item.href || "/"}
              imgSrc={item.imgSrc || "/images/banners-img/home1.webp"}
              imgWidth={item.imgWidth || 980}
              imgHeight={item.imgHeight || 500}
              buttonText={item.buttonText || "see"}
              key={key}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Banner;
