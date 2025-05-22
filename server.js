import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

const cookieJar = new tough.CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookieJar);

async function loginWithRedirect(username, password) {
  const loginData = new URLSearchParams({ UserName: username, Password: password });

  const loginRes = await fetchWithCookies('https://app.moiashkola.ua/', {
    method: 'POST',
    body: loginData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
    },
    redirect: 'manual',
  });

  if (loginRes.status === 302 || loginRes.status === 303) {
    const location = loginRes.headers.get('location');
    if (location) {
      await fetchWithCookies(`https://app.moiashkola.ua${location}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
    }
  }
}

// === РОЗКЛАД ===
async function getlesion(username, password) {
  await loginWithRedirect(username, password);

  const page = await fetchWithCookies('https://app.moiashkola.ua/TvarkarascioIrasas/MokinioTvarkarastis', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const html = await page.text();
  const $ = cheerio.load(html);
  const results = [];

  $('tbody.bg-white').each((_, tbody) => {
    const day = [];
    $(tbody).find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 5) {
        const time = $(cells[2]).text().trim();
        const urok = $(cells[4]).text().trim();
        day.push({ urok, time });
      }
    });
    results.push(day);
  });

  return results;
}

// === ПРОФІЛЬ ===
async function getprofil(username, password) {
  await loginWithRedirect(username, password);

  const page = await fetchWithCookies('https://app.moiashkola.ua/Profilis', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const html = await page.text();
  const $ = cheerio.load(html);
  const result = [];

  $('h2, span, i').each((i, el) => {
    result.push($(el).text().trim());
  });

  return result;
}

// === Д/З ===
async function gethomework(username, password) {
  await loginWithRedirect(username, password);

  const baseUrl = 'https://app.moiashkola.ua/odata/NamuDarbaiOData';

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}T21:00:00+00:00`;

  const url = `${baseUrl}?$format=json&$top=30&$filter=AtliktiIki eq ${encodeURIComponent(dateStr)}&$count=true`;

  const response = await fetchWithCookies(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const data = await response.text();
  return JSON.parse(data);
}

// === АНАЛІТИКА / ОЦІНКИ ===
async function loginAndFetchData(username, password) {
  await loginWithRedirect(username, password);

  const page = await fetchWithCookies('https://app.moiashkola.ua/Analitika', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const html = await page.text();
  const $ = cheerio.load(html);
  const spans = [];

  $('span').each((i, el) => {
    spans.push($(el).text().trim());
  });

  return spans;
}

// === API ===
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Потрібні username та password' });
    const grades = await loginAndFetchData(username, password);
    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/domash', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Потрібні username та password' });
    const data = await gethomework(username, password);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/rozklad', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Потрібні username та password' });
    const data = await getlesion(username, password);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/prof', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Потрібні username та password' });
    const data = await getprofil(username, password);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// === СТАРТ СЕРВЕРА ===
app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
