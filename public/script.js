document.addEventListener('DOMContentLoaded', () => {
    // 获取页面上的所有交互元素
    const shareInput = document.getElementById('share-input');
    const parseButton = document.getElementById('parse-button');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');

    const downloadButton = document.getElementById('download-button');
    const videoTitle = document.querySelector('#video-title span');
    const videoAuthor = document.querySelector('#video-author span');
    const likeCount = document.getElementById('like-count');
    const commentCount = document.getElementById('comment-count');
    const shareCount = document.getElementById('share-count');

    // 新增元素的获取
    const originalLinkSpan = document.getElementById('original-link');
    const copyButton = document.getElementById('copy-button');

    let dp; // DPlayer instance

    // 为“立即解析”按钮绑定点击事件
    parseButton.addEventListener('click', handleParse);

    // 为“复制”按钮绑定点击事件
    copyButton.addEventListener('click', handleCopy);


    // 允许在文本域中使用 Ctrl+Enter 或 Command+Enter 快捷键来触发解析
    shareInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleParse();
        }
    });

    /**
     * 主解析函数
     */
    async function handleParse() {
        hideError();
        resultContainer.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        parseButton.disabled = true;
        parseButton.textContent = '解析中...';

        const inputText = shareInput.value;
        const douyinUrl = extractUrl(inputText);

        if (!douyinUrl) {
            showError('未能从输入内容中提取有效的抖音链接，请检查后重试。');
            resetUI();
            return;
        }

        try {
            // 现在两个请求都从我们的后端函数获取
            const urlEndpoint = `/.netlify/functions/parse?url=${encodeURIComponent(douyinUrl)}`;
            const infoEndpoint = `/.netlify/functions/parse?data&url=${encodeURIComponent(douyinUrl)}`;

            // 并行发起请求
            const [urlData, videoInfo] = await Promise.all([
                fetch(urlEndpoint).then(res => res.json()), // 这里现在接收 JSON
                fetch(infoEndpoint).then(res => res.json())
            ]);

            // 检查API返回是否成功
            if (urlData.error || videoInfo.error) {
                 throw new Error(urlData.error || videoInfo.error || 'API 返回错误');
            }

            // 更新前端界面
            updateResult(urlData, videoInfo);

        } catch (error) {
            console.error('解析失败:', error);
            showError(error.message || '解析失败，请检查链接或稍后再试。');
        } finally {
            resetUI();
        }
    }

    /**
     * 从文本中提取URL
     */
    function extractUrl(text) {
        const regex = /(https?:\/\/v\.douyin\.com\/[a-zA-Z0-9]+)/;
        const match = text.match(regex);
        return match ? match[0] : null;
    }

    /**
     * 将结果更新到页面
     * @param {object} urlData - 包含 originalUrl 和 finalUrl 的对象
     * @param {object} info - 包含视频所有信息的对象
     */
    function updateResult(urlData, info) {
        const { originalUrl, finalUrl } = urlData;

        if (dp) {
            dp.destroy();
        }

        dp = new DPlayer({
            container: document.getElementById('dplayer'),
            video: {
                url: originalUrl,
            },
        });

        downloadButton.href = finalUrl;
        downloadButton.download = `${info.nickname || 'douyin'}-${info.desc || 'video'}.mp4`;

        // 显示 API 返回的原始链接
        originalLinkSpan.textContent = originalUrl;

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
     * 处理复制按钮点击事件
     */
    function handleCopy() {
        const linkToCopy = originalLinkSpan.textContent;
        if (!linkToCopy) return;

        navigator.clipboard.writeText(linkToCopy).then(() => {
            // 复制成功后的用户反馈
            const originalText = copyButton.textContent;
            copyButton.textContent = '已复制!';
            copyButton.style.backgroundColor = '#FE2C55';
            copyButton.style.color = '#fff';

            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.backgroundColor = '';
                copyButton.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('复制失败: ', err);
            alert('复制失败，请手动复制。');
        });
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
