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

// === УСТОЙЧИВАЯ АВТОРИЗАЦИЯ ===
async function loginWithRedirect(username, password) {
  const loginUrl = 'https://app.moiashkola.ua/';

  // 1. Получаем токен из формы логина
  const loginPage = await fetchWithCookies(loginUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const loginHtml = await loginPage.text();
  const $ = cheerio.load(loginHtml);

  const requestVerificationToken = $('input[name="__RequestVerificationToken"]').val();
  if (!requestVerificationToken) throw new Error('CSRF токен не найден');

  // 2. Отправляем логин POST-запрос
  const formData = new URLSearchParams({
    __RequestVerificationToken: requestVerificationToken,
    UserName: username,
    Password: password,
  });

  const loginRes = await fetchWithCookies(loginUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      Referer: loginUrl,
    },
    redirect: 'manual',
  });

  // 3. Переход по редиректу
  if ([302, 303].includes(loginRes.status)) {
    const location = loginRes.headers.get('location');
    if (location) {
      await fetchWithCookies(`https://app.moiashkola.ua${location}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
    }
  }

  // 4. Проверка, вошли ли мы
  const checkPage = await fetchWithCookies('https://app.moiashkola.ua/', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const checkHtml = await checkPage.text();
  if (checkHtml.includes('Prisijungti') || checkHtml.includes('Авторизация')) {
    throw new Error('Неверный логин или пароль');
  }
}

// === РОЗКЛАД ===
async function getSchedule(username, password) {
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
        const subject = $(cells[4]).text().trim();
        day.push({ subject, time });
      }
    });
    results.push(day);
  });

  return results;
}

// === ПРОФІЛЬ ===
async function getProfile(username, password) {
  await loginWithRedirect(username, password);

  const page = await fetchWithCookies('https://app.moiashkola.ua/Profilis', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const html = await page.text();
  const $ = cheerio.load(html);
  const result = [];

  $('h2, span, i').each((_, el) => {
    const text = $(el).text().trim();
    if (text) result.push(text);
  });

  return result;
}

// === Д/З ===
async function getHomework(username, password) {
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

  if (!response.ok) throw new Error('Не удалось получить домашнее задание');

  return await response.json();
}

// === АНАЛІТИКА / ОЦІНКИ ===
async function getGrades(username, password) {
  await loginWithRedirect(username, password);

  const page = await fetchWithCookies('https://app.moiashkola.ua/Analitika', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const html = await page.text();
  const $ = cheerio.load(html);
  const results = [];

  $('span').each((_, el) => {
    const text = $(el).text().trim();
    if (text) results.push(text);
  });

  return results;
}

// === API ===
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Требуются username и password' });
    const grades = await getGrades(username, password);
    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/domash', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Требуются username и password' });
    const data = await getHomework(username, password);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rozklad', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Требуются username и password' });
    const data = await getSchedule(username, password);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prof', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Требуются username и password' });
    const data = await getProfile(username, password);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// === СТАРТ СЕРВЕРА ===
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
