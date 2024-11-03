const fetch = require('node-fetch');

// Endpoint principale per Vercel
module.exports = async (req, res) => {
  // Configura l'URL e la chiave API di Notion
  const notionApiUrl = '133863224739800488dacadc7e93c08e';
  const notionApiKey = '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';

  try {
    const response = await fetch(notionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28' // versione API
      }
    });

    if (!response.ok) {
      throw new Error('Errore nella chiamata all\'API di Notion');
    }

    const data = await response.json();
    res.status(200).json(data); // Invia i dati come JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Notion' });
  }
};
