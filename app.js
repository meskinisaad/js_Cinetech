// SPA Navigation
function showSection(id) {
    document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// DATA
let films = JSON.parse(localStorage.getItem("films")) || [];
let directors = JSON.parse(localStorage.getItem("directors")) || [];
let ratings = [];

// RENDER FILMS
function renderFilms() {
    filmList.innerHTML = "";
    films.forEach(f => {
        filmList.innerHTML += `
        <tr>
            <td><img src="${f.poster}" class="poster"></td>
            <td>${f.title}</td>
            <td>${f.genre}</td>
            <td>${f.year}</td>
            <td>${f.director}</td>
            <td>${f.rating}</td>
            <td><button onclick="deleteFilm(${f.id})">🗑️</button></td>
        </tr>`;
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
    directors.push(directorName.value);
    localStorage.setItem("directors", JSON.stringify(directors));
    renderDirectors();
    updateKPI();
    directorForm.reset();
});

function renderDirectors() {
    directorList.innerHTML = "";
    directors.forEach((d, i) => {
        directorList.innerHTML += `<li>${d} <button onclick="deleteDirector(${i})">🗑️</button></li>`;
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

    if (ratings.length > 0) {
        const avg = ratings.reduce((a,b)=>a+b,0) / ratings.length;
        document.getElementById("kpi-rating").textContent = avg.toFixed(1);
    }
}
const film = document.querySelector(".films");
addEventListener("keypress", function(event){
    if (event.key === "Enter") {
         loadFromAPI();
    }
});


// OMDB API (avec Poster)
function loadFromAPI() {
    const name = movieSearch.value;

    fetch(`https://www.omdbapi.com/?t=${name}&apikey=564727fa`)
        .then(res => res.json())
        .then(data => {

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

            if (!directors.includes(data.Director)) {
                directors.push(data.Director);
                localStorage.setItem("directors", JSON.stringify(directors));
                renderDirectors();
            }

            ratings.push(parseFloat(data.imdbRating));
            updateKPI();

            apiMsg.textContent = "Film + Poster ajoutés ✔️";
        })
        .catch(() => alert("Erreur API"));
}

// INIT
renderFilms();
renderDirectors();
updateKPI();
