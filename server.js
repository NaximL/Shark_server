import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function createFetchWithCookies() {
  const cookieJar = new tough.CookieJar();
  return fetchCookie(fetch, cookieJar);
}

async function login(fetchWithCookies, username, password) {
  const loginData = new URLSearchParams({ UserName: username, Password: password });

  const loginResponse = await fetchWithCookies('https://app.moiashkola.ua/', {
    method: 'POST',
    body: loginData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://app.moiashkola.ua/'
    },
    redirect: 'manual',
  });

  if (loginResponse.status !== 302) {
    throw new Error('Login failed. Check credentials.');
  }
}

async function fetchPage(fetchWithCookies, url) {
  const response = await fetchWithCookies(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return await response.text();
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const fetchWithCookies = createFetchWithCookies();
  try {
    await login(fetchWithCookies, username, password);
    const html = await fetchPage(fetchWithCookies, 'https://app.moiashkola.ua/Analitika');
    const $ = cheerio.load(html);
    const spans = [];
    $('span').each((_, el) => spans.push($(el).text().trim()));
    res.json(spans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/domash', async (req, res) => {
  const { username, password } = req.body;
  const fetchWithCookies = createFetchWithCookies();
  try {
    await login(fetchWithCookies, username, password);
    const dateStr = new Date().toISOString().split('T')[0] + 'T21:00:00+00:00';
    const url = `https://app.moiashkola.ua/odata/NamuDarbaiOData?%24format=json&%24top=30&%24filter=AtliktiIki%20eq%20${encodeURIComponent(dateStr)}&%24count=true`;
    const response = await fetchWithCookies(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rozklad', async (req, res) => {
  const { username, password } = req.body;
  const fetchWithCookies = createFetchWithCookies();
  try {
    await login(fetchWithCookies, username, password);
    const html = await fetchPage(fetchWithCookies, 'https://app.moiashkola.ua/TvarkarascioIrasas/MokinioTvarkarastis');
    const $ = cheerio.load(html);
    const result = [];
    $('tbody.bg-white').each((_, tbody) => {
      const lessons = [];
      $(tbody).find('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 5) {
          const time = $(cells[2]).text().trim();
          const urok = $(cells[4]).text().trim();
          lessons.push({ urok, time });
        }
      });
      result.push(lessons);
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/prof', async (req, res) => {
  const { username, password } = req.body;
  const fetchWithCookies = createFetchWithCookies();
  try {
    await login(fetchWithCookies, username, password);
    const html = await fetchPage(fetchWithCookies, 'https://app.moiashkola.ua/Profilis');
    const $ = cheerio.load(html);
    const result = [];
    $('h2, span, i').each((_, el) => result.push($(el).text().trim()));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
