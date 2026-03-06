const API_KEY = "LCc8yC3V8qH2zpKDNlqx2G9jEKIw2kwPOhuNCX2a";
const API_URL = "https://api.nasa.gov/planetary/apod";
const STORAGE_KEY = "nasaSearches";

const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const imageContainer = document.getElementById("current-image-container");
const searchHistoryList = document.getElementById("search-history");

async function fetchApodByDate(date) {
  const response = await fetch(`${API_URL}?api_key=${API_KEY}&date=${date}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

function renderImageData(data) {
  const { title, explanation, date, media_type, url } = data;

  let mediaHtml = "";

  if (media_type === "image") {
    mediaHtml = `<img src="${url}" alt="${title}" />`;
  } else {
    mediaHtml = `<iframe src="${url}" title="${title}" allowfullscreen></iframe>`;
  }

  imageContainer.innerHTML = `
    ${mediaHtml}
    <h3>${title}</h3>
    <p><strong>Date:</strong> ${date}</p>
    <p>${explanation}</p>
  `;
}

function renderError(message) {
  imageContainer.innerHTML = `<p class="error">${message}</p>`;
}

async function getCurrentImageOfTheDay() {
  const currentDate = new Date().toISOString().split("T")[0];

  try {
    const data = await fetchApodByDate(currentDate);
    renderImageData(data);
  } catch (error) {
    renderError("Unable to fetch the current image of the day.");
    console.error(error);
  }
}

async function getImageOfTheDay(date) {
  const selectedDate = date || searchInput.value;

  if (!selectedDate) {
    renderError("Please select a valid date.");
    return;
  }

  try {
    const data = await fetchApodByDate(selectedDate);
    renderImageData(data);
    saveSearch(selectedDate);
    addSearchToHistory();
  } catch (error) {
    renderError("Unable to fetch image for the selected date.");
    console.error(error);
  }
}

function saveSearch(date) {
  const searches = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  if (!searches.includes(date)) {
    searches.push(date);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  }
}

function addSearchToHistory() {
  const searches = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  searchHistoryList.innerHTML = "";

  searches
    .slice()
    .reverse()
    .forEach((date) => {
      const li = document.createElement("li");
      li.textContent = date;
      li.addEventListener("click", () => {
        searchInput.value = date;
        getImageOfTheDay(date);
      });
      searchHistoryList.appendChild(li);
    });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  getImageOfTheDay();
});

window.addEventListener("DOMContentLoaded", () => {
  getCurrentImageOfTheDay();
  addSearchToHistory();
});