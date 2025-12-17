const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

console.log('WebSocket server started on port 8080');

wss.on('connection', function connection(ws) {
  console.log('A new client connected');

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    
    // Broadcast to all clients
    wss.clients.forEach(function each(client) {
      if (client.readyState === ws.OPEN) { // Broadcast to all, including sender for this implementation
        client.send(data, { binary: false });
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

});
