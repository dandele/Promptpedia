import fetch from 'node-fetch';

const notionApiUrl = `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`;
const notionApiKey = process.env.NOTION_API_KEY;

export default async function handler(req, res) {
  try {
    // Configura le intestazioni CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://promptpedia.uncrn.co');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Configura la cache
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

    let results = [];
    let hasMore = true;
    let nextCursor = undefined;

    // Itera su tutte le pagine finché ci sono risultati
    while (hasMore) {
      const response = await fetch(notionApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          page_size: 100, // Limite massimo per ogni richiesta
          start_cursor: nextCursor || undefined,
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

      // Concatena i risultati
      results = results.concat(
        data.results.map(item => ({
          promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "Untitled",
          tag: item.properties["Tag"].select?.name || "",
          excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "",
          pageUrl: item.properties["pageUrl"].formula?.string || "#",
          dynamicTarget: "_blank"
        }))
      );

      // Controlla se ci sono altre pagine
      hasMore = data.has_more;
      nextCursor = data.next_cursor;
    }

    // Restituisci tutti i risultati
    res.status(200).json(results);
  } catch (error) {
    console.error("Errore durante il recupero dei dati da Notion:", error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Notion' });
  }
}
