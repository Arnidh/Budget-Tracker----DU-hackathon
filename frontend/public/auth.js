// frontend/public/auth.js
// Authentication logic for Budgeting for All

// Check authentication state
auth.onAuthStateChanged(user => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
      // User is signed in
      if (currentPage === 'login.html' || currentPage === 'register.html') {
        window.location.href = 'index.html'; // Redirect to dashboard if already logged in
      }
      
      // Update UI to show user is logged in
      const userDisplay = document.getElementById('user-display');
      if (userDisplay) {
        userDisplay.textContent = user.email;
      }
      
      // Load user-specific data if on dashboard
      if (currentPage === 'index.html' || currentPage === '') {
        loadUserData(user.uid);
      }
    } else {
      // No user is signed in
      if (currentPage !== 'login.html' && currentPage !== 'register.html') {
        window.location.href = 'login.html'; // Redirect to login
      }
    }
  });
  
  // Login function
  function login(email, password) {
    const errorMessage = document.getElementById('login-error');
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = 'index.html';
      })
      .catch(error => {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
      });
  }
  
  // Register function
  function register(email, password) {
    const errorMessage = document.getElementById('register-error');
    
    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
        // Create user profile in Firestore
        return db.collection('users').doc(cred.user.uid).set({
          email: email,
          createdAt: new Date(),
          monthlyBudget: 0,
          savingsGoal: {
            target: 0,
            current: 0,
            title: ''
          }
        });
      })
      .then(() => {
        window.location.href = 'index.html';
      })
      .catch(error => {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
      });
  }
  
  // Google Sign-In
  function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
      .then(result => {
        const user = result.user;
        
        // Check if this is a new user
        db.collection('users').doc(user.uid).get()
          .then(doc => {
            if (!doc.exists) {
              // Create new user profile
              return db.collection('users').doc(user.uid).set({
                email: user.email,
                createdAt: new Date(),
                monthlyBudget: 0,
                savingsGoal: {
                  target: 0,
                  current: 0,
                  title: ''
                }
              });
            }
          })
          .then(() => {
            window.location.href = 'index.html';
          });
      })
      .catch(error => {
        const errorContainer = document.getElementById('login-error') || document.getElementById('register-error');
        if (errorContainer) {
          errorContainer.textContent = error.message;
          errorContainer.style.display = 'block';
        }
      });
  }
  
  // Logout function
  function logout() {
    auth.signOut()
      .then(() => {
        window.location.href = 'login.html';
      });
  }