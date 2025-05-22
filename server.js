import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'], 
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const cookieJar = new tough.CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookieJar);

async function getlesion(username, password) {
  const loginData = new URLSearchParams({
    UserName: username,
    Password: password,
  });

  await fetchWithCookies('https://app.moiashkola.ua/', {
    method: 'POST',
    body: loginData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'uk-UA,uk;q=0.9,ru-RU;q=0.8,ru;q=0.7,en-US;q=0.6,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': 'https://app.moiashkola.ua',
      'Referer': 'https://app.moiashkola.ua/',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Sec-CH-UA': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"macOS"',
    },
    redirect: 'manual',
  });

  const protectedPage = await fetchWithCookies('https://app.moiashkola.ua/TvarkarascioIrasas/MokinioTvarkarastis', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const protectedHtml = await protectedPage.text();
  const $ = cheerio.load(protectedHtml);
  const results = [];

  $('tbody.bg-white').each((_, tbody) => {
    const ef = [];
    $(tbody).find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 5) {
        const time = $(cells[2]).text().trim();
        const urok = $(cells[4]).text().trim();
        ef.push({ urok, time });
      }
    });
    results.push(ef);
  });
  
  return results;
}

async function getprofil(username, password) {
  const loginData = new URLSearchParams({
    UserName: username,
    Password: password,
  });

  await fetchWithCookies('https://app.moiashkola.ua/', {
    method: 'POST',
    body: loginData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'uk-UA,uk;q=0.9,ru-RU;q=0.8,ru;q=0.7,en-US;q=0.6,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': 'https://app.moiashkola.ua',
      'Referer': 'https://app.moiashkola.ua/',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Sec-CH-UA': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"macOS"',
    },
    redirect: 'manual',
  });

  const protectedPage = await fetchWithCookies('https://app.moiashkola.ua/Profilis', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const protectedHtml = await protectedPage.text();
  const $ = cheerio.load(protectedHtml);
  const result = [];
  $('h2').each((i, el) => result.push($(el).text().trim()));
  $('span').each((i, el) => result.push($(el).text().trim()));
  $('i').each((i, el) => result.push($(el).text().trim()));
  return result;
}

async function gethomework(username, password) {
  const loginData = new URLSearchParams({
    UserName: username,
    Password: password,
  });

  await fetchWithCookies('https://app.moiashkola.ua/', {
    method: 'POST',
    body: loginData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'uk-UA,uk;q=0.9,ru-RU;q=0.8,ru;q=0.7,en-US;q=0.6,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': 'https://app.moiashkola.ua',
      'Referer': 'https://app.moiashkola.ua/',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Sec-CH-UA': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"macOS"',
    },
    redirect: 'manual',
  });

  const baseUrl = 'https://app.moiashkola.ua/odata/NamuDarbaiOData';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate());

  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}T21:00:00+00:00`;
  const params = [
    `%24format=json`,
    `%24top=30`,
    `%24filter=AtliktiIki%20eq%20${encodeURIComponent(dateStr)}`,
    `%24count=true`
  ];

  const url = `${baseUrl}?${params.join('&')}`;

  const protectedPage = await fetchWithCookies(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const protectedHtml = await protectedPage.text();
  return JSON.parse(protectedHtml);
}

async function loginAndFetchData(username, password) {
  const loginData = new URLSearchParams({
    UserName: username,
    Password: password,
  });

  await fetchWithCookies('https://app.moiashkola.ua/', {
    method: 'POST',
    body: loginData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'uk-UA,uk;q=0.9,ru-RU;q=0.8,ru;q=0.7,en-US;q=0.6,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': 'https://app.moiashkola.ua',
      'Referer': 'https://app.moiashkola.ua/',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Sec-CH-UA': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"macOS"',
    },
    redirect: 'manual',
  });
  
  const protectedPage = await fetchWithCookies('https://app.moiashkola.ua/Analitika', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const protectedHtml = await protectedPage.text();
  const $ = cheerio.load(protectedHtml);
  const spans = [];
  $('span').each((i, el) => spans.push($(el).text().trim()));
  return spans;
}

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Потрібні username та password' });
    }
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
    if (!username || !password) {
      return res.status(400).json({ error: 'Потрібні username та password' });
    }
    const homeworks = await gethomework(username, password);
    res.json(homeworks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/rozklad', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Потрібні username та password' });
    }
    const schedule = await getlesion(username, password);
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/prof', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Потрібні username та password' });
    }
    const profile = await getprofil(username, password);
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
