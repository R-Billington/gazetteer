$(window).on('load', function () {
    if ($('#preloader').length) {      
        $('#preloader').delay(100).fadeOut('slow', function () {        
            $(this).remove();      
        });    
    }
});

///////////////////
// MAP SET UP

let southWest = L.latLng(-89.98155760646617, -180),
northEast = L.latLng(89.99346179538875, 180);
let bounds = L.latLngBounds(southWest, northEast);

let mymap = L.map('map', {
  center: bounds.getCenter(),
  zoom: 5,
  maxBounds: bounds,
  maxBoundsViscosity: 5
}).setView([0, 0], 3);

////////////////////////
// MAP TILES ADDED

/*L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    minZoom: 2,
    id: 'mapbox/light-v10',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoicm9iaW4tYiIsImEiOiJja2ZzOXYxNDIwODhqMnRzOHE1ZTJ1c25pIn0.xr3GpBX63L2YBgOfivabjw'
}).addTo(mymap);*/
//L.tileLayer.provider('Jawg.Streets', {accessToken: 'Lg2j1CGLHVHD7e6YIa4qwA1KO1k7XGf9odQVH5nSDG5Z5RmSzxtk5kl6KwhzAlvQ'}).addTo(mymap);
let tileLayer = L.tileLayer.provider('Stadia.Outdoors').addTo(mymap);
console.log(tileLayer);


///////////////////////////////
// FINDING USER LOCATION

mymap.locate({setView: true, maxZoom: 10});

