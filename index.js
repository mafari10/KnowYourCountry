import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
// Db connection
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
});
db.connect().catch((err) => {
  console.error("Database connection error:", err);
});
// Db query
async function visited_countries() {
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");
    let countries = [];
    result.rows.forEach((country) => {
      countries.push(country.country_code);
    });
    return countries;
  } catch (error) {
    console.error("Error fetching visited countries:", error);
  }
}

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", async (req, res) => {
  try {
    const countries = await visited_countries();
    res.render("index.ejs", { countries: countries, total: countries.length });
  } catch (error) {
    console.error("Error rendering page:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/add", async (req, res) => {
  const country = req.body["country"].trim();

  // select country code by condition
  try {
    const dbQueryCountryCode = await db.query(
      "SELECT country_code FROM countries WHERE country_name = $1",
      [country]
    );
    const countryCode = dbQueryCountryCode.rows[0].country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (error) {
      const countries = await visited_countries();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Error adding country because you already visited",
      });
      console.error("Error adding country:", error);
    }
  } catch (error) {
    const countries = await visited_countries();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Error adding country because country not found",
    });
    console.error("Error fetching country code:", error);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
