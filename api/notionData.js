app.get('/api/notionData', async (req, res) => {
  try {
    const { cursor } = req.query; // Ottieni il cursore dalla query string

    const response = await fetch(notionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: 20, // Limite massimo per pagina
        start_cursor: cursor || undefined, // Usa il cursore fornito o inizia dall'inizio
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
    const extractedData = data.results.map(item => ({
      id: item.id,
      promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "",
      contenuto: item.properties["Contenuto"].rich_text[0]?.plain_text || "",
      link: item.properties["Link"].rich_text[0]?.plain_text || "",
      excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "",
      tag: item.properties["Tag"].select?.name || "",
      pageUrl: item.properties["pageUrl"].formula?.string || ""
    }));

    res.status(200).json({
      results: extractedData,
      nextCursor: data.next_cursor, // Includi il cursore per la pagina successiva
      hasMore: data.has_more // Indica se ci sono più dati disponibili
    });
  } catch (error) {
    console.error("Errore durante il recupero dei dati da Notion:", error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Notion' });
  }
});
