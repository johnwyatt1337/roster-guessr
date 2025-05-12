import { teams } from './teams.js';

// Select elements
const instructionsElement = document.getElementById("instructions");
const gameArea = document.getElementById("game-area");
const teamInfoElement = document.getElementById("team-info");
const playerGuessInput = document.getElementById("player-guess");
const submitGuessButton = document.getElementById("submit-guess");
const feedbackElement = document.getElementById("feedback");
const progressElement = document.getElementById("progress");

// Function to get the current date in Western US Time (PST/PDT)
function getWesternDate() {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset(); // Offset in minutes from UTC
    const westernOffset = -480; // PST is UTC-8 (in minutes)
    const westernTime = new Date(now.getTime() + (westernOffset - utcOffset) * 60000);
    return westernTime;
}

// Function to get or initialize the unused teams list
function getUnusedTeams() {
    const unusedTeams = JSON.parse(localStorage.getItem("unusedTeams"));
    if (unusedTeams && unusedTeams.length > 0) {
        return unusedTeams;
    }
    // If no unused teams are stored, initialize with all team names
    const teamNames = Object.keys(teams);
    localStorage.setItem("unusedTeams", JSON.stringify(teamNames));
    return teamNames;
}

// Function to select a random team from the unused list
function selectRandomTeam(unusedTeams) {
    const randomIndex = Math.floor(Math.random() * unusedTeams.length);
    const selectedTeam = unusedTeams[randomIndex];

    // Remove the selected team from the unused list
    unusedTeams.splice(randomIndex, 1);

    // Update the unused teams in localStorage
    localStorage.setItem("unusedTeams", JSON.stringify(unusedTeams));

    return selectedTeam;
}

// Function to get the daily challenge team
function getDailyChallengeTeam() {
    const lastChangeTimestamp = localStorage.getItem("lastChangeTimestamp");
    const now = new Date();

    // Convert the current time to Eastern Time (EST/EDT)
    const easternTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );

    console.log("Current Eastern Time:", easternTime.toString());

    // Create a Date object for 10:17 AM Eastern Time today
    const changeTime = new Date(easternTime.toDateString() + " 03:00:00");
    console.log("Change Time (10:17 AM Eastern):", changeTime.toString());

    // Check if it's time to update the daily challenge
    if (!lastChangeTimestamp || new Date(lastChangeTimestamp) < changeTime) {
        if (easternTime >= changeTime) {
            let unusedTeams = getUnusedTeams();

            // Reset the unused teams list if all teams have been used
            if (unusedTeams.length === 0) {
                unusedTeams = Object.keys(teams);
                localStorage.setItem("unusedTeams", JSON.stringify(unusedTeams));
            }

            // Select a new random team
            const newTeam = selectRandomTeam(unusedTeams);

            // Store the new team and update the timestamp
            localStorage.setItem("dailyChallengeTeam", newTeam);
            localStorage.setItem("lastChangeTimestamp", easternTime.toISOString());

            console.log("New Daily Challenge Team:", newTeam);
            return newTeam;
        }
    }

    // If it's not time to update, return the stored team
    const storedTeam = localStorage.getItem("dailyChallengeTeam");
    console.log("Stored Daily Challenge Team:", storedTeam);
    return storedTeam || "No team available"; // Fallback if no team is stored
}

// Function to get all player names from all teams
function getAllPlayerNames() {
    return Object.values(teams)
        .flat() // Flatten the array of arrays
        .map(player => player.name); // Extract player names
}

