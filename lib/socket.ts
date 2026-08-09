import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    socket = io(url, {
      // Start with HTTP long-polling (works through almost any network/
      // firewall/proxy) and upgrade to WebSocket only if the network
      // allows it. Forcing "websocket" first breaks on restrictive
      // networks (mobile carriers, guest/event Wi-Fi, corporate firewalls)
      // that block the WebSocket upgrade, leaving the phone stuck with no
      // connection at all.
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
