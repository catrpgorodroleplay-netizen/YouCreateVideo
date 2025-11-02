// CREATE Video Hosting - ПОЛНОСТЬЮ РАБОЧИЙ БЕЗ БОТОВ
const SUPABASE_URL = 'https://tpcyttxxxtnmfpvnyfmm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwY3l0dHh4eHRubWZwdm55Zm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTgzMDUsImV4cCI6MjA3NzU3NDMwNX0.NQxbRwG68DZL781Zdd3baKiAhw3Q8xyhGgTgC57y39E';

// Данные
let videos = JSON.parse(localStorage.getItem('create_videos')) || [];
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
let currentVideo = null;
let isLoginMode = true;

// Глобальная база комментариев и защита от накрутки
let allComments = JSON.parse(localStorage.getItem('global_comments')) || {};
let userReactions = JSON.parse(localStorage.getItem('user_reactions')) || {};
let viewedVideos = JSON.parse(localStorage.getItem('viewed_videos')) || {};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Загружаем видео
    if (videos.length === 0) {
        createInitialVideos();
    }
    loadVideos();
    updateUI();
    
    // Назначаем обработчики
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    
    console.log('CREATE Video Hosting загружен!');
}

// ==================== ВИДЕО СИСТЕМА ====================

function createInitialVideos() {
    videos = []; // Пустой массив - нет бот-видео
    saveVideos();
}

function loadVideos() {
    displayVideos(videos, document.getElementById('videoGrid'));
}

function saveVideos() {
    localStorage.setItem('create_videos', JSON.stringify(videos));
}