// Function to filter player names and display suggestions with images
function updatePlayerSuggestions(input, allPlayers) {
    const suggestionsElement = document.getElementById("player-suggestions");
    suggestionsElement.innerHTML = ""; // Clear previous suggestions

    if (input.trim() === "") {
        suggestionsElement.style.display = "none"; // Hide suggestions if input is empty
        return;
    }

    // Filter players whose names include the input (case-insensitive)
    const filteredPlayers = allPlayers.filter(player =>
        player.name.toLowerCase().includes(input.toLowerCase())
    );

    // Show suggestions if there are matches
    if (filteredPlayers.length > 0) {
        suggestionsElement.style.display = "block";
    } else {
        suggestionsElement.style.display = "none";
    }

    // Add filtered players to the suggestions dropdown
    filteredPlayers.forEach((player, index) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.classList.add("suggestion-item");
        suggestionItem.setAttribute("data-index", index); // Add index for navigation

        // Add player image and name
        suggestionItem.innerHTML = `
            <img src="${player.picture}" alt="${player.name}" class="suggestion-image">
            <span class="suggestion-name">${player.name}</span>
        `;

        // Handle click event to select a player
        suggestionItem.addEventListener("click", () => {
            document.getElementById("player-guess").value = player.name; // Set input value
            suggestionsElement.style.display = "none"; // Hide suggestions
        });

        suggestionsElement.appendChild(suggestionItem);
    });

    // Add keyboard navigation
    let selectedIndex = -1; // Track the currently selected suggestion

    playerGuessInput.addEventListener("keydown", (event) => {
        const suggestionItems = suggestionsElement.querySelectorAll(".suggestion-item");

        if (event.key === "ArrowDown") {
            // Move down the list
            event.preventDefault();
            if (selectedIndex < suggestionItems.length - 1) {
                selectedIndex++;
                updateActiveSuggestion(suggestionItems, selectedIndex);
            }
        } else if (event.key === "ArrowUp") {
            // Move up the list
            event.preventDefault();
            if (selectedIndex > 0) {
                selectedIndex--;
                updateActiveSuggestion(suggestionItems, selectedIndex);
            }
        } else if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission or default behavior

            if (selectedIndex >= 0 && selectedIndex < suggestionItems.length) {
                // Select the current suggestion
                const selectedItem = suggestionItems[selectedIndex];
                document.getElementById("player-guess").value = selectedItem.querySelector(".suggestion-name").textContent;
                suggestionsElement.style.display = "none"; // Hide suggestions
            } else if (playerGuessInput.value.trim() !== "") {
                // Trigger the submit guess button if input is not empty
                submitGuessButton.click();
            }
        }
    });

    function updateActiveSuggestion(items, index) {
        // Remove active class from all items
        items.forEach(item => item.classList.remove("active"));

        // Add active class to the current item
        if (index >= 0 && index < items.length) {
            items[index].classList.add("active");
            items[index].scrollIntoView({ block: "nearest" }); // Ensure the active item is visible
        }
    }
}

// Function to create player slots
function createPlayerSlots(teamPlayers) {
    const playerSlotsContainer = document.getElementById("player-slots");
    playerSlotsContainer.innerHTML = ""; // Clear previous slots

    // Create a slot for each player
    teamPlayers.forEach(() => {
        const slot = document.createElement("div");
        slot.classList.add("player-slot");
        slot.innerHTML = `<img src="" alt="Player Slot" class="player-image" style="display: none;">`;
        playerSlotsContainer.appendChild(slot);
    });
}

// Function to reveal a player's image in the corresponding slot
function revealPlayerImage(playerName, teamPlayers) {
    const playerSlots = document.querySelectorAll(".player-slot");
    const playerIndex = teamPlayers.findIndex(player => player.name.toLowerCase() === playerName.toLowerCase());

    if (playerIndex !== -1) {
        const playerSlot = playerSlots[playerIndex];
        const playerImage = playerSlot.querySelector(".player-image");
        playerImage.src = teamPlayers[playerIndex].picture; // Set the player's image
        playerImage.alt = playerName; // Set the alt text
        playerImage.title = playerName; // Add the player's name as a tooltip
        playerImage.style.display = "block"; // Show the image
    }
}

// Function to update the team logo
function updateTeamLogo(teamName) {
    const teamLogoContainer = document.getElementById("team-logo-container");
    const teamLogo = document.getElementById("team-logo");

    // Set the team logo source and alt text
    teamLogo.src = `images/${teamName.toLowerCase().replace(/ /g, "-")}-logo.png`; // Example: "boston-celtics-logo.png"
    teamLogo.alt = `${teamName} Logo`;

    // Show the team logo container
    teamLogoContainer.style.display = "block";
}

