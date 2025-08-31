import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { DesignStyle } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const redesignRoom = async (
  base64Image: string,
  mimeType: string,
  style: DesignStyle
): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `أعد تصميم هذه الغرفة بأسلوب ${style}. اجعلها تبدو واقعية.`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
            return part.inlineData.data;
        }
    }

    throw new Error('لم يتم العثور على صورة في استجابة الذكاء الاصطناعي.');
  } catch (error) {
    console.error('Error redesigning room:', error);
    if (error instanceof Error) {
        let errorMessage = 'حدث خطأ غير معروف أثناء إنشاء التصميم.';
        try {
            // The error message from the SDK can be a JSON string.
            const errorJson = JSON.parse(error.message);
            if (errorJson?.error?.message) {
                if (errorJson.error.status === 'RESOURCE_EXHAUSTED') {
                    errorMessage = 'لقد تجاوزت حد الاستخدام المجاني لهذا اليوم. يرجى التحقق من خطة الفوترة الخاصة بك أو المحاولة مرة أخرى غدًا.';
                } else {
                    errorMessage = `حدث خطأ من الواجهة البرمجية: ${errorJson.error.message}`;
                }
            }
        } catch (e) {
            // If parsing fails, it's not a JSON string. Fallback to original behavior.
            errorMessage = `فشل في إنشاء التصميم: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
    throw new Error('حدث خطأ غير معروف أثناء إنشاء التصميم.');
  }
};