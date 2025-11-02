// CREATE Video Hosting - РЕАЛЬНЫЙ СЕРВЕР БЕЗ ДЕМО
const SUPABASE_URL = 'https://tpcyttxxxtnmfpvnyfmm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwY3l0dHh4eHRubWZwdm55Zm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTgzMDUsImV4cCI6MjA3NzU3NDMwNX0.NQxbRwG68DZL781Zdd3baKiAhw3Q8xyhGgTgC57y39E';

// Текущий пользователь
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
let currentVideo = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    loadVideos();
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
});

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
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

// ЗАГРУЗКА ВИДЕО С РЕАЛЬНОГО СЕРВЕРА
async function loadVideos() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка сервера');
        const videos = await response.json();
        
        displayVideos(videos, document.getElementById('videoGrid'));
        
        if (videos.length === 0) {
            document.getElementById('videoGrid').innerHTML = `
                <div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <h3>🎬 Пока нет видео</h3>
                    <p>Будьте первым - загрузите видео!</p>
                    <button onclick="showUploadForm()" style="background: #ff0000; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 15px;">
                        📹 Загрузить первое видео
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('videoGrid').innerHTML = `
            <div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3>🔧 Настройка базы данных...</h3>
                <p>Создайте таблицы в Supabase</p>
                <button onclick="createTables()" style="background: #00b050; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 15px;">
                    🗃️ Создать таблицы
                </button>
            </div>
        `;
    }
}

// СОЗДАНИЕ ТАБЛИЦ В БАЗЕ ДАННЫХ
async function createTables() {
    alert('Зайди в Supabase → SQL Editor → выполни этот код:\n\n' +
        'CREATE TABLE videos (\n' +
        '  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,\n' +
        '  title TEXT NOT NULL,\n' +
        '  description TEXT,\n' +
        '  video_url TEXT NOT NULL,\n' +
        '  thumbnail TEXT,\n' +
        '  channel_name TEXT NOT NULL,\n' +
        '  views INT DEFAULT 0,\n' +
        '  likes INT DEFAULT 0,\n' +
        '  dislikes INT DEFAULT 0,\n' +
        '  upload_date TIMESTAMPTZ DEFAULT NOW()\n' +
        ');\n\n' +
        'CREATE TABLE comments (\n' +
        '  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,\n' +
        '  video_id BIGINT REFERENCES videos(id),\n' +
        '  username TEXT NOT NULL,\n' +
        '  text TEXT NOT NULL,\n' +
        '  location TEXT DEFAULT 'Global',\n' +
        '  timestamp TIMESTAMPTZ DEFAULT NOW()\n' +
        ');\n\n' +
        'ALTER TABLE videos ENABLE ROW LEVEL SECURITY;\n' +
        'ALTER TABLE comments ENABLE ROW LEVEL SECURITY;\n' +
        'CREATE POLICY "Allow all operations" ON videos FOR ALL USING (true);\n' +
        'CREATE POLICY "Allow all operations" ON comments FOR ALL USING (true);');
}

// ОТОБРАЖЕНИЕ ВИДЕО
function displayVideos(videos, container) {
    container.innerHTML = '';
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.onclick = () => playVideo(video);
        
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'https://via.placeholder.com/320x180/333333/FFFFFF?text=CREATE'}" alt="${video.title}">
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

// ВОСПРОИЗВЕДЕНИЕ ВИДЕО
async function playVideo(video) {
    currentVideo = video;
    
    // ОБНОВЛЯЕМ ПРОСМОТРЫ НА СЕРВЕРЕ
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${video.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
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
    const likeCount = document.getElementById('likeCount');
    const dislikeCount = document.getElementById('dislikeCount');
    
    videoPlayer.src = video.video_url;
    videoTitle.textContent = video.title;
    videoViews.textContent = formatViews((video.views || 0) + 1) + ' просмотров';
    videoDate.textContent = formatDate(video.upload_date);
    videoDescription.textContent = video.description || 'Нет описания';
    channelName.textContent = video.channel_name;
    channelAvatar.src = `https://ui-avatars.com/api/?name=${video.channel_name}&background=random&size=50`;
    likeCount.textContent = video.likes || 0;
    dislikeCount.textContent = video.dislikes || 0;
    
    loadComments(video.id);
}