// Function to reset the game area
function resetGameArea() {
    // Hide all game areas
    gameArea.style.display = "none";
    document.getElementById("free-mode-container").style.display = "none";
    document.getElementById("player-challenge-container").style.display = "none";
    document.getElementById("about-site-container").style.display = "none"; // Hide About Site container

    // Clear team info, feedback, progress, and player slots
    teamInfoElement.textContent = "";
    feedbackElement.textContent = "";
    progressElement.textContent = "";
    document.getElementById("player-slots").innerHTML = "";

    // Clear the instructions text
    instructionsElement.textContent = "";

    // Hide and reset team logo
    const teamLogoContainer = document.getElementById("team-logo-container");
    teamLogoContainer.style.display = "none";
    const teamLogo = document.getElementById("team-logo");
    teamLogo.src = "";
    teamLogo.alt = "";

    // Remove Gauntlet Mode progress container if it exists
    const progressContainer = document.getElementById("progress-container");
    if (progressContainer) {
        progressContainer.remove();
    }

    // Clear Free Mode team logo list
    const teamLogoList = document.getElementById("team-logo-list");
    if (teamLogoList) {
        teamLogoList.innerHTML = "";
    }
}

// Function to start the daily challenge
function startDailyChallenge() {
    resetGameArea(); // Clear previous mode elements

    const teamName = getDailyChallengeTeam();
    const teamPlayers = teams[teamName];
    const playerNames = teamPlayers.map(player => player.name);
    const allPlayerNames = getAllPlayerNames(); // Get all player names
    const guessedPlayers = new Set();
    let misses = 0; // Track the number of misses
    const maxMisses = 3; // Maximum allowed misses

    // Show the game area and update the team info
    gameArea.style.display = "block";
    teamInfoElement.textContent = `Today's challenge: Name as many players as you can from the ${teamName}!`;
    feedbackElement.textContent = "";
    progressElement.textContent = `Guessed: 0/${teamPlayers.length} | Misses: ${misses}/${maxMisses}`;

    // Update the team logo
    updateTeamLogo(teamName);

    // Create player slots
    createPlayerSlots(teamPlayers);

    // Update suggestions as the user types
    playerGuessInput.addEventListener("input", () => {
        const allPlayers = Object.values(teams).flat(); // Get all players from all teams
        updatePlayerSuggestions(playerGuessInput.value, allPlayers);
    });

    // Handle guesses
    submitGuessButton.onclick = () => {
        const guess = playerGuessInput.value.trim();
        playerGuessInput.value = ""; // Clear the input field

        if (!guess) {
            feedbackElement.textContent = "Please enter a player's name.";
            return;
        }

        if (playerNames.map(name => name.toLowerCase()).includes(guess.toLowerCase())) {
            if (!guessedPlayers.has(guess.toLowerCase())) {
                guessedPlayers.add(guess.toLowerCase());
                feedbackElement.textContent = `Correct! ${guess} is on the ${teamName}.`;

                // Reveal the player's image
                revealPlayerImage(guess, teamPlayers);
            } else {
                feedbackElement.textContent = `You already guessed ${guess}.`;
            }
        } else {
            misses++; // Increment the miss counter
            feedbackElement.textContent = `${guess} is not on the ${teamName}. Misses: ${misses}/${maxMisses}`;
        }

        // Update progress
        progressElement.textContent = `Guessed: ${guessedPlayers.size}/${teamPlayers.length} | Misses: ${misses}/${maxMisses}`;

        // Check if the user has failed
        if (misses >= maxMisses) {
            feedbackElement.textContent = `You failed! Here are the remaining players from the ${teamName}.`;
            submitGuessButton.disabled = true; // Disable the button

            // Populate the slots with the remaining players
            teamPlayers.forEach(player => {
                if (!guessedPlayers.has(player.name.toLowerCase())) {
                    revealPlayerImage(player.name, teamPlayers);
                }
            });
            return;
        }

        // Check if all players are guessed
        if (guessedPlayers.size === teamPlayers.length) {
            feedbackElement.textContent = `Congratulations! You named all players on the ${teamName}.`;
            submitGuessButton.disabled = true; // Disable the button
        }
    };
}

