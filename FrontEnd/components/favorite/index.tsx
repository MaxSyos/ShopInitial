import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLanguage } from "../../hooks/useLanguage";
import { IFavoriteRootState } from "../../lib/types/favorite";
import { useRouter } from "next/router";
import { useAuth } from "../../hooks/useAuth";
import { fetchUserFavorites, removeFavoriteProduct } from "../../store/favorite-slice";
import { toast } from "react-toastify";
import { MdDelete, MdShoppingCart } from "react-icons/md";
import { addItemAndPersist } from "../../store/cart-async-slice";

const Favorites = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const favoriteItems = useSelector(
    (state: IFavoriteRootState) => state.favorite.items || []
  );
  const loading = useSelector(
    (state: IFavoriteRootState) => state.favorite.loading || false
  );
  const error = useSelector(
    (state: IFavoriteRootState) => state.favorite.error || null
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      // @ts-ignore
      dispatch(fetchUserFavorites());
    }
  }, [isAuthenticated, user, dispatch]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    if (!confirm('Deseja remover este produto dos favoritos?')) return;
    try {
      // @ts-ignore
      await dispatch(removeFavoriteProduct(favoriteId));
      toast.success('Removido dos favoritos');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover');
    }
  };

  const handleAddToCart = (item: any) => {
    const firstImage = (() => {
      const img = item.productData?.image;
      if (!img) return null;
      if (Array.isArray(img) && img.length > 0) {
        const v = img[0];
        return typeof v === 'string' ? v : v?.url || null;
      }
      if (typeof img === 'object') return img?.url || null;
      return String(img);
    })();

    const product = {
      _id: item.productId || item.id,
      name: item.productData?.name || 'Produto',
      price: item.productData?.price || 0,
      slug: item.productData?.slug || { current: '' },
      images: firstImage ? [{ url: firstImage }] : [],
    };

    try {
      (dispatch as any)(addItemAndPersist({ product, quantity: 1 }));
      // Remover dos favoritos após adicionar ao carrinho
      // @ts-ignore
      dispatch(removeFavoriteProduct(item.id));
      toast.success('Adicionado ao carrinho e removido dos favoritos');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao adicionar ao carrinho');
    }
  };

  const handleViewProduct = async (item: any) => {
    try {
      const productId = item.productId || item.productData?.productId || item.productData?._id || item.productData?.id;
      // If we have a productId, fetch full product data to build canonical URL
      if (productId) {
        const resp = await fetch(`/api/products/${productId}`);
        if (!resp.ok) {
          toast.warn('Não foi possível acessar o produto');
          return;
        }
        const data = await resp.json();
        const product = data?.product || data;
        // Build URL segments similar ao Card component
        const categorySegment = (() => {
          const cat = product.category;
          if (!cat) return 'categoria';
          if (Array.isArray(cat) && cat.length > 0) return cat[0].slug || cat[0].name || String(cat[0]);
          return cat.slug || cat.name || String(cat);
        })();
        const subCategorySegment = product.subCategory || 'all';
        const titleSlug = product.name ? product.name.replace(/\s+/g, '-').toLowerCase() : (product.slug?.current || product.id);
        const slugSegment = product.slug?.current || product.id;
        const productUrl = `/${categorySegment}/${subCategorySegment}/${titleSlug}/${slugSegment}`;
        router.push(productUrl);
        return;
      }

      // Fallback: if slug exists in productData try to open products listing or warn
      if (item.productData?.slug?.current) {
        router.push(`/products/${item.productData.slug.current}`);
        return;
      }

      toast.warn('Não foi possível acessar o produto');
    } catch (err) {
      console.error('handleViewProduct error', err);
      toast.warn('Não foi possível acessar o produto');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-800 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-palette-text mb-8">Meus Favoritos</h1>

      {favoriteItems.length === 0 ? (
        <div className="bg-palette-card p-8 rounded-lg shadow-md text-center border border-palette-border">
          <p className="text-palette-mute text-lg mb-4">Você ainda não tem produtos favoritos</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-palette-primary text-palette-side px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Explorar Produtos
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteItems.map((item: any) => (
            <FavoriteCard
              key={item.id}
              item={item}
              onView={() => handleViewProduct(item)}
              onAddToCart={() => handleAddToCart(item)}
              onRemove={() => handleRemoveFavorite(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

type FavoriteCardProps = {
  item: any;
  onView: () => void;
  onAddToCart: () => void;
  onRemove: () => void;
};

const FavoriteCard: React.FC<FavoriteCardProps> = ({ item, onView, onAddToCart, onRemove }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const computeImage = () => {
      const img = item.productData?.image;
      if (img) {
        if (Array.isArray(img) && img.length > 0) {
          const v = img[0];
          return typeof v === 'string' ? v : v?.url || null;
        }
        if (typeof img === 'object') return img?.url || null;
        if (typeof img === 'string' && img.trim() !== '') return img;
      }
      // fallback: if productData.images exists
      const imgs = item.productData?.images;
      if (Array.isArray(imgs) && imgs.length > 0) {
        const v = imgs[0];
        return typeof v === 'string' ? v : v?.url || null;
      }
      return null;
    };

    const url = computeImage();
    if (url) {
      setImageUrl(url);
    } else if (item.productId) {
      // tentar buscar imagem do produto completo caso o payload do favorito seja parcial
      (async () => {
        try {
          const r = await fetch(`/api/products/${item.productId}`);
          if (!r.ok) return;
          const d = await r.json();
          const prod = d?.product || d;
          const imgs = prod?.images || prod?.images?.map?.((i: any) => i.url) || [];
          const first = Array.isArray(imgs) ? (imgs[0]?.url || imgs[0]) : null;
          if (first) setImageUrl(first);
        } catch (err) {
          // ignore
        }
      })();
    } else {
      setImageUrl(null);
    }
  }, [item]);

  return (
    <div className="bg-palette-card rounded-lg shadow-md p-4 border border-palette-border hover:shadow-lg transition-shadow flex flex-col h-full">
      <div
        onClick={onView}
        className="relative mb-3 h-40 bg-palette-fill rounded-md overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={item.productData?.name || 'Produto'} className="w-full h-full object-cover" />
        ) : (
          <div className="text-palette-mute text-sm">Sem imagem</div>
        )}
      </div>

      <h3 onClick={onView} className="text-palette-text font-semibold text-sm mb-2 line-clamp-2 cursor-pointer hover:text-palette-primary transition-colors">
        {item.productData?.name || 'Produto'}
      </h3>

      <div className="mb-3">
        <p className="text-palette-primary font-bold text-lg">
          {item.productData?.price
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.productData.price)
            : 'Preço indisponível'}
        </p>
      </div>

      <div className="flex gap-2 mt-auto">
        <button onClick={onAddToCart} className="flex-1 bg-palette-primary text-palette-side py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
          <MdShoppingCart size={16} /> Carrinho
        </button>
        <button onClick={onRemove} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" title="Remover dos favoritos">
          <MdDelete size={18} />
        </button>
      </div>
    </div>
  );
};

export default Favorites;
