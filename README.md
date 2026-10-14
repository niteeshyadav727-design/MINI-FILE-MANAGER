const server = http.createServer((req, res) => {
    // Return all files when the browser requests GET /api/files.
    if (req.method === 'GET' && req.url === '/api/files') {
        // readdir returns the names inside the data directory.
        return fs.readdir(DATA_DIR, (error, files) => {
            // Handle a directory-reading error.
            if (error) return sendJSON(res, 500, { error: 'Could not read files.' });
            // Send the list to the browser.
            sendJSON(res, 200, files);
        });
    }

    // Return basic OS information for GET /api/system.
    if (req.method === 'GET' && req.url === '/api/system') {
        // Read a few useful values from the os module.
        const info = {
            platform: os.platform(),
            architecture: os.arch(),
            cpuCores: os.cpus().length,
            hostname: os.hostname()
        };
        // Send the information as JSON.]
        return sendJSON(res, 200, info);
    }

    // Read one file for GET /api/files/:filename.
    if (req.method === 'GET' && req.url.startsWith('/api/files/')) {
        // Get the filename from the URL.
        const filename = decodeURIComponent(req.url.split('/').pop());
        // Build a safe path.
        const filePath = safePath(filename);
        // Reject an invalid filename.
        if (!filePath) return sendJSON(res, 400, { error: 'Invalid .txt filename.' });
        // Read the file as UTF-8 text.
        return fs.readFile(filePath, 'utf8', (error, content) => {
            // Return 404 if the file cannot be found.
            if (error) return sendJSON(res, 404, { error: 'File not found.' });
            // Send the file name and content.
            sendJSON(res, 200, { name: filename, content });
        });
    }

    // Create a file for POST /api/files.
    if (req.method === 'POST' && req.url === '/api/files') {
        // Read the JSON body first.
        return readBody(req, (error, body) => {
            // Reject malformed JSON.
            if (error) return sendJSON(res, 400, { error: 'Invalid JSON.' });
            // Extract the two values sent by the frontend.
            const { filename, content } = body;
            // Build a safe file path.
            const filePath = safePath(filename || '');
            // Validate the filename.
            if (!filePath) return sendJSON(res, 400, { error: 'Use a valid .txt filename.' });
            // Do not overwrite an existing file.
            if (fs.existsSync(filePath)) return sendJSON(res, 409, { error: 'File already exists.' });
            // Create the new file.
            fs.writeFile(filePath, content || '', 'utf8', writeError => {
                // Handle a write error.
                if (writeError) return sendJSON(res, 500, { error: 'Could not create file.' });
                // Report success using HTTP 201 Created.
                sendJSON(res, 201, { message: 'File created successfully.' });
            });
        });
    }

    // Delete a file for DELETE /api/files/:filename.
    if (req.method === 'DELETE' && req.url.startsWith('/api/files/')) {
        // Get the filename from the URL.
        const filename = decodeURIComponent(req.url.split('/').pop());
        // Build a safe path.
        const filePath = safePath(filename);
        // Reject an invalid filename.
        if (!filePath) return sendJSON(res, 400, { error: 'Invalid .txt filename.' });
        // unlink removes the file from the file system.
        return fs.unlink(filePath, error => {
            // Return 404 if the file does not exist.
            if (error) return sendJSON(res, 404, { error: 'File not found.' });
            // Confirm deletion.
            sendJSON(res, 200, { message: 'File deleted successfully.' });
        });
    }

    // Serve index.html for the home page.
    if (req.method === 'GET' && req.url === '/') return serveFile(res, 'index.html', 'text/html');
    // Serve CSS when the browser requests /style.css.
    if (req.method === 'GET' && req.url === '/style.css') return serveFile(res, 'style.css', 'text/css');
    // Serve browser JavaScript when the browser requests /app.js.
    if (req.method === 'GET' && req.url === '/app.js') return serveFile(res, 'app.js', 'application/javascript');

    // Send 404 when no route matched the request.
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - Route not found');
});

// Serve one frontend file using fs.readFile and path.join.
function serveFile(res, filename, contentType) {
    // Build the path to the requested frontend file.
    const filePath = path.join(PUBLIC_DIR, filename);
    // Read the file from disk.
    fs.readFile(filePath, (error, data) => {
        // Handle a missing or unreadable frontend file.
        if (error) { res.writeHead(500); return res.end('Could not load file.'); }
        // Set the correct content type.
        res.writeHead(200, { 'Content-Type': contentType });
        // Send the file contents to the browser.
        res.end(data);
    });
}