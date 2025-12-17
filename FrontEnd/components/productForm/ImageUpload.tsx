import React, { useState, useRef } from 'react';
import { uploadImageToImgBB } from '../../lib/services/imgbbService';
import { useLanguage } from '../../hooks/useLanguage';
import { toast } from 'react-toastify';
import { MdDelete, MdAdd, MdArrowUpward, MdArrowDownward } from 'react-icons/md';

interface ImagePreview {
  url: string;
  file?: File;
  alt?: string;
  isUploading?: boolean;
  id?: string;
  order?: number;
}

interface ImageUploadProps {
  onImagesChange: (images: ImagePreview[]) => void;
  images: ImagePreview[];
  maxImages?: number;
  apiKey?: string;
}

const ImageUploadComponent: React.FC<ImageUploadProps> = ({
  onImagesChange,
  images,
  maxImages = 5,
  apiKey,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    if (images.length + files.length > maxImages) {
      toast.error(t.maxImagesError);
      return;
    }

    setUploading(true);

    try {
      const newImages: ImagePreview[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} ${t.invalidImageType}`);
          continue;
        }

        // Validar tamanho (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} ${t.imageTooLarge}`);
          continue;
        }

        try {
          // Criar preview temporário
          const reader = new FileReader();
          await new Promise<void>((resolve) => {
            reader.onload = (event) => {
              newImages.push({
                url: event.target?.result as string,
                file,
                isUploading: true,
              });
              resolve();
            };
            reader.readAsDataURL(file);
          });
        } catch (err) {
          console.error('Erro ao ler arquivo:', err);
          toast.error(`Erro ao processar ${file.name}`);
        }
      }

      // Atualizar com previews
      const updatedImages = [...images, ...newImages];
      onImagesChange(updatedImages);

      // Fazer upload de cada imagem
      for (let i = 0; i < newImages.length; i++) {
        const imageIndex = images.length + i;
        try {
          const uploadedUrl = await uploadImageToImgBB(
            newImages[i].file!,
            apiKey
          );

          // Atualizar a imagem com URL do ImgBB
          updatedImages[imageIndex] = {
            ...updatedImages[imageIndex],
            url: uploadedUrl,
            isUploading: false,
          };

          onImagesChange([...updatedImages]);
          toast.success(t.imageUploadSuccess);
        } catch (error) {
          console.error('Erro no upload:', error);
          // Remover imagem falhada
          updatedImages.splice(imageIndex, 1);
          onImagesChange([...updatedImages]);
          toast.error(t.imageUploadError);
        }
      }
    } finally {
      setUploading(false);
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
    toast.info(t.imageRemoved);
  };

  const handleAltChange = (index: number, alt: string) => {
    const updatedImages = [...images];
    updatedImages[index].alt = alt;
    onImagesChange(updatedImages);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= images.length) return;

    const updatedImages = [...images];
    [updatedImages[index], updatedImages[newIndex]] = [
      updatedImages[newIndex],
      updatedImages[index],
    ];

    onImagesChange(updatedImages);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <label className="block text-sm font-semibold text-palette-base mb-2">
          {t.productImages}
        </label>

        {/* Área de upload */}
        <div
          className="border-2 border-dashed border-palette-primary rounded-lg p-6 text-center cursor-pointer hover:bg-palette-card transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || images.length >= maxImages}
            className="hidden"
          />

          <MdAdd className="mx-auto text-3xl text-palette-primary mb-2" />
          <p className="text-palette-base font-medium">
            {t.clickOrDragImages}
          </p>
          <p className="text-palette-mute text-sm mt-1">
            {t.imageSizeInfo} ({images.length}/{maxImages})
          </p>

          {uploading && (
            <p className="text-palette-primary text-sm mt-2">
              {t.saving}
            </p>
          )}
        </div>
      </div>

      {/* Grid de imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group border border-palette-primary rounded-lg overflow-hidden bg-palette-card"
            >
              {/* Número da imagem */}
              <div className="absolute top-2 left-2 bg-palette-primary text-white text-xs font-bold px-2 py-1 rounded z-10">
                #{index + 1}
              </div>

              {/* Imagem */}
              <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                {image.isUploading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-palette-primary"></div>
                  </div>
                ) : (
                  <img
                    src={image.url}
                    alt={image.alt || `Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay com opções */}
                {!image.isUploading && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, 'up')}
                      disabled={index === 0}
                      className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white transition-colors"
                      title="Mover para cima"
                    >
                      <MdArrowUpward size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white transition-colors"
                      title="Mover para baixo"
                    >
                      <MdArrowDownward size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                      title={t.removeImage}
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Campo Alt Text */}
              {!image.isUploading && (
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Descrição da imagem"
                    value={image.alt || ''}
                    onChange={(e) => handleAltChange(index, e.target.value)}
                    className="w-full text-xs px-2 py-1 border border-palette-primary rounded bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-1 focus:ring-palette-primary"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadComponent;
