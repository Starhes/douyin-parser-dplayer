document.addEventListener('DOMContentLoaded', () => {
    const shareInput = document.getElementById('share-input');
    const parseButton = document.getElementById('parse-button');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');

    const videoPlayer = document.getElementById('video-player');
    const downloadButton = document.getElementById('download-button');
    const videoTitle = document.querySelector('#video-title span');
    const videoAuthor = document.querySelector('#video-author span');
    const likeCount = document.getElementById('like-count');
    const commentCount = document.getElementById('comment-count');
    const shareCount = document.getElementById('share-count');

    parseButton.addEventListener('click', handleParse);

    // 允许在文本域中按 Enter 键 (Ctrl+Enter) 触发解析
    shareInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleParse();
        }
    });

    async function handleParse() {
        // 1. 重置界面
        hideError();
        resultContainer.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        parseButton.disabled = true;
        parseButton.textContent = '解析中...';

        // 2. 提取链接
        const inputText = shareInput.value;
        const douyinUrl = extractUrl(inputText);

        if (!douyinUrl) {
            showError('未能从输入内容中提取有效的抖音链接，请检查后重试。');
            resetUI();
            return;
        }
        
        try {
            // 3. 并行请求视频链接和视频信息
            // 使用我们自己的 Netlify Function 代理
            const apiEndpoint = `/.netlify/functions/parse?url=${encodeURIComponent(douyinUrl)}`;

            const [videoUrl, videoInfo] = await Promise.all([
                fetch(apiEndpoint).then(res => res.text()),
                fetch(`${apiEndpoint}&data`).then(res => res.json())
            ]);
            
            if (videoInfo.error || !videoUrl || videoUrl.startsWith('<')) {
                 throw new Error(videoInfo.error || '无法获取视频链接，API 可能返回了错误页面。');
            }

            // 4. 更新界面
            updateResult(videoUrl, videoInfo);

        } catch (error) {
            console.error('解析失败:', error);
            showError(error.message || '解析失败，请检查链接或稍后再试。');
        } finally {
            // 5. 恢复按钮状态
            resetUI();
        }
    }

    function extractUrl(text) {
        // 使用正则表达式匹配抖音分享链接
        const regex = /(https?:\/\/v\.douyin\.com\/[a-zA-Z0-9]+)/;
        const match = text.match(regex);
        return match ? match[0] : null;
    }

    function updateResult(url, info) {
        loadingDiv.classList.add('hidden');
        
        // 更新视频播放器和下载链接
        videoPlayer.src = url;
        downloadButton.href = url;
        // 使用视频标题或作者名作为建议的文件名
        downloadButton.download = `${info.nickname || 'douyin'}-${info.desc || 'video'}.mp4`;

        // 更新视频信息
        videoTitle.textContent = info.desc || '无标题';
        videoAuthor.textContent = info.nickname || '未知作者';
        likeCount.textContent = formatNumber(info.digg_count);
        commentCount.textContent = formatNumber(info.comment_count);
        shareCount.textContent = formatNumber(info.share_count);

        resultContainer.classList.remove('hidden');
    }

    function showError(message) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    function hideError() {
        errorDiv.classList.add('hidden');
    }
    
    function resetUI() {
        loadingDiv.classList.add('hidden');
        parseButton.disabled = false;
        parseButton.textContent = '立即解析';
    }

    function formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + 'w';
        }
        return num.toString();
    }
});