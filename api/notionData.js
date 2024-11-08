import fetch from 'node-fetch';
import express from 'express';

const app = express();

const notionApiUrl = `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`;
const notionApiKey = process.env.NOTION_API_KEY;

app.get('/api/notionData', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    let results = [];
    let hasMore = true;
    let nextCursor = undefined;

    // Loop per ottenere tutte le pagine con i filtri applicati
    while (hasMore) {
      const response = await fetch(notionApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          page_size: 100, // Limite massimo per Notion
          start_cursor: nextCursor, // Usa il cursore per le pagine successive
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
      results = results.concat(data.results); // Aggiungi i risultati alla lista principale
      hasMore = data.has_more;
      nextCursor = data.next_cursor; // Aggiorna il cursore per la pagina successiva
    }

    // Estrai i dati rilevanti
    const extractedData = results.map(item => ({
      id: item.id,
      promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "",
      contenuto: item.properties["Contenuto"].rich_text[0]?.plain_text || "",
      link: item.properties["Link"].rich_text[0]?.plain_text || "",
      excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "",
      tag: item.properties["Tag"].select?.name || "",
      pageUrl: item.properties["pageUrl"].formula?.string || ""
    }));

    res.status(200).json(extractedData);
  } catch (error) {
    console.error("Errore durante il recupero dei dati da Notion:", error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Notion' });
  }
});

export default app;
