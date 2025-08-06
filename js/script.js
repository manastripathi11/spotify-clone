console.log("Let's write Javascript");

// Global audio control
let currentSong = new Audio();  // This will be used to control the currently playing song
let songs = [];   // Array to hold songs loaded from the current folder
let currFolder;   // Variable to keep track of the current folder

// Convert seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";   // Handle invalid input
    const minutes = Math.floor(seconds / 60);   // Calculate minutes
    const remainingSeconds = Math.floor(seconds % 60);   // Calculate remaining seconds
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;   // Format as MM:SS
}

// Load songs from a folder
async function getSongs(folder) {
    currFolder = folder;   // Update current folder
    let a = await fetch(`http://127.0.0.1:3000/SPOTIFY%20CLONE/${folder}/`);   // Fetch the folder contents
    let response = await a.text();   // Get the response as text
    let div = document.createElement("div");   // Create a temporary div to parse the HTML
    div.innerHTML = response;    // Set the inner HTML to the response
    let as = div.getElementsByTagName("a");    // Get all anchor tags
    songs = [];    // Initialize songs array

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push({
                name: element.href.split(`/${folder}/`)[1],   // Extract song name
                url: element.href   // Full URL to the song
            });
        }
    }

    return songs;
}

// Play song
const playMusic = (trackUrl) => {
    if (currentSong) currentSong.pause();    // Pause any currently playing song

    currentSong = new Audio(trackUrl);    // Create a new Audio object with the track URL
    currentSong.play();    // Start playing the song
    play.src = "img/pause.svg";   // Change play button icon to pause

    document.querySelector(".songinfo").innerHTML = trackUrl.slice(trackUrl.lastIndexOf('/') + 1).replaceAll("%20", " ");    // Display song info in the UI
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";    // Reset song time display

    // Update the seekbar and songtime as the song plays
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
        document.querySelector(".progress").style.width =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });
};

// Show all albums
async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:3000/SPOTIFY%20CLONE/songs/`);    // Fetch the songs directory
    let response = await a.text();    // Get the response as text
    let div = document.createElement("div");     // Create a temporary div to parse the HTML
    div.innerHTML = response;   // Set the inner HTML to the response
    let anchors = div.getElementsByTagName("a");    // Get all anchor tags
    let cardContainer = document.querySelector(".cardContainer");   // Get the card container element
    cardContainer.innerHTML = "";   // Clear any existing content in the card container

    let array = Array.from(anchors);    // Convert HTMLCollection to an array for easier manipulation
    for (let index = 0; index < array.length; index++) {
        const e = array[index];   // Iterate through each anchor tag
        if (e.href.includes("/songs")) {    // Check if the href contains "/songs"
            let folder = e.href.split("/").slice(-2)[0];    // Extract the folder name from the URL

            // Load info.json
            try {
                let a = await fetch(`http://127.0.0.1:3000/SPOTIFY%20CLONE/songs/${folder}/info.json`);     // Fetch the info.json file
                let response = await a.json();  // Parse the response as JSON

                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
                            <circle cx="12" cy="12" r="10" fill="#1fdf64" />
                            <path d="M9.5 11.2V12.8C9.5 14.3 9.5 15.1 9.96 15.39C10.41 15.69 11.03 15.35 12.28 14.67L13.75 13.87C15.25 13.06 16 12.65 16 12C16 11.35 15.25 10.94 13.75 10.13L12.28 9.33C11.03 8.65 10.41 8.31 9.96 8.61C9.5 8.92 9.5 9.68 9.5 11.2Z" fill="#000"/>
                        </svg>
                    </div>
                    <img src="songs/${folder}/cover.jpg" alt="">
                    <h2>${response.title}</h2>
                    <p>${response.description}</p>
                </div>`;
            } catch (err) {
                console.error(`info.json missing for folder: ${folder}`);   // Log error if info.json is not found
            }
        }
    }

    // Card click listener (Important!)
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async e => {
            let folder = e.currentTarget.dataset.folder;    // Get the folder from the clicked card's data attribute
            console.log("Folder clicked:", folder);     
            await getSongs(`songs/${folder}`);      // Load songs from the selected folder
            loadSongsInUI();    // Load songs into the UI
            if (songs.length > 0) {
                playMusic(songs[0].url);    // Play the first song in the folder
            }
        });
    });
}

// Render songs in sidebar
function loadSongsInUI() {
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];     // Get the first <ul> element inside the songList
    songUL.innerHTML = "";      // Clear any existing content in the song list

    for (const song of songs) {
        songUL.innerHTML += `
        <li data-url="${song.url}">
            <img src="img/music.svg" class="invert" alt="">
            <div class="info">
                <h3>${song.name.replaceAll("%20", " ")}</h3>
                <p>Manas</p>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(document.querySelectorAll(".songList li")).forEach(li => {
        li.addEventListener("click", () => {
            const songUrl = li.getAttribute("data-url");    // Get the song URL from the clicked list item
            playMusic(songUrl);     // Play the selected song
        });
    });
}

