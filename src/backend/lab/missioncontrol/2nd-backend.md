I need a lightweight local server to power my Mission Control dashboard with live data. Build me a complete Node.js server with these specs:

Setup:

- Single file: server.js (or server.mjs)
- Port: 8899
- Serve my mission-control.html file at the root
- CORS enabled for local development
- No heavy frameworks — just built-in Node http/https modules (or Express if cleaner)

API Endpoints:
Create RESTful endpoints that Mission Control can fetch from:

1. GET /mc/status — Returns system status:
    - Server uptime, last data refresh timestamp, connection health: "online"

2. GET /mc/data — Returns dashboard data:
    - Read from a local JSON file (mc-data.json) that stores all dashboard state

3. POST /mc/data — Save dashboard data:
    - Accepts JSON body, writes to mc-data.json
    - Lets Mission Control sync its localStorage to the server as backup

4. GET /mc/weather?city=[CITY] — Fetch current weather:
    - Use wttr.in API (free, no key): https://wttr.in/[CITY]?format=j1
    - Return: temperature, condition, feels_like

5. GET /mc/activity — Returns recent activity log:
    - Read from mc-activity.json, returns last 50 entries

6. POST /mc/activity — Add activity entry:
    - Appends to mc-activity.json with timestamp

Auto-start (macOS):
Also generate a LaunchAgent plist file that auto-starts this server on login:

- File: ~/Library/LaunchAgents/com.missioncontrol.server.plist
- Points to the server.js file
- Runs on load, restarts if crashed
- Include the terminal commands to install it

Setup instructions:
Print clear step-by-step setup instructions:

1. Save server.js to a folder
2. Run `node server.js`
3. Open http://localhost:8899
4. (Optional) Install the LaunchAgent for auto-start

Keep it simple. No database, no auth, no complexity. Just a clean local server that makes Mission Control come alive.
