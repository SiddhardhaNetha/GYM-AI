async function send() {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");

  const message = input.value.trim();

  if (!message) {
    return;
  }

  // Add user message
  const userMsgDiv = document.createElement("div");
  userMsgDiv.className = "message user-msg";
  userMsgDiv.innerHTML = `${escapeHtml(message)}`;
  chat.appendChild(userMsgDiv);

  input.value = "";
  chat.scrollTop = chat.scrollHeight;

  // Hide welcome text when chat starts
  const welcomeText = document.getElementById("welcome-text");
  if (welcomeText) {
    welcomeText.style.display = "none";
  }

  // Show loading indicator
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "message bot-msg";
  loadingDiv.innerHTML = `<span class="loading"></span><span class="loading"></span><span class="loading"></span>`;
  chat.appendChild(loadingDiv);
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    // Remove loading message
    chat.removeChild(loadingDiv);

    // Add bot response
    const botMsgDiv = document.createElement("div");
    botMsgDiv.className = "message bot-msg";
    botMsgDiv.innerHTML = `${escapeHtml(data.reply)}`;
    chat.appendChild(botMsgDiv);

    chat.scrollTop = chat.scrollHeight;

  } catch (error) {
    console.error("Error:", error);
    
    // Remove loading message
    if (chat.contains(loadingDiv)) {
      chat.removeChild(loadingDiv);
    }

    // Add error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "message bot-msg";
    errorDiv.innerHTML = `<span style="color: #ff6b35;">Sorry, I couldn't reach the server. Make sure the backend is running on port 5000.</span>`;
    chat.appendChild(errorDiv);

    chat.scrollTop = chat.scrollHeight;
  }
}

// Handle welcome text visibility
function handleInput(input) {
  const welcomeText = document.getElementById("welcome-text");
  if (!welcomeText) return;
  
  if (input.value.trim().length > 0) {
    welcomeText.style.opacity = "0";
    setTimeout(() => {
        if (input.value.trim().length > 0) welcomeText.style.display = "none";
    }, 300);
  } else {
    // Only bring back if chat is empty
    const chat = document.getElementById("chat");
    if (chat.children.length === 0) {
        welcomeText.style.display = "block";
        setTimeout(() => { welcomeText.style.opacity = "1"; }, 10);
    }
  }
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ENTER key support 🔥
document.getElementById("input").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    send();
  }
});

// Reset chat function
function resetChat() {
  const chat = document.getElementById("chat");
  chat.innerHTML = "";
  const welcomeText = document.getElementById("welcome-text");
  if (welcomeText) {
      welcomeText.style.display = "block";
      welcomeText.style.opacity = "1";
  }
}

// Toggle Chat Sidebar
function toggleChat() {
  const sidebar = document.getElementById("chatbot-sidebar");
  const toggle = document.getElementById("chat-toggle");
  
  sidebar.classList.toggle("active");
  
  if (sidebar.classList.contains("active")) {
    toggle.innerHTML = "✖";
    toggle.style.background = "#2f2f2f";
    // Also focus input when opening
    setTimeout(() => {
        document.getElementById("input").focus();
    }, 400);
  } else {
    toggle.innerHTML = "💬";
    toggle.style.background = "#fff";
  }
}

// Auth State Management
async function checkAuth() {
  try {
    const res = await fetch('/api/user');
    const user = await res.json();
    
    // Header specific elements
    const headerNav = document.querySelector('.header-nav');
    const loginBtn = document.querySelector('.login-nav-btn');
    const signupBtn = document.querySelector('.signup-nav-btn');
    
    // Sidebar specific elements
    const sidebarLoginBtn = document.querySelector('.chatbot-header .login-btn');
    
    if (user) {
      const userDisplay = `
        <span class="nav-link" style="color: #fff; font-weight: 500;">Hi, ${user.displayName.split(' ')[0]}</span>
        <a href="/logout" class="nav-link login-nav-btn nav-btn">Logout</a>
      `;
      
      // Update Laptop Header
      if (loginBtn) loginBtn.remove();
      if (signupBtn) signupBtn.remove();
      
      // Clear home/about for authenticated state if space is tight, or just append
      headerNav.insertAdjacentHTML('beforeend', userDisplay);
      
      // Update Mobile Sidebar
      if (sidebarLoginBtn) {
        sidebarLoginBtn.innerHTML = 'Logout';
        sidebarLoginBtn.onclick = () => window.location.href = '/logout';
      }
    } else {
      // Set click handlers for login buttons
      const loginActions = [loginBtn, sidebarLoginBtn];
      loginActions.forEach(btn => {
        if (btn) btn.onclick = () => window.location.href = '/auth/google';
      });
      
      if (signupBtn) {
        signupBtn.onclick = () => window.location.href = '/auth/google';
      }
    }
  } catch (err) {
    console.error('Auth check failed:', err);
  }
}

// Run auth check on load
document.addEventListener('DOMContentLoaded', checkAuth);