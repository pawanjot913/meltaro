import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let ai: GoogleGenAI | null = null;

if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your-key-here') {
  ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  logger.info('Gemini API initialised — Mello is cloud-powered');
} else {
  logger.info('GEMINI_API_KEY not set — Mello will use offline fallback responses');
}

const SYSTEM_INSTRUCTION = `You are Mello, the fluffy virtual mascot, nature-loving barista, and warm digital companion at Meltaro Artisan Bakery & Café.
Your tone is incredibly welcoming, friendly, helpful, and sweet (feel free to sound slightly playful or cozy).
You adore specialty coffee, handcrafted pastries, and outdoor woodland café vibes.
Our Menu features:
- Signature Latte ($5.80) [Single-origin Arabica, micro-foamed organic milk, cocoa dust]
- Velvet Iced Mocha ($6.50) [Swiss dark chocolate, cold espresso, whole milk, whipped cream]
- Belgian Chocolate Shake ($7.25) [Belgian dark cocoa, double cream vanilla ice cream]
- Lotus Biscoff Cheesecake ($12.50) [Crushed Biscoff, Belgian cream cheese, speculoos drizzle]
- Forest Dark Cake ($9.00) [Dark chocolate sponge, wild mountain forest berry reduction, gold leaf]
- Berry Cloud Pancakes ($14.20) [Ultra-fluffy soufflé pancakes, strawberries, clotted cream]
- Nutella Pancakes ($9.75) [Stacked buttermilk pancakes, Nutella, hazelnut chunks]
- Truffle Parlour Fries ($9.00) [Hand-cut fries, white truffle oil, grated parmesan]
- Meltaro Lava Cake ($11.00) [Molten centre of 70% dark Belgian cocoa, vanilla ice cream]
- Honey Glazed Croissant ($6.50) [Laminated pastry, organic wildflower honey glaze]
- Heritage Sourdough ($12.00) [36-hour slow-fermented crusty loaf]
- Pistachio Macarons ($18.00) [Gift box of 6 filled with Sicilian pistachio ganache]

Our Ordering Options:
1. Pickup (Free)
2. Delivery ($5.99 fee)
3. Car-Hop ($2.50 fee — we bring it to your vehicle; provide your licence plate when ordering)

Keep replies friendly, conversational, and concise (under 3–4 sentences). Direct guests to add items to their basket.`;

type ChatHistory = { role: 'user' | 'model'; text: string }[];

function offlineFallback(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey'))
    return "Hello there! Mello here, your fluffy woodland companion! Welcome to Meltaro Artisan Bakery. How can I brighten your day? ☕✨";
  if (msg.includes('menu') || msg.includes('food') || msg.includes('eat') || msg.includes('drink'))
    return "Ooh, our menu is filled with wonder! My absolute favourites are the Lotus Biscoff Cheesecake ($12.50), Berry Cloud Pancakes ($14.20), and a warm Signature Latte ($5.80). What sounds perfect to you today? ✨";
  if (msg.includes('car-hop') || msg.includes('carhop') || msg.includes('license') || msg.includes('licence'))
    return "Our Car-Hop service is wonderful! Order your treats, select Car-Hop, note your licence plate, and drive up under our pine trees — I'll bring your box right to your window! 🚗🌲";
  if (msg.includes('delivery') || msg.includes('pickup') || msg.includes('fee'))
    return "We offer Pickup (free), Car-Hop ($2.50), and Delivery ($5.99) straight to your door. Which works best for you? 📦";
  if (msg.includes('location') || msg.includes('hours') || msg.includes('open'))
    return "We're at 742 Evergreen Glen, open daily 7:00 AM – 9:00 PM for fresh coffee and warm conversations! 🗺️🌲";
  if (msg.includes('price') || msg.includes('cost') || msg.includes('how much'))
    return "Our delicacies range from the Honey Croissant at $6.50 up to the Pistachio Macarons gift box at $18. Tell me what you're eyeing and I'll help! 💵";
  return "Hello, friend! Mello here! 🌲 I'm a little disconnected from the cloud right now, but I can still help with our menu and ordering. What would you like to know?";
}

export async function getReply(
  message: string,
  history: ChatHistory
): Promise<{ reply: string; source: 'gemini' | 'fallback' }> {
  if (ai) {
    try {
      const contents = [
        ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: message }] },
      ];
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 },
      });
      return { reply: response.text ?? "Hmm, I didn't quite catch that. Can you say it again?", source: 'gemini' };
    } catch (err) {
      logger.error('Gemini API call failed, falling back to offline', { err: (err as Error).message });
    }
  }
  return { reply: offlineFallback(message), source: 'fallback' };
}
