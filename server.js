const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ensure README.md is not served as default
app.get('/README.md', (req, res) => {
  res.redirect('/');
});

// API endpoint to get video info
app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const formats = info.formats.map(format => ({
      itag: format.itag,
      quality: format.qualityLabel || format.quality,
      type: format.mimeType,
      container: format.container,
      hasAudio: format.hasAudio,
      hasVideo: format.hasVideo,
      contentLength: format.contentLength
    }));

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      formats
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    if (error.message.includes('Video unavailable')) {
      res.status(404).json({ error: 'الفيديو غير متاح أو محذوف' });
    } else if (error.message.includes('Private video')) {
      res.status(403).json({ error: 'الفيديو خاص ولا يمكن الوصول إليه' });
    } else if (error.message.includes('This video is unavailable')) {
      res.status(404).json({ error: 'هذا الفيديو غير متاح في بلدك' });
    } else if (error.message.includes('Status code: 410') || error.message.includes('This video is no longer available')) {
      res.status(410).json({ error: 'الفيديو غير متاح بسبب تغييرات في YouTube API. يرجى المحاولة لاحقًا أو استخدام رابط آخر.' });
    } else if (error.message.includes('Status code: 410') || error.message.includes('This video is no longer available')) {
      res.status(410).json({ error: 'الفيديو غير متاح بسبب تغييرات في YouTube API. يرجى المحاولة لاحقًا أو استخدام رابط آخر.' });
    } else if (error.message.includes('network timeout')) {
      res.status(408).json({ error: 'انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى' });
    } else if (error.message.includes('rate limit')) {
      res.status(429).json({ error: 'تم تجاوز الحد المسموح به، يرجى الانتظار قليلاً ثم المحاولة مرة أخرى' });
    } else {
      res.status(500).json({ error: 'فشل جلب معلومات الفيديو: ' + error.message });
    }
  }
});

// API endpoint to download video
app.get('/api/download', async (req, res) => {
  try {
    const { url, itag, format } = req.query;
    
    if (!url || !itag) {
      return res.status(400).json({ error: 'يجب توفير رابط الفيديو ومعرف الجودة' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'رابط يوتيوب غير صالح' });
    }

    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    
    // التحقق من توفر التنسيق المطلوب
    const selectedFormat = info.formats.find(f => f.itag === parseInt(itag));
    if (!selectedFormat) {
      return res.status(400).json({ error: 'تنسيق الفيديو المطلوب غير متوفر' });
    }

    // التحقق من حجم الملف
    if (selectedFormat.contentLength) {
      const fileSizeInMB = parseInt(selectedFormat.contentLength) / (1024 * 1024);
      if (fileSizeInMB > 500) { // حد أقصى 500 ميجابايت
        return res.status(400).json({ error: 'حجم الملف كبير جداً. الحد الأقصى هو 500 ميجابايت' });
      }
    }

    // إعداد رأس الاستجابة للتحميل
    res.header('Content-Disposition', `attachment; filename="${videoTitle}.${format || 'mp4'}"`);
    
    // إعداد خيارات التحميل
    const downloadOptions = {
      quality: itag,
      filter: format === 'mp3' ? 'audioonly' : 'videoandaudio'
    };

    // بدء تدفق الفيديو
    const videoStream = ytdl(url, downloadOptions);
    
    // معالجة أحداث التدفق
    videoStream.on('error', (error) => {
      console.error('خطأ في تدفق الفيديو:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'حدث خطأ أثناء تحميل الفيديو' });
      }
    });

    videoStream.on('progress', (chunkLength, downloaded, total) => {
      if (total) {
        const percent = (downloaded / total * 100).toFixed(2);
        console.log(`تقدم التحميل: ${percent}%`);
      }
    });

    // بدء التدفق إلى المستجيب
    videoStream.pipe(res);

    // معالجة إغلاق الاتصال
    res.on('close', () => {
      videoStream.destroy();
    });
  } catch (error) {
    console.error('خطأ في تحميل الفيديو:', error);
    if (error.message.includes('age-restricted')) {
      res.status(403).json({ error: 'هذا الفيديو مقيد بالعمر ولا يمكن تحميله' });
    } else if (error.message.includes('copyright')) {
      res.status(403).json({ error: 'هذا الفيديو محمي بحقوق النشر' });
    } else {
      res.status(500).json({ error: 'فشل تحميل الفيديو: ' + error.message });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});