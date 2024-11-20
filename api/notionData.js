import fetch from 'node-fetch';

const notionApiUrl = `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`;
const notionApiKey = process.env.NOTION_API_KEY;

// Configura la cache (opzionale)
let cache = {
  data: null,
  timestamp: null,
  ttl: 300000 // 5 minuti
};

export default async function handler(req, res) {
  try {
    // Configura le intestazioni CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://promptpedia.uncrn.co');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { cursor } = req.query; // Ottieni il cursore dalla query string
    const pageSize = 20; // Limita i risultati a 20 per richiesta

    // Usa la cache se i dati sono già disponibili e non scaduti
    const now = Date.now();
    if (cache.data && cache.timestamp && now - cache.timestamp < cache.ttl && !cursor) {
      console.log('Restituzione dati dalla cache');
      return res.status(200).json(cache.data);
    }

    const response = await fetch(notionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: pageSize,
        start_cursor: cursor || undefined, // Usa il cursore o inizia dall'inizio
        filter: {
          and: [
            {
              property: "Prompt Title",
              title: {
                does_not_equal: "Titolo del prompt non trovato."
              }
            },
            {
              property: "Contenuto",
              rich_text: {
                does_not_equal: "Contenuto non trovato."
              }
            }
          ]
        }
      })
    });

    if (!response.ok) throw new Error(`Errore nella chiamata all'API di Notion, status: ${response.status}`);

    const data = await response.json();

    // Estrai i dati rilevanti
    const extractedData = results.map(item => ({
      id: item.id,
      promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "Untitled",
      tag: item.properties["Tag"].select?.name || "",
      excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "",
      dynamicUrl: item.properties["pageUrl"].formula?.string || "#",
      dynamicTarget: "_blank" // Modifica se necessario
    }));

    const responseData = {
      results: extractedData,
      nextCursor: data.next_cursor,
      hasMore: data.has_more
    };

    // Aggiorna la cache solo se siamo alla prima pagina
    if (!cursor) {
      cache = {
        data: responseData,
        timestamp: now
      };
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Errore durante il recupero dei dati da Notion:", error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Notion' });
  }
}
