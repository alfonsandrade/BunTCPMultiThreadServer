import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

const clients = new Map();

const ROOT_DIRECTORY = '/home/alfons/git/BunTCPChat/';

const mimeTypes = {
    '.html': 'text/html',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg'
};

Bun.listen({
    hostname: "localhost",
    port: 8080,
    socket: {
        data(socket, rawData) {
            const data = rawData.toString();

            // Analisar a requisição HTTP
            const lines = data.split("\r\n");
            const [method, url, protocol] = lines[0].split(" ");
            
            if (method === "GET") {
                const requestedPath = path.join(ROOT_DIRECTORY, url);
                if (fs.existsSync(requestedPath)) {
                    const fileExt = path.extname(requestedPath);
                    const mimeType = mimeTypes[fileExt] || 'application/octet-stream';
                    const fileData = fs.readFileSync(requestedPath);
                    const hash = crypto.createHash('sha256').update(fileData).digest('hex');

                    const response = [
                        "HTTP/1.1 200 OK",
                        `Server: BunMultiThreadServer`,
                        `Date: ${new Date().toUTCString()}`,
                        `Content-Type: ${mimeType}`,
                        `Content-Length: ${fileData.length}`,
                        `Content-SHA256: ${hash}`,
                        "",
                        ""
                    ].join("\r\n");

                    socket.write(response, 'utf-8');
                    socket.write(fileData);
                    socket.end();
                } else {
                    const errorMessage = "File Not Found";
                    const errorResponse = [
                        "HTTP/1.1 404 Not Found",
                        `Server: BunMultiThreadServer`,
                        `Date: ${new Date().toUTCString()}`,
                        "Content-Type: text/html",
                        `Content-Length: ${errorMessage.length}`,
                        "",
                        errorMessage
                    ].join("\r\n");

                    socket.write(errorResponse, 'utf-8');
                    socket.end();
                }
            } else {
                socket.write("HTTP/1.1 405 Method Not Allowed\r\n\r\n", 'utf-8');
                socket.end();
            }
        },
        open(socket) {
            const sessionId = Date.now().toString(36);
            socket.data = { sessionId };
            clients.set(sessionId, socket);
        },
        close(socket) {
            clients.delete(socket.data.sessionId);
        },
        error(socket, error) {
            console.error(`Error on socket: ${error}`);
        }
    }
});

