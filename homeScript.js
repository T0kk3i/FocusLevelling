document.addEventListener("DOMContentLoaded", function () {

    // XP Setup
    let xp = parseInt(localStorage.getItem("xp")) || 0;
    let currentRankIndex = parseInt(localStorage.getItem("rankIndex")) || 0;
    const ranks = ["E", "D", "C", "B", "A", "S", "SS"];
    let habits = JSON.parse(localStorage.getItem("habits")) || [];

    const username = localStorage.getItem("username") || "Adventurer";
    document.getElementById("greeting").innerText = `Welcome Player ${username.toUpperCase()}!`;
    document.getElementById("sidebar-name").textContent = username;

    updateXPBar();
    renderHabits();

    function updateXPBar() {
        localStorage.setItem("xp", xp);
        localStorage.setItem("rankIndex", currentRankIndex);

        document.getElementById("xp-value").innerText = xp % 100;
        document.getElementById("xp-fill").style.width = (xp % 100) + "%";
        document.getElementById("sidebar-xp").innerText = xp % 100;
        document.getElementById("sidebar-level").innerText = ranks[currentRankIndex];
    }

    function toggleHabit(index) {
        const habit = habits[index];
        const difficulty = habit.difficulty || "medium";
        const xpGain = difficulty === "easy" ? 10 : difficulty === "hard" ? 30 : 20;

        if (!habit.done) {
            xp += xpGain;
            if (xp >= 100) {
                xp = 0;
                currentRankIndex = Math.min(currentRankIndex + 1, ranks.length - 1);
                document.getElementById("level-up").innerText = `LEVEL UP! You are now Rank ${ranks[currentRankIndex]}`;
                setTimeout(() => {
                    document.getElementById("level-up").innerText = "";
                }, 2000);
            }
        } else {
            xp = Math.max(xp - xpGain, 0);
        }

        habit.done = !habit.done;
        saveHabits();
        updateXPBar();
        renderHabits();
    }

    function addHabit() {
        const input = document.getElementById("habitInput");
        const text = input.value.trim();
        const difficulty = document.getElementById("difficultySelect").value;
        const type = document.getElementById("habitTypeSelect")?.value || "daily";

        if (!text) return;
        if (!["easy", "medium", "hard"].includes(difficulty)) {
            alert("Invalid Difficulty");
            return;
        }

        habits.push({ text, done: false, difficulty, type });
        saveHabits();
        renderHabits();
        input.value = "";
    }

    function deleteHabit(index) {
        habits.splice(index, 1);
        saveHabits();
        renderHabits();
    }

    function saveHabits() {
        localStorage.setItem("habits", JSON.stringify(habits));
    }

    function renderHabits() {
        const dailyList = document.getElementById("daily-habits-list");
        const todoList = document.getElementById("todo-list");
        dailyList.innerHTML = "";
        todoList.innerHTML = "";

        habits.forEach((habit, index) => {
            const div = document.createElement("div");
            div.className = "habit";
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.style.borderLeft = habit.difficulty === "easy" ? "5px solid #4caf50"
                : habit.difficulty === "medium" ? "5px solid #ffeb3b"
                : "5px solid #f44336";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = habit.done;
            checkbox.onclick = () => toggleHabit(index);

            const label = document.createElement("label");
            label.innerHTML = `<strong>${habit.text}</strong> <span style="font-size: 12px; opacity: 0.7;">(${habit.difficulty})</span>`;
            if (habit.done) {
                label.style.textDecoration = "line-through";
                label.innerHTML += " ✅";
            }

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete";
            deleteBtn.textContent = "Delete";
            deleteBtn.onclick = () => deleteHabit(index);

            div.appendChild(checkbox);
            div.appendChild(label);
            div.appendChild(deleteBtn);

            if (habit.type === "todo") {
                todoList.appendChild(div);
            } else {
                dailyList.appendChild(div);
            }
        });
    }

    function startAISetup() {
        document.getElementById("ai-modal").style.display = "flex";
    }

    function closeAIModal() {
        document.getElementById("ai-modal").style.display = "none";
    }

    function handleAIModal() {
        const input = document.getElementById("ai-goal-input").value.trim();
        if (!input) {
            alert("Please enter a goal first!");
            return;
        }

        const goal = input.toLowerCase();
        const suggestions = [];

        const fuzzyMatch = {
            study: ["study", "exam", "quiz", "homework", "assignment"],
            gym: ["gym", "workout", "fitness", "lift"],
            read: ["read", "book", "novel"],
            wake: ["wake", "6am", "early"]
        };

        for (const [key, keywords] of Object.entries(fuzzyMatch)) {
            if (keywords.some(word => goal.includes(word))) {
                if (key === "study") suggestions.push("Study for 30 mins");
                if (key === "gym") suggestions.push("Exercise for 1 hour");
                if (key === "read") suggestions.push("Read 10 pages");
                if (key === "wake") suggestions.push("Wake up at 7am");
            }
        }

        if (suggestions.length === 0) {
            alert("No matching habits found.");
            return;
        }

        suggestions.forEach(text => habits.push({ text, done: false, difficulty: "medium", type: "daily" }));
        saveHabits();
        renderHabits();
        closeAIModal();
    }

    function resetXP() {
        xp = 0;
        currentRankIndex = 0;
        updateXPBar();
    }

    document.getElementById("ai-goal-input").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            handleAIModal();
        }
    });

    document.getElementById("habitInput").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addHabit();
        }
    });

    // Expose buttons globally (if needed by inline HTML onclicks)
    window.addHabit = addHabit;
    window.startAISetup = startAISetup;
    window.handleAIModal = handleAIModal;
    window.closeAIModal = closeAIModal;
    window.resetXP = resetXP;
});
