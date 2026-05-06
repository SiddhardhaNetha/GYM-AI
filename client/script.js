let selectedImageBase64 = null;

window.escapeHtml = function(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
};

window.clearImage = function() {
    selectedImageBase64 = null;
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) previewContainer.style.display = 'none';
    const imagePreview = document.getElementById('image-preview');
    if (imagePreview) imagePreview.src = '';
};

window.handleInput = function(input) {
    const welcomeText = document.getElementById("welcome-text");
    if (!welcomeText) return;
    if (input.value.trim().length > 0) {
        welcomeText.style.display = "none";
    } else {
        const chat = document.getElementById("chat");
        if (chat && chat.children.length === 0) welcomeText.style.display = "block";
    }
};

window.toggleChat = function() {
    const sidebar = document.getElementById("chatbot-sidebar");
    const toggle = document.getElementById("chat-toggle");
    if (!sidebar) return;
    sidebar.classList.toggle("active");
    if (sidebar.classList.contains("active")) {
        if (toggle) {
            toggle.innerHTML = "✕";
            toggle.style.background = "#2f2f2f";
        }
        setTimeout(() => {
            const input = document.getElementById("input");
            if (input) input.focus();
        }, 100);
    } else {
        if (toggle) {
            toggle.innerHTML = "💬";
            toggle.style.background = "#fff";
        }
    }
};

window.send = async function() {
    const input = document.getElementById("input");
    const chat = document.getElementById("chat");
    if (!input || !chat) return;

    const message = input.value.trim();
    if (!message && !selectedImageBase64) return;

    const userMsgDiv = document.createElement("div");
    userMsgDiv.className = "message user-msg";
    
    let userHtml = window.escapeHtml(message);
    if (selectedImageBase64) {
        userHtml += (message ? '<br>' : '') + '<img src="' + selectedImageBase64 + '" style="max-width: 200px; border-radius: 8px; margin-top: 10px; display: block;">';
    }
    
    userMsgDiv.innerHTML = userHtml;
    chat.appendChild(userMsgDiv);

    const imageToSend = selectedImageBase64;
    input.value = "";
    window.clearImage();
    chat.scrollTop = chat.scrollHeight;

    const welcomeText = document.getElementById("welcome-text");
    if (welcomeText) welcomeText.style.display = "none";

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message bot-msg";
    loadingDiv.innerHTML = '<span class="loading"></span><span class="loading"></span><span class="loading"></span>';
    chat.appendChild(loadingDiv);
    chat.scrollTop = chat.scrollHeight;

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: message || "Analyze this image", 
                image: imageToSend 
            })
        });

        const data = await response.json();
        if (chat.contains(loadingDiv)) chat.removeChild(loadingDiv);

        const botMsgDiv = document.createElement("div");
        botMsgDiv.className = "message bot-msg";
        botMsgDiv.innerHTML = window.escapeHtml(data.reply);
        chat.appendChild(botMsgDiv);
        chat.scrollTop = chat.scrollHeight;

    } catch (error) {
        console.error("Error:", error);
        if (chat.contains(loadingDiv)) chat.removeChild(loadingDiv);
        const errorDiv = document.createElement("div");
        errorDiv.className = "message bot-msg";
        errorDiv.innerHTML = '<span style="color: #ff6b35;">Error reaching server.</span>';
        chat.appendChild(errorDiv);
        chat.scrollTop = chat.scrollHeight;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                selectedImageBase64 = event.target.result;
                const previewContainer = document.getElementById('preview-container');
                const imagePreview = document.getElementById('image-preview');
                if (imagePreview) imagePreview.src = selectedImageBase64;
                if (previewContainer) previewContainer.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        });
    }

    const inputArea = document.getElementById("input");
    if (inputArea) {
        inputArea.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                window.send();
            }
        });
    }

    // Check user authentication
    async function checkAuth() {
        try {
            const response = await fetch("/api/user");
            const user = await response.json();
            const nav = document.getElementById("header-nav");
            if (user && nav) {
                // User is logged in, show logout and profile
                nav.innerHTML = `
                    <a href="index.html" class="nav-link">Home</a>
                    <a href="about.html" class="nav-link">About</a>
                    <a href="coaching.html" class="nav-link">Coaching</a>
                    <span class="nav-link" style="color: #fff; font-size: 0.85em;">Hi, ${user.displayName || 'User'}</span>
                    <a href="/auth/logout" class="nav-link login-nav-btn nav-btn">Logout</a>
                `;
                
                // Also update chatbot sidebar button if it exists
                const sidebarLogin = document.querySelector(".chatbot-header .login-btn");
                if (sidebarLogin) {
                    sidebarLogin.textContent = "Logout";
                    sidebarLogin.onclick = () => window.location.href = "/auth/logout";
                }
            }
        } catch (error) {
            console.error("Auth check failed:", error);
        }
    }
    checkAuth();

    // Menu Toggle Logic
    const menuBtn = document.getElementById("menuBtn");
    const closeMenu = document.getElementById("closeMenu");
    const sideMenu = document.getElementById("sideMenu");
    const menuOverlay = document.getElementById("menuOverlay");

    if (menuBtn && sideMenu && menuOverlay) {
        menuBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            sideMenu.classList.add("active");
            menuOverlay.classList.add("active");
        });

        const hideMenu = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            sideMenu.classList.remove("active");
            menuOverlay.classList.remove("active");
        };

        if (closeMenu) closeMenu.addEventListener("click", hideMenu);
        menuOverlay.addEventListener("click", hideMenu);
    }
});

