// ================= SPA Navigation =================
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ================= DATA =================
let films = JSON.parse(localStorage.getItem("films")) || [];
let directors = JSON.parse(localStorage.getItem("directors")) || [];
let ratings = [];

// ================= ELEMENTS =================
const movieSearch = document.getElementById("movieSearch");
const apiMsg = document.getElementById("apiMsg");
const directorForm = document.getElementById("directorForm");
const directorName = document.getElementById("directorName");

// ================= FILMS =================
function renderFilms() {
  const filmListEl = document.getElementById("filmList");
  filmListEl.innerHTML = "";

  films.forEach(f => {
    filmListEl.innerHTML += `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="px-4 py-3">
          <img src="${f.poster}" class="w-14 h-20 object-cover rounded-md border border-slate-700">
        </td>
        <td class="px-4 py-3 font-medium">${f.title}</td>
        <td class="px-4 py-3 text-slate-300">${f.genre}</td>
        <td class="px-4 py-3 text-slate-300">${f.year}</td>
        <td class="px-4 py-3 text-slate-300">${f.director}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full bg-slate-800 text-xs">
            ⭐ ${f.rating}
          </span>
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick="deleteFilm(${f.id})"
            class="h-8 w-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20">
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
  updatePieChart();
  updateYearChart();
  loadGenres(); 
}





function deleteFilm(id) {
  if (confirm("Supprimer ce film ?")) {
    films = films.filter(f => f.id !== id);
    saveFilms(); 
  }
}


// ================= DIRECTORS =================
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
  const el = document.getElementById("directorList");
  el.innerHTML = "";

  directors.forEach((d, i) => {
    el.innerHTML += `
      <li class="flex justify-between bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
        <span>${d}</span>
        <button onclick="deleteDirector(${i})"
          class="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">
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

// ================= KPI =================
function updateKPI() {
  document.getElementById("kpi-films").textContent = films.length;
  document.getElementById("kpi-directors").textContent = directors.length;

  ratings = films.map(f => parseFloat(f.rating)).filter(r => !isNaN(r));
  document.getElementById("kpi-rating").textContent =
    ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "0";
}

// ================= ENTER KEY =================
movieSearch.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    loadFromAPI();
  }
});

// ================= OMDB API =================
function loadFromAPI() {
  const name = movieSearch.value.trim();
  if (!name) {
    apiMsg.textContent = "Entre un titre de film.";
    apiMsg.className = "text-xs mt-2 text-red-400";
    return;
  }

  apiMsg.textContent = "Recherche...";
  apiMsg.className = "text-xs mt-2 text-slate-400";

  // 1️⃣ Search by name
  fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(name)}&apikey=c758f163`)
    .then(res => res.json())
    .then(search => {
      if (search.Response === "False") throw "Not found";

      // 2️⃣ Get first imdbID
      const imdbID = search.Search[0].imdbID;

      // 3️⃣ Get full movie data
      return fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=c758f163`);
    })
    .then(res => res.json())
    .then(data => {
      const film = {
        id: Date.now(),
        title: data.Title,
        genre: data.Genre,
        year: data.Year,
        director: data.Director,
        rating: data.imdbRating,
        poster: data.Poster !== "N/A"
          ? data.Poster
          : "https://via.placeholder.com/60x90"
      };

      films.push(film);
      saveFilms();

      if (data.Director && !directors.includes(data.Director)) {
        directors.push(data.Director);
        localStorage.setItem("directors", JSON.stringify(directors));
        renderDirectors();
      }

      apiMsg.textContent = "Film + poster ajoutés ✔️";
      apiMsg.className = "text-xs mt-2 text-emerald-400";
      movieSearch.value = "";
    })
    .catch(() => {
      apiMsg.textContent = "Film introuvable.";
      apiMsg.className = "text-xs mt-2 text-red-400";
    });
}
// ================= PIE CHART avec POURCENTAGE =================
let genrePieChart;

