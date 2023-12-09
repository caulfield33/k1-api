const express = require('express');
const WebSocket = require('ws')
const http = require('http');

const app = express();
const server = http.createServer(app);
const printerData = {};

const wsListener = ip => {
    const ws = new WebSocket(`ws://${ip}:9999/`);

    ws.onopen = () => console.log("Connected to printer on ip: " + ip);

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            printerData[ip] = ip in printerData ?  {...printerData[ip], ...data} : data;
            console.log(`\n\nData on printer: ${ip}\n${JSON.stringify(printerData[ip], null, 2)}`)
        } catch (e) {
            console.error(`Error parsing of data from printer on ip: ${ip}\n\n\n${e}`);
        }
    };

    ws.onclose = () => {
        console.log("Disconected from printer on ip: " + ip);
        delete printerData[ip];
    };  
}


app.get('/all-connected', (req, res) => {
    return res.json(printerData);
})

app.get('/printer-ip/:printerIp', (req, res) => {
    const ip = req.params.printerIp;

    if (ip in printerData) {
        return res.json(printerData[ip])
    } 

    wsListener(ip);

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (ip in printerData) {
                resolve(res.json(printerData[ip]));
                return;
            }
            reject("Cannot connect to printer on ip: " + ip)
        }, 5000)
    })
});



const PORT = process.env.PORT || 3110;

server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));