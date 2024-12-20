import fetch from 'node-fetch';

const notionApiUrl = `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`;
const notionApiKey = process.env.NOTION_API_KEY;

export default async function handler(req, res) {
  try {
    // Configura le intestazioni CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://promptpedia.uncrn.co');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { cursor } = req.query; // Ottieni il cursore dalla query string
    console.log("Cursor ricevuto:", cursor); // Log del cursore ricevutooo
    const pageSize = 20;

    if (!notionApiUrl || !notionApiKey) {
      throw new Error('Le variabili di ambiente NOTION_DATABASE_ID o NOTION_API_KEY non sono definite.');
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
        start_cursor: cursor || undefined, // Usa il cursore solo se definito
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

    if (!response.ok) {
      console.error(`Errore HTTP da Notion: ${response.status} - ${response.statusText}`);
      throw new Error(`Errore HTTP da Notion: ${response.status}`);
    }

    const data = await response.json();
    console.log("Risposta di Notion:", JSON.stringify(data, null, 2)); // Log completo della risposta API

    const extractedData = data.results.map(item => ({
      promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "Untitled",
      tag: item.properties["Tag"].select?.name || "",
      excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "",
      pageUrl: item.properties["pageUrl"].formula?.string || "#",
      dynamicTarget: "_blank"
    }));

    console.log("Dati estratti:", extractedData); // Log dei dati estratti

    res.status(200).json({
      results: extractedData,
      nextCursor: data.next_cursor || null,
      hasMore: data.has_more || false
    });
  } catch (error) {
    console.error("Errore durante il recupero dei dati da Notion:", error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Notion' });
  }
}
