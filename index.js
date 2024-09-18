import express from 'express';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import WEATHER_API from './config.js';

const app = express(); // Create an Express application
const port = 3000; // Define the port number

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Serve the cities.json file securely
app.get('/cities.json', (req, res) => {
	const citiesFilePath = path.join(__dirname, 'cities.json');
	fs.access(citiesFilePath, fs.constants.R_OK, err => {
		if (err) {
			console.error('Error accessing cities.json:', err);
			res.status(500).send('Internal Server Error');
		} else {
			res.sendFile(citiesFilePath, err => {
				if (err) {
					console.error('Error sending cities.json:', err);
					res.status(500).send('Internal Server Error');
				}
			});
		}
	});
});

let lat = 26.8206; // Lattitude of the location that will change
let lon = 30.8025; // Longtitude of the location that will change

// Route to handle the root URL
app.get('/', (req, res) => {
	getWeatherData(res); // Fetch and render weather data for the default location
});

// Route to handle form submissions for city search
app.post('/search', (req, res) => {
	const city = req.body.city; // Get the city name from the form data

	// Read and parse the cities.json file
	const citiesFilePath = path.join(__dirname, 'cities.json');
	fs.readFile(citiesFilePath, 'utf8', (err, data) => {
		if (err) {
			console.error('Error reading cities.json:', err);
			res.status(500).send('Internal Server Error');
			return;
		}

		const cities = JSON.parse(data); // Parse the JSON data
		const cityData = cities.find(
			c => c.name.toLowerCase() === city.toLowerCase()
		); // Find the city in the JSON data

		if (cityData) {
			// City found, update latitude and longitude
			lat = cityData.lat; // Change the lattitude
			lon = cityData.lng; // Change the longtitude
			getWeatherData(res); // Fetch and render weather data for the found city
		} else {
			// City not found
			res.status(404).send('City not found');
		}
	});
});

// App listening on port 3000 when starting logs a message
app.listen(port, () => console.log('app running on ' + port));

// Function to fetch and render weather data in index.ejs using axios.
function getWeatherData(res) {
	axios
		.get(
			`https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${WEATHER_API}`
		)
		.then(function (response) {
			const resp = response.data; // The response data
			const weather = resp.weather[0]; // A var to fetch data easier
			// Render the index.ejs file with the datas aquired.
			res.render('index.ejs', {
				temp: `${floorWeather(resp.main.temp)}°`,
				main: weather.main,
				max: `${floorWeather(resp.main.temp_max)}°`,
				min: `${floorWeather(resp.main.temp_min)}°`,
				name: resp.name,
				country: resp.sys.country,
				weather: checkWeatherCode(weather.id),
				feels_like: `${floorWeather(resp.main.feels_like)}°`,
				wind_speed: resp.wind.speed,
				wind_degree: resp.wind.deg,
				humidity: resp.main.humidity,
			});
		})
		// Handling error
		.catch(function (error) {
			console.log(error);
		});
}

// Floors or rounds the weather based on the last 2 decimal digits
function floorWeather(num) {
	if (num) {
		const decimalPart = num.toString().split('.')[1];
		if (decimalPart && decimalPart.length >= 2) {
			const lastTwoDigits = parseInt(decimalPart.slice(0, 2), 10);
			if (lastTwoDigits >= 50) {
				return Math.ceil(num);
			}
		}
		return Math.floor(num);
	}
	return null;
}

// Checks weather code to be able to use it on the background, it returns a string that is passed to the index.ejs to render the corresponding video.
function checkWeatherCode(code) {
	if (code) {
		if (code === 800) {
			return 'clear';
		} else if (code >= 200 && code <= 232) {
			return 'storm';
		} else if (code >= 300 && code <= 321) {
			return 'drizzle';
		} else if (code >= 500 && code <= 531) {
			return 'rain';
		} else if (code >= 600 && code <= 622) {
			return 'snow';
		} else if (code >= 801 && code <= 804) {
			return 'cloudy';
		}
	}
	return null;
}
