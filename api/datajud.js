export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tribunal, apiKey, body } = req.body;
    if (!tribunal || !apiKey || !body) {
      return res.status(400).json({ error: 'Missing: tribunal, apiKey, body' });
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

    const text = await response.text();

    if (!response.ok) {
      console.error(`Datajud error ${response.status}:`, text.slice(0, 500));
      return res.status(response.status).json({
        error: `Datajud retornou ${response.status}`,
        details: text.slice(0, 300)
      });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(500).json({ error: 'Resposta invalida do Datajud', raw: text.slice(0, 300) }); }

    // Normalize: some tribunals use polo instead of partes
    if (data?.hits?.hits) {
      data.hits.hits = data.hits.hits.map(hit => {
        const s = hit._source;
        if (!s.partes || s.partes.length === 0) {
          if (s.polo && Array.isArray(s.polo)) s.partes = s.polo;
        }
        return hit;
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
