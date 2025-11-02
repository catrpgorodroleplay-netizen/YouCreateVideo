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
