import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { GoSearch } from "react-icons/go";
import { useLanguage } from "../../hooks/useLanguage";
import { IProduct } from "../../lib/types/products";

interface Product {
  id?: string;
  _id?: string;
  name: string;
  price?: number;
  images?: Array<{ url: string; alt?: string }>;
  slug?: { current?: string } | string;
  category?: any;
  subCategory?: string;
  category?: any;
  subCategory?: string;
}

const SearchBar = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Buscar produtos em tempo real
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchInput.trim().length > 1) {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/products/search?q=${encodeURIComponent(searchInput)}&limit=6`
          );
          const data = await response.json();
          if (data.success) {
            setResults(data.data || []);
            setShowResults(true);
          }
        } catch (error) {
          console.error("Error searching products:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const slugify = (s?: string) => (s ? s.replace(/\s+/g, "-").toLowerCase() : "");

  const buildProductUrl = (product: Product) => {
    const id = product._id || product.id || (typeof product.slug === 'string' ? product.slug : product.slug?.current) || '';

    // category can be an object (prisma) or array (frontend), or string
    let category = 'categoria';
    if (Array.isArray(product.category) && product.category.length > 0) {
      category = product.category[0];
    } else if (product.category && typeof product.category === 'object' && product.category.name) {
      category = product.category.name;
    } else if (typeof product.category === 'string') {
      category = product.category;
    }

    const subCategory = (product as any).subCategory || 'all';
    const titleSlug = product.name ? slugify(product.name) : id;
    const slug = typeof product.slug === 'string' ? product.slug : product.slug?.current || id;

    return `/${encodeURIComponent(category)}/${encodeURIComponent(subCategory)}/${encodeURIComponent(titleSlug)}/${encodeURIComponent(slug)}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput)}`);
      setShowResults(false);
      setSearchInput("");
    }
  };

  const handleProductClick = (product: Product) => {
    // Construir o path estruturado: /{category}/{subCategory}/{titleSlug}/{slug}
    const url = buildProductUrl(product);
    router.push(url);
    setShowResults(false);
    setSearchInput("");
  };

  return (
    <div ref={searchRef} className="relative max-w-[50rem] w-full md:w-[90%] px-4 md:ltr:ml-4 md:rtl:mr-4">
      <form onSubmit={handleSearch}>
        <div className="rounded-lg bg-slate-600/10 dark:bg-slate-800 flex items-center">
          <GoSearch style={{ color: "rgb(156 163 175)" }} className="ml-4" />
          <input
            className="px-4 py-2 md:py-3 bg-transparent outline-none w-full"
            type="search"
            placeholder={`${t.search}`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => {
              if (searchInput.trim().length > 1) {
                setShowResults(true);
              }
            }}
          />
        </div>
      </form>

      {/* Dropdown de resultados */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">{t.loading || "Carregando..."}</div>
          ) : results.length > 0 ? (
            <>
              <div className="flex gap-2 p-4 overflow-x-auto">
                {results.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          {t.noImage || "Sem imagem"}
                        </div>
                      )}
                    </div>
                    <p className="text-xs mt-1 text-center truncate w-24 dark:text-gray-300">
                      {product.name}
                    </p>
                    <p className="text-xs font-semibold text-palette-primary text-center">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(product.price)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t dark:border-slate-700 text-center">
                <button
                  onClick={handleSearch}
                  className="text-sm text-palette-primary hover:underline"
                >
                  {t.viewAllResults || "Ver todos os resultados"}
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {t.noResults || "Nenhum produto encontrado"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

