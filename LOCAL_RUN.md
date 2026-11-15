# Run FINN on your computer

FINN runs as a local web app. No public host or account is required. Once it starts, open `http://localhost:8000` on that computer. To show it on a phone on the same Wi-Fi, use the computer's LAN IP and allow port 8000 through its firewall.

## Windows

1. Install Node.js 20.19+ or 22.12+ from <https://nodejs.org/>.
2. Extract the FINN project ZIP.
3. Double-click `start-finn.bat` and wait for the server message.
4. Open <http://localhost:8000> in a browser. Leave the terminal window open while using FINN; press Ctrl+C to stop it.

## macOS or Linux

1. Install Node.js 20.19+ or 22.12+ from <https://nodejs.org/>.
2. Extract the FINN project ZIP and open a terminal in that folder.
3. Run `./start-finn.sh`.
4. Open <http://localhost:8000>. Leave the terminal open while using FINN; press Ctrl+C to stop it.

The first run installs dependencies and builds the interface, so it needs internet access. Later runs reuse the installed dependencies. The app stores SQLite data and indexed public PDFs locally in `data/`. Refreshing market/filing sources and indexing company documents also need internet access. No API key is required.

## Docker alternative

Install Docker Desktop (Windows/macOS) or Docker Engine with the Compose plugin (Linux), then run from the extracted folder:

```sh
docker compose up --build
```

Open <http://localhost:8000>. The Compose setup stores the local database and indexed PDFs in a Docker volume named `finn_data`. Stop with Ctrl+C; run `docker compose down` to remove the container while keeping the volume. To delete the saved local data too, run `docker compose down --volumes`.

## Give someone the local package

Share `FINN-local-prototype.zip` or the public GitHub repository. The recipient extracts the ZIP and follows the steps above. The Windows starter file is `start-finn.bat`; macOS/Linux users run `start-finn.sh`.
