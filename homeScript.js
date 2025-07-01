document.addEventListener("DOMContentLoaded", function(){  

    window.closeAIModal = closeAIModal;
    window.handleAIModal = handleAIModal;
    window.resetXP = resetXP;
    window.addHabit = addHabit;
    window.startAISetup = startAISetup;
    window.closeHabitModal = closeHabitModal;
    window.confirmHabit = confirmHabit;
    const habitList = document.getElementById("daily-habit-list");
    const dailyList = document.getElementById("daily-habit-list");
    const todoList = document.getElementById("todo-list");
    
    /* XP Bar */
    let xp = parseInt(localStorage.getItem("xp")) || 0; 
    let currentRankIndex = parseInt(localStorage.getItem("rankIndex") || 0);
    const ranks = ["E", "D", "C", "B", "A", "S", "SS"];

    updateXPBar();


    function toggleHabit(index) {
        const difficulty = habits[index].difficulty || "medium";
        const xpGain = difficulty == "easy" ? 10 : difficulty == "hard" ? 30: 20;

        if (!habits[index].done) {
            xp += xpGain;

            if (xp >= 100) {
                xp = 0
                currentRankIndex = Math.min(currentRankIndex + 1, ranks.length -1);
                document.getElementById("level-up").innerText = `LEVEL Up! You are now Rank ${ranks[currentRankIndex]}`;
                setTimeout(() => {
                    document.getElementById("level-up").innerText = "";
                }, 2000);
            }
        } else {
            xp = Math.max(xp - xpGain, 0); // Removing a habit minuses 10 XP, but not below 0
        }

        habits[index].done = !habits[index].done; //Flipping done to not done    
        saveHabits();
        updateXPBar();
        renderHabits();

        //to-do habits gets deleted after marked, with delay
        if(habits[index] && habits[index].type === "todo" && habits[index].done){
            setTimeout(() => {
                deleteHabit(index);
            }, 2000); //2s delay
        }
    } 

    function updateXPBar() {
        localStorage.setItem("xp", xp);
        localStorage.setItem("rankIndex", currentRankIndex);

        document.getElementById("xp-value").innerText = xp % 100; // show num
        document.getElementById("xp-fill").style.width = (xp % 100) + "%"; //Fill bar to match XP
        document.getElementById("sidebar-xp").innerText = xp % 100;
        document.getElementById("sidebar-level").innerText = ranks[currentRankIndex];
    }


    const username = localStorage.getItem("username") || "Adventurer";


    document.getElementById("greeting").innerText = `Welcome Player ${username.toUpperCase()}!`;
    document.getElementById("sidebar-name").textContent = `${username}`;

    //Loading saved habits:
    let habits = JSON.parse(localStorage.getItem("habits")) || [];
    renderHabits();

    //Ading Habits:
    function addHabit() {
        document.getElementById("habit-detail-modal").style.display = "flex";
    }

    //Stripping Habit into Parts 
    function parseHabit(text){
        const numberMatch = text.match(/(\d+)/); //Find any number
        const amount = numberMatch ? parseInt(numberMatch[1]) : 1;

        const lowerText = text.toLowerCase();

        let unit = "generic";
        if (lowerText.includes("min")){
            unit = "time";
        } else if (lowerText.includes("chapter") || lowerText.includes("page") || lowerText.includes("read")){
            unit = "reading";
        } 

        const base = text.replace(/(\d+\s*\w*)/i, "").trim(); 

        return {base, duration: amount,unit};

    }

    function confirmHabit(){
        const name = document.getElementById("habitInput").value.trim();
        const difficulty = document.getElementById("modal-difficulty").value;
        const type = document.getElementById("modal-type").value;

        if (name === "") {
            alert("Please enter habit name:");
            return;
        }

        const { base, duration } = parseHabit(name);

        const newHabit = {
            text: name,
            base: base,
            duration: duration,
            difficulty: difficulty,
            done: false,
            type: type
        };

        habits.push(newHabit);
        saveHabits();
        renderHabits();

        // Reset Input/Close
        document.getElementById("habitInput").value = "";
        document.getElementById("habit-detail-modal").style.display = "none";
    }

    function deleteHabit(index) {
        habits.splice(index, 1)
        saveHabits();
        renderHabits();
    }

    function saveHabits(){
        localStorage.setItem("habits", JSON.stringify(habits));
    }

    
    function renderHabits(){
        dailyList.innerHTML = "";
        todoList.innerHTML = "";

        habits.forEach((habit, index) => {
            const div = document.createElement("div");
            div.className = "habit";

            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.justifyContent = "space-between";
            div.style.borderLeft = habit.difficulty === "easy" ? "5px solid #4caf50":
                                habit.difficulty === "medium" ? "5px solid #ffeb3b":
                                "5px solid #f44336";            

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = habit.done;
            checkbox.onclick = () => toggleHabit(index);

            const label = document.createElement("label");
            label.className = habit.done ? "done": "";
            label.textContent = habit.text;

                
            if (habit.done) {
                label.style.textDecoration = "line-through";
                label.innerHTML += " ✅";
            }

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete";
            deleteBtn.textContent = "Delete";
            deleteBtn.onclick = () => deleteHabit(index);

            //New Feedback Button 
            const feedbackBtn = document.createElement("button");
            feedbackBtn.className = "feedback-btn";
            feedbackBtn.textContent = "Feedback";
            feedbackBtn.onclick = () => giveFeedback(habits[index], index);

            div.appendChild(checkbox);
            div.appendChild(label);
            div.appendChild(deleteBtn);
            div.appendChild(feedbackBtn);

            //List
            if (habit.type === "todo") {
                todoList.appendChild(div);
            } else {
                dailyList.appendChild(div);
            }
        });
    }

    window.renderHabits = renderHabits;

    //AI Recommendations
    function startAISetup() {
        document.getElementById("ai-modal").style.display = "flex";
    }

    function handleAIModal() {
        const input = document.getElementById("ai-goal-input").value.trim();
        if (!input){
            alert("Please enter a goal first!");
            return;
        }        

        const goal = input.toLowerCase();
        const suggestions = [];

        // Fuzzy Matching
        const fuzzyMatch = {
            study: ["study", "studying", "exam", "test", "quiz", "homework", "revise", "assignment", "paper"],
            gym: ["gym", "workout", "running", "fitness", "training", "lift", "stronger", "gyming", "fit", "healthier", "body"],
            read: ["read", "reading", "book", "novel"],
            sleep: ["sleep", "rest", "tired"],
            wake: ["wake", "6am"],
        };

        for (const[habit, keywords] of Object.entries(fuzzyMatch)) {
            if (keywords.some(word => goal.includes(word))) {
                if(habit === "study") suggestions.push("Study for 30 Mins");
                if(habit === "gym") suggestions.push("Exercise for 60 Mins");
                if(habit === "read") suggestions.push("Read 10 Chapters");
                if(habit === "wake") suggestions.push("Wake at 7am");
            }
        } 


        if (suggestions.length == 0) {
            alert("Sorry, I didn't detect any goals. Try again with specific terms: like gym/study/read");
        } else {
            suggestions.forEach(habit => habits.push({ text: habit, done: false, type: "daily"}));
            saveHabits();
            renderHabits();
            alert("Starter Habits Have Been Added Based on Goals!");

            //close modal
            document.getElementById("ai-modal").style.display= "none";
            document.getElementById("ai-goal-input").value = "";
        }
    }

    

    function closeAIModal(){
        document.getElementById("ai-modal").style.display = "none";
    }

    function closeHabitModal(){
        document.getElementById("habit-detail-modal").style.display = "none";
    }

    //1st Feedback Function

    function giveFeedback(habit, index) {
        const response = prompt("How was the habit?");

        //Grab base/duration
        if(!habit.base || !habit.duration) {
            const parsed = parseHabit(habit.text);
            habit.base = parsed.base;
            habit.duration = parsed.duration;
        }

        //Testing Logs
        console.log("GIVE FEEDBACK TRIGGERED");
        console.log("Habit passed in:", habit);
        console.log("Index passed in:", index);
        console.log("Habit base:", habit.base);
        console.log("Habit duration:", habit.duration);
        console.log("Habit text:", habit.text);
        console.log("Parsed habit:", habit.base, habit.duration);

        //Duration Updating based on Habits
        const limits = {
            readin: { min: 1, max: 10, step: 2},
            time: {min: 5, max: 120, step: 10}
        };

        const parsed = parseHabit(habit.text);
        habit.base = habit.base || parsed.base;
        habit.duration = habit.duration || parsed.duration;

        let unit = (habit.unit || parsed.unit || "time").toLowerCase();
        const rule = limits[unit] || limits["time"];
        console.log("Unit:", unit);



        //Duration Updating
        if(response.toLowerCase().includes("hard")){
            habit.duration = Math.max(habit.duration - rule.step, rule.min); // -10 Mins, 5 mins minimum
        } else if (response.toLocaleLowerCase().includes("easy")){
            habit.duration = Math.min(habit.duration += rule.step, rule.max);
        }

        //Dificulty Updating
        if (habit.duration <= 10) {
            habit.difficulty = "easy";
        } else if (habit.duration <= 30) {
            habit.difficulty = "medium";
        } else {
            habit.difficulty = "hard";
        }

        //Formatting Logic
        if (unit === "reading") {
            habit.text = `${capitalize(habit.base)} ${habit.duration} chapters`;
        } else if (unit === "time"){
            habit.text = `${capitalize(habit.base)} for ${habit.duration} mins`;
        } else {
            habit.text = `${capitalize(habit.base)} ${habit.duration}`;
        }

        saveHabits();
        renderHabits();
        alert("Habits Updated!");
    }

    window.giveFeedback = giveFeedback;

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
        
    function resetXP() {
        xp = 0;
        currentRankIndex = 0;


        localStorage.setItem("xp", xp);
        localStorage.setItem("rankIndex", currentRankIndex);
        
        document.getElementById("sidebar-xp").textContent = "0";
        document.getElementById("sidebar-level").textContent = ranks[currentRankIndex];
        
        updateXPBar();
        renderHabits();
    }

    document.getElementById("ai-goal-input").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Optional: prevents form submission or unwanted behavior
        handleAIModal();
        }
    });

    document.getElementById("habitInput").addEventListener("keydown", function(event) {
        if(event.key === "Enter") {
            event.preventDefault();
            addHabit();
            }
    });

    document.getElementById("habit-detail-modal").addEventListener("keydown", function(event) {
        if(event.key === "Enter") {
            event.preventDefault();
            confirmHabit();
        }
    });

    //Resets habit after timer 
 function checkDailyReset() {
    const now = new Date();
    const today = now.toDateString();
    const lastReset = localStorage.getItem("lastReset");

    if (lastReset !== today) {
        habits.forEach(habit => {
            if (habit.type === "daily") {
                if(!habit.done) {
                    const xpLoss = habit.difficulty === "easy" ? 5 :
                                    habit.difficulty === "medium" ? 10: 15;
                    xp -= xpLoss;
                    if (xp < 0){
                        if(currentRankIndex > 0){
                            currentRankIndex--; //Rank Drop 1
                            xp = 90; //Xp 90 full
                            console.log(`New rank ${ranks[currentRankIndex]}`);
                        } else {
                            xp = 0;
                        }
                    }
                    console.log(`Lost ${xpLoss} XP for missing: ${habit.text}`); //test
                }
                habit.done = false;
            }
        });

        localStorage.setItem("lastReset", today);
        saveHabits();
        updateXPBar();
        renderHabits();
    }
}
window.checkDailyReset = checkDailyReset;

