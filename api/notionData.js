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

    const response = await fetch(notionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) throw new Error(`Errore nella chiamata all'API di Notion, status: ${response.status}`);
    
    const notionData = await response.json();
    
    // Estrai i dati dall'array `results`
    const extractedData = notionData.results.map(item => {
      return {
        id: item.id,
        promptTitle: item.properties["Prompt Title"].title[0]?.plain_text || "", // Estrarre il titolo
        contenuto: item.properties["Contenuto"].rich_text[0]?.plain_text || "", // Estrarre il contenuto
        link: item.properties["Link"].rich_text[0]?.plain_text || "", // Estrarre il link
        excerpt: item.properties["Excerpt"].rich_text[0]?.plain_text || "", // Estrarre l'excerpt
        tag: item.properties["Tag"].select?.name || "" // Estrarre il tag
      };
    });

    // Invia solo i dati estratti
    res.status(200).json(extractedData);
  } catch (error) {
    console.error("Errore durante il recupero dei dati da Notion:", error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Notion' });
  }
});

export default app;
