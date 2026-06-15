const searchBtn = document.getElementById("searchBtn");
const querySearch = document.getElementById("querySearch");
const weatherSign = document.getElementById("sign");
const locName = document.getElementById("location");
const deg = document.getElementById("degree");
const com1 = document.getElementById("comment1");
const com2 = document.getElementById("comment2");
const humidity = document.getElementById("humid");
const wind = document.getElementById("wind");
const uv = document.getElementById("uv");
const forecast = document.getElementById("forecast");
const heroSection = document.getElementById("heroSection");
const displaySavedData = document.getElementById("showData");
const storeData = [];

//this uses navigator to get the coordinates and sends to the weather function to get the current and 5 day weather forecast
navigator.geolocation.getCurrentPosition(async function (position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    );
    if (response.ok) {
      const data = await response.json();
      const city = data.address.city;
      const country = data.address.country;
      if (city) {
        locName.innerHTML = `
        <strong>${city}, ${country}</strong>
        
      `;
        //stores the city in the local storage
        storeData.unshift(city);
      } else {
        const country = data.address.country;
        locName.innerHTML = `
        <strong>${country}</strong>`;
      }
      console.log(city);

      getWeather(lat, lon);
    }
  } catch (error) {
    console.log(error);
    showError();
  }
});

querySearch.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    handleSearch(querySearch);
  }
});
searchBtn.addEventListener("click", function () {
  handleSearch(querySearch);
});

async function handleSearch(input) {
  const value = typeof input === "string" ? input : input.value;
  if (!value) {
    alert("field cannot be empty");
  } else {
    const coordinate = await getCoordinates(value);
    if (!coordinate.lat || !coordinate.lon) {
      return;
    }
    const weather = await getWeather(coordinate.lat, coordinate.lon);
    showData(storeData);
  }
}

//this function gets the lat,long and also create the local storage
async function getCoordinates(city) {
  if (city === "") {
    return;
  }
  storeData.unshift(city);
  localStorage.setItem("savedData", JSON.stringify(storeData));
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      // console.log(data);
      locName.innerHTML = `
        <strong>${data.results[0].name}, ${data.results[0].country}</strong>
      `;
      const lat = data.results[0].latitude;
      const lon = data.results[0].longitude;
      return { lat, lon };
    }
  } catch (error) {
    console.log("Error", error);
    showError();
  }
}

async function getWeather(lat, lon) {
  showLoader();

  if (!lat || !lon) {
    console.log("Coordinates not found");
    return null;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=tem
perature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_m
ax,temperature_2m_min,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      // console.log(data);
      const weatherValue = getWeatherDescription(data.current);
      const weatherHumidity = data.current.relative_humidity_2m;
      const weatherTemp = data.current.temperature_2m;
      const weatherWind = data.current.wind_speed_10m;
      const weatherDesc = weatherValue[0];
      const weatherSymbol = weatherValue[1];
      displayCurrentWeather(
        weatherHumidity,
        weatherTemp,
        weatherWind,
        weatherDesc,
        weatherSymbol,
      );
      displayForecastDaily(data);
    }
  } catch (error) {
    console.log("Error:", error);
    showError();
  }
}

// this function shows a loading animation when data is being fetched
function showLoader() {
  forecast.innerHTML = `
        <div class="loader">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
}

//this function display the data for the current weather

function displayCurrentWeather(
  weatherHumidity,
  weatherTemp,
  weatherWind,
  weatherDesc,
  weatherSymbol,
) {
  weatherSign.classList.add("sign");
  deg.innerHTML = `<p id="degree">${weatherTemp}&deg;C</p>`;
  humidity.innerHTML = `<p id="humid">${weatherHumidity}%</p>`;
  wind.innerHTML = `<p id="wind">${weatherWind}km/h</p>`;
  com1.innerHTML = `<p id="comment1">${weatherDesc}</p>`;
  weatherSign.innerHTML = `<p id="comment1">${weatherSymbol}</p>`;
  com2.innerHTML = `<p id="comment2">Feels like 36&deg;C</p>`;
  uv.innerHTML = `<p id="uv">HIGH</p>`;
}

//this function displays the data for the 5 day forecast
function displayForecastDaily(data) {
  const daily = data.daily;
  const combinedData = daily.time.slice(0, 5).map((time, index) => {
    return {
      time: convertDate(time, index),
      hTemp: daily.temperature_2m_max[index],
      lTemp: daily.temperature_2m_min[index],
      weather_code: daily.weather_code[index],
    };
  });

  console.log(combinedData);
  forecast.innerHTML = ``;
  for (cdata of combinedData) {
    const weatherValue = getWeatherDescription(cdata);
    const card = document.createElement("div");
    card.innerHTML = "";
    card.classList.add("fcard");
    card.innerHTML = `
        <p>${cdata.time}</p>
        <p class="sign">${weatherValue[1]}</p>
        <div>
            <p>${cdata.hTemp}&deg;</p>
            <p id="para">${cdata.lTemp}&deg;</p>
        </div>
    `;
    forecast.appendChild(card);
  }
}

//this function converts the weathercode and returns a description with corresponding symbol
function getWeatherDescription(cdata) {
  switch (cdata.weather_code) {
    case 0:
      return ["Clear sky", "☀"];
    case 1:
    case 2:
    case 3:
      return ["Partly cloudy", "⛅"];

    case 45:
    case 48:
      return ["Foggy", "🌫️"];

    case 51:
    case 53:
    case 55:
      return ["Drizzle", "🌨️"];

    case 61:
    case 63:
    case 65:
      return ["Rain", "⛈️"];

    case 71:
    case 73:
    case 75:
      return ["Snow", "❄"];

    case 80:
    case 81:
    case 82:
      return ["Rain showers", "🌧️"];

    case 95:
    case 96:
      return ["Thunderstorm", "⛈"];

    default:
      return ["Unknown", ""];
  }
}

//this function converts the data to weekday
function convertDate(time, index) {
  if (index === 0) {
    return "Today";
  } else {
    return new Date(time).toLocaleDateString("en-us", {
      weekday: "short",
    });
  }
}

//this function get the local storage data and displays them
function showData() {
  const openData = JSON.parse(localStorage.getItem("savedData"));
  const uniqueData = [...new Set(openData)].slice(0, 5);
  displaySavedData.innerHTML = ``;
  // console.log(limitedData);
  uniqueData.forEach((element) => {
    const tag = document.createElement("button");
    tag.className = "chip";
    tag.dataset.brand = element;
    tag.textContent = element;
    tag.onclick = () => handleSearch(element);
    displaySavedData.appendChild(tag);
  });
}

//this function handles the errors encountered in the async
function showError() {
  locName.classList.add("error");
  locName.innerHTML = `
  <p>Cannot fetch data at this time. Try again later</p>`;
}