function updatePieChart() {
  const genreCount = {};

  films.forEach(f => {
    if (!f.genre) return;
    f.genre.split(",").forEach(g => {
      const genre = g.trim();
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
  });

  const labels = Object.keys(genreCount);
  const data = Object.values(genreCount);
  const total = data.reduce((a, b) => a + b, 0);

  const ctx = document.getElementById("genrePieChart");

  if (genrePieChart) {
    genrePieChart.destroy();
  }

  genrePieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          "#eab308",
          "#f59e0b",
          "#f97316",
          "#84cc16",
          "#22c55e",
          "#06b6d4",
          "#3b82f6",
          "#8b5cf6",
          "#ec4899"
        ],
        borderColor: "#020617",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return ` ${context.label} : ${value} film(s) (${percentage}%)`;
            }
          }
        },
        legend: {
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            padding: 15
          }
        }
      }
    }
  });
}

// ================= LINE CHART (FILMS PAR ANNÉE) =================
let yearChart;

function updateYearChart() {
  const yearCount = {};

  films.forEach(f => {
    const year = parseInt(f.year);
    if (!year || isNaN(year)) return;

    yearCount[year] = (yearCount[year] || 0) + 1;
  });

  const labels = Object.keys(yearCount)
    .sort((a, b) => a - b);

  const data = labels.map(y => yearCount[y]);

  const ctx = document.getElementById("yearChart");

  if (yearChart) {
    yearChart.destroy();
  }

  yearChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Nombre de films",
        data,
        tension: 0.4,
        fill: true,
        borderColor: "#eab308",
        backgroundColor: "rgba(234,179,8,0.2)",
        pointBackgroundColor: "#eab308",
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb"
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Année",
            color: "#e5e7eb"
          },
          ticks: { color: "#e5e7eb" },
          grid: { color: "#1f2937" }
        },
        y: {
          title: {
            display: true,
            text: "Nombre de films",
            color: "#e5e7eb"
          },
          ticks: { color: "#e5e7eb", stepSize: 1 },
          grid: { color: "#1f2937" }
        }
      }
    }
  });
}
/////// alphabet
function sortFilmsAlpha(order) {
  if (order === "az") {
    films.sort((a, b) => a.title.localeCompare(b.title));
  } else if (order === "za") {
    films.sort((a, b) => b.title.localeCompare(a.title));
  }
  renderFilms();
}

function sortFilmsGenre(genre) {
  if (!genre) {
    renderFilms();
    return;
  }

  const filtered = films.filter(f =>
    f.genre && f.genre.includes(genre)
  );

  const filmListEl = document.getElementById("filmList");
  filmListEl.innerHTML = "";

  filtered.forEach(f => {
    filmListEl.innerHTML += `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="px-4 py-3">
          <img src="${f.poster}" class="w-14 h-20 object-cover rounded-md border border-slate-700">
        </td>
        <td class="px-4 py-3 font-medium">${f.title}</td>
        <td class="px-4 py-3">${f.genre}</td>
        <td class="px-4 py-3">${f.year}</td>
        <td class="px-4 py-3">${f.director}</td>
        <td class="px-4 py-3">⭐ ${f.rating}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="deleteFilm(${f.id})"
            class="h-8 w-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20">
            🗑️
          </button>
        </td>
      </tr>
    `;
  });
}

function loadGenres() {
  const select = document.getElementById("sortGenre");
  const genres = new Set();

  films.forEach(f => {
    if (!f.genre) return;
    f.genre.split(",").forEach(g => genres.add(g.trim()));
  });

  select.innerHTML = `<option value="">Par catégorie</option>`;
  genres.forEach(g => {
    select.innerHTML += `<option value="${g}">${g}</option>`;
  });
}




// ================= INIT =================
renderFilms();
renderDirectors();
updateKPI();
updatePieChart();
updateYearChart();
loadGenres();
