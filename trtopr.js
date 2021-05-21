const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const https = require('https');
const useragent = require('express-useragent');

const app = express();
const port = process.env.PORT || 81;

app.use(express.static('public'));

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	next();
});

app.use(useragent.express());
app.get('/useragent', function (req, res) {
	res.send(req.useragent);
});

const sslServer = https.createServer(
	{
		key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
		cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
	},
	app
);

const crawl = async ({ url }) => {
	let obj = {};

	const response = await fetch(url);
	const dataFromAPI = await response.json();

	// read the current file and save to obj
	let data = getJsonData();
	obj = JSON.stringify(data);

	// append dataFromAPI to currentData
	obj = {
		...data,
		[`${Object.keys(data).length + 1}`]: dataFromAPI,
	};

	let finalData = JSON.stringify(obj);

	// write updated data to data.json
	fs.writeFile('data.json', finalData, (err) => {
		if (err) {
			throw err;
		}
		console.log(`JSON data is saved id ${Object.keys(data).length + 1}`);
	});
};

const getJsonData = () => {
	const data = fs.readFileSync('data.json');
	const result = JSON.parse(data);

	return result;
};

// execute the function every hour
setInterval(function () {
	crawl({
		url: 'https://uw9yf1u6qf.execute-api.ca-central-1.amazonaws.com/prod/live-counter',
	});
}, 3600000);

app.get('/data', (req, res) => {
	const data = getJsonData();
	res.send(data);
});

app.get('/fetch', async (req, res) => {
	const data = await fetch(
		'https://uw9yf1u6qf.execute-api.ca-central-1.amazonaws.com/prod/live-counter'
	);
	const json = await data.json();
	res.send(json);
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
