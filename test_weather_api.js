// No import needed for native fetch in Node 18+
// If running on older node, this might fail, but let's try native first.

async function testWeather() {
    try {
        console.log('--- Testing Geocoding API ---');
        const location = 'Hyderabad';
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
        console.log('Geo URL:', geoUrl);

        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) {
            console.error('Geocoding API failed:', geoRes.status, geoRes.statusText);
            return;
        }

        const geoJson = await geoRes.json();
        console.log('Geo Response:', JSON.stringify(geoJson, null, 2));

        const place = geoJson?.results?.[0];
        if (!place) {
            console.error('No results found for location');
            return;
        }

        const { latitude, longitude } = place;
        console.log(`Resolved: Lat ${latitude}, Lon ${longitude}`);

        console.log('\n--- Testing Weather API ---');
        // Using the exact URL format from my fix
        const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        console.log('Weather URL:', wxUrl);

        const wxRes = await fetch(wxUrl);
        if (!wxRes.ok) {
            console.error('Weather API failed:', wxRes.status, wxRes.statusText);
            const text = await wxRes.text();
            console.error('Error body:', text);
            return;
        }

        const wx = await wxRes.json();
        console.log('Weather Response:', JSON.stringify(wx, null, 2));

    } catch (error) {
        console.error('Exception:', error);
    }
}

testWeather();
