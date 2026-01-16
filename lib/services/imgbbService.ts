/**
 * Serviço para upload de imagens no ImgBB
 * API com suporte a chave de API para melhor confiabilidade
 */

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export const uploadImageToImgBB = async (
  file: File,
  apiKey?: string
): Promise<string> => {
  try {
    // Usar a chave de API fornecida, caso contrário tentar usar do .env
    const key = apiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY;

    if (!key) {
      console.warn('Nenhuma chave de API ImgBB fornecida. Tentando upload sem chave (pode falhar).');
    }

    const formData = new FormData();
    formData.append('image', file);

    // Construir URL com chave se disponível
    let uploadUrl = IMGBB_API_URL;
    if (key) {
      uploadUrl = `${IMGBB_API_URL}?key=${key}`;
    }

    console.log('Iniciando upload para ImgBB...', { 
      fileName: file.name, 
      fileSize: file.size,
      hasApiKey: !!key 
    });

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    // Log da resposta para debug
    const responseText = await response.text();
    console.log('Resposta ImgBB:', { status: response.status, statusText: response.statusText });

    // Tentar parsear como JSON
    let data: ImgBBResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Resposta não é JSON válido:', responseText);
      throw new Error(`Erro ao fazer upload: ${response.statusText} - ${responseText}`);
    }

    if (!response.ok) {
      const errorMessage = data?.status === 400 
        ? 'Erro de requisição inválida (400). Verifique a chave de API ou tente novamente.'
        : `Erro ao fazer upload: ${response.statusText} (${response.status})`;
      throw new Error(errorMessage);
    }

    if (!data.success) {
      throw new Error(`Falha no upload da imagem: ${data.status}`);
    }

    console.log('Upload bem-sucedido:', data.data.url);
    return data.data.url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao fazer upload para ImgBB:', errorMessage);
    throw new Error(
      `Não foi possível fazer upload da imagem. ${errorMessage}`
    );
  }
};

export const uploadMultipleImagesToImgBB = async (
  files: File[],
  apiKey?: string
): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file) =>
      uploadImageToImgBB(file, apiKey)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Erro ao fazer upload de múltiplas imagens:', error);
    throw error;
  }
};