// Function to initialize Gauntlet Mode
function startGauntletMode() {
    resetGameArea(); // Clear previous mode elements

    // Clear any existing Gauntlet Mode UI
    let unusedTeams = Object.keys(teams); // Start with all teams
    const totalTeams = unusedTeams.length; // Total number of teams
    const guessedPlayers = new Set(); // Track guessed players for the current team
    let completedTeams = 0; // Track the number of completed teams
    let misses = 0; // Track the number of misses for the current team
    const maxMisses = 3; // Maximum allowed misses per team

    // Create a container for progress, "Next Team" button, and teams completed
    const progressContainer = document.createElement("div");
    progressContainer.id = "progress-container";
    progressContainer.style.display = "flex";
    progressContainer.style.alignItems = "center";
    progressContainer.style.justifyContent = "center";
    progressContainer.style.gap = "10px";
    progressContainer.style.marginBottom = "10px";
    gameArea.insertBefore(progressContainer, document.getElementById("team-logo-container"));

    // Move the progress text into the container
    progressContainer.appendChild(progressElement);

    // Create the "Teams Completed" text
    const teamsCompletedElement = document.createElement("span");
    teamsCompletedElement.id = "teams-completed";
    teamsCompletedElement.textContent = `Teams Completed: ${completedTeams}/${totalTeams}`;
    progressContainer.appendChild(teamsCompletedElement);

    // Create the "Next Team" button
    const nextTeamButton = document.createElement("button");
    nextTeamButton.textContent = "Next Team";
    nextTeamButton.style.display = "none"; // Initially hidden
    nextTeamButton.id = "next-team-btn";
    progressContainer.appendChild(nextTeamButton);

    // Function to load the next team
    function loadNextTeam() {
        if (unusedTeams.length === 0) {
            // If all teams are completed
            gameArea.style.display = "none";
            instructionsElement.textContent = "Congratulations! You've completed Gauntlet Mode!";
            return;
        }

        // Select a random team from the unused list
        const randomIndex = Math.floor(Math.random() * unusedTeams.length);
        const teamName = unusedTeams[randomIndex];
        const teamPlayers = teams[teamName];
        const playerNames = teamPlayers.map(player => player.name);

        // Remove the selected team from the unused list
        unusedTeams.splice(randomIndex, 1);

        // Reset the game area for the new team
        guessedPlayers.clear();
        misses = 0; // Reset misses for the new team
        gameArea.style.display = "block";
        teamInfoElement.textContent = `Guess the players for the ${teamName}!`;
        feedbackElement.textContent = "";
        progressElement.textContent = `Guessed: 0/${teamPlayers.length} | Misses: ${misses}/${maxMisses}`;
        submitGuessButton.disabled = false;
        nextTeamButton.style.display = "none"; // Hide the "Next Team" button

        // Update the team logo
        updateTeamLogo(teamName);

        // Create player slots
        createPlayerSlots(teamPlayers);

        // Update suggestions as the user types
        playerGuessInput.addEventListener("input", () => {
            const allPlayers = Object.values(teams).flat(); // Get all players from all teams
            updatePlayerSuggestions(playerGuessInput.value, allPlayers);
        });

        // Handle guesses
        submitGuessButton.onclick = () => {
            const guess = playerGuessInput.value.trim();
            playerGuessInput.value = ""; // Clear the input field

            if (!guess) {
                feedbackElement.textContent = "Please enter a player's name.";
                return;
            }

            if (playerNames.map(name => name.toLowerCase()).includes(guess.toLowerCase())) {
                if (!guessedPlayers.has(guess.toLowerCase())) {
                    guessedPlayers.add(guess.toLowerCase());
                    feedbackElement.textContent = `Correct! ${guess} is on the ${teamName}.`;

                    // Reveal the player's image
                    revealPlayerImage(guess, teamPlayers);
                } else {
                    feedbackElement.textContent = `You already guessed ${guess}.`;
                }
            } else {
                misses++; // Increment the miss counter
                feedbackElement.textContent = `${guess} is not on the ${teamName}. Misses: ${misses}/${maxMisses}`;
            }

            // Update progress
            progressElement.textContent = `Guessed: ${guessedPlayers.size}/${teamPlayers.length} | Misses: ${misses}/${maxMisses}`;

            // Check if the user has failed
            if (misses >= maxMisses) {
                feedbackElement.textContent = `You failed! Here are the remaining players from the ${teamName}.`;
                submitGuessButton.disabled = true; // Disable the button

                // Populate the slots with the remaining players
                teamPlayers.forEach(player => {
                    if (!guessedPlayers.has(player.name.toLowerCase())) {
                        revealPlayerImage(player.name, teamPlayers);
                    }
                });

                // Show the "Next Team" button
                nextTeamButton.style.display = "inline-block";
                return;
            }

            // Check if all players are guessed
            if (guessedPlayers.size === teamPlayers.length) {
                feedbackElement.textContent = `Great job! You've completed the ${teamName}!`;
                submitGuessButton.disabled = true; // Disable the button temporarily

                // Increment completed teams and update the "Teams Completed" text
                completedTeams++;
                teamsCompletedElement.textContent = `Teams Completed: ${completedTeams}/${totalTeams}`;

                // Show the "Next Team" button
                nextTeamButton.style.display = "inline-block";
            }
        };
    }

    // Add event listener to the "Next Team" button
    nextTeamButton.addEventListener("click", () => {
        loadNextTeam();
    });

    // Start with the first team
    loadNextTeam();
}

