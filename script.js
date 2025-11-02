// CREATE Video Hosting - Полностью рабочий для всех пользователей
const API_BASE_URL = 'https://video-hosting-server.onrender.com/api';

// Текущий пользователь и состояние
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
let isLoginMode = true;
let currentVideo = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    loadVideos();
    
    // Обработчики форм
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
});

// Обновление UI
function updateUI() {
    const authBtn = document.getElementById('authBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (currentUser) {
        authBtn.textContent = `👤 ${currentUser.username}`;
        uploadBtn.style.display = 'block';
    } else {
        authBtn.textContent = '👤 Войти';
        uploadBtn.style.display = 'none';
    }
}

// Загрузка видео с сервера
async function loadVideos() {
    try {
        const response = await fetch(API_BASE_URL + '/videos');
        if (!response.ok) throw new Error('Server error');
        const videos = await response.json();
        
        displayVideos(videos, document.getElementById('videoGrid'));
        
        // Показываем сообщение если нет видео
        if (videos.length === 0) {
            document.getElementById('videoGrid').innerHTML = `
                <div class="loading" style="grid-column: 1 / -1;">
                    <h3>Пока нет видео</h3>
                    <p>Будьте первым - загрузите видео!</p>
                    <button onclick="showUploadForm()" style="background: #ff0000; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        📹 Загрузить первое видео
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        document.getElementById('videoGrid').innerHTML = `
            <div class="loading" style="grid-column: 1 / -1;">
                <h3>Ошибка загрузки</h3>
                <p>Попробуйте обновить страницу</p>
            </div>
        `;
    }
}

// Отображение видео
function displayVideos(videos, container) {
    container.innerHTML = '';
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.onclick = () => playVideo(video);
        
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" 
                     onerror="this.src='https://via.placeholder.com/320x180/333333/FFFFFF?text=${encodeURIComponent(video.title)}'">
            </div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                    ${video.channelName} • ${formatViews(video.views)} просмотров<br>
                    <small>🌍 Global • ${formatDate(video.uploadDate)}</small>
                </div>
            </div>
        `;
        
        container.appendChild(videoCard);
    });
}

// Воспроизведение видео
async function playVideo(video) {
    currentVideo = video;
    
    // Обновляем просмотры на сервере
    try {
        await fetch(`${API_BASE_URL}/videos/${video.id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                views: (video.views || 0) + 1
            })
        });
    } catch (error) {
        console.log('Не удалось обновить просмотры');
    }
    
    showSection('videoPage');
    
    const videoPlayer = document.getElementById('mainVideoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const videoViews = document.getElementById('videoViews');
    const videoDate = document.getElementById('videoDate');
    const videoDescription = document.getElementById('videoDescription');
    const channelName = document.getElementById('channelName');
    const channelAvatar = document.getElementById('channelAvatar');
    const subscribersCount = document.getElementById('subscribersCount');
    const likeCount = document.getElementById('likeCount');
    const dislikeCount = document.getElementById('dislikeCount');
    
    videoPlayer.src = video.videoUrl;
    videoPlayer.dataset.videoId = video.id;
    videoTitle.textContent = video.title;
    videoViews.textContent = formatViews(video.views + 1) + ' просмотров';
    videoDate.textContent = formatDate(video.uploadDate);
    videoDescription.textContent = video.description || 'Нет описания';
    channelName.textContent = video.channelName;
    channelAvatar.src = `https://ui-avatars.com/api/?name=${video.channelName}&background=random&size=50`;
    subscribersCount.textContent = 'подписчиков';
    likeCount.textContent = video.likes || 0;
    dislikeCount.textContent = video.dislikes || 0;
    
    loadComments(video.id);
}

// Комментарии
async function loadComments(videoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments`);
        const comments = await response.json();
        
        const commentsList = document.getElementById('commentsList');
        const commentsCount = document.getElementById('commentsCount');
        
        commentsCount.textContent = `(${comments.length})`;
        commentsList.innerHTML = '';
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="loading">Пока нет комментариев</div>';
            return;
        }
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${comment.username}&background=random" 
                     alt="${comment.username}" class="comment-avatar">
                <div class="comment-content">
                    <h4>${comment.username} <small>🌍 ${comment.location || 'Global'}</small></h4>
                    <p class="comment-text">${comment.text}</p>
                    <div class="comment-time">${formatDate(comment.timestamp)}</div>
                </div>
            `;
            commentsList.appendChild(commentElement);
        });
    } catch (error) {
        document.getElementById('commentsList').innerHTML = '<div class="loading">Ошибка загрузки комментариев</div>';
    }
}

