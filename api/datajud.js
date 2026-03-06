export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tribunal, apiKey, body } = req.body;

    if (!tribunal || !apiKey || !body) {
      return res.status(400).json({ error: 'Missing required fields: tribunal, apiKey, body' });
    }

    const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `APIKey ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ 
        error: `Datajud returned ${response.status}`, 
        details: text 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