// Function to initialize Free Mode
function startFreeMode() {
    resetGameArea(); // Clear previous mode elements

    const freeModeContainer = document.getElementById("free-mode-container");
    const teamLogoList = document.getElementById("team-logo-list");

    // Show the Free Mode container and hide other game areas
    freeModeContainer.style.display = "block";
    gameArea.style.display = "none";

    // Set the instructions text for Free Mode
    instructionsElement.textContent = "Select a team to start guessing!";

    // Create a logo for each team
    Object.keys(teams).forEach(teamName => {
        const teamLogoItem = document.createElement("div");
        teamLogoItem.classList.add("team-logo-item");

        // Add the team logo and name
        teamLogoItem.innerHTML = `
            <img src="images/${teamName.toLowerCase().replace(/ /g, "-")}-logo.png" 
                 alt="${teamName} Logo" 
                 class="team-logo">
            <p>${teamName}</p>
        `;

        // Add a click event to start guessing for the selected team
        teamLogoItem.addEventListener("click", () => {
            startTeamGuessing(teamName);
        });

        teamLogoList.appendChild(teamLogoItem);
    });
}

// Function to start guessing for a specific team
function startTeamGuessing(teamName) {
    const teamPlayers = teams[teamName];
    const playerNames = teamPlayers.map(player => player.name);
    const guessedPlayers = new Set();

    // Hide the Free Mode container and show the game area
    document.getElementById("free-mode-container").style.display = "none";
    gameArea.style.display = "block";

    // Update the game area for the selected team
    teamInfoElement.textContent = `Guess the players for the ${teamName}!`;
    feedbackElement.textContent = "";
    progressElement.textContent = `Guessed: 0/${teamPlayers.length}`;
    submitGuessButton.disabled = false;

    // Update the team logo
    updateTeamLogo(teamName);

    // Create player slots
    createPlayerSlots(teamPlayers);

    // Update suggestions as the user types
    playerGuessInput.addEventListener("input", () => {
        const allPlayers = Object.values(teams).flat(); // Get all players from all teams
        updatePlayerSuggestions(playerGuessInput.value, allPlayers);
    });

    // Handle guesses
    submitGuessButton.onclick = () => {
        const guess = playerGuessInput.value.trim();
        playerGuessInput.value = ""; // Clear the input field

        if (!guess) {
            feedbackElement.textContent = "Please enter a player's name.";
            return;
        }

        if (playerNames.map(name => name.toLowerCase()).includes(guess.toLowerCase())) {
            if (!guessedPlayers.has(guess.toLowerCase())) {
                guessedPlayers.add(guess.toLowerCase());
                feedbackElement.textContent = `Correct! ${guess} is on the ${teamName}.`;

                // Reveal the player's image
                revealPlayerImage(guess, teamPlayers);
            } else {
                feedbackElement.textContent = `You already guessed ${guess}.`;
            }
        } else {
            feedbackElement.textContent = `${guess} is not on the ${teamName}. Try again!`;
        }

        // Update progress
        progressElement.textContent = `Guessed: ${guessedPlayers.size}/${teamPlayers.length}`;

        // Check if all players are guessed
        if (guessedPlayers.size === teamPlayers.length) {
            feedbackElement.textContent = `Congratulations! You named all players on the ${teamName}.`;
            submitGuessButton.disabled = true; // Disable the button
        }
    };
}