function onLocationFound(e) {
    const radius = e.accuracy;
    
    L.marker(e.latlng).addTo(mymap).bindPopup('<b class="popUp">You are here!</b>').openPopup();
    
    L.circle(e.latlng, radius).addTo(mymap);
    
    let coords = e.latlng.lat + ',' + e.latlng.lng;
    $.ajax({
        url: 'libs/php/getCountryCode.php',
        type: 'POST',
        dataType: 'json',
        data: {
            q: coords 
        },
        success: function(result) {
            let country = result.results[0].countryCode;
            setTimeout(function() {
                addBorder(country);
                showInfo(country);
            }, 400);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
    })
}

mymap.on('locationfound', onLocationFound);

///////////////////////////
// GeoJSON INIT

const highResPath = 'libs/js/countriesHighRes.geo.json';
const medResPath = 'libs/js/countriesMedRes.geo.json';
const lowResPath = 'libs/js/countriesLowRes.geo.json';

let bordersJSON, lowResJSON;
$.getJSON(medResPath, function(data) {
    bordersJSON = data;
});
$.getJSON(lowResPath, function(data) {
    lowResJSON = data;
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*function onEachFeature(feature, layer) {
    layer.on({
        click : onCountryClick,
        mouseover : onCountryHighLight,
        mouseout : onCountryMouseOut
    });
};

function onCountryMouseOut(e){
	C.geojson.resetStyle(e.target);
//	$("#countryHighlighted").text("No selection");

	var countryName = e.target.feature.properties.name;
	var countryCode = e.target.feature.properties.iso_a2;
//callback when mouse exits a country polygon goes here, for additional actions
}

function onCountryClick(e){
//callback for clicking inside a polygon
    console.log(e.target.feature);
}

function onCountryHighLight(e){
	var layer = e.target;
    
    layer.setStyle({
		weight: 2,
		color: '#666',
		dashArray: '',
        fillColor: 'blue',
		fillOpacity: 0.2
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}

	var countryName = e.target.feature.properties.name;
	var countryCode = e.target.feature.properties.iso_a2;
//callback when mouse enters a country polygon goes here, for additional actions
}*/
///////////////////////////////////////////////////////////////////////////////////////////////////////////


function zoomToFeature(bounds) {
    mymap.fitBounds(bounds);
}

//////////////////////////////
// SHOW COUNTRY INFORMATION
function showInfo(country) {
    $.ajax({
            url: 'libs/php/getCountryInfo.php',
            type: 'POST',
            dataType: 'json',
            data: {
                country: country
            },
            success: function(result) {
                let name = result.data[0].countryName,
                    continent = result.data[0].continentName,
                    capital = result.data[0].capital,
                    population = addCommas(result.data[0].population),
                    area = addCommas(result.data[0].areaInSqKm),
                    currency = result.data[0].currencyCode;
                
                if (!$('#map').hasClass('narrow')) {
                    let mobile = window.matchMedia( "(max-width: 750px)" );
                    let tablet = window.matchMedia( "(max-width: 1100px)" );
                    if (mobile.matches) {
                        slideMapLeft(5);
                        slideInfoLeft(95);
                        fadeControlsOut()
                    } else if (tablet.matches) {
                        slideMapLeft(40);
                        slideInfoLeft(60);
                        fadeControlsOut()
                    } else {
                        slideMapLeft(60);
                        slideInfoLeft(40);
                    }   
                }
                $('#general').html(
                    `<h1>${name.toUpperCase()}</h1><img id="flag" alt="${name} flag" src="https://flagcdn.com/w640/${country.toLowerCase()}.png">
                    <p><span class="bold">Capital City:</span> ${capital}</p>
                    <p><span class="bold">Population:</span> ${population}</p>
                    <p><span class="bold">Area (km<sup>2</sup>):</span> ${area}</p>`
                );
                $('#show-info-btn').val('>');
                
                showExRates(currency);
                addCities(country);
                addCovidData(country, result.data[0].population);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            }
        })
}

////////////////////////////////
// FADE MAP CONTROLS IN AND OUT
function fadeControlsOut() {
    $('#map-style-buttons').fadeOut();
    $('.legend').fadeOut();
}

function fadeControlsIn() {
    $('#map-style-buttons').fadeIn();
    $('.legend').fadeIn();
}

////////////////////////////
// ADD COMMAS TO BIG NUMBERS
function addCommas(num) {
    num = num.toString();
    let end = '';
    if (num.includes('.')) {
        let index = num.indexOf('.');
        end = num.slice(index);
        num = num.slice(0, index);
    }
    let digits = num.length;
    let current = digits - 1;
    let count = 1;
    let newStr = '';
    while (count <= digits) {
        if (count % 3 === 0 && count !== digits) {
            newStr = ',' + num[current] + newStr;
        } else {
            newStr = num[current] + newStr;
        }
        current--;
        count++;
    }
    return newStr + end;
}

////////////////////////////////////////
// SHOW EXCHANGE RATES

function showExRates(currency) {
    $.ajax({
        url: 'libs/php/getExchangeRate.php',
        type: 'POST',
        dataType: 'json',
        success: function(result) {
            let usd = (1 / result.data.rates[currency]);
            let gbp = (result.data.rates.GBP * usd),
                eur = (result.data.rates.EUR * usd);
            usd = usd.toFixed(findDecimalPlaces(usd));
            gbp = gbp.toFixed(findDecimalPlaces(gbp));
            eur = eur.toFixed(findDecimalPlaces(eur));
            
            $('#rates').html(`<h2>EXCHANGE RATES</h2>
                              <p>1.00 ${currency} = ${usd} USD</p>
                              <p>1.00 ${currency} = ${gbp} GBP</p>
                              <p>1.00 ${currency} = ${eur} EUR</p>`);
            
            
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
    })
}

function findDecimalPlaces(num) {
    num = num.toString();
    if (num.includes('e')) {
        return parseInt(num[num.length - 1], 10) + 1;
    } else if (num[0] !== '0' || num[2] !== '0' || num[3] !== '0') {
        return 2;
    } else {
        let index;
        for (let i = 4; i < num.length; i++) {
            if (num[i] !== '0') {
                index = i;
                break;
            }
        }
        return index;
    }
    
}


/////////////////////////////////////
// HIGHLIGHT COUNTRY AND ADD BORDER
let countryOutline;
function addBorder(country) {
    if (countryOutline) {
        mymap.removeLayer(countryOutline);
    }
    
    bordersJSON.features.forEach(function(feature) {
        if (feature.properties.iso_a2 === country) {
            let countryJSON = {
                type: 'FeatureCollection',
                features: [feature]
            }
            
            let borderColor;
            if ($('#map-wrapper').hasClass('light-style')) {
                borderColor = '#00441b';
            } else if ($('#map-wrapper').hasClass('dark-style')) {
                borderColor = 'white';
            } else if ($('#map-wrapper').hasClass('satellite-style')) {
                borderColor = '#69ffcd';
            }
            
            countryOutline = L.geoJson(countryJSON, {
                style: {
                    fillColor: borderColor,
                    weight: 3,
                    opacity: 0.4,
                    color: borderColor,
                    fillOpacity: 0.15,
                }
            }).addTo(mymap);
        }
    })
    setTimeout(function() {
        mymap.fitBounds(countryOutline.getBounds());
    }, 700);
}

/////////////////////////////////
// SEARCH BAR FUNCTIONALITY
$('#searchBar').keypress(function(e) {
    if (e.keyCode === 13) {
        let search = e.target.value;
        $.ajax({
            url: 'libs/php/codeFromSearch.php',
            type: 'POST',
            dataType: 'json',
            data: {
                query: search
            },
            success: function(result) {
                let countryCode = result.data[0].alpha2Code;
                addBorder(countryCode);
                showInfo(countryCode);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            }
        })
    }
})

////////////////////////////////////////////
// ALLOWS CLICKING ON COUNTRY TO SELECT
mymap.addEventListener('click', function(e) {
    let latlng = mymap.mouseEventToLatLng(e.originalEvent);
    let coords = latlng.lat + ',' + latlng.lng;
    $.ajax({
        url: 'libs/php/getCountryCode.php',
        type: 'POST',
        dataType: 'json',
        data: {
            q: coords
        },
        success: function(result) {
            let country = result.results[0].countryCode;
            addBorder(country);
            showInfo(country);
            
            /*$.ajax({
                url: 'libs/php/getBounds.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    country: country
                },
                success: function(result) {
                    let north = result.data[0].north,
                        south = result.data[0].south,
                        east = result.data[0].east,
                        west = result.data[0].west 
                    let southWest = [south, west];
                    let northEast = [north, east];
                    zoomToFeature([southWest, northEast]);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR);
                    console.log(textStatus);
                    console.log(errorThrown);
                }
            })*/
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
        
    })
    
});

///////////////////////////
// ADD BIG 10 CITIES
let markerArr = [];
function addCities(country) {    
    $.ajax({
        url: 'libs/php/getCities.php',
        type: 'POST',
        dataType: 'json',
        data: {
            country: country
        },
        success: function(result) {
            if (markerArr[0]) {
                markerArr.forEach(function(marker) {
                    mymap.removeLayer(marker);
                })
            }
            
            let city1 = result.data[0],
                city2 = result.data[1],
                city3 = result.data[2],
                city4 = result.data[3],
                city5 = result.data[4],
                city6 = result.data[5],
                city7 = result.data[6],
                city8 = result.data[7],
                city9 = result.data[8],
                city10 = result.data[9];
            
            let cityArr = [city1, city2, city3, city4, city5, city6, city7, city8, city9, city10];
            let popUpArr = [];
            for (let i = 0; i < 10; i++) {
                let latlng = [cityArr[i].lat, cityArr[i].lng];
                markerArr[i] = new L.marker(latlng).addTo(mymap);
                popUpArr.push(`<b class="popUp">${cityArr[i].name}</b>
                               <div class="wikiLink"><a href="https://en.wikipedia.org/wiki/${cityArr[i].name}" target="_blank">Wikipedia</a></div>`);
            };
            
            for (let i = 0; i < 10; i++) {
                markerArr[i].bindPopup(popUpArr[i]);
                markerArr[i].on('click',function(ev) {
                    ev.target.openPopup();
                });
            };
            
            
            $('#cities').html(`<p>1. ${city1.toponymName}: ${addCommas(city1.population)}</p>
                               <p>2. ${city2.toponymName}: ${addCommas(city2.population)}</p>
                               <p>3. ${city3.toponymName}: ${addCommas(city3.population)}</p>
                               <p>4. ${city4.toponymName}: ${addCommas(city4.population)}</p>
                               <p>5. ${city5.toponymName}: ${addCommas(city5.population)}</p>
                               <p>6. ${city6.toponymName}: ${addCommas(city6.population)}</p>
                               <p>7. ${city7.toponymName}: ${addCommas(city7.population)}</p>
                               <p>8. ${city8.toponymName}: ${addCommas(city8.population)}</p>
                               <p>9. ${city9.toponymName}: ${addCommas(city9.population)}</p>
                               <p>10. ${city10.toponymName}: ${addCommas(city10.population)}</p>`);
            
            $('#weather').html('');
            cityArr.forEach(function(city) {
                addWeather(city);
            });
            
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
    })
}

//////////////////////////////////////
// ADD WEATHER FOR CITY

function addWeather(city) {
    $.ajax({
        url: 'libs/php/getWeather.php',
        type: 'POST',
        dataType: 'json',
        data: {
            lat: city.lat,
            lon: city.lng
        },
        success: function(result) {
            let weather = result.data.weather[0];
            let temp = Math.round(result.data.main.temp - 273.15);
            $('#weather').html($('#weather').html() + `<div>
                                <p>${city.toponymName}</p>
                                <p><img id="weatherIcon" alt="weather in ${city.toponymName}" src="http://openweathermap.org/img/wn/${weather.icon}@2x.png">
                                   ${temp}°C</p>
                                </div>`);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
    })
}

///////////////////////////////
// ADD COVID DATA

function addCovidData(country, population) {
    $.ajax({
        url: 'libs/php/getCovidData.php',
        type: 'POST',
        dataType: 'json',
        success: function(result) {
            covidData = result.data;
            covidData.forEach(function(element) {
                if (element['CountryCode'] === country) {
                    covidData = element;
                }
            });
            $('#covid').html(`<h2>COVID-19 DATA</h2>
                              <p>Total Confirmed Cases: ${addCommas(covidData['TotalConfirmed'])}</p>
                              <p>Total Confirmed Deaths: ${addCommas(covidData['TotalDeaths'])}</p>
                              <p>Cases Per Million: ${addCommas(Math.round(covidData['TotalConfirmed'] / (population / 1000000)))}</p>
                              <p>Deaths Per Million: ${addCommas(Math.round(covidData['TotalDeaths'] / (population / 1000000)))}</p>`);
        }, 
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
    })   
}

//////////////////////////////////
// RESET MAP VIEW BUTTON

$('#returnBtn').click(function() {
    $('.layerBtn').removeClass('clicked');
    removeLayers();
    if (markerArr[0]) {
        markerArr.forEach(function(marker) {
            mymap.removeLayer(marker);
        })
    }
    $('input[type="button"]').removeAttr('disabled');
    
    if ($('#map').hasClass('narrow')) {
        hideInfo();
    }
    
    $('#searchBar').val('');
})

/////////////////////////////////////////////////////
// FUNCTIONS FOR ADDING CHLOROPLETH LENSES
function getPopDensityColor(d) {
    return d > 1500 ? '#800026' :
           d > 700  ? '#BD0026' :
           d > 500  ? '#E31A1C' :
           d > 300  ? '#FC4E2A' :
           d > 150  ? '#FD8D3C' :
           d > 75   ? '#FEB24C' :
           d > 25   ? '#FED976' :
                      '#FFEDA0';
}

function popDensityStyle(feature) {
    let density;
    populationDensity.forEach(function(country) {
        if (feature.properties.name === country["country"]) {
            density = country["density"];
        }
    });
    let color = getPopDensityColor(density);
    return {
        weight: 0,
        opacity: 0.4,
        color: 'black',
        fillOpacity: 0.7,
        fillColor: color,
    }
} 

function getPopulationColor(p) {
    return p > 1000000000 ? '#00441b' :
           p > 200000000  ? '#006d2c' :
           p > 100000000  ? '#238b45' :
           p > 75000000   ? '#41ab5d' :
           p > 50000000   ? '#74c476' :
           p > 25000000   ? '#a1d99b' :
           p > 10000000   ? '#c7e9c0' :
           p > 5000000    ? '#e5f5e0' :
                            '#f7fcf5';
}

function populationStyle(feature) {
    let population;
    populations.forEach(function(country) {
        if (feature.properties.name === country["country"]) {
            population = country["population"];
        }
    });
    let color = getPopulationColor(population);
    return {
        weight: 0,
        opacity: 0.4,
        color: 'black',
        fillOpacity: 0.7,
        fillColor: color,
    }
}

function getGdpColor(gdp) {
    return gdp > 20000000 ? '#08306b' :
           gdp > 10000000 ? '#08519c' :
           gdp > 3000000  ? '#2171b5' :
           gdp > 750000   ? '#4292c6' :
           gdp > 300000   ? '#6baed6' :
           gdp > 100000   ? '#9ecae1' :
           gdp > 50000    ? '#c6dbef' :
           gdp > 15000    ? '#deebf7' :
                            '#f7fbff';
}

function gdpStyle(feature) {
    let gdp; 
    let gdpJson = lowResJSON.features;
    gdpJson.forEach(function(country) {
        if (feature.properties.name === country.properties.name) {
            gdp = country.properties.gdp_md_est;
        }
    });
    let color = getGdpColor(gdp);
    return {
        weight: 0,
        opacity: 0.4,
        color: 'black',
        fillOpacity: 0.7,
        fillColor: color,
    }
}

function getGdpCapColor(gdp) {
    return gdp > 50000 ? '#4a1486' :
           gdp > 35000 ? '#6a51a3' :
           gdp > 20000 ? '#807dba' :
           gdp > 10000 ? '#9e9ac8' :
           gdp > 5000  ? '#bcbddc' :
           gdp > 2000  ? '#dadaeb' :
           gdp > 1000  ? '#efedf5' :
                         '#fcfbfd';
}

function gdpCapStyle(feature) {
    let gdpCap; 
    let gdpJson = lowResJSON.features;
    gdpJson.forEach(function(country) {
        if (feature.properties.name === country.properties.name) {
            gdpCap = (country.properties.gdp_md_est * 1000000) / country.properties.pop_est;
        }
    });
    let color = getGdpCapColor(gdpCap);
    return {
        weight: 0,
        opacity: 0.4,
        color: 'black',
        fillOpacity: 0.7,
        fillColor: color,
    }
}

let C = {};
let legend;
function addLens(style, button, grades, modifier, colorFunc, title) {
    removeLayers();
    if (!$(button).hasClass('clicked')) {
        $.getJSON(medResPath, function(data) {
            C.geojson = L.geoJson(data, {
                clickable: false,
                style: style,
            }).addTo(mymap);
        });
        
        legend = L.control({position: 'bottomright'});

        legend.onAdd = function (map) {

            let div = L.DomUtil.create('div', 'info legend'),
            labels = [];
            div.innerHTML = `<strong id="legend-title">${title}</strong><br>`;
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + colorFunc((grades[i] * modifier) + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }

            return div;
        };

        legend.addTo(mymap);
        
        
        $('.layerBtn').removeClass('clicked');
        $(button).addClass('clicked');
    } else {
        $(button).removeClass('clicked');
    }
}


$('#populationDensities').click(function() {
    addLens(popDensityStyle, '#populationDensities', [0, 25, 75, 150, 300, 500, 700, 1500], 1, getPopDensityColor, 'Pop/km<sup>2</sup>');
});
$('#populations').click(function() {
    addLens(populationStyle, '#populations', [0, 5, 10, 25, 50, 75, 100, 200, 1000], 1000000, getPopulationColor, 'Millions');
});
$('#gdp').click(function() {
    addLens(gdpStyle, '#gdp', [0, 15, 50, 100, 300, 750, 3000, 10000, 20000], 1000, getGdpColor, '$1, 000');
});
$('#gdpCap').click(function() {
    addLens(gdpCapStyle, '#gdpCap', [0, 1, 2, 5, 10, 20, 35, 50], 1000, getGdpCapColor, '$1, 000');
});

////////////////////////////////
// ADD MAP COVID DATA FUNCTIONS
let covidData;

function covidStyle(feature) {
    let covidCases;
    covidData.forEach(function(country) {
        if (feature.properties.iso_a2 === country['CountryCode']) {
            covidCases = country['TotalConfirmed'];
        }
    });
    let color = getCovidColor(covidCases);
    return {
        weight: 0,
        opacity: 0.4,
        color: 'black',
        fillOpacity: 0.7,
        fillColor: color,
    }
}

function getCovidColor(cases) {
    return cases > 8000000 ? '#99000d' :
           cases > 5000000 ? '#cb181d' :
           cases > 1000000 ? '#ef3b2c' :
           cases > 500000  ? '#fb6a4a' :
           cases > 100000  ? '#fc9272' :
           cases > 50000   ? '#fcbba1' :
           cases > 10000   ? '#fee0d2' :
                             '#fff5f0';
}

function addCovidLens(styleFunc) {
    $.ajax({
        url: 'libs/php/getCovidData.php',
        type: 'POST',
        dataType: 'json',
        success: function(result) {
            covidData = result.data;
            $.getJSON(medResPath, function(data) {
                C.geojson = L.geoJson(data, {
                    clickable: false,
                    style: styleFunc,
                }).addTo(mymap);
            });
        }, 
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
    })   
}

$('#covidBtn').click(function() {
    removeLayers();
    
    if (!$(this).hasClass('clicked')) {
        addCovidLens(covidStyle);
        $('.layerBtn').removeClass('clicked');
        $(this).addClass('clicked');
    } else {
        $(this).removeClass('clicked');
    }
    
    legend = L.control({position: 'bottomright'});

        legend.onAdd = function (map) {

            let div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 10, 50, 100, 500, 1000, 5000, 8000],
                labels = [];
            div.innerHTML = `<strong id="legend-title">Thousands</strong><br>`;
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getCovidColor((grades[i] * 1000) + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }

            return div;
        };

        legend.addTo(mymap);
})


////////////////////////////////
// REMOVE LAYERS FUNCTION

function removeLayers() {
    if (countryOutline) {
        mymap.removeLayer(countryOutline);
    }
    if (weatherLayer) {
        mymap.removeLayer(weatherLayer);
    }
    if (C.geojson) {
        mymap.removeLayer(C.geojson);
        mymap.removeControl(legend);
    }
}

////////////////////////////////////
// HIDE AND SHOW INFO FUNCTIONS

function hideInfo() {
    slideMapRight();
    slideInfoRight();
    fadeControlsIn();
    $('#show-info-btn').val('<');
}

$('#show-info-btn').click(function() {
    if (!$('#map').hasClass('narrow')) {
        let mobile = window.matchMedia( "(max-width: 750px)" );
        let tablet = window.matchMedia( "(max-width: 1100px)" );
        if (mobile.matches) {
            slideMapLeft(5);
            slideInfoLeft(95);
            fadeControlsOut()
        } else if (tablet.matches) {
            slideMapLeft(40);
            slideInfoLeft(60);
            fadeControlsOut()
        } else {
            slideMapLeft(60);
            slideInfoLeft(40);
        }
        $('#show-info-btn').val('>');
    } else {
        hideInfo();
    }
})

///////////////////////////////////
// INFO SLIDE ANIMATIONS

function slideMapLeft(endWidth) {
    $('#map').addClass('narrow');
    let width = 100;
    let id = setInterval(frame, 5);
    function frame() {
        if (width === endWidth) {
            clearInterval(id);
        } else {
            width--;
            $('#map-wrapper').css('width', width + 'vw');
        }
    }
    setTimeout(function() {
        mymap.invalidateSize();
    }, 400);
}

function slideMapRight() {
    $('#map').removeClass('narrow');
    let width = 60;
    let id = setInterval(frame, 5);
    function frame() {
        if (width === 100) {
            clearInterval(id);
        } else {
            width++;
            $('#map-wrapper').css('width', width + 'vw');
        }
    }
    setTimeout(function() {
        mymap.invalidateSize();
    }, 400);
}

function slideInfoLeft(endWidth) {
    let width = 0;
    let id = setInterval(frame, 5);
    function frame() {
        if (width === endWidth) {
            clearInterval(id);
        } else {
            width++;
            $('#info').css('width', width + 'vw');
        }
    }
}

function slideInfoRight() {
    let width = 40;
    let id = setInterval(frame, 5);
    function frame() {
        if (width === 0) {
            clearInterval(id);
        } else {
            width--;
            $('#info').css('width', width + 'vw');
        }
    }
}

///////////////////////////////////
// BUTTONS TO ADD WEATHER LAYERS
let weatherLayer;

function addWeatherLayer(layerName, buttonId) {
    $(buttonId).click(function() {
        if (weatherLayer) {
            mymap.removeLayer(weatherLayer);
        }
        if (C.geojson) {
            mymap.removeLayer(C.geojson);
            mymap.removeControl(legend);
        }
        if (!$(buttonId).hasClass('clicked')) {
            weatherLayer = L.tileLayer('https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={appid}', {
                layer: layerName,
                appid: '428c70e187a922784afbb86191cb6196'
            }).addTo(mymap);
            $('.layerBtn').removeClass('clicked');
            $(buttonId).addClass('clicked');
        } else {
            $(buttonId).removeClass('clicked');
        }
    })
}

addWeatherLayer('clouds_new', '#cloudBtn');
addWeatherLayer('temp_new', '#tempBtn');
addWeatherLayer('precipitation_new', '#rainBtn');

////////////////////////////////////////
// BUTTON CLICK EFFECTS

function addClickEffectsReset(elementId, color) {
    $(`#${elementId}`).mousedown(function() {
        $(`#${elementId}`).css({
            boxShadow: '0 0 white',
            top: '3px',
        });
    });
    $(`#${elementId}`).mouseup(function() {
        $(`#${elementId}`).css({
            boxShadow: '0 3px ' + color,
            top: '0',
        });
    });
}

addClickEffectsReset('returnBtn', '#00441b');
addClickEffectsReset('hideBtn', 'black');

/////////////////////////////
// CHANGE MAP STYLE BUTTONS
function addMapStyleButtonFunctionality(buttonId, tileName) {
    $(buttonId).click(function() {
        if (!$(this).hasClass('base-map-clicked')) {
            let style = buttonId.slice(1) + '-style';
            $('#map-wrapper').removeClass().addClass(style);
            
            $('.map-style-btn').removeClass('base-map-clicked');
            mymap.removeLayer(tileLayer);
            tileLayer = L.tileLayer.provider(tileName).addTo(mymap);
            $(this).addClass('base-map-clicked');
            
            if ($('#rainBtn').hasClass('clicked')) {
                mymap.removeLayer(weatherLayer);
                weatherLayer = L.tileLayer('https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={appid}', {
                    layer: 'precipitation_new',
                    appid: '428c70e187a922784afbb86191cb6196'
                }).addTo(mymap);
            } else if ($('#cloudBtn').hasClass('clicked')) {
                mymap.removeLayer(weatherLayer);
                weatherLayer = L.tileLayer('https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={appid}', {
                    layer: 'clouds_new',
                    appid: '428c70e187a922784afbb86191cb6196'
                }).addTo(mymap);
            } else if ($('#tempBtn').hasClass('clicked')) {
                mymap.removeLayer(weatherLayer);
                weatherLayer = L.tileLayer('https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={appid}', {
                    layer: 'temp_new',
                    appid: '428c70e187a922784afbb86191cb6196'
                }).addTo(mymap);
            }
        }
    })
}

addMapStyleButtonFunctionality('#light', 'Stadia.Outdoors');
addMapStyleButtonFunctionality('#dark', 'Stadia.AlidadeSmoothDark');
addMapStyleButtonFunctionality('#satellite', 'Esri.WorldImagery');






