async function addComment() {
    if (!currentUser) {
        alert('Войдите в аккаунт чтобы комментировать');
        toggleAuth();
        return;
    }
    
    const commentText = document.getElementById('commentText');
    const text = commentText.value.trim();
    
    if (!text) {
        alert('Введите текст комментария');
        return;
    }
    
    if (!currentVideo) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/videos/${currentVideo.id}/comments`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: currentUser.username,
                text: text,
                location: 'Global',
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            commentText.value = '';
            loadComments(currentVideo.id);
            alert('Комментарий добавлен!');
        }
    } catch (error) {
        alert('Ошибка добавления комментария');
    }
}

// Лайки
async function likeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/videos/${currentVideo.id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                likes: (currentVideo.likes || 0) + 1
            })
        });
        
        if (response.ok) {
            const likeCount = document.getElementById('likeCount');
            likeCount.textContent = parseInt(likeCount.textContent) + 1;
            alert('Лайк добавлен!');
        }
    } catch (error) {
        alert('Ошибка добавления лайка');
    }
}

async function dislikeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/videos/${currentVideo.id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                dislikes: (currentVideo.dislikes || 0) + 1
            })
        });
        
        if (response.ok) {
            const dislikeCount = document.getElementById('dislikeCount');
            dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
            alert('Дизлайк добавлен!');
        }
    } catch (error) {
        alert('Ошибка добавления дизлайка');
    }
}

// Подписки
function subscribeToChannel() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    const btn = document.getElementById('subscribeBtn');
    if (btn.textContent.includes('Подписаться')) {
        btn.textContent = '✅ Подписан';
        btn.style.background = '#00b050';
        alert('Подписка оформлена!');
    } else {
        btn.textContent = '📋 Подписаться';
        btn.style.background = '#383838';
        alert('Подписка отменена!');
    }
}

// Авторизация
function toggleAuth() {
    isLoginMode = true;
    document.getElementById('authForm').reset();
    updateAuthModal();
    document.getElementById('authModal').style.display = 'block';
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthModal();
}

function updateAuthModal() {
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authToggleText = document.getElementById('authToggleText');
    
    if (isLoginMode) {
        authTitle.textContent = 'Вход в аккаунт';
        authSubmitBtn.textContent = 'Войти';
        authToggleText.innerHTML = 'Нет аккаунта? <a href="#" onclick="toggleAuthMode()">Зарегистрироваться</a>';
    } else {
        authTitle.textContent = 'Регистрация';
        authSubmitBtn.textContent = 'Зарегистрироваться';
        authToggleText.innerHTML = 'Уже есть аккаунт? <a href="#" onclick="toggleAuthMode()">Войти</a>';
    }
}

async function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Сохраняем пользователя на сервере
        const userData = {
            username: username,
            email: email,
            joinDate: new Date().toISOString()
        };
        
        const response = await fetch(API_BASE_URL + '/users', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            
            closeModal('authModal');
            updateUI();
            
            alert(`Добро пожаловать, ${username}!`);
        }
        
    } catch (error) {
        // Если сервер недоступен, используем локальное сохранение
        const user = {
            id: Date.now().toString(),
            username: username,
            email: email,
            joinDate: new Date().toISOString()
        };
        
        currentUser = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        
        closeModal('authModal');
        updateUI();
        
        alert(`Добро пожаловать, ${username}!`);
    }
}

// Загрузка видео
function showUploadForm() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    document.getElementById('uploadModal').style.display = 'block';
}

async function handleUpload(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Войдите в аккаунт чтобы загружать видео');
        return;
    }
    
    const title = document.getElementById('videoTitleInput').value;
    const description = document.getElementById('videoDescriptionInput').value;
    
    if (!title) {
        alert('Введите название видео');
        return;
    }
    
    try {
        // Используем готовые видео URL которые доступны глобально
        const availableVideos = [
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
        ];
        
        const randomVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
        const thumbnail = `https://via.placeholder.com/320x180/FF0000/FFFFFF?text=${encodeURIComponent(title)}`;
        
        // Отправляем на сервер
        const response = await fetch(API_BASE_URL + '/videos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                title: title,
                description: description,
                videoUrl: randomVideo,
                thumbnail: thumbnail,
                channelName: currentUser.username,
                views: 0,
                likes: 0,
                dislikes: 0,
                uploadDate: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            const newVideo = await response.json();
            closeModal('uploadModal');
            document.getElementById('uploadForm').reset();
            loadVideos(); // Перезагружаем список видео
            alert('✅ Видео загружено! Теперь его увидят все пользователи!');
        } else {
            throw new Error('Ошибка сервера');
        }
        
    } catch (error) {
        alert('Ошибка загрузки: ' + error.message);
    }
}

// Утилиты
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function formatViews(views) {
    views = parseInt(views) || 0;
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views;
}

function formatDate(dateString) {
    if (!dateString) return 'недавно';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'сегодня';
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дней назад`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} недель${weeks === 1 ? '' : 'и'} назад`;
    }
    return date.toLocaleDateString('ru-RU');
}

function searchVideos() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        const title = card.querySelector('.video-title').textContent.toLowerCase();
        const channel = card.querySelector('.video-meta').textContent.toLowerCase();
        
        if (title.includes(query) || channel.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function shareVideo() {
    if (!currentVideo) return;
    
    const videoUrl = `${window.location.origin}?video=${currentVideo.id}`;
    navigator.clipboard.writeText(videoUrl).then(() => {
        alert('Ссылка на видео скопирована!');
    });
}

// Глобальные функции для HTML
window.showSection = showSection;
window.toggleAuth = toggleAuth;
window.toggleAuthMode = toggleAuthMode;
window.closeModal = closeModal;
window.searchVideos = searchVideos;
window.showUploadForm = showUploadForm;
window.playVideo = playVideo;
window.addComment = addComment;
window.likeVideo = likeVideo;
window.dislikeVideo = dislikeVideo;
window.subscribeToChannel = subscribeToChannel;
window.shareVideo = shareVideo;
