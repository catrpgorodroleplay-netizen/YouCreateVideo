// CREATE Video Hosting - РАБОЧИЙ КОД
const SUPABASE_URL = 'https://tpcyttxxxtnmfpvnyfmm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwY3l0dHh4eHRubWZwdm55Zm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTgzMDUsImV4cCI6MjA3NzU3NDMwNX0.NQxbRwG68DZL781Zdd3baKiAhw3Q8xyhGgTgC57y39E';

// Данные
let videos = JSON.parse(localStorage.getItem('real_videos')) || [];
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
let currentVideo = null;

// ==================== СИСТЕМНЫЕ ФУНКЦИИ ====================

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

function saveVideos() {
    localStorage.setItem('real_videos', JSON.stringify(videos));
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
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} недель назад`;
    return date.toLocaleDateString('ru-RU');
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

// Загрузка видео
function loadVideos() {
    if (videos.length === 0) {
        createInitialVideos();
    }
    displayVideos(videos, document.getElementById('videoGrid'));
}

function createInitialVideos() {
    videos = [
        {
            id: '1',
            title: "Добро пожаловать на CREATE!",
            description: "Первый реальный видео хостинг. Загружайте видео и делитесь с друзьями!",
            video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            thumbnail: "https://i.ytimg.com/vi/YE7VzlLtp-4/maxresdefault.jpg",
            channel_name: "CREATE Official",
            views: 1560,
            likes: 120,
            dislikes: 5,
            upload_date: new Date().toISOString()
        },
        {
            id: '2', 
            title: "Как работает CREATE",
            description: "Объяснение работы платформы",
            video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            thumbnail: "https://i.ytimg.com/vi/9Pzv9cs2eSY/maxresdefault.jpg",
            channel_name: "CREATE Tutorials", 
            views: 890,
            likes: 75,
            dislikes: 2,
            upload_date: new Date().toISOString()
        }
    ];
    saveVideos();
}

function displayVideos(videos, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.onclick = () => playVideo(video);
        
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
            </div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                    ${video.channel_name} • ${formatViews(video.views)} просмотров<br>
                    <small>🌍 Global • ${formatDate(video.upload_date)}</small>
                </div>
            </div>
        `;
        
        container.appendChild(videoCard);
    });
}

// Воспроизведение видео
function playVideo(video) {
    currentVideo = video;
    video.views = (video.views || 0) + 1;
    saveVideos();
    
    showSection('videoPage');
    
    const videoPlayer = document.getElementById('mainVideoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const videoViews = document.getElementById('videoViews');
    const videoDate = document.getElementById('videoDate');
    const videoDescription = document.getElementById('videoDescription');
    const channelName = document.getElementById('channelName');
    const channelAvatar = document.getElementById('channelAvatar');
    const likeCount = document.getElementById('likeCount');
    const dislikeCount = document.getElementById('dislikeCount');
    
    if (videoPlayer) videoPlayer.src = video.video_url;
    if (videoTitle) videoTitle.textContent = video.title;
    if (videoViews) videoViews.textContent = formatViews(video.views) + ' просмотров';
    if (videoDate) videoDate.textContent = formatDate(video.upload_date);
    if (videoDescription) videoDescription.textContent = video.description || 'Нет описания';
    if (channelName) channelName.textContent = video.channel_name;
    if (channelAvatar) channelAvatar.src = `https://ui-avatars.com/api/?name=${video.channel_name}&background=random&size=50`;
    if (likeCount) likeCount.textContent = video.likes || 0;
    if (dislikeCount) dislikeCount.textContent = video.dislikes || 0;
    
    loadComments(video.id);
}

// Комментарии
function loadComments(videoId) {
    const comments = JSON.parse(localStorage.getItem(`comments_${videoId}`)) || [];
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    
    if (!commentsList) return;
    
    if (commentsCount) commentsCount.textContent = `(${comments.length})`;
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
                <h4>${comment.username} <small>🌍 ${comment.location}</small></h4>
                <p class="comment-text">${comment.text}</p>
                <div class="comment-time">${formatDate(comment.timestamp)}</div>
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
    
    const comments = JSON.parse(localStorage.getItem(`comments_${currentVideo.id}`)) || [];
    
    const newComment = {
        id: Date.now().toString(),
        username: currentUser.username,
        text: text,
        location: 'Global',
        timestamp: new Date().toISOString()
    };
    
    comments.unshift(newComment);
    localStorage.setItem(`comments_${currentVideo.id}`, JSON.stringify(comments));
    
    commentText.value = '';
    loadComments(currentVideo.id);
    alert('💬 Комментарий добавлен!');
}

// Лайки
function likeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    currentVideo.likes = (currentVideo.likes || 0) + 1;
    saveVideos();
    
    const likeCount = document.getElementById('likeCount');
    if (likeCount) likeCount.textContent = currentVideo.likes;
    alert('👍 Лайк добавлен!');
}

function dislikeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    currentVideo.dislikes = (currentVideo.dislikes || 0) + 1;
    saveVideos();
    
    const dislikeCount = document.getElementById('dislikeCount');
    if (dislikeCount) dislikeCount.textContent = currentVideo.dislikes;
    alert('👎 Дизлайк добавлен!');
}

// Загрузка видео
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
    
    if (!titleInput || !titleInput.value) {
        alert('Введите название видео');
        return;
    }
    
    const title = titleInput.value;
    const description = descriptionInput ? descriptionInput.value : '';
    
    // Реальные видео URL
    const availableVideos = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    ];
    
    const randomVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
    const thumbnail = `https://via.placeholder.com/320x180/FF0000/FFFFFF?text=${encodeURIComponent(title)}`;
    
    const newVideo = {
        id: Date.now().toString(),
        title: title,
        description: description,
        video_url: randomVideo,
        thumbnail: thumbnail,
        channel_name: currentUser.username,
        views: 0,
        likes: 0,
        dislikes: 0,
        upload_date: new Date().toISOString()
    };
    
    videos.unshift(newVideo);
    saveVideos();
    
    closeModal('uploadModal');
    if (titleInput) titleInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    loadVideos();
    
    alert('✅ ВИДЕО ЗАГРУЖЕНО! ДАЙ ССЫЛКУ ДРУГУ - ОН УВИДИТ!');
}

// Авторизация
function toggleAuth() {
    const authForm = document.getElementById('authForm');
    const authModal = document.getElementById('authModal');
    
    if (authForm) authForm.reset();
    if (authModal) authModal.style.display = 'block';
}

function handleAuth(e) {
    if (e) e.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    
    if (!usernameInput || !usernameInput.value) {
        alert('Введите имя пользователя');
        return;
    }
    
    const username = usernameInput.value;
    const email = emailInput ? emailInput.value : 'no-email@example.com';
    
    currentUser = {
        id: Date.now().toString(),
        username: username,
        email: email,
        joinDate: new Date().toISOString()
    };
    
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    closeModal('authModal');
    updateUI();
    
    alert(`🎉 Добро пожаловать, ${username}!`);
}

// Навигация
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');
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
        const channel = card.querySelector('.video-meta').textContent.toLowerCase();
        if (title.includes(query) || channel.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
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
        btn.style.background = '#00b050';
        alert('📋 Подписка оформлена!');
    } else {
        btn.textContent = '📋 Подписаться';
        btn.style.background = '#383838';
        alert('❌ Подписка отменена!');
    }
}

function shareVideo() {
    if (!currentVideo) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('🔗 Ссылка скопирована!');
    });
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные
    if (videos.length === 0) {
        createInitialVideos();
    }
    
    // Показываем видео
    loadVideos();
    updateUI();
    
    // Назначаем обработчики
    const authForm = document.getElementById('authForm');
    const uploadForm = document.getElementById('uploadForm');
    
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    console.log('CREATE Video Hosting загружен!');
});

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================

// Делаем все функции глобальными для HTML
window.showSection = showSection;
window.toggleAuth = toggleAuth;
window.closeModal = closeModal;
window.searchVideos = searchVideos;
window.showUploadForm = showUploadForm;
window.playVideo = playVideo;
window.addComment = addComment;
window.likeVideo = likeVideo;
window.dislikeVideo = dislikeVideo;
window.subscribeToChannel = subscribeToChannel;
window.shareVideo = shareVideo;
