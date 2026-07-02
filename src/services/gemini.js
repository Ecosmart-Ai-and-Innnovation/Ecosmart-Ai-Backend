const { GoogleGenerativeAI } = require('@google/generative-ai');

function extractMimeType(base64String) {
  if (base64String.startsWith('data:image/')) {
    return base64String.split(';')[0].replace('data:', '');
  }
  return 'image/jpeg';
}

function extractBase64Data(base64String) {
  const match = base64String.match(/^data:image\/\w+;base64,(.+)$/);
  return match ? match[1] : base64String;
}

// Smart fallback for common waste types when Gemini is unavailable
function getFallbackResult(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('plastic') || t.includes('bottle') && !t.includes('glass')) {
    return {
      wasteType: 'Plastic Bottle',
      category: 'plastic',
      recyclable: true,
      confidence: 85,
      estimatedValue: { min: 5, max: 20, currency: 'NGN' },
      disposalGuidance: 'Rinse the bottle, remove the cap, and flatten before recycling.',
      ecoTip: 'Using a reusable bottle saves up to 156 plastic bottles per year!',
    };
  }
  if (t.includes('aluminium') || t.includes('can') || t.includes('tin') || t.includes('aluminum')) {
    return {
      wasteType: 'Aluminium Can',
      category: 'metal',
      recyclable: true,
      confidence: 90,
      estimatedValue: { min: 30, max: 80, currency: 'NGN' },
      disposalGuidance: 'Rinse the can, crush it to save space, and place in the metal recycling bin.',
      ecoTip: 'Recycling one aluminium can saves enough energy to power a TV for 3 hours!',
    };
  }
  if (t.includes('glass')) {
    return {
      wasteType: 'Glass Bottle',
      category: 'glass',
      recyclable: true,
      confidence: 88,
      estimatedValue: { min: 5, max: 15, currency: 'NGN' },
      disposalGuidance: 'Rinse and remove the lid. Separate by color if required by your local recycler.',
      ecoTip: 'Glass can be recycled infinitely without losing quality!',
    };
  }
  if (t.includes('paper') || t.includes('cardboard') || t.includes('box') || t.includes('cardboard box')) {
    return {
      wasteType: 'Cardboard Box',
      category: 'paper',
      recyclable: true,
      confidence: 87,
      estimatedValue: { min: 10, max: 30, currency: 'NGN' },
      disposalGuidance: 'Flatten the box and remove any tape or labels before recycling.',
      ecoTip: 'Recycling 1 ton of cardboard saves 17 trees and 7000 gallons of water!',
    };
  }
  if (t.includes('organic') || t.includes('food') || t.includes('banana') || t.includes('peel')) {
    return {
      wasteType: 'Food Scraps',
      category: 'organic',
      recyclable: false,
      confidence: 80,
      estimatedValue: { min: 0, max: 0, currency: 'NGN' },
      disposalGuidance: 'Consider composting organic waste. It makes excellent fertilizer for gardens.',
      ecoTip: 'Composting reduces methane emissions from landfills and enriches soil naturally.',
    };
  }
  if (t.includes('ewaste') || t.includes('electronic') || t.includes('battery') || t.includes('phone')) {
    return {
      wasteType: 'Electronic Waste',
      category: 'ewaste',
      recyclable: true,
      confidence: 82,
      estimatedValue: { min: 100, max: 500, currency: 'NGN' },
      disposalGuidance: 'Do not throw in regular trash. Take to a certified e-waste recycling center.',
      ecoTip: 'E-waste contains valuable metals like gold, silver, and copper that can be recovered!',
    };
  }
  if (t.includes('metal') || t.includes('iron') || t.includes('scrap')) {
    return {
      wasteType: 'Metal Scrap',
      category: 'metal',
      recyclable: true,
      confidence: 85,
      estimatedValue: { min: 50, max: 200, currency: 'NGN' },
      disposalGuidance: 'Separate ferrous and non-ferrous metals for better recycling value.',
      ecoTip: 'Recycling metal uses 74% less energy than producing new metal from raw materials.',
    };
  }
  if (t.includes('rubber') || t.includes('tire') || t.includes('tyre')) {
    return {
      wasteType: 'Rubber Tire',
      category: 'rubber',
      recyclable: true,
      confidence: 78,
      estimatedValue: { min: 50, max: 150, currency: 'NGN' },
      disposalGuidance: 'Take to a tire recycling facility. Tires can be repurposed into fuel or playground surfaces.',
      ecoTip: 'Old tires can be turned into beautiful planters, swings, or even building materials!',
    };
  }
  return {
    wasteType: text || 'Unknown Item',
    category: 'unknown',
    recyclable: false,
    confidence: 50,
    estimatedValue: { min: 0, max: 0, currency: 'NGN' },
    disposalGuidance: 'Unable to identify this item. Try a clearer image or use the manual entry option.',
    ecoTip: 'When in doubt, check with your local recycling center for proper disposal.',
  };
}

async function classifyWaste(imageBase64, text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // No API key — use smart fallback
    return getFallbackResult(text || 'item');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  });

  const prompt = `You are a waste classification AI assistant. Analyze the waste item and return ONLY valid JSON — no markdown, no code fences, no explanations.

${
  imageBase64
    ? 'Analyze the waste item shown in this image.'
    : `Classify this waste type based on the following text: "${text}".`
}

Return exactly this JSON structure:
{
  "wasteType": "Specific waste item name (e.g. Plastic Water Bottle, Aluminium Can, Glass Bottle, Cardboard Box, Banana Peel, etc.)",
  "category": "One of: plastic | paper | metal | glass | organic | ewaste | rubber | unknown",
  "recyclable": true or false,
  "confidence": number between 0-100,
  "estimatedValue": {
    "min": number (minimum estimated value in NGN),
    "max": number (maximum estimated value in NGN),
    "currency": "NGN"
  },
  "disposalGuidance": "One short sentence on how to prepare or dispose of this item for recycling",
  "ecoTip": "One short eco-friendly tip related to this waste type"
}`;

  try {
    const parts = [{ text: prompt }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: extractBase64Data(imageBase64),
          mimeType: extractMimeType(imageBase64),
        },
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    if (!responseText || !responseText.trim()) {
      return getFallbackResult(text || 'item');
    }

    let cleaned = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini API error:', error.message);
    // Use smart fallback
    return getFallbackResult(text || (imageBase64 ? 'captured item' : 'Unknown Item'));
  }
}

module.exports = { classifyWaste };
