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

  // 如果请求的是包含视频信息的 JSON 数据，则逻辑不变
  if (data !== undefined) {
    const targetUrl = `https://${API_DOMAIN}?data&url=${encodeURIComponent(url)}`;
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Failed to fetch video info');
      const jsonData = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      };
    } catch (error) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Failed to fetch data from the video API.' }),
      };
    }
  }

  // 如果是请求视频链接，执行以下新逻辑
  try {
    // 1. 先从你的 API 获取会 302 跳转的链接
    const initialApiUrl = `https://${API_DOMAIN}?url=${encodeURIComponent(url)}`;
    const initialResponse = await fetch(initialApiUrl);
    if (!initialResponse.ok) {
        throw new Error(`API call failed with status: ${initialResponse.status}`);
    }
    const originalUrl = await initialResponse.text(); // 这是你的API返回的、会跳转的链接

    // 2. 请求这个会跳转的链接，fetch 会自动处理 302 跳转
    //    最终的 response.url 就是跳转后的地址
    const finalResponse = await fetch(originalUrl, { referrerPolicy: "no-referrer" });
    if (!finalResponse.ok) {
        throw new Error(`Failed to follow redirect from: ${originalUrl}`);
    }
    const finalUrl = finalResponse.url; // 这是跳转后的最终视频链接

    // 3. 将两个链接都返回给前端
    const responsePayload = {
        originalUrl: originalUrl, // API返回的原始链接
        finalUrl: finalUrl,     // 302跳转后的最终链接
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responsePayload),
    };

  } catch (error) {
    console.error('Error fetching or redirecting URL:', error);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to get or resolve video URL.' }),
    };
  }
};
