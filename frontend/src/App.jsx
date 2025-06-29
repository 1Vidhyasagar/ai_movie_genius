import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  CssBaseline,
  Switch,
  FormControlLabel,
  createTheme,
  ThemeProvider,
  CircularProgress,
} from "@mui/material";
import { grey } from "@mui/material/colors";

const OMDB_API_KEY = "190be3a8";

const trendingMovieTitles = [
  "Inception",
  "The Dark Knight",
  "Interstellar",
  "Avengers: Endgame",
  "The Matrix",
  "Titanic",
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [aiMovies, setAiMovies] = useState([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const results = await Promise.all(
          trendingMovieTitles.map(async (title) => {
            const res = await axios.get(
              `https://www.omdbapi.com/?t=${encodeURIComponent(
                title
              )}&apikey=${OMDB_API_KEY}`
            );
            return res.data && res.data.Response === "True" ? res.data : null;
          })
        );
        setTrendingMovies(results.filter(Boolean));
      } catch (err) {
        console.error("OMDb Trending Error:", err.message);
      }
    };
    fetchTrending();
  }, []);

  const getSuggestions = async () => {
    if (!prompt) return;

    setLoading(true);
    setResult("");
    setAiMovies([]);
    setTrendingMovies([]);

    try {
      const res = await axios.post(
        "http://host.docker.internal:5000/api/suggest",
        {
          prompt,
        }
      );

      const suggestions = res.data.result || "";
      setResult(suggestions);

      const movieTitles = suggestions
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/"([^"]+)"/);
          return match
            ? match[1].trim()
            : line
                .replace(/^\d+\.?\s*/, "")
                .split(" by ")[0]
                .trim();
        });

      const movies = await Promise.all(
        movieTitles.map(async (title) => {
          try {
            const exactRes = await axios.get(
              `https://www.omdbapi.com/?t=${encodeURIComponent(
                title
              )}&apikey=${OMDB_API_KEY}`
            );
            if (exactRes.data && exactRes.data.Response === "True")
              return exactRes.data;

            const fallbackRes = await axios.get(
              `https://www.omdbapi.com/?s=${encodeURIComponent(
                title
              )}&apikey=${OMDB_API_KEY}`
            );
            if (fallbackRes.data.Search && fallbackRes.data.Search.length > 0) {
              const firstResult = fallbackRes.data.Search[0];
              const fullDetails = await axios.get(
                `https://www.omdbapi.com/?i=${firstResult.imdbID}&apikey=${OMDB_API_KEY}`
              );
              if (fullDetails.data && fullDetails.data.Response === "True") {
                return fullDetails.data;
              }
            }

            return null;
          } catch (err) {
            console.error("OMDb fetch error for:", title, err.message);
            return null;
          }
        })
      );

      const filtered = movies.filter(Boolean);
      setAiMovies(filtered);
    } catch (err) {
      console.error("AI Suggestion Error:", err.message);
      setResult("❌ Failed to get suggestions from AI.");
    } finally {
      setLoading(false);
    }
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      background: {
        default: darkMode ? grey[900] : "#f4f6f8",
      },
    },
  });

  const cinematicFont = { fontFamily: "'Cinzel', serif" };
  const movieFont = { fontFamily: "'Playfair Display', serif" };


  const backgroundStyle = {
    background: darkMode
      ? "linear-gradient(to right, #0f2027, #203a43, #2c5364)"
      : "linear-gradient(to right, #e0eafc, #cfdef3)",
    minHeight: "100vh",
    paddingTop: "2rem",
    paddingBottom: "2rem",
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={backgroundStyle}>
        <Container maxWidth="md">
          <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                />
              }
              label={darkMode ? "Dark Mode" : "Light Mode"}
            />
          </Grid>

          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ ...cinematicFont }}
          >
            🎬 AI Movie Genius
          </Typography>

          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={12} sm={9}>
              <TextField
                fullWidth
                label="Enter a movie or description..."
                variant="outlined"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                InputProps={{ sx: { height: 56 } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={getSuggestions}
                disabled={loading}
                sx={{ height: 56 }}
              >
                {loading ? (
                  <>
                    <CircularProgress
                      size={24}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                    Thinking...
                  </>
                ) : (
                  "🎥 Suggest"
                )}
              </Button>
            </Grid>
          </Grid>

          {/* Trending Movies */}
          {trendingMovies.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                🔥 Trending Movies
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                {trendingMovies.map((movie, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        height: "100%",
                        boxShadow: 3,
                        transition: "transform 0.3s, box-shadow 0.3s",
                        "&:hover": {
                          transform: "scale(1.03)",
                          boxShadow: 6,
                        },
                        m: 1, // add margin around each card
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="300"
                        image={
                          movie.Poster && movie.Poster !== "N/A"
                            ? movie.Poster
                            : "https://via.placeholder.com/500x750?text=No+Image"
                        }
                        alt={movie.Title}
                      />
                      <CardContent>
                        <Typography variant="h6" sx={{ ...movieFont }}>
                          {movie.Title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          ⭐ {movie.imdbRating} | 📅 {movie.Year}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* AI Suggested Movies */}
          {aiMovies.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
                🤖 AI Suggested Movies
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                {aiMovies.map((movie, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ height: "100%", boxShadow: 3 }}>
                      <CardMedia
                        component="img"
                        height="300"
                        image={
                          movie.Poster && movie.Poster !== "N/A"
                            ? movie.Poster
                            : "https://via.placeholder.com/500x750?text=No+Image"
                        }
                        alt={movie.Title}
                      />
                      <CardContent>
                        <Typography variant="h6">{movie.Title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ⭐ {movie.imdbRating} | 📅 {movie.Year}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* AI Fallback Text */}
          {!aiMovies.length && result && (
            <Card sx={{ mt: 4, boxShadow: 3 }}>
              <CardContent>
                <Typography
                  variant="body1"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                >
                  {result}
                </Typography>
              </CardContent>
            </Card>
          )}
          <Typography
            variant="body2"
            align="center"
            sx={{
              mt: 5,
              pt: 3,
              borderTop: `1px solid ${darkMode ? grey[700] : grey[300]}`,
              fontFamily: "'Playfair Display', serif",
              color: darkMode ? grey[400] : grey[700],
            }}
          >
            © {new Date().getFullYear()} AI Movie Genius • Built with ❤️ and
            OMDb API
          </Typography>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