function startResetCountdown() {
    function getNextResetTime() {
        const now = new Date();
        const resetTime = new Date();
        resetTime.setHours(0, 0, 0, 0); // midnight tonight
        resetTime.setDate(resetTime.getDate() + 1); // next day
        return resetTime;
    }

    let resetTime = getNextResetTime();

    function updateCountdown() {
        const now = new Date();
        let diff = resetTime - now;

        if (diff <= 0) {
            checkDailyReset();
            resetTime = getNextResetTime(); // refresh the reset time
            diff = resetTime - now;         // recalculate diff
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        const timerSpan = document.getElementById("reset-timer");
        if (timerSpan) timerSpan.textContent = display;
    }

    function pad(num) {
        return num.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

    
    // Making Functions Global
    checkDailyReset();
    startResetCountdown();
    
    //Not in Use! 2nd feedback Function (testing lol)
    function giveFeedbackAI() {
        habits.forEach((habit, index) => {

            const response = prompt(`How was "${habit.text}"? (Easy/ Hard / Just right)`);
            if (!response) return;

            //Checks if Base/Duration is missing, tries to parse
            if(!habit.base || !habit.duration) {
                const parsed = parseHabit(habit.text);
                habit.base = parsed.base;
                habit.duration = parsed.duration;
            }

            if(response.toLowerCase().includes("hard")) {
                habit.duration = Math.max(habit.duration - 10, 5);
            } else if (response.toLowerCase().includes("easy")){
                habit.duration += 10;
            }

            const lower = response.toLowerCase();

            if (lower.includes("easy")) {
                habit.duration = Math.min(habit.duration + 15, 120); // Max 120 mins
            } else if (lower.includes("hard")) {
                habit.duration = Math.max(habit.duration - 10, 5); // Min 5 mins
            }

            // Update difficulty
            if (habit.duration <= 15) {
                habit.difficulty = "easy";
            } else if (habit.duration <= 30) {
                habit.difficulty = "medium";
            } else {
                habit.difficulty = "hard";
            }

        });        
        // Update habit text
        habit.text = `${habit.base} for ${habit.duration} mins`;
        saveHabits();
        renderHabits();
        alert("Habits updated!");
    }

});  