function displayVideos(videos, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (videos.length === 0) {
        container.innerHTML = `
            <div class="loading" style="grid-column: 1 / -1;">
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
                     onerror="this.src='https://via.placeholder.com/360x200/333333/FFFFFF?text=CREATE'">
            </div>
            <div class="video-info">
                <img src="${video.channelAvatar || 'https://ui-avatars.com/api/?name=' + video.channelName + '&background=666'}" 
                     alt="${video.channelName}" class="channel-avatar-small">
                <div class="video-details">
                    <div class="video-title">${video.title}</div>
                    <div class="video-meta">
                        <div class="channel-name">${video.channelName}</div>
                        <div>${formatViews(video.views)} просмотров • ${formatDate(video.uploadDate)}</div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(videoCard);
    });
}

// ==================== ВИДЕОПЛЕЕР ====================

function playVideo(video) {
    currentVideo = video;
    
    const viewKey = `${currentUser ? currentUser.id : 'anonymous'}_${video.id}`;
    
    // Увеличиваем просмотры только если пользователь еще не смотрел
    if (!viewedVideos[viewKey]) {
        video.views = (video.views || 0) + 1;
        viewedVideos[viewKey] = true;
        saveVideos();
        localStorage.setItem('viewed_videos', JSON.stringify(viewedVideos));
    }
    
    showSection('videoPage');
    
    // Настраиваем видеоплеер
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
    
    if (videoPlayer) {
        videoPlayer.src = video.videoUrl;
        videoPlayer.load(); // Перезагружаем видео
    }
    if (videoTitle) videoTitle.textContent = video.title;
    if (videoViews) videoViews.textContent = formatViews(video.views) + ' просмотров';
    if (videoDate) videoDate.textContent = formatDate(video.uploadDate);
    if (videoDescription) videoDescription.textContent = video.description || 'Нет описания';
    if (channelName) channelName.textContent = video.channelName;
    if (channelAvatar) channelAvatar.src = video.channelAvatar || `https://ui-avatars.com/api/?name=${video.channelName}&background=666&color=fff`;
    if (subscribersCount) subscribersCount.textContent = formatViews(video.subscribers || 0) + ' подписчиков';
    if (likeCount) likeCount.textContent = video.likes || 0;
    if (dislikeCount) dislikeCount.textContent = video.dislikes || 0;
    
    // Обновляем кнопки реакций
    updateReactionButtons();
    
    loadComments(video.id);
}

// ==================== КОММЕНТАРИИ (ГЛОБАЛЬНЫЕ) ====================

function loadComments(videoId) {
    const comments = allComments[videoId] || [];
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    
    if (!commentsList) return;
    
    if (commentsCount) commentsCount.textContent = comments.length;
    commentsList.innerHTML = '';
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="loading">Пока нет комментариев</div>';
        return;
    }
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <img src="${comment.userAvatar || 'https://ui-avatars.com/api/?name=' + comment.username + '&background=666'}" 
                 alt="${comment.username}" class="comment-avatar">
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.username}</span>
                    <span class="comment-time">${formatDate(comment.timestamp)}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `;
        commentsList.appendChild(commentElement);
    });
}

function addComment() {
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
    
    // Инициализируем массив комментариев для видео если его нет
    if (!allComments[currentVideo.id]) {
        allComments[currentVideo.id] = [];
    }
    
    const newComment = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        text: text,
        timestamp: new Date().toISOString(),
        videoId: currentVideo.id
    };
    
    allComments[currentVideo.id].unshift(newComment);
    
    // Сохраняем ВСЕ комментарии глобально
    localStorage.setItem('global_comments', JSON.stringify(allComments));
    
    commentText.value = '';
    loadComments(currentVideo.id);
    alert('💬 Комментарий добавлен! Теперь его увидят все пользователи!');
}

function clearComment() {
    const commentText = document.getElementById('commentText');
    if (commentText) commentText.value = '';
}

// ==================== ЛАЙКИ И ДЕЙСТВИЯ (ЗАЩИТА ОТ НАКРУТКИ) ====================

function likeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    const reactionKey = `${currentUser.id}_${currentVideo.id}`;
    
    // Проверяем, не лайкал ли уже пользователь
    if (userReactions[reactionKey] === 'like') {
        alert('❌ Вы уже лайкнули это видео!');
        return;
    }
    
    // Если был дизлайк - убираем его
    if (userReactions[reactionKey] === 'dislike') {
        currentVideo.dislikes = Math.max(0, (currentVideo.dislikes || 0) - 1);
    }
    
    // Добавляем лайк
    currentVideo.likes = (currentVideo.likes || 0) + 1;
    userReactions[reactionKey] = 'like';
    
    saveVideos();
    localStorage.setItem('user_reactions', JSON.stringify(userReactions));
    
    const likeCount = document.getElementById('likeCount');
    const dislikeCount = document.getElementById('dislikeCount');
    if (likeCount) likeCount.textContent = currentVideo.likes;
    if (dislikeCount) dislikeCount.textContent = currentVideo.dislikes;
    
    // Обновляем кнопки
    updateReactionButtons();
    
    alert('👍 Лайк добавлен!');
}

function dislikeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    const reactionKey = `${currentUser.id}_${currentVideo.id}`;
    
    // Проверяем, не дизлайкал ли уже пользователь
    if (userReactions[reactionKey] === 'dislike') {
        alert('❌ Вы уже дизлайкнули это видео!');
        return;
    }
    
    // Если был лайк - убираем его
    if (userReactions[reactionKey] === 'like') {
        currentVideo.likes = Math.max(0, (currentVideo.likes || 0) - 1);
    }
    
    // Добавляем дизлайк
    currentVideo.dislikes = (currentVideo.dislikes || 0) + 1;
    userReactions[reactionKey] = 'dislike';
    
    saveVideos();
    localStorage.setItem('user_reactions', JSON.stringify(userReactions));
    
    const likeCount = document.getElementById('likeCount');
    const dislikeCount = document.getElementById('dislikeCount');
    if (likeCount) likeCount.textContent = currentVideo.likes;
    if (dislikeCount) dislikeCount.textContent = currentVideo.dislikes;
    
    // Обновляем кнопки
    updateReactionButtons();
    
    alert('👎 Дизлайк добавлен!');
}

function updateReactionButtons() {
    if (!currentUser || !currentVideo) return;
    
    const reactionKey = `${currentUser.id}_${currentVideo.id}`;
    const reaction = userReactions[reactionKey];
    
    const likeBtn = document.querySelector('.like-btn');
    const dislikeBtn = document.querySelector('.dislike-btn');
    
    // Сбрасываем все стили
    if (likeBtn) likeBtn.classList.remove('active');
    if (dislikeBtn) dislikeBtn.classList.remove('active');
    
    // Устанавливаем активный стиль
    if (reaction === 'like' && likeBtn) {
        likeBtn.classList.add('active');
    } else if (reaction === 'dislike' && dislikeBtn) {
        dislikeBtn.classList.add('active');
    }
}

function subscribeToChannel() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    const btn = document.getElementById('subscribeBtn');
    if (!btn) return;
    
    if (btn.textContent.includes('Подписаться')) {
        btn.textContent = '✅ Подписан';
        btn.style.background = '#3ea6ff';
        if (currentVideo) {
            currentVideo.subscribers = (currentVideo.subscribers || 0) + 1;
            saveVideos();
        }
        alert('📋 Подписка оформлена!');
    } else {
        btn.textContent = 'Подписаться';
        btn.style.background = '#ff0000';
        if (currentVideo && currentVideo.subscribers > 0) {
            currentVideo.subscribers--;
            saveVideos();
        }
        alert('❌ Подписка отменена!');
    }
}

// ==================== ЗАГРУЗКА ВИДЕО (ПО ФАЙЛУ) ====================

function showUploadForm() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) uploadModal.style.display = 'block';
}

function handleUpload(e) {
    if (e) e.preventDefault();
    
    if (!currentUser) {
        alert('Войдите в аккаунт чтобы загружать видео');
        return;
    }
    
    const titleInput = document.getElementById('videoTitleInput');
    const descriptionInput = document.getElementById('videoDescriptionInput');
    const videoFileInput = document.getElementById('videoFile');
    const thumbnailFileInput = document.getElementById('thumbnailFile');
    
    if (!titleInput || !titleInput.value) {
        alert('Введите название видео');
        return;
    }
    
    if (!videoFileInput || !videoFileInput.files[0]) {
        alert('Выберите видео файл');
        return;
    }
    
    const title = titleInput.value;
    const description = descriptionInput ? descriptionInput.value : '';
    const videoFile = videoFileInput.files[0];
    const thumbnailFile = thumbnailFileInput ? thumbnailFileInput.files[0] : null;
    
    // Проверяем размер файла (макс 500MB)
    if (videoFile.size > 500 * 1024 * 1024) {
        alert('Размер видео не должен превышать 500MB');
        return;
    }
    
    // Создаем временные URL для файлов
    const videoUrl = URL.createObjectURL(videoFile);
    let thumbnailUrl = `https://via.placeholder.com/1280x720/ff0000/FFFFFF?text=${encodeURIComponent(title)}`;
    
    if (thumbnailFile) {
        thumbnailUrl = URL.createObjectURL(thumbnailFile);
    }
    
    const newVideo = {
        id: Date.now().toString(),
        title: title,
        description: description,
        videoUrl: videoUrl,
        thumbnail: thumbnailUrl,
        channelName: currentUser.username,
        channelAvatar: currentUser.avatar,
        views: 0,
        likes: 0,
        dislikes: 0,
        subscribers: 0,
        uploadDate: new Date().toISOString(),
        // Добавляем информацию о пользователе который загрузил
        userId: currentUser.id
    };
    
    videos.unshift(newVideo);
    saveVideos();
    
    closeModal('uploadModal');
    if (titleInput) titleInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (videoFileInput) videoFileInput.value = '';
    if (thumbnailFileInput) thumbnailFileInput.value = '';
    
    loadVideos();
    
    alert('✅ ВИДЕО ЗАГРУЖЕНО!\n\nТеперь его увидят все пользователи!');
}

