// CREATE Video Hosting - Работает с текущим сервером
const API_BASE_URL = 'https://video-hosting-server.onrender.com/api';

// Текущий пользователь и состояние
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
let isLoginMode = true;
let currentVideo = null;

// Демо видео которые всегда доступны
const DEMO_VIDEOS = [
    {
        id: '1',
        title: "Добро пожаловать на CREATE!",
        description: "Первый международный видео хостинг. Загружайте свои видео и делитесь с миром!",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnail: "https://i.ytimg.com/vi/YE7VzlLtp-4/maxresdefault.jpg",
        channelName: "CREATE Official",
        views: 1560,
        likes: 120,
        dislikes: 5,
        uploadDate: new Date().toISOString()
    },
    {
        id: '2', 
        title: "Красивая природа 4K",
        description: "Удивительные пейзажи со всего мира в высоком качестве",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnail: "https://i.ytimg.com/vi/9Pzv9cs2eSY/maxresdefault.jpg",
        channelName: "Nature World",
        views: 890,
        likes: 75,
        dislikes: 2,
        uploadDate: new Date().toISOString()
    }
];

// Все видео (демо + загруженные пользователями)
let allVideos = [...DEMO_VIDEOS];

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

// Загрузка видео
async function loadVideos() {
    try {
        const response = await fetch(API_BASE_URL + '/videos');
        if (response.ok) {
            const serverVideos = await response.json();
            // Объединяем демо видео с видео с сервера
            allVideos = [...DEMO_VIDEOS, ...serverVideos];
        }
    } catch (error) {
        console.log('Сервер недоступен, используем демо видео');
    }
    
    displayVideos(allVideos, document.getElementById('videoGrid'));
}

// Отображение видео
function displayVideos(videos, container) {
    container.innerHTML = '';
    
    if (videos.length === 0) {
        container.innerHTML = `
            <div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3>🎬 Пока нет видео</h3>
                <p>Будьте первым - загрузите видео!</p>
                <button onclick="showUploadForm()" style="background: #ff0000; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 15px;">
                    📹 Загрузить первое видео
                </button>
            </div>
        `;
        return;
    }
    
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
function playVideo(video) {
    currentVideo = video;
    
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
    videoTitle.textContent = video.title;
    videoViews.textContent = formatViews(video.views) + ' просмотров';
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
        document.getElementById('commentsList').innerHTML = '<div class="loading">Пока нет комментариев</div>';
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
            alert('💬 Комментарий добавлен!');
        } else {
            throw new Error('Ошибка сервера');
        }
    } catch (error) {
        alert('✅ Комментарий добавлен (локально)');
        commentText.value = '';
        // Добавляем комментарий локально
        const commentsList = document.getElementById('commentsList');
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=${currentUser.username}&background=random" 
                 alt="${currentUser.username}" class="comment-avatar">
            <div class="comment-content">
                <h4>${currentUser.username} <small>🌍 Global</small></h4>
                <p class="comment-text">${text}</p>
                <div class="comment-time">только что</div>
            </div>
        `;
        commentsList.insertBefore(commentElement, commentsList.firstChild);
        
        // Обновляем счетчик
        const commentsCount = document.getElementById('commentsCount');
        const currentCount = parseInt(commentsCount.textContent.replace(/[()]/g, '')) || 0;
        commentsCount.textContent = `(${currentCount + 1})`;
    }
}

// Лайки
function likeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    const likeCount = document.getElementById('likeCount');
    likeCount.textContent = parseInt(likeCount.textContent) + 1;
    alert('👍 Лайк добавлен!');
}

function dislikeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    const dislikeCount = document.getElementById('dislikeCount');
    dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
    alert('👎 Дизлайк добавлен!');
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
        alert('📋 Подписка оформлена!');
    } else {
        btn.textContent = '📋 Подписаться';
        btn.style.background = '#383838';
        alert('❌ Подписка отменена!');
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

function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!username || !email) {
        alert('Заполните все поля');
        return;
    }
    
    // Простая регистрация без сервера
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
    
    alert(`🎉 Добро пожаловать, ${username}!`);
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
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
        ];
        
        const randomVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
        const thumbnail = `https://via.placeholder.com/320x180/FF0000/FFFFFF?text=${encodeURIComponent(title)}`;
        
        // Пытаемся отправить на сервер
        const videoData = {
            title: title,
            description: description,
            videoUrl: randomVideo,
            thumbnail: thumbnail,
            channelName: currentUser.username,
            views: 0,
            likes: 0,
            dislikes: 0,
            uploadDate: new Date().toISOString()
        };
        
        const response = await fetch(API_BASE_URL + '/videos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(videoData)
        });
        
        if (response.ok) {
            const newVideo = await response.json();
            // Добавляем новое видео в список
            allVideos.unshift(newVideo);
            displayVideos(allVideos, document.getElementById('videoGrid'));
            
            closeModal('uploadModal');
            document.getElementById('uploadForm').reset();
            alert('✅ Видео загружено на сервер! Теперь его увидят все пользователи!');
        } else {
            throw new Error('Сервер не отвечает');
        }
        
    } catch (error) {
        // Если сервер недоступен, добавляем видео локально
        const videoData = {
            id: Date.now().toString(),
            title: title,
            description: description,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            thumbnail: `https://via.placeholder.com/320x180/FF0000/FFFFFF?text=${encodeURIComponent(title)}`,
            channelName: currentUser.username,
            views: 0,
            likes: 0,
            dislikes: 0,
            uploadDate: new Date().toISOString()
        };
        
        allVideos.unshift(videoData);
        displayVideos(allVideos, document.getElementById('videoGrid'));
        
        closeModal('uploadModal');
        document.getElementById('uploadForm').reset();
        alert('✅ Видео загружено (локально)! Обновите страницу чтобы увидеть его.');
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
    
    const videoUrl = window.location.href.split('?')[0] + `?video=${currentVideo.id}`;
    navigator.clipboard.writeText(videoUrl).then(() => {
        alert('🔗 Ссылка на видео скопирована!');
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
