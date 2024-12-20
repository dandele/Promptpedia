import fetch from 'node-fetch';

// Verifica che le variabili di ambiente siano definite
const notionApiUrl = `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`;
const notionApiKey = process.env.NOTION_API_KEY;

export default async function handler(req, res) {
  try {
    // Configura le intestazioni CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://promptpedia.uncrn.co');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { cursor, all } = req.query; // Ottieni il cursore e il flag "all" dalla query string
    const pageSize = 20; // Limita i risultati a 20 per richiesta
    let hasMore = true;
    let nextCursor = cursor || undefined;
    let results = [];

    // Verifica che l'URL dell'API e la chiave siano definiti
    if (!notionApiUrl || !notionApiKey) {
      throw new Error('Le variabili di ambiente NOTION_DATABASE_ID o NOTION_API_KEY non sono definite.');
    }

    do {
      const response = await fetch(notionApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          page_size: pageSize,
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
      results = results.concat(
        data.results.map(item => ({
          promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "Untitled",
          tag: item.properties["Tag"].select?.name || "",
          excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "",
          pageUrl: item.properties["pageUrl"].formula?.string || "#",
          dynamicTarget: "_blank"
        }))
      );

      hasMore = data.has_more;
      nextCursor = data.next_cursor;

      // Se il parametro "all" non è presente, interrompi dopo la prima pagina
      if (!all) break;

    } while (hasMore);

    // Restituisci i risultati e il cursore per la prossima pagina (se applicabile)
    res.status(200).json({
      results,
      nextCursor: hasMore ? nextCursor : null,
      hasMore
    });
  } catch (error) {
    console.error("Errore durante il recupero dei dati da Notion:", error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Notion' });
  }
}
