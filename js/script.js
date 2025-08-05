console.log("Let's write Javascript");

// Global audio control
let currentSong = new Audio();
let songs = [];
let currFolder;

// Convert seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Load songs from a folder
async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/SPOTIFY%20CLONE/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push({
                name: element.href.split(`/${folder}/`)[1],
                url: element.href
            });
        }
    }

    return songs;
}

// Play song
const playMusic = (trackUrl) => {
    if (currentSong) currentSong.pause();

    currentSong = new Audio(trackUrl);
    currentSong.play();
    play.src = "img/pause.svg";

    document.querySelector(".songinfo").innerHTML = trackUrl.slice(trackUrl.lastIndexOf('/') + 1).replaceAll("%20", " ");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

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
    let a = await fetch(`http://127.0.0.1:3000/SPOTIFY%20CLONE/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0];

            // Load info.json
            try {
                let a = await fetch(`http://127.0.0.1:3000/SPOTIFY%20CLONE/songs/${folder}/info.json`);
                let response = await a.json();

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
                console.error(`info.json missing for folder: ${folder}`);
            }
        }
    }

    // Card click listener (Important!)
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async e => {
            let folder = e.currentTarget.dataset.folder;
            console.log("Folder clicked:", folder);
            await getSongs(`songs/${folder}`);
            loadSongsInUI();
            if (songs.length > 0) {
                playMusic(songs[0].url);
            }
        });
    });
}

// Render songs in sidebar
function loadSongsInUI() {
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

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
            const songUrl = li.getAttribute("data-url");
            playMusic(songUrl);
        });
    });
}

// Required for initially loaded cards
Array.from(document.getElementsByClassName("card")).forEach(card => {
    card.addEventListener("click", async e => {
        let folder = e.currentTarget.dataset.folder;
        await getSongs(`songs/${folder}`);
        loadSongsInUI();

        if (songs.length > 0) {
            playMusic(songs[0].url);
        }
    });
});

// Play/Pause toggle
play.addEventListener("click", () => {
    if (!currentSong.src) {
        if (songs.length > 0) playMusic(songs[0].url);
    } else if (currentSong.paused) {
        currentSong.play();
        play.src = "img/pause.svg";
    } else {
        currentSong.pause();
        play.src = "img/play.svg";
    }
});

// Seekbar click
document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
});

// Previous button
previous.addEventListener("click", () => {
    currentSong.pause();
    let currentIndex = songs.findIndex(song => song.url === currentSong.src);
    if (currentIndex > 0) playMusic(songs[currentIndex - 1].url);
});

// Next button
next.addEventListener("click", () => {
    currentSong.pause();
    let currentIndex = songs.findIndex(song => song.url === currentSong.src);
    if (currentIndex !== -1 && currentIndex < songs.length - 1) {
        playMusic(songs[currentIndex + 1].url);
    }
});

// Volume slider
document.querySelector(".range input").addEventListener("change", e => {
    currentSong.volume = parseInt(e.target.value) / 100;
    if (currentSong.volume > 0) {
        document.querySelector(".volume>img").src = "img/volume.svg";
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
    document.querySelector(".left").style.left = "0";
});

document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-500%";
});

// Initialize
async function main() {
    await getSongs("songs/Angry_(mood)");  // Load initial songs from a default folder
    console.log(songs);
    displayAlbums();
    loadSongsInUI();
}
main();