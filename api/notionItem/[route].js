export default async function handler(req, res) {
  const route = req.url.split('/').pop(); // Estrarre manualmente pageUrl
  console.log('Route estratto manualmente:', route); // Debug

  if (!route || route === 'notionItem') {
    return res.status(400).json({ error: 'Parametro route mancante o non valido' });
  }

  try {
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

    const data = await response.json();
    if (data.results.length === 0) {
      return res.status(404).json({ error: 'Item non trovato' });
    }

    const item = data.results[0];
    const extractedItem = {
      id: item.id,
      promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "",
      content: item.properties["Contenuto"].rich_text[0]?.plain_text || "",
      pageUrl: item.properties["pageUrl"].formula?.string || "#",
      link: item.properties["Link"]?.rich_text[0]?.plain_text || "#",
      excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "",
      tag: item.properties["Tag"].select?.name || ""
    };

    res.status(200).json(extractedItem);
  } catch (error) {
    console.error("Errore:", error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati dell\'item da Notion' });
  }
}
