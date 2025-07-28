document.addEventListener('DOMContentLoaded', () => {
    // 获取页面上的所有交互元素
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

    // 为“立即解析”按钮绑定点击事件
    parseButton.addEventListener('click', handleParse);

    // 允许在文本域中使用 Ctrl+Enter 或 Command+Enter 快捷键来触发解析
    shareInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleParse();
        }
    });

    /**
     * 主解析函数，处理所有核心逻辑
     */
    async function handleParse() {
        // 1. 重置用户界面，显示加载状态
        hideError();
        resultContainer.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        parseButton.disabled = true;
        parseButton.textContent = '解析中...';

        // 2. 从输入内容中提取有效的抖音分享链接
        const inputText = shareInput.value;
        const douyinUrl = extractUrl(inputText);

        if (!douyinUrl) {
            showError('未能从输入内容中提取有效的抖音链接，请检查后重试。');
            resetUI();
            return;
        }
        
        try {
            // 3. 调用后端的 parse 函数，获取视频元数据和原始链接
            // 这个函数只负责获取信息，不负责处理视频流
            const apiEndpoint = `/.netlify/functions/parse?url=${encodeURIComponent(douyinUrl)}`;

            const [videoUrl, videoInfo] = await Promise.all([
                fetch(apiEndpoint).then(res => res.text()),
                fetch(`${apiEndpoint}&data`).then(res => res.json())
            ]);
            
            // 检查API返回是否成功
            if (videoInfo.error || !videoUrl || videoUrl.startsWith('<')) {
                 throw new Error(videoInfo.error || '无法获取视频链接，API 可能返回了错误页面。');
            }

            // 4. 使用获取到的数据更新前端界面
            updateResult(videoUrl, videoInfo);

        } catch (error) {
            console.error('解析失败:', error);
            showError(error.message || '解析失败，请检查链接或稍后再试。');
        } finally {
            // 5. 无论成功或失败，都恢复按钮状态
            resetUI();
        }
    }

    /**
     * 使用正则表达式从一段文本中提取出抖音短链接
     * @param {string} text - 包含链接的完整分享文案
     * @returns {string|null} - 提取出的链接或 null
     */
    function extractUrl(text) {
        const regex = /(https?:\/\/v\.douyin\.com\/[a-zA-Z0-9]+)/;
        const match = text.match(regex);
        return match ? match[0] : null;
    }

    /**
     * 将解析结果更新到页面上
     * @param {string} url - 从 API 获取的原始视频链接 (e.g., https://www.iesdouyin.com/...)
     * @param {object} info - 包含视频所有信息的对象
     */
    function updateResult(url, info) {
        loadingDiv.classList.add('hidden');
        
        // 你的 CDN 代理域名
        const cdnDomain = 'https://dylink.hbum.de';

        // 原始视频 URL 格式为: https://www.iesdouyin.com/some/path/to/video.mp4
        // 我们需要提取出域名后的路径部分: /some/path/to/video.mp4
        const videoPath = url.replace('https://www.iesdouyin.com', '');
        
        // 构建最终指向你 CDN 的代理 URL
        const proxyUrl = cdnDomain + videoPath;

        // 更新视频播放器和下载链接，让它们指向你的 CDN 代理地址
        videoPlayer.src = proxyUrl;
        downloadButton.href = proxyUrl;
        
        // 使用视频标题或作者名作为建议的文件名
        downloadButton.download = `${info.nickname || 'douyin'}-${info.desc || 'video'}.mp4`;

        // 更新视频元数据信息
        videoTitle.textContent = info.desc || '无标题';
        videoAuthor.textContent = info.nickname || '未知作者';
        likeCount.textContent = formatNumber(info.digg_count);
        commentCount.textContent = formatNumber(info.comment_count);
        shareCount.textContent = formatNumber(info.share_count);

        // 显示结果区域
        resultContainer.classList.remove('hidden');
    }

    /**
     * 显示错误信息
     * @param {string} message - 要显示的错误消息
     */
    function showError(message) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    /**
     * 隐藏错误信息
     */
    function hideError() {
        errorDiv.classList.add('hidden');
    }
    
    /**
     * 重置界面到初始状态
     */
    function resetUI() {
        loadingDiv.classList.add('hidden');
        parseButton.disabled = false;
        parseButton.textContent = '立即解析';
    }

    /**
     * 将数字格式化，超过一万的显示为 'xw' 格式
     * @param {number|null} num - 要格式化的数字
     * @returns {string} - 格式化后的字符串
     */
    function formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + 'w';
        }
        return num.toString();
    }
});
