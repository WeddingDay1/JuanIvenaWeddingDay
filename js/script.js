// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    // Ganti dengan URL Web App Anda dari Google Apps Script
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    WEDDING_DATE: new Date('2026-05-01T18:00:00').getTime()
};

// ========================================
// MUSIC CONTROL
// ========================================
const musicControl = document.getElementById('musicControl');
const backgroundMusic = document.getElementById('backgroundMusic');
let isPlaying = false;

musicControl.addEventListener('click', () => {
    if (isPlaying) {
        backgroundMusic.pause();
        musicControl.classList.add('paused');
    } else {
        backgroundMusic.play();
        musicControl.classList.remove('paused');
    }
    isPlaying = !isPlaying;
});

// Auto play on user interaction
document.addEventListener('click', () => {
    if (!isPlaying) {
        backgroundMusic.play().then(() => {
            isPlaying = true;
            musicControl.classList.remove('paused');
        }).catch(err => {
            console.log('Autoplay prevented:', err);
        });
    }
}, { once: true });

// ========================================
// PHOTO CAROUSEL
// ========================================
const carouselTrack = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const indicatorsContainer = document.getElementById('carouselIndicators');

let currentIndex = 0;
const carouselItems = document.querySelectorAll('.carousel-item');
const totalItems = carouselItems.length;

// Create indicators
for (let i = 0; i < totalItems; i++) {
    const indicator = document.createElement('div');
    indicator.classList.add('indicator');
    if (i === 0) indicator.classList.add('active');
    indicator.addEventListener('click', () => goToSlide(i));
    indicatorsContainer.appendChild(indicator);
}

const indicators = document.querySelectorAll('.indicator');

function updateCarousel() {
    const offset = -currentIndex * 100;
    carouselTrack.style.transform = `translateX(${offset}%)`;
    
    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
    });
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % totalItems;
    updateCarousel();
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    updateCarousel();
}

function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
}

nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// Auto slide every 5 seconds
setInterval(nextSlide, 5000);

// Touch swipe support
let touchStartX = 0;
let touchEndX = 0;

carouselTrack.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

carouselTrack.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) nextSlide();
    if (touchEndX > touchStartX + 50) prevSlide();
}

// ========================================
// COUNTDOWN TIMER
// ========================================
function updateCountdown() {
    const now = new Date().getTime();
    const distance = CONFIG.WEDDING_DATE - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

    if (distance < 0) {
        document.getElementById('countdown').innerHTML = '<h3>Hari Bahagia Telah Tiba! 🎉</h3>';
    }
}

// Update countdown every second
setInterval(updateCountdown, 1000);
updateCountdown();

// ========================================
// RSVP FORM SUBMISSION
// ========================================
const rsvpForm = document.getElementById('rsvpForm');

rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nama: document.getElementById('nama').value,
        jumlah: document.getElementById('jumlah').value,
        status: document.querySelector('input[name="status"]:checked').value,
        ucapan: document.getElementById('ucapan').value
    };

    // Disable submit button
    const submitBtn = rsvpForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        // Show success message
        showNotification('Terima kasih! RSVP Anda telah dikirim.', 'success');
        rsvpForm.reset();
        
        // Reload messages
        setTimeout(loadMessages, 1000);

    } catch (error) {
        console.error('Error:', error);
        showNotification('Maaf, terjadi kesalahan. Silakan coba lagi.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// ========================================
// LOAD MESSAGES FROM GOOGLE SHEETS
// ========================================
async function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Memuat ucapan...</div>';

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL);
        const data = await response.json();

        if (data.length === 0) {
            messagesList.innerHTML = '<p class="no-messages">Belum ada ucapan. Jadilah yang pertama! 💝</p>';
            return;
        }

        // Sort by date (newest first)
        data.sort((a, b) => new Date(b[0]) - new Date(a[0]));

        messagesList.innerHTML = data.map(row => {
            const [timestamp, nama, jumlah, status, ucapan] = row;
            const date = new Date(timestamp);
            const formattedDate = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            return `
                <div class="message-card">
                    <div class="message-header">
                        <h4>${nama}</h4>
                        <span class="message-date">${formattedDate}</span>
                    </div>
                    <div class="message-status">
                        <span class="status-badge ${status === 'Hadir' ? 'attending' : 'not-attending'}">
                            <i class="fas ${status === 'Hadir' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${status}
                        </span>
                        <span class="guest-count">${jumlah} Orang</span>
                    </div>
                    ${ucapan ? `<p class="message-text">${ucapan}</p>` : ''}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading messages:', error);
        messagesList.innerHTML = '<p class="error-message">Gagal memuat ucapan. Silakan refresh halaman.</p>';
    }
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// SCROLL ANIMATIONS
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// ========================================
// SMOOTH SCROLL FOR NAVIGATION
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// INITIALIZE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    updateCountdown();
});
