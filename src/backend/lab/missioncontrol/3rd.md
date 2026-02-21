Update my mission-control.html to connect to the local server at http://localhost:8899. Add:

1. On page load, fetch GET /mc/data and merge with localStorage (server = backup, localStorage = primary)
2. Every 5 minutes, POST current localStorage state to /mc/data as backup
3. Fetch weather from GET /mc/weather?city=[YOUR_CITY] and display temp + condition in the header next to the status dot
4. When any data changes, POST to /mc/activity with a description of what changed
5. Update the status dot: green = server connected, red = offline (fallback to localStorage-only mode)
6. Add a small "Server: Online/Offline" indicator in the header

Keep all existing localStorage functionality as the primary data layer. The server is a backup + data enrichment layer, not a replacement.
