const express = require('express');
const WebSocket = require('ws')
const http = require('http');

const app = express();
const server = http.createServer(app);
const printerData = {};
const connections = {};


const wsListener = ip => {
    if (!(printerData[ip] === undefined || printerData[ip].offline)) {
        console.log("Already connected to printer on ip: " + ip)
        return;
    }

    let interval;
    const ws = new WebSocket(`ws://${ip}:9999/`);

    ws.on('open', () => {
        connections[ip] = true
        ws.on('pong', () => { connections[ip] = true; });

        interval = setInterval(() => {
            if (!connections[ip]) { return ws.terminate(); }
            connections[ip] = false;
            ws.ping();
        }, 5000);
        console.log("Connected to printer on ip: " + ip)
    });

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            printerData[ip] = ip in printerData ? {...printerData[ip], ...data} : data;
        } catch (e) {
            console.error(`Error parsing of data from printer on ip: ${ip}\n\n\n${e}`);
        }
    };


    ws.on('close', () => {
        console.log("Disconnected from printer on ip: " + ip);
        printerData[ip] = {offline: true};
        connections[ip] = false;
        clearInterval(interval)
    });

    ws.on('error', () => {
        console.error("Error in WebSocket connection ");
        printerData[ip] = {offline: true};
        connections[ip] = false;
        clearInterval(interval)
    });
}


app.get('/printer-ip/:printerIp', (req, res) => {
    const ip = req.params.printerIp;

    wsListener(ip);

    if (ip in printerData) {
        return res.json(printerData[ip])
    }

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(res.json(printerData[ip]));
        }, 1000)
    })
});



const PORT = process.env.PORT || 3110;

server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));