window.toggleHeightInputs = function() {
    const unit = document.getElementById('height-unit').value;
    const cmContainer = document.getElementById('cm-input-container');
    const ftInContainer = document.getElementById('ft-in-input-container');
    
    if (unit === 'cm') {
        cmContainer.style.display = 'block';
        ftInContainer.style.display = 'none';
        ftInContainer.style.gap = '0';
    } else {
        cmContainer.style.display = 'none';
        ftInContainer.style.display = 'flex';
        ftInContainer.style.gap = '5px';
    }
};

window.calculateBMI = function() {
    const age = parseFloat(document.getElementById('bmi-age').value);
    const gender = document.getElementById('bmi-gender').value;
    let weight = parseFloat(document.getElementById('bmi-weight').value);
    const weightUnit = document.getElementById('weight-unit').value;
    const heightUnit = document.getElementById('height-unit').value;
    const resultDiv = document.getElementById('bmi-result');

    let heightInMeters = 0;

    if (!age || age <= 0) {
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(255, 68, 68, 0.1)';
        resultDiv.style.color = '#ff4444';
        resultDiv.innerText = 'Please enter a valid age.';
        return;
    }

    // Convert weight to kg
    if (weightUnit === 'lbs') {
        weight = weight * 0.453592;
    }

    // Convert height to meters
    if (heightUnit === 'cm') {
        const heightCm = parseFloat(document.getElementById('bmi-height').value);
        heightInMeters = heightCm / 100;
    } else {
        const ft = parseFloat(document.getElementById('bmi-height-ft').value) || 0;
        const inch = parseFloat(document.getElementById('bmi-height-in').value) || 0;
        const totalInches = (ft * 12) + inch;
        heightInMeters = totalInches * 0.0254;
    }

    if (!weight || !heightInMeters || weight <= 0 || heightInMeters <= 0) {
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(255, 68, 68, 0.1)';
        resultDiv.style.color = '#ff4444';
        resultDiv.innerText = 'Please enter valid weight and height.';
        return;
    }

    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    let category = '';
    let color = '';

    // Age and gender based logic (Adults 20+ vs Children/Seniors)
    if (age < 20) {
        // Simple percentile-based representation for demonstration
        // Note: Real child BMI requires growth charts, here we provide a generalized estimation
        if (bmi < 15) { category = 'Underweight'; color = '#ffbb33'; }
        else if (bmi < 22) { category = 'Normal weight'; color = '#00ff88'; }
        else if (bmi < 27) { category = 'Overweight'; color = '#ffbb33'; }
        else { category = 'Obese'; color = '#ff4444'; }
    } else if (age > 65) {
        // Seniors often have slightly higher healthy BMI ranges
        if (bmi < 22) { category = 'Underweight'; color = '#ffbb33'; }
        else if (bmi < 28) { category = 'Normal weight'; color = '#00ff88'; }
        else if (bmi < 31) { category = 'Overweight'; color = '#ffbb33'; }
        else { category = 'Obese'; color = '#ff4444'; }
    } else {
        // Standard Adult ranges with slight gender-based commentary
        if (bmi < 18.5) { category = 'Underweight'; color = '#ffbb33'; }
        else if (bmi < 25) { category = 'Normal weight'; color = '#00ff88'; }
        else if (bmi < 30) { category = 'Overweight'; color = '#ffbb33'; }
        else { category = 'Obese'; color = '#ff4444'; }
    }

    resultDiv.style.display = 'block';
    resultDiv.style.background = color + '22';
    resultDiv.style.color = color;
    resultDiv.innerHTML = `BMI: <strong>${bmi} kg/m²</strong><br><small>${category} (${gender}, ${age}y)</small>`;
};


