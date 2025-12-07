// Localhost Scanner Module

window.scanLocalhostPorts = async function () {
    const ports = [3000, 5173, 8080, 8000, 4200];
    for (const port of ports) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 200); // Fast timeout
            const response = await fetch(`http://localhost:${port}`, { method: 'HEAD', signal: controller.signal });
            clearTimeout(id);
            if (response.ok || response.status < 500) {
                return `http://localhost:${port}`;
            }
        } catch (e) {
            // Ignore error, try next port
        }
    }
    return null;
};
