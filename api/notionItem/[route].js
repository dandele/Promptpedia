import fetch from 'node-fetch';

const notionApiUrl = `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`;
const notionApiKey = process.env.NOTION_API_KEY;

export default async function handler(req, res) {
  // Verifica se `route` viene passato da Unicorn
  let { route } = req.query;

  // Se `route` non è presente, prova a estrarlo manualmente da `req.url`
  if (!route) {
    route = req.url.split('/').pop(); // Estrai manualmente dal percorso
    console.log('Route estratto manualmente:', route); // Debug
  }

  if (!route) {
    return res.status(400).json({ error: 'Parametro route mancante o non valido' });
  }

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const bodyData = {
      filter: {
        property: "pageUrl",
        formula: {
          string: {
            equals: route
          }
        }
      }
    };

    const response = await fetch(notionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) throw new Error(`Errore nella chiamata all'API di Notion, status: ${response.status}`);
    
    const data = await response.json();

    if (data.results.length === 0) {
      return res.status(404).json({ error: 'Item non trovato' });
    }

    const item = data.results[0];

    const extractedItem = {
      id: item.id,
      promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "",
      contenuto: item.properties["Contenuto"].rich_text[0]?.plain_text || "",
      pageUrl: item.properties["pageUrl"].formula?.string || "#",
      link: item.properties["Link"]?.rich_text[0]?.plain_text || "#",
      excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "",
      tag: item.properties["Tag"].select?.name || ""
    };

    console.log('Item estratto:', extractedItem); // Debug
    res.status(200).json(extractedItem);
  } catch (error) {
    console.error("Errore dettagliato:", error);
    res.status(500).json({ 
      error: 'Errore durante il recupero dei dati dell\'item da Notion',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
