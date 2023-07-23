const apiKey = "cfa02226";
const moviesPerPage = 10;
let currentPage = 1;
let totalResults = 0;
let currentMovies = [];

const searchInput = document.getElementById("search");
const searchButton = document.getElementById("search-button");
const movieListContainer = document.getElementById("movies");
const movieDetailsContainer = document.getElementById("movie-details");
const paginationContainer = document.getElementById("pagination");

async function fetchMovies(searchQuery, page) {
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${apiKey}&s=${searchQuery}&page=${page}`
    );
    const data = await response.json();
    if (data.Response === "True") {
      totalResults = parseInt(data.totalResults);
      return data.Search;
    } else {
      throw new Error(data.Error);
    }
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    return [];
  }
}

function displayMovies(movies) {
  movieListContainer.innerHTML = "";
  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");
    movieCard.dataset.imdbID = movie.imdbID;
    movieCard.innerHTML = `
      <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster">
      <h2 class="movie-title">${movie.Title}</h2>
    `;
    movieCard.addEventListener("click", () => showMovieDetails(movie.imdbID));
    movieListContainer.appendChild(movieCard);
  });
}

searchButton.addEventListener("click", async () => {
  const searchQuery = searchInput.value.trim();
  if (searchQuery !== "") {
    currentPage = 1;
    const movies = await fetchMovies(searchQuery, currentPage);
    displayMovies(movies);
    currentMovies = movies;
    displayPagination();
  }
});

function hideMovieDetails() {
  movieDetailsContainer.style.display = "none";
}

function handlePaginationClick(page) {
  if (page >= 1 && page <= Math.ceil(totalResults / moviesPerPage)) {
    movieDetailsContainer.style.display = "none";
    currentPage = page;
    fetchMoviesAndDisplay(searchInput.value.trim(), currentPage);
  }
}

async function fetchMoviesAndDisplay(searchQuery, page) {
  const movies = await fetchMovies(searchQuery, page);
  movieListContainer.innerHTML = "";
  if (movies.length === 0) {
    hideMovieDetails();
    showNoMoviesFoundMessage();
  } else {
    showPaginationButtons();
    displayMovies(movies);
    currentMovies = movies;
    displayPagination();
  }
}

function displayPagination() {
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(totalResults / moviesPerPage);
  const maxVisibleButtons = 5;
  const halfVisibleButtons = Math.floor(maxVisibleButtons / 2);
  let startPage = Math.max(currentPage - halfVisibleButtons, 1);
  let endPage = Math.min(startPage + maxVisibleButtons - 1, totalPages);

  if (endPage - startPage + 1 < maxVisibleButtons) {
    startPage = Math.max(endPage - maxVisibleButtons + 1, 1);
  }

  const previousButton = document.createElement("button");
  previousButton.classList.add("pagination-button");
  previousButton.textContent = "Previous";
  previousButton.disabled = currentPage === 1;
  previousButton.addEventListener("click", () =>
    handlePaginationClick(currentPage - 1)
  );
  paginationContainer.appendChild(previousButton);

  for (let i = startPage; i <= endPage; i++) {
    const paginationButton = document.createElement("button");
    paginationButton.classList.add("pagination-button");
    paginationButton.textContent = i;
    paginationButton.disabled = i === currentPage;
    paginationButton.addEventListener("click", () => handlePaginationClick(i));
    paginationContainer.appendChild(paginationButton);

    paginationButton.style.opacity = "0";
    paginationButton.style.pointerEvents = "none";
    setTimeout(() => {
      paginationButton.style.opacity = "1";
      paginationButton.style.pointerEvents = "auto";
    }, 100);
  }

  const nextButton = document.createElement("button");
  nextButton.classList.add("pagination-button");
  nextButton.textContent = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () =>
    handlePaginationClick(currentPage + 1)
  );
  paginationContainer.appendChild(nextButton);

  nextButton.style.opacity = "0";
  nextButton.style.pointerEvents = "none";
  setTimeout(() => {
    nextButton.style.opacity = "1";
    nextButton.style.pointerEvents = "auto";
  }, 100);
}

let currentDisplayedMovieID = null;

async function showMovieDetails(imdbID) {
  if (imdbID === currentDisplayedMovieID) {
    hideMovieDetails();
    currentDisplayedMovieID = null;
    return;
  }

  const response = await fetch(
    `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}`
  );
  const movieData = await response.json();

  const titleElement = document.getElementById("movie-title");
  const posterElement = document.getElementById("movie-poster");
  const releaseYearElement = document.getElementById("release-year");
  const genreElement = document.getElementById("genre");
  const plotElement = document.getElementById("plot");

  titleElement.textContent = movieData.Title;
  posterElement.src = movieData.Poster;
  releaseYearElement.textContent = movieData.Year;
  genreElement.textContent = movieData.Genre;
  plotElement.textContent = movieData.Plot;

  movieDetailsContainer.dataset.imdbID = imdbID;
  movieDetailsContainer.style.display = "block";
  movieDetailsContainer.scrollIntoView({ behavior: "smooth" });

  loadUserRating(imdbID);
  displayUserComments(imdbID);

  currentDisplayedMovieID = imdbID;
}

const ratingStars = document.querySelectorAll(".stars .star");
const userCommentInput = document.getElementById("comment-input");
const submitCommentButton = document.getElementById("submit-comment");
const commentsContainer = document.getElementById("comments");

function loadUserRating(imdbID) {
  const userRating = localStorage.getItem(`rating_${imdbID}`);
  ratingStars.forEach((star) => {
    star.classList.remove("selected");
    if (star.dataset.rating <= userRating) {
      star.classList.add("selected");
    }
  });
}

function handleRatingSelection(imdbID, rating) {
  localStorage.setItem(`rating_${imdbID}`, rating);
  loadUserRating(imdbID);
}

function fetchUserComments(imdbID) {
  const comments = localStorage.getItem(`comments_${imdbID}`);
  return comments ? JSON.parse(comments) : [];
}

function saveUserComments(imdbID, comments) {
  localStorage.setItem(`comments_${imdbID}`, JSON.stringify(comments));
}

function handleCommentSubmission(imdbID, comment) {
  const userComments = fetchUserComments(imdbID);
  userComments.push(comment);
  saveUserComments(imdbID, userComments);

  displayUserComments(imdbID);

  userCommentInput.value = "";
}

function showNoMoviesFoundMessage() {
  movieListContainer.innerHTML =
    '<p class="no-movies-message">No movie found!</p>';
  paginationContainer.style.display = "none";
}

function displayUserComments(imdbID) {
  const userComments = fetchUserComments(imdbID);
  commentsContainer.innerHTML = "";

  if (userComments.length > 0) {
    const commentsList = document.createElement("ul");
    const previousCommentsHeader = document.createElement("h4");
    previousCommentsHeader.textContent = "Previous comments";
    commentsContainer.appendChild(previousCommentsHeader);

    userComments.forEach((comment) => {
      const commentItem = document.createElement("li");
      commentItem.textContent = comment;
      commentsList.appendChild(commentItem);
    });
    commentsContainer.appendChild(commentsList);
  } else {
    commentsContainer.textContent = "No comments yet.";
  }
}

movieDetailsContainer.addEventListener("click", (event) => {
  if (event.target.classList.contains("star")) {
    const star = event.target;
    const imdbID = movieDetailsContainer.dataset.imdbID;
    const rating = star.dataset.rating;
    handleRatingSelection(imdbID, rating);
  }
});

movieDetailsContainer.addEventListener("click", (event) => {
  if (event.target.id === "submit-comment") {
    const imdbID = movieDetailsContainer.dataset.imdbID;
    const commentInput = document.getElementById("comment-input");
    const comment = commentInput.value.trim();
    if (comment !== "") {
      handleCommentSubmission(imdbID, comment);
      commentInput.value = "";
    }
  }
});

function showNoMoviesFoundMessage() {
  movieListContainer.innerHTML =
    '<p class="no-movies-message">No movie found!</p>';
  paginationContainer.style.display = "none";
}

function showPaginationButtons() {
  paginationContainer.style.display = "flex";
}

function handleSearch() {
  const searchQuery = searchInput.value.trim();
  if (searchQuery !== "") {
    currentPage = 1;
    fetchMoviesAndDisplay(searchQuery, currentPage);
  } else {
    hideMovieDetails();
  }
}

searchButton.addEventListener("click", handleSearch);

searchInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

function handleCommentSubmission(imdbID, comment) {
  const userComments = fetchUserComments(imdbID);
  userComments.push(comment);
  saveUserComments(imdbID, userComments);

  displayUserComments(imdbID);

  const commentInput = document.getElementById("comment-input");
  commentInput.value = "";
}

submitCommentButton.addEventListener("click", () => {
  const imdbID = movieDetailsContainer.dataset.imdbID;
  const commentInput = document.getElementById("comment-input");
  const comment = commentInput.value.trim();
  if (comment !== "") {
    handleCommentSubmission(imdbID, comment);
  }
});

userCommentInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const imdbID = movieDetailsContainer.dataset.imdbID;
    const commentInput = document.getElementById("comment-input");
    const comment = commentInput.value.trim();
    if (comment !== "") {
      handleCommentSubmission(imdbID, comment);
    }
  }
});

fetchMoviesAndDisplay("", currentPage);
document.getElementById("search").focus();