// Required for initially loaded cards
Array.from(document.getElementsByClassName("card")).forEach(card => {
    card.addEventListener("click", async e => {
        let folder = e.currentTarget.dataset.folder;    // Get the folder from the clicked card's data attribute
        await getSongs(`songs/${folder}`);  // Load songs from the selected folder
        loadSongsInUI();    // Load songs into the UI

        if (songs.length > 0) {
            playMusic(songs[0].url);    // Play the first song in the folder
        }
    });
});

// Play/Pause toggle
play.addEventListener("click", () => {
    if (!currentSong.src) {     // If no song is currently loaded
        if (songs.length > 0) playMusic(songs[0].url);   // Play the first song in the list
    } else if (currentSong.paused) {    // If the current song is paused
        currentSong.play();     // Play the current song
        play.src = "img/pause.svg";     // Change play button icon to pause
    } else {
        currentSong.pause();    // Pause the current song
        play.src = "img/play.svg";   // Change play button icon to play
    }
});

// Seekbar click
document.querySelector(".seekbar").addEventListener("click", (e) => {
    const seekbar = e.currentTarget;  // Always the .seekbar element
    const rect = seekbar.getBoundingClientRect();  // Get position of seekbar
    const clickX = e.clientX - rect.left;  // Get actual x position of click inside seekbar

    const percent = (clickX / rect.width) * 100;  // Calculate percentage of click position

    document.querySelector(".circle").style.left = percent + "%";
    document.querySelector(".progress").style.width = percent + "%";

    currentSong.currentTime = (currentSong.duration * percent) / 100;
});

// Previous button
previous.addEventListener("click", () => {
    currentSong.pause();    // Pause the current song
    let currentIndex = songs.findIndex(song => song.url === currentSong.src);   // Find the index of the current song
    if (currentIndex > 0) playMusic(songs[currentIndex - 1].url);   // Play the previous song if it exists
});

// Next button
next.addEventListener("click", () => {
    currentSong.pause();    // Pause the current song
    let currentIndex = songs.findIndex(song => song.url === currentSong.src);   // Find the index of the current song
    if (currentIndex !== -1 && currentIndex < songs.length - 1) {   // Check if the current song is not the last one
        playMusic(songs[currentIndex + 1].url);   // Play the next song
    }
});

// Volume slider
document.querySelector(".range input").addEventListener("change", e => {
    currentSong.volume = parseInt(e.target.value) / 100;    // Set the volume of the current song based on the slider value
    if (currentSong.volume > 0) {
        document.querySelector(".volume>img").src = "img/volume.svg";   // Change icon to volume if volume is greater than 0
    }
});

// Mute / Unmute toggle
document.querySelector(".volume>img").addEventListener("click", e => {
    if (e.target.src.includes("volume.svg")) {
        e.target.src = e.target.src.replace("volume.svg", "mute.svg");
        currentSong.volume = 0;
        document.querySelector(".range input").value = 0;
    } else {
        e.target.src = e.target.src.replace("mute.svg", "volume.svg");
        currentSong.volume = 0.50;
        document.querySelector(".range input").value = 50;
    }
});

// Sidebar open/close
document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";   // Open the sidebar
});

document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-500%";   // Close the sidebar
});

// Initialize
async function main() {
    await getSongs("songs/Angry_(mood)");  // Load initial songs from a default folder
    console.log(songs);
    displayAlbums();
    loadSongsInUI();
}
main();