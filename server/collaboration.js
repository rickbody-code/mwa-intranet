const WebSocket = require('ws');
const Y = require('yjs');

// Map to store documents by room name
const docs = new Map();

// Simple WebSocket setup for Yjs collaboration
function setupWSConnection(ws, req) {
  let doc = null;
  let roomName = null;
  
  ws.on('message', (message) => {
    try {
      const buffer = new Uint8Array(message);
      
      // First message should contain room name
      if (!roomName) {
        const roomMessage = new TextDecoder().decode(buffer);
        if (roomMessage.startsWith('join:')) {
          roomName = roomMessage.substring(5);
          
          // Get or create document for this room
          if (!docs.has(roomName)) {
            docs.set(roomName, new Y.Doc());
          }
          doc = docs.get(roomName);
          
          // Send current document state to new client
          const currentState = Y.encodeStateAsUpdate(doc);
          if (currentState.length > 0) {
            ws.send(currentState);
          }
          
          console.log(`Client joined room: ${roomName}`);
          return;
        }
      }
      
      if (doc && roomName) {
        // Apply update to document
        Y.applyUpdate(doc, buffer);
        
        // Broadcast to all other clients in the same room
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.roomName === roomName) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    if (roomName) {
      console.log(`Client left room: ${roomName}`);
    }
  });
  
  // Store room name on the WebSocket for routing
  Object.defineProperty(ws, 'roomName', {
    get: () => roomName,
    enumerable: true
  });
}

// Create WebSocket server for Yjs collaboration
const wss = new WebSocket.Server({ 
  port: 1234,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      windowBits: 13,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 1024,
    },
    threshold: 1024,
    concurrencyLimit: 10,
    clientMaxWindow: 13,
    clientMaxNoContextTakeover: false,
    serverMaxWindow: 13,
    serverMaxNoContextTakeover: false,
    serverNoContextTakeover: false,
    clientNoContextTakeover: false,
  }
});

console.log('Yjs WebSocket server running on port 1234');

// Handle connections
wss.on('connection', (ws, req) => {
  console.log('New collaboration connection');
  
  setupWSConnection(ws, req, {
    // Optional: Add authentication here
    // authenticate: (req) => {
    //   // Verify JWT token or session
    //   return true;
    // }
  });
  
  ws.on('close', () => {
    console.log('Collaboration connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down collaboration server...');
  wss.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down collaboration server...');
  wss.close(() => {
    process.exit(0);
  });
});