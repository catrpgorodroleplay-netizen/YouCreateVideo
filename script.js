// Конфигурация бэкенда - ЗАМЕНИТЕ НА ВАШ СЕРВЕР
const API_BASE_URL = 'https://video-hosting-server.onrender.com' // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ URL

// Класс для работы с API
class VideoHostingAPI {
    constructor() {
        this.token = localStorage.getItem('create_token');
        this.user = JSON.parse(localStorage.getItem('create_user')) || null;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Ошибка сервера');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Авторизация
    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('create_token', this.token);
        localStorage.setItem('create_user', JSON.stringify(this.user));
        
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('create_token', this.token);
        localStorage.setItem('create_user', JSON.stringify(this.user));
        
        return data;
    }

    // Видео
    async getVideos() {
        return await this.request('/videos');
    }

    async getVideo(id) {
        return await this.request(`/videos/${id}`);
    }

    async uploadVideo(formData) {
        return await this.request('/videos/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
    }

    async likeVideo(videoId) {
        return await this.request(`/videos/${videoId}/like`, {
            method: 'POST'
        });
    }

    async dislikeVideo(videoId) {
        return await this.request(`/videos/${videoId}/dislike`, {
            method: 'POST'
        });
    }

    // Комментарии
    async getComments(videoId) {
        return await this.request(`/videos/${videoId}/comments`);
    }

    async addComment(videoId, text) {
        return await this.request(`/videos/${videoId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }

    // Подписки
    async subscribe(channelId) {
        return await this.request(`/channels/${channelId}/subscribe`, {
            method: 'POST'
        });
    }

    async unsubscribe(channelId) {
        return await this.request(`/channels/${channelId}/unsubscribe`, {
            method: 'POST'
        });
    }

    // История
    async addToHistory(videoId, progress) {
        return await this.request('/history', {
            method: 'POST',
            body: JSON.stringify({ videoId, progress })
        });
    }
}

// Инициализация API
const api = new VideoHostingAPI();

// Текущий пользователь и состояние
let currentUser = api.user;
let isLoginMode = true;
let currentVideo = null;

// Демо-функции для тестирования (удалите в продакшене)
class DemoBackend {
    constructor() {
        this.videos = JSON.parse(localStorage.getItem('create_videos')) || [];
        this.users = JSON.parse(localStorage.getItem('create_users')) || [];
        this.comments = JSON.parse(localStorage.getItem('create_comments')) || [];
        this.likes = JSON.parse(localStorage.getItem('create_likes')) || [];
        this.subscriptions = JSON.parse(localStorage.getItem('create_subscriptions')) || [];
    }

    save() {
        localStorage.setItem('create_videos', JSON.stringify(this.videos));
        localStorage.setItem('create_users', JSON.stringify(this.users));
        localStorage.setItem('create_comments', JSON.stringify(this.comments));
        localStorage.setItem('create_likes', JSON.stringify(this.likes));
        localStorage.setItem('create_subscriptions', JSON.stringify(this.subscriptions));
    }

    // Имитация API методов
    async register(username, email, password) {
        const user = {
            id: Date.now().toString(),
            username,
            email,
            password, // В реальном приложении хэшируйте!
            avatar: this.generateAvatar(username),
            joinDate: new Date().toISOString(),
            subscribers: 0
        };
        
        this.users.push(user);
        this.save();
        
        return {
            token: 'demo-token-' + Date.now(),
            user
        };
    }

    async login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Неверный email или пароль');
        
        return {
            token: 'demo-token-' + Date.now(),
            user
        };
    }

    async getVideos() {
        return this.videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    }

    async uploadVideo(formData) {
        const title = formData.get('title');
        const description = formData.get('description');
        const videoFile = formData.get('video');
        const thumbnailFile = formData.get('thumbnail');

        const videoUrl = URL.createObjectURL(videoFile);
        const thumbnailUrl = thumbnailFile ? URL.createObjectURL(thumbnailFile) : this.generateThumbnail(title);

        const video = {
            id: Date.now().toString(),
            title,
            description,
            channelId: currentUser.id,
            channelName: currentUser.username,
            channelAvatar: currentUser.avatar,
            videoUrl,
            thumbnail: thumbnailUrl,
            views: 0,
            likes: 0,
            dislikes: 0,
            uploadDate: new Date().toISOString(),
            location: this.getRandomLocation()
        };

        this.videos.push(video);
        this.save();
        
        return video;
    }

    generateAvatar(username) {
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23${Math.floor(Math.random()*16777215).toString(16)}"/><text x="50" y="60" text-anchor="middle" fill="white" font-family="Arial" font-size="40">${username[0].toUpperCase()}</text></svg>`;
    }

    generateThumbnail(title) {
        const colors = ['ff0000', '0070c0', '00b050', 'ffc000', '7030a0'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23${color}"/><text x="160" y="90" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">${title}</text></svg>`;
    }

    getRandomLocation() {
        const locations = ['USA', 'Russia', 'Germany', 'Japan', 'Brazil', 'India', 'UK', 'France'];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    async addComment(videoId, text) {
        const comment = {
            id: Date.now().toString(),
            videoId,
            userId: currentUser.id,
            username: currentUser.username,
            userAvatar: currentUser.avatar,
            text,
            timestamp: new Date().toISOString(),
            location: this.getRandomLocation()
        };
        
        this.comments.push(comment);
        this.save();
        return comment;
    }

    async getComments(videoId) {
        return this.comments.filter(c => c.videoId === videoId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async likeVideo(videoId) {
        this.removeReaction(videoId);
        
        this.likes.push({
            videoId,
            userId: currentUser.id,
            type: 'like',
            timestamp: new Date().toISOString()
        });
        
        this.updateVideoStats(videoId);
        this.save();
    }

    async dislikeVideo(videoId) {
        this.removeReaction(videoId);
        
        this.likes.push({
            videoId,
            userId: currentUser.id,
            type: 'dislike',
            timestamp: new Date().toISOString()
        });
        
        this.updateVideoStats(videoId);
        this.save();
    }

    removeReaction(videoId) {
        this.likes = this.likes.filter(l => 
            !(l.videoId === videoId && l.userId === currentUser.id)
        );
    }

    updateVideoStats(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (video) {
            video.likes = this.likes.filter(l => l.videoId === videoId && l.type === 'like').length;
            video.dislikes = this.likes.filter(l => l.videoId === videoId && l.type === 'dislike').length;
        }
    }

    getUserReaction(videoId) {
        const reaction = this.likes.find(l => 
            l.videoId === videoId && l.userId === currentUser.id
        );
        return reaction ? reaction.type : null;
    }
}

// Используем демо бэкенд (замените на реальный API)
const backend = new DemoBackend();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    loadVideos();
    
    authForm.addEventListener('submit', handleAuth);
    uploadForm.addEventListener('submit', handleUpload);
    
    if (currentUser) {
        updateUserInterface();
    }
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

// Загрузка видео
async function loadVideos() {
    try {
        const videos = await backend.getVideos();
        displayVideos(videos, document.getElementById('videoGrid'));
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        document.getElementById('videoGrid').innerHTML = '<div class="loading">Ошибка загрузки видео</div>';
    }
}

function displayVideos(videos, container) {
    container.innerHTML = '';
    
    if (videos.length === 0) {
        container.innerHTML = '<div class="loading">Пока нет видео. Будьте первым!</div>';
        return;
    }
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.onclick = () => playVideo(video.id);
        
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"180\" viewBox=\"0 0 320 180\"><rect width=\"320\" height=\"180\" fill=\"%23333\"/><text x=\"160\" y=\"90\" text-anchor=\"middle\" fill=\"white\" font-family=\"Arial\" font-size=\"16\">${video.title}</text></svg>'">
            </div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                    ${video.channelName} • ${formatViews(video.views)} просмотров<br>
                    <small>📍 ${video.location} • ${formatDate(video.uploadDate)}</small>
                </div>
            </div>
        `;
        
        container.appendChild(videoCard);
    });
}

// Воспроизведение видео
async function playVideo(videoId) {
    try {
        const video = (await backend.getVideos()).find(v => v.id === videoId);
        if (!video) return;
        
        currentVideo = video;
        
        // Обновляем просмотры
        video.views = (video.views || 0) + 1;
        backend.save();
        
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
        videoViews.textContent = formatViews(video.views) + ' просмотров';
        videoDate.textContent = formatDate(video.uploadDate);
        videoDescription.textContent = video.description || 'Нет описания';
        channelName.textContent = video.channelName;
        channelAvatar.src = video.channelAvatar;
        subscribersCount.textContent = '0 подписчиков';
        likeCount.textContent = video.likes || 0;
        dislikeCount.textContent = video.dislikes || 0;
        
        updateLikeButtons(videoId);
        loadComments(videoId);
        
    } catch (error) {
        console.error('Ошибка воспроизведения видео:', error);
        alert('Ошибка загрузки видео');
    }
}

// Комментарии
async function loadComments(videoId) {
    try {
        const comments = await backend.getComments(videoId);
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
                <img src="${comment.userAvatar}" alt="${comment.username}" class="comment-avatar">
                <div class="comment-content">
                    <h4>${comment.username} <small>📍 ${comment.location}</small></h4>
                    <p class="comment-text">${comment.text}</p>
                    <div class="comment-time">${formatDate(comment.timestamp)}</div>
                </div>
            `;
            commentsList.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
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
        await backend.addComment(currentVideo.id, text);
        commentText.value = '';
        loadComments(currentVideo.id);
    } catch (error) {
        console.error('Ошибка добавления комментария:', error);
        alert('Ошибка добавления комментария');
    }
}

// Лайки
function updateLikeButtons(videoId) {
    if (!currentUser) return;
    
    const reaction = backend.getUserReaction(videoId);
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    
    likeBtn.classList.remove('active');
    dislikeBtn.classList.remove('active');
    
    if (reaction === 'like') {
        likeBtn.classList.add('active');
    } else if (reaction === 'dislike') {
        dislikeBtn.classList.add('active');
    }
}

async function likeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    try {
        await backend.likeVideo(currentVideo.id);
        playVideo(currentVideo.id); // Обновляем страницу
    } catch (error) {
        console.error('Ошибка лайка:', error);
    }
}

async function dislikeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    try {
        await backend.dislikeVideo(currentVideo.id);
        playVideo(currentVideo.id); // Обновляем страницу
    } catch (error) {
        console.error('Ошибка дизлайка:', error);
    }
}

// Подписки
async function subscribeToChannel() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    try {
        // В демо версии просто меняем текст кнопки
        const btn = document.getElementById('subscribeBtn');
        if (btn.textContent.includes('Подписаться')) {
            btn.textContent = '✅ Подписан';
            btn.style.background = '#00b050';
        } else {
            btn.textContent = '📋 Подписаться';
            btn.style.background = '#383838';
        }
    } catch (error) {
        console.error('Ошибка подписки:', error);
    }
}

// Авторизация
function toggleAuth() {
    isLoginMode = true;
    authForm.reset();
    updateAuthModal();
    authModal.style.display = 'block';
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
        let result;
        
        if (isLoginMode) {
            result = await backend.login(email, password);
        } else {
            result = await backend.register(username, email, password);
        }
        
        currentUser = result.user;
        localStorage.setItem('create_user', JSON.stringify(currentUser));
        closeModal('authModal');
        updateUI();
        updateUserInterface();
        
        alert(`Добро пожаловать, ${currentUser.username}!`);
        
    } catch (error) {
        alert(error.message);
    }
}

// Загрузка видео
function showUploadForm() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    uploadModal.style.display = 'block';
}

async function handleUpload(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Войдите в аккаунт чтобы загружать видео');
        return;
    }
    
    const title = document.getElementById('videoTitleInput').value;
    const description = document.getElementById('videoDescriptionInput').value;
    const videoFile = document.getElementById('videoFile').files[0];
    
    if (!videoFile) {
        alert('Выберите видео файл');
        return;
    }
    
    // Проверка размера файла (макс 500MB)
    if (videoFile.size > 500 * 1024 * 1024) {
        alert('Размер видео не должен превышать 500MB');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('video', videoFile);
        
        const thumbnailFile = document.getElementById('thumbnailFile').files[0];
        if (thumbnailFile) {
            formData.append('thumbnail', thumbnailFile);
        }
        
        await backend.uploadVideo(formData);
        
        closeModal('uploadModal');
        uploadForm.reset();
        loadVideos();
        
        alert('Видео успешно загружено! Пользователи со всего мира теперь могут его смотреть!');
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Ошибка загрузки видео: ' + error.message);
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
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'сегодня';
    } else if (diffDays === 1) {
        return 'вчера';
    } else if (diffDays < 7) {
        return `${diffDays} дней назад`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} недель${weeks === 1 ? '' : 'и'} назад`;
    } else {
        return date.toLocaleDateString('ru-RU');
    }
}

function searchVideos() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    backend.getVideos().then(videos => {
        const filtered = videos.filter(video => 
            video.title.toLowerCase().includes(query) ||
            video.description.toLowerCase().includes(query) ||
            video.channelName.toLowerCase().includes(query)
        );
        displayVideos(filtered, document.getElementById('videoGrid'));
    });
}

function shareVideo() {
    if (!currentVideo) return;
    
    const videoUrl = `${window.location.origin}?video=${currentVideo.id}`;
    navigator.clipboard.writeText(videoUrl).then(() => {
        alert('Ссылка на видео скопирована в буфер обмена!');
    });
}

function updateUserInterface() {
    if (currentUser) {
        loadSubscriptions();
        loadLibrary();
        loadHistory();
    }
}

async function loadSubscriptions() {
    // Заглушка для подписок
    const videos = await backend.getVideos();
    displayVideos(videos.slice(0, 6), document.getElementById('subscriptionsGrid'));
}

async function loadLibrary() {
    if (!currentUser) return;
    
    const videos = await backend.getVideos();
    const userVideos = videos.filter(video => video.channelId === currentUser.id);
    displayVideos(userVideos, document.getElementById('libraryGrid'));
}

async function loadHistory() {
    // Заглушка для истории
    const videos = await backend.getVideos();
    displayVideos(videos.slice(0, 8), document.getElementById('historyGrid'));
}

// Обработка глубоких ссылок
function handleDeepLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video');
    
    if (videoId) {
        playVideo(videoId);
    }
}

// Инициализация глубоких ссылок
document.addEventListener('DOMContentLoaded', handleDeepLinks);
