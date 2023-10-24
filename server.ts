import * as path from 'path';
import { serve, file } from 'bun';

const ROOT_DIRECTORY = '/home/alfons/git/BunTCPMultiThreadServer';

const mimeTypes = {
    '.html': 'text/html',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg'
};

function generateHeaders(content: string | Buffer, mimeType: string) {
    const currentDate = new Date().toUTCString();
    return {
        'Server': 'Bun-Server/1.0.2', 
        'Date': currentDate,
        'Content-Type': mimeType,
        'Last-Modified': currentDate,
        'Content-Length': String(content.length)
    };
}

function serveFile(req, filePath) {
    const fileExt = path.extname(filePath);
    const mimeType = mimeTypes[fileExt] || 'application/octet-stream';
    
    try {
        const content = file(filePath);
        const headers = generateHeaders(content, mimeType);
        return new Response(content, { headers });
    } catch (e) {
        return send404();
    }
}

function send404() {
    const errorMessage = "File Not Found";
    const headers = generateHeaders(errorMessage, 'text/html');
    return new Response(errorMessage, {
        status: 404,
        headers
    });
}

const server = serve({
    fetch(req) {
        const url = new URL(req.url);
        const requestedPath = path.join(ROOT_DIRECTORY, url.pathname);
        if (req.method === "GET") {
            if (url.pathname.endsWith('/') || url.pathname === '') {
                const indexPath = path.join(requestedPath, 'pagina.html');
                return serveFile(req, indexPath);
            } else {
                return serveFile(req, requestedPath);
            }
        }            
    },
    websocket: {
        message(ws, message) {
            // Placeholder for websocket support.
        }
    }
});

console.log(`Listening on localhost:${server.port}`);