// Function to initialize Player Challenge Mode
function startPlayerChallenge() {
    resetGameArea(); // Clear previous mode elements

    // Show the Player Challenge container
    const playerChallengeContainer = document.getElementById("player-challenge-container");
    playerChallengeContainer.style.display = "block";

    // Get all players from all teams
    const allPlayers = Object.values(teams).flat();
    const randomPlayers = []; // Array to store 12 random players
    const totalGuessesAllowed = 12; // Total number of guesses allowed (to account for 9 correct + 2 misses + 1 final guess)
    let correctGuesses = 0; // Track the number of correct guesses
    let totalGuesses = 0; // Track the total number of guesses made
    let misses = 0; // Track the number of misses
    const maxMisses = 3; // Maximum allowed misses

    // Randomly select 12 unique players
    while (randomPlayers.length < totalGuessesAllowed) {
        const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
        if (!randomPlayers.includes(randomPlayer)) {
            randomPlayers.push(randomPlayer);
        }
    }

    // Display the first player's name
    const instructionsElement = document.getElementById("player-challenge-instructions");
    const feedbackElement = document.getElementById("player-challenge-feedback");
    const suggestionsElement = document.getElementById("team-suggestions");
    const guessInput = document.getElementById("player-challenge-guess");
    const submitButton = document.getElementById("player-challenge-submit");
    const imagesContainer = document.getElementById("player-challenge-images");

    // Reset the images container, feedback, and input field
    imagesContainer.innerHTML = ""; // Clear any previous images
    feedbackElement.textContent = ""; // Clear feedback
    guessInput.value = ""; // Clear the input field

    // Ensure the suggestions dropdown is cleared and hidden
    suggestionsElement.innerHTML = "";
    suggestionsElement.style.display = "none";

    // Check if the progress counter already exists
    let progressCounter = document.getElementById("player-challenge-progress");
    if (!progressCounter) {
        // Create a progress counter if it doesn't exist
        progressCounter = document.createElement("p");
        progressCounter.id = "player-challenge-progress";
        instructionsElement.insertAdjacentElement("afterend", progressCounter);
    }

    // Reset the progress counter text
    progressCounter.textContent = `Correct Guesses: ${correctGuesses}/10 | Misses: ${misses}/${maxMisses}`;

    // Initialize the first player's question
    instructionsElement.textContent = `Which team does ${randomPlayers[totalGuesses].name} play for?`;
    feedbackElement.textContent = "";

    // Attach the input event listener for team suggestions
    guessInput.addEventListener("input", () => {
        const input = guessInput.value.trim().toLowerCase();
        suggestionsElement.innerHTML = ""; // Clear previous suggestions

        if (input === "") {
            suggestionsElement.style.display = "none"; // Hide if input is empty
            return;
        }

        // Filter teams based on input
        const filteredTeams = Object.keys(teams).filter(teamName =>
            teamName.toLowerCase().includes(input)
        );

        if (filteredTeams.length > 0) {
            suggestionsElement.style.display = "block"; // Show suggestions
        } else {
            suggestionsElement.style.display = "none"; // Hide if no matches
        }

        // Populate the dropdown with filtered teams
        filteredTeams.forEach(teamName => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion-item");

            suggestionItem.innerHTML = `
                <img src="images/${teamName.toLowerCase().replace(/ /g, "-")}-logo.png" 
                     alt="${teamName} Logo" 
                     class="team-logo">
                <span class="team-name">${teamName}</span>
            `;

            // Handle click event to select a team
            suggestionItem.addEventListener("click", () => {
                guessInput.value = teamName; // Set input value
                suggestionsElement.style.display = "none"; // Hide suggestions
            });

            suggestionsElement.appendChild(suggestionItem);
        });
    });

    // Attach the event listener to the Submit Guess button
    submitButton.onclick = () => {
        const guess = guessInput.value.trim();
        guessInput.value = ""; // Clear the input field

        if (!guess) {
            feedbackElement.textContent = "Please enter a team name.";
            return;
        }

        const currentPlayer = randomPlayers[totalGuesses];

        // Display the player's picture and team logo (for both correct and incorrect guesses)
        const playerImage = document.createElement("img");
        playerImage.src = currentPlayer.picture;
        playerImage.alt = `${currentPlayer.name}`;
        playerImage.classList.add("player-image");

        const teamLogo = document.createElement("img");
        teamLogo.src = `images/${currentPlayer.team.toLowerCase().replace(/ /g, "-")}-logo.png`;
        teamLogo.alt = `${currentPlayer.team} Logo`;
        teamLogo.classList.add("team-logo");

        // Clear previous images and append new ones
        imagesContainer.innerHTML = "";
        imagesContainer.appendChild(playerImage);
        imagesContainer.appendChild(teamLogo);

        // Check if the guess matches the player's team
        if (guess.toLowerCase() === currentPlayer.team.toLowerCase()) {
            feedbackElement.textContent = `Correct! ${currentPlayer.name} plays for the ${currentPlayer.team}.`;

            // Increment the correct guess counter
            correctGuesses++;
        } else {
            // Increment the miss counter on an incorrect guess
            misses++;
            feedbackElement.textContent = `Incorrect! ${currentPlayer.name} plays for the ${currentPlayer.team}. Misses: ${misses}/${maxMisses}`;
        }

        // Increment the total guesses counter
        totalGuesses++;

        // Check if the user has reached the maximum misses
        if (misses >= maxMisses) {
            // Update the progress counter to show 3/3 misses
            progressCounter.textContent = `Correct Guesses: ${correctGuesses}/10 | Misses: ${misses}/${maxMisses}`;

            // Display failure message
            feedbackElement.textContent = "You failed the Player Challenge.";
            feedbackElement.innerHTML += `<br>Refresh the page and click 'Player Challenge' to play again!`;
            submitButton.disabled = true; // Disable the button to prevent further guesses
            return; // Stop further execution
        }

        // Check if the challenge is complete
        if (correctGuesses >= 10) {
            feedbackElement.textContent = "Congratulations! You completed the Player Challenge!";
            feedbackElement.innerHTML += `<br>Refresh the page and click 'Player Challenge' to play again!`;
            submitButton.disabled = true; // Disable the button
        } else if (totalGuesses < totalGuessesAllowed) {
            // Move to the next player's question
            instructionsElement.textContent = `Which team does ${randomPlayers[totalGuesses].name} play for?`;
        }

        // Update progress
        progressCounter.textContent = `Correct Guesses: ${correctGuesses}/10 | Misses: ${misses}/${maxMisses}`;
    };
}

// Attach the daily challenge function to the button
document.getElementById("daily-challenge-btn").addEventListener("click", startDailyChallenge);

// Attach the Gauntlet Mode function to the button
document.getElementById("gauntlet-mode-btn").addEventListener("click", startGauntletMode);

// Attach the Free Mode function to the button
document.getElementById("free-mode-btn").addEventListener("click", startFreeMode);

// Attach the Player Challenge function to the button
document.getElementById("player-challenge-btn").addEventListener("click", startPlayerChallenge);

// Attach the About Site function to the button
document.getElementById("about-site-btn").addEventListener("click", () => {
    resetGameArea(); // Clear all other content

    // Show the About Site container
    document.getElementById("about-site-container").style.display = "block";

    // Update the instructions text
    instructionsElement.textContent = "About This Site";
});

// Automatically start in Daily Challenge Mode when the page loads
document.addEventListener("DOMContentLoaded", () => {
    startDailyChallenge();
});