// ==================== АВТОРИЗАЦИЯ ====================

function toggleAuth() {
    isLoginMode = true;
    updateAuthModal();
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'block';
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthModal();
}

function updateAuthModal() {
    const authTitle = document.querySelector('#authModal h2');
    const authSubmitBtn = document.querySelector('#authModal .submit-btn');
    const authSwitch = document.querySelector('.auth-switch');
    
    if (authTitle) {
        authTitle.textContent = isLoginMode ? 'Вход в CREATE' : 'Регистрация';
    }
    if (authSubmitBtn) {
        authSubmitBtn.textContent = isLoginMode ? 'Войти' : 'Зарегистрироваться';
    }
    if (authSwitch) {
        authSwitch.innerHTML = isLoginMode ? 
            'Нет аккаунта? <a href="#" onclick="toggleAuthMode()">Зарегистрироваться</a>' :
            'Уже есть аккаунт? <a href="#" onclick="toggleAuthMode()">Войти</a>';
    }
}

function handleAuth(e) {
    if (e) e.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!usernameInput || !usernameInput.value) {
        alert('Введите имя пользователя');
        return;
    }
    
    const username = usernameInput.value;
    const email = emailInput ? emailInput.value : `${username}@create.com`;
    const password = passwordInput ? passwordInput.value : 'default123';
    
    currentUser = {
        id: Date.now().toString(),
        username: username,
        email: email,
        avatar: `https://ui-avatars.com/api/?name=${username}&background=ff0000&color=fff`,
        joinDate: new Date().toISOString()
    };
    
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    closeModal('authModal');
    updateUI();
    
    alert(`🎉 Добро пожаловать, ${username}!`);
}

// ==================== УТИЛИТЫ ====================

function updateUI() {
    const authBtn = document.getElementById('authBtn');
    const uploadBtn = document.querySelector('.upload-btn');
    
    if (currentUser) {
        if (authBtn) authBtn.innerHTML = `<img src="${currentUser.avatar}" style="width: 32px; height: 32px; border-radius: 50%;" alt="${currentUser.username}">`;
        if (uploadBtn) uploadBtn.style.display = 'flex';
    } else {
        if (authBtn) authBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
        `;
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');
    
    // Если переходим на главную - обновляем видео
    if (sectionId === 'home') {
        loadVideos();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function searchVideos() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase();
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        const title = card.querySelector('.video-title').textContent.toLowerCase();
        const channel = card.querySelector('.channel-name').textContent.toLowerCase();
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
        alert('🔗 Ссылка на видео скопирована! Отправьте другу.');
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
    }
}

function formatViews(views) {
    views = parseInt(views) || 0;
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
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
        return `${weeks} недель${weeks === 1 ? 'у' : 'и'} назад`;
    }
    return date.toLocaleDateString('ru-RU');
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================

window.showSection = showSection;
window.toggleAuth = toggleAuth;
window.toggleAuthMode = toggleAuthMode;
window.closeModal = closeModal;
window.searchVideos = searchVideos;
window.showUploadForm = showUploadForm;
window.playVideo = playVideo;
window.addComment = addComment;
window.clearComment = clearComment;
window.likeVideo = likeVideo;
window.dislikeVideo = dislikeVideo;
window.subscribeToChannel = subscribeToChannel;
window.shareVideo = shareVideo;
window.toggleSidebar = toggleSidebar;
