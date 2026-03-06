const API_KEY = "LCc8yC3V8qH2zpKDNlqx2G9jEKIw2kwPOhuNCX2a";
const API_URL = "https://api.nasa.gov/planetary/apod";
const STORAGE_KEY = "nasaSearches";
const APOD_START_DATE = "1995-06-16";

const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const imageContainer = document.getElementById("current-image-container");
const searchHistoryList = document.getElementById("search-history");
const refreshTodayButton = document.getElementById("refresh-today");
const clearHistoryButton = document.getElementById("clear-history");
const statusText = document.getElementById("status-text");

function getLocalIsoDate(date = new Date()) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().split("T")[0];
}

function setStatus(message, className = "") {
  statusText.textContent = message;
  statusText.className = `status ${className}`.trim();
}

function setLoading(isLoading) {
  const buttons = form.querySelectorAll("button");
  buttons.forEach((button) => {
    button.disabled = isLoading;
  });

  searchInput.disabled = isLoading;

  if (isLoading) {
    setStatus("Loading astronomy picture...", "loading");
  }
}

function getStoredSearches() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSearch(date) {
  const searches = getStoredSearches();

  if (!searches.includes(date)) {
    searches.push(date);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches.slice(-20)));
  }
}

function clearSearchHistory() {
  localStorage.removeItem(STORAGE_KEY);
  addSearchToHistory();
  setStatus("Past searches cleared.");
}

function addSearchToHistory() {
  const searches = getStoredSearches();
  searchHistoryList.innerHTML = "";

  if (!searches.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "No searches yet.";
    searchHistoryList.appendChild(li);
    return;
  }

  searches
    .slice()
    .reverse()
    .forEach((date) => {
      const li = document.createElement("li");
      li.className = "history-item";

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = date;
      button.addEventListener("click", () => {
        searchInput.value = date;
        getImageOfTheDay(date);
      });

      li.appendChild(button);
      searchHistoryList.appendChild(li);
    });
}

function isDateInRange(date, minDate, maxDate) {
  return date >= minDate && date <= maxDate;
}

async function fetchApodByDate(date) {
  const response = await fetch(`${API_URL}?api_key=${API_KEY}&date=${date}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

function renderError(message) {
  imageContainer.innerHTML = `<p class="error">${message}</p>`;
  setStatus(message, "error");
}

function createMediaElement(data) {
  if (data.media_type === "image") {
    const img = document.createElement("img");
    img.src = data.url;
    img.alt = data.title;
    img.loading = "lazy";
    return img;
  }

  const iframe = document.createElement("iframe");
  iframe.src = data.url;
  iframe.title = data.title;
  iframe.allowFullscreen = true;
  iframe.loading = "lazy";
  return iframe;
}

function renderImageData(data) {
  imageContainer.innerHTML = "";

  const media = createMediaElement(data);
  const meta = document.createElement("div");
  meta.className = "apod-meta";

  const title = document.createElement("h3");
  title.textContent = data.title;

  const dateLine = document.createElement("p");
  dateLine.className = "apod-date";
  dateLine.textContent = `Date: ${data.date}`;

  const explanation = document.createElement("p");
  explanation.className = "apod-explanation";
  explanation.textContent = data.explanation;

  meta.append(title, dateLine, explanation);
  imageContainer.append(media, meta);
  setStatus(`Showing APOD for ${data.date}.`);
}

async function getImageOfTheDay(date, options = { saveToHistory: true }) {
  const selectedDate = date || searchInput.value;
  const today = getLocalIsoDate();

  if (!selectedDate) {
    renderError("Please select a valid date.");
    return;
  }

  if (!isDateInRange(selectedDate, APOD_START_DATE, today)) {
    renderError(`Date must be between ${APOD_START_DATE} and ${today}.`);
    return;
  }

  setLoading(true);

  try {
    const data = await fetchApodByDate(selectedDate);
    renderImageData(data);

    if (options.saveToHistory) {
      saveSearch(selectedDate);
      addSearchToHistory();
    }
  } catch (error) {
    renderError("Unable to fetch image for the selected date.");
    console.error(error);
  } finally {
    setLoading(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  getImageOfTheDay();
});

refreshTodayButton.addEventListener("click", () => {
  const today = getLocalIsoDate();
  searchInput.value = today;
  getImageOfTheDay(today);
});

clearHistoryButton.addEventListener("click", clearSearchHistory);

window.addEventListener("DOMContentLoaded", () => {
  const today = getLocalIsoDate();

  searchInput.min = APOD_START_DATE;
  searchInput.max = today;
  searchInput.value = today;

  setStatus("Loading latest APOD...", "loading");
  getImageOfTheDay(today, { saveToHistory: false });
  addSearchToHistory();
});