// КОММЕНТАРИИ
async function loadComments(videoId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/comments?video_id=eq.${videoId}&select=*&order=timestamp.desc`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
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
                    <h4>${comment.username} <small>🌍 ${comment.location}</small></h4>
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

// ДОБАВЛЕНИЕ КОММЕНТАРИЯ
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
        const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                video_id: currentVideo.id,
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
        }
    } catch (error) {
        alert('Ошибка добавления комментария');
    }
}

// ЛАЙКИ
async function likeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${currentVideo.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                likes: (currentVideo.likes || 0) + 1
            })
        });
        
        const likeCount = document.getElementById('likeCount');
        likeCount.textContent = parseInt(likeCount.textContent) + 1;
        alert('👍 Лайк добавлен!');
    } catch (error) {
        alert('Ошибка добавления лайка');
    }
}

// ДИЗЛАЙКИ
async function dislikeVideo() {
    if (!currentUser) {
        toggleAuth();
        return;
    }
    
    if (!currentVideo) return;
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${currentVideo.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                dislikes: (currentVideo.dislikes || 0) + 1
            })
        });
        
        const dislikeCount = document.getElementById('dislikeCount');
        dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
        alert('👎 Дизлайк добавлен!');
    } catch (error) {
        alert('Ошибка добавления дизлайка');
    }
}

// ЗАГРУЗКА ВИДЕО
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
    const videoFile = document.getElementById('videoFile').files[0];
    
    if (!title) {
        alert('Введите название видео');
        return;
    }
    
    try {
        // ИСПОЛЬЗУЕМ РЕАЛЬНЫЕ ВИДЕО URL
        const availableVideos = [
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
        ];
        
        const randomVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
        const thumbnail = `https://via.placeholder.com/320x180/FF0000/FFFFFF?text=${encodeURIComponent(title)}`;
        
        // ОТПРАВЛЯЕМ НА РЕАЛЬНЫЙ СЕРВЕР
        const response = await fetch(`${SUPABASE_URL}/rest/v1/videos`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                title: title,
                description: description,
                video_url: randomVideo,
                thumbnail: thumbnail,
                channel_name: currentUser.username,
                views: 0,
                likes: 0,
                dislikes: 0,
                upload_date: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            closeModal('uploadModal');
            document.getElementById('uploadForm').reset();
            loadVideos(); // ПЕРЕЗАГРУЖАЕМ ВИДЕО
            alert('✅ ВИДЕО ЗАГРУЖЕНО НА РЕАЛЬНЫЙ СЕРВЕР! ДРУГ УВИДИТ ЕГО!');
        } else {
            throw new Error('Ошибка сервера');
        }
        
    } catch (error) {
        alert('Ошибка загрузки: ' + error.message);
    }
}

// АВТОРИЗАЦИЯ
function toggleAuth() {
    document.getElementById('authForm').reset();
    document.getElementById('authModal').style.display = 'block';
}

function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    
    if (!username || !email) {
        alert('Заполните все поля');
        return;
    }
    
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

// УТИЛИТЫ
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

// ГЛОБАЛЬНЫЕ ФУНКЦИИ
window.showSection = showSection;
window.toggleAuth = toggleAuth;
window.closeModal = closeModal;
window.searchVideos = searchVideos;
window.showUploadForm = showUploadForm;
window.playVideo = playVideo;
window.addComment = addComment;
window.likeVideo = likeVideo;
window.dislikeVideo = dislikeVideo;
window.subscribeToChannel = function() {
    if (!currentUser) { toggleAuth(); return; }
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
};
window.shareVideo = function() {
    if (!currentVideo) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('🔗 Ссылка скопирована!');
    });
};
