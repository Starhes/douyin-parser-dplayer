// 你的真实 API 域名
const API_DOMAIN = 'dyapi.hbum.de';

exports.handler = async (event) => {
  // 从请求中获取 url 和 data 参数
  const { url, data } = event.queryStringParameters;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL parameter is required.' }),
    };
  }

  // 构建目标 API 的 URL
  // 如果存在 data 参数，则将其添加到 URL 的开头
  const targetUrl = `https://${API_DOMAIN}?${data !== undefined ? 'data&' : ''}url=${encodeURIComponent(url)}`;

  try {
    // 使用 fetch 向你的 API 发起请求
    const response = await fetch(targetUrl);

    // 如果 API 返回的不是成功状态，则抛出错误
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    // 判断是返回 JSON 还是纯文本链接
    if (data !== undefined) {
      const jsonData = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      };
    } else {
      const videoLink = await response.text();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: videoLink,
      };
    }

  } catch (error) {
    console.error('Error fetching from API:', error);
    return {
      statusCode: 502, // Bad Gateway，表示代理服务器出错
      body: JSON.stringify({ error: 'Failed to fetch data from the video API.' }),
    };
  }
};