window.calculateTDEE = function() {
    const gender = document.getElementById('tdee-gender').value;
    const age = parseFloat(document.getElementById('tdee-age').value);
    const weight = parseFloat(document.getElementById('tdee-weight').value);
    const height = parseFloat(document.getElementById('tdee-height').value);
    const activity = parseFloat(document.getElementById('tdee-activity').value);
    const resultDiv = document.getElementById('tdee-result');

    if (!age || !weight || !height) {
        resultDiv.style.display = 'block';
        resultDiv.style.color = '#ff4444';
        resultDiv.innerText = 'Please fill all fields.';
        return;
    }

    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = (gender === 'male') ? bmr + 5 : bmr - 161;
    
    const tdee = Math.round(bmr * activity);
    
    resultDiv.style.display = 'block';
    resultDiv.style.background = 'rgba(0, 255, 136, 0.1)';
    resultDiv.style.color = '#00ff88';
    resultDiv.innerHTML = `
        <strong>BMR:</strong> ${bmr.toFixed(0)} kcal<br>
        <strong>TDEE:</strong> ${tdee} kcal<br><br>
        <strong>Daily Goals:</strong><br>
        • Lose (0.5kg/wk): ${tdee - 500} kcal<br>
        • Maintain: ${tdee} kcal<br>
        • Gain (0.5kg/wk): ${tdee + 500} kcal
    `;
};

window.calculatePhysique = function() {
    const weight = parseFloat(document.getElementById('tdee-weight').value); // Reuse weight from TDEE
    const height = parseFloat(document.getElementById('tdee-height').value); // Reuse height
    const waist = parseFloat(document.getElementById('bf-waist').value);
    const neck = parseFloat(document.getElementById('bf-neck').value);
    const gender = document.getElementById('tdee-gender').value;
    const resultDiv = document.getElementById('physique-result');

    if (!waist || !neck || !weight || !height) {
        resultDiv.style.display = 'block';
        resultDiv.style.color = '#ff4444';
        resultDiv.innerText = 'Enter weight/height above + waist/neck.';
        return;
    }

    // Ideal Weight (Devine Formula)
    let idealWeight = 0;
    const heightInInches = height / 2.54;
    if (gender === 'male') {
        idealWeight = 50 + 2.3 * (heightInInches - 60);
    } else {
        idealWeight = 45.5 + 2.3 * (heightInInches - 60);
    }

    // US Navy Body Fat Formula (simplified for metric)
    let bodyFat = 0;
    if (gender === 'male') {
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else {
        const hip = parseFloat(document.getElementById('bf-hip').value) || waist;
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    }

    resultDiv.style.display = 'block';
    resultDiv.style.background = 'rgba(0, 255, 136, 0.1)';
    resultDiv.style.color = '#00ff88';
    resultDiv.innerHTML = `
        <strong>Body Fat:</strong> ${bodyFat.toFixed(1)}%<br>
        <strong>Ideal Weight:</strong> ${idealWeight.toFixed(1)} kg<br>
        <small>Target Range: ${(idealWeight - 5).toFixed(1)} - ${(idealWeight + 5).toFixed(1)} kg</small>
    `;
};


window.scrollToCalculator = function(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

console.log('script.js loaded at ' + new Date());
