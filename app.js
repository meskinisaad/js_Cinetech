// SPA Navigation
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// DATA
let films = JSON.parse(localStorage.getItem("films")) || [];
let directors = JSON.parse(localStorage.getItem("directors")) || [];
let ratings = [];

// ELEMENTS GLOBAUX
const movieSearch = document.getElementById("movieSearch");
const apiMsg = document.getElementById("apiMsg");
const directorForm = document.getElementById("directorForm");
const directorName = document.getElementById("directorName");

// RENDER FILMS
function renderFilms() {
  const filmListEl = document.getElementById("filmList");
  filmListEl.innerHTML = "";
  films.forEach(f => {
    filmListEl.innerHTML += `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="px-4 py-3">
          <img src="${f.poster}" class="w-14 h-20 object-cover rounded-md border border-slate-700" />
        </td>
        <td class="px-4 py-3 font-medium">${f.title}</td>
        <td class="px-4 py-3 text-slate-300">${f.genre}</td>
        <td class="px-4 py-3 text-slate-300">${f.year}</td>
        <td class="px-4 py-3 text-slate-300">${f.director}</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-slate-800 text-xs">
            ⭐ ${f.rating}
          </span>
        </td>
        <td class="px-4 py-3 text-center">
          <button 
            onclick="deleteFilm(${f.id})"
            class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            title="Supprimer"
          >
            🗑️
          </button>
        </td>
      </tr>
    `;
  });
}

function saveFilms() {
  localStorage.setItem("films", JSON.stringify(films));
  renderFilms();
  updateKPI();
}

function deleteFilm(id) {
  if (confirm("Supprimer ce film ?")) {
    films = films.filter(f => f.id !== id);
    saveFilms();
  }
}

// DIRECTORS
directorForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = directorName.value.trim();
  if (!name) return;

  directors.push(name);
  localStorage.setItem("directors", JSON.stringify(directors));
  renderDirectors();
  updateKPI();
  directorForm.reset();
});

function renderDirectors() {
  const directorListEl = document.getElementById("directorList");
  directorListEl.innerHTML = "";
  directors.forEach((d, i) => {
    directorListEl.innerHTML += `
      <li class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
        <span>${d}</span>
        <button 
          onclick="deleteDirector(${i})"
          class="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
        >
          Supprimer
        </button>
      </li>
    `;
  });
}

function deleteDirector(i) {
  directors.splice(i, 1);
  localStorage.setItem("directors", JSON.stringify(directors));
  renderDirectors();
  updateKPI();
}

// KPI
function updateKPI() {
  document.getElementById("kpi-films").textContent = films.length;
  document.getElementById("kpi-directors").textContent = directors.length;

  ratings = films
    .map(f => parseFloat(f.rating))
    .filter(r => !isNaN(r));

  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    document.getElementById("kpi-rating").textContent = avg.toFixed(1);
  } else {
    document.getElementById("kpi-rating").textContent = "0";
  }
}

// ENTER POUR CHERCHER FILM
if (movieSearch) {
  movieSearch.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      loadFromAPI();
    }
  });
}

// OMDB API
function loadFromAPI() {
  const name = movieSearch.value.trim();
  if (!name) {
    apiMsg.textContent = "Entre un titre de film.";
    apiMsg.classList.remove("text-emerald-400");
    apiMsg.classList.add("text-red-400");
    return;
  }

  fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(name)}&apikey=564727fa`)
    .then(res => res.json())
    .then(data => {
      if (data.Response === "False") {
        apiMsg.textContent = "Film introuvable.";
        apiMsg.classList.remove("text-emerald-400");
        apiMsg.classList.add("text-red-400");
        return;
      }

      const film = {
        id: Date.now(),
        title: data.Title,
        genre: data.Genre,
        year: data.Year,
        director: data.Director,
        rating: data.imdbRating,
        poster: data.Poster !== "N/A" ? data.Poster : "https://via.placeholder.com/60x90"
      };

      films.push(film);
      saveFilms();

      if (data.Director && !directors.includes(data.Director)) {
        directors.push(data.Director);
        localStorage.setItem("directors", JSON.stringify(directors));
        renderDirectors();
      }

      apiMsg.textContent = "Film + poster ajoutés ✔️";
      apiMsg.classList.remove("text-red-400");
      apiMsg.classList.add("text-emerald-400");
      movieSearch.value = "";
    })
    .catch(() => {
      alert("Erreur API");
    });
}

// INIT
renderFilms();
renderDirectors();
updateKPI();
