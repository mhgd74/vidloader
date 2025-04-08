// Client-side only implementation for video info fetching
// This script replaces server-side API calls with client-side YouTube iframe API

document.addEventListener('DOMContentLoaded', function() {
  const urlForm = document.getElementById('url-form');
  const videoUrlInput = document.getElementById('video-url');
  const videoInfo = document.getElementById('video-info');
  const loading = document.getElementById('loading');
  const thumbnail = document.getElementById('thumbnail');
  const videoTitle = document.getElementById('video-title');
  const videoFormats = document.getElementById('video-formats');
  const audioFormats = document.getElementById('audio-formats');
  const videoFormatRadio = document.getElementById('video-format');
  const audioFormatRadio = document.getElementById('audio-format');

  // Load YouTube API
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // Toggle between video and audio formats
  videoFormatRadio.addEventListener('change', function() {
    videoFormats.style.display = 'block';
    audioFormats.style.display = 'none';
  });

  audioFormatRadio.addEventListener('change', function() {
    videoFormats.style.display = 'none';
    audioFormats.style.display = 'block';
  });

  // Handle form submission
  urlForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const url = videoUrlInput.value.trim();
    
    if (!url) return;

    // Show loading spinner
    loading.style.display = 'block';
    videoInfo.style.display = 'none';
    videoFormats.innerHTML = '';
    audioFormats.innerHTML = '';

    try {
      // Extract video ID from URL
      const videoId = extractVideoId(url);
      if (!videoId) {
        throw new Error('رابط يوتيوب غير صالح');
      }

      // Get video info using YouTube oEmbed API
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        throw new Error('حدث خطأ أثناء تحليل الفيديو');
      }

      const data = await response.json();
      
      // Update UI with video info
      thumbnail.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      videoTitle.textContent = data.title;

      // Add predefined format options since we can't get actual formats without server-side code
      addPredefinedFormats(videoId, url);

      // Show video info
      videoInfo.style.display = 'block';
    } catch (error) {
      alert(error.message || 'حدث خطأ أثناء تحليل الفيديو');
      console.error('Error:', error);
    } finally {
      loading.style.display = 'none';
    }
  });

  // Extract YouTube video ID from URL
  function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  // Add predefined format options
  function addPredefinedFormats(videoId, originalUrl) {
    // Clear previous formats
    videoFormats.innerHTML = '';
    audioFormats.innerHTML = '';
    
    // Add info message about GitHub Pages limitations
    const infoMessage = document.createElement('div');
    infoMessage.className = 'alert alert-info';
    infoMessage.innerHTML = `
      <p><strong>ملاحظة:</strong> نظرًا لقيود GitHub Pages، لا يمكن تحميل الفيديو مباشرة من هذا الموقع.</p>
      <p>يمكنك استخدام إحدى الخدمات التالية للتحميل:</p>
    `;
    videoFormats.appendChild(infoMessage);

    // Add video format options
    const videoQualityOptions = [
      { label: 'جودة عالية (1080p)', format: 'mp4' },
      { label: 'جودة متوسطة (720p)', format: 'mp4' },
      { label: 'جودة منخفضة (480p)', format: 'mp4' }
    ];

    videoQualityOptions.forEach(option => {
      const formatItem = document.createElement('div');
      formatItem.className = 'format-item';
      
      formatItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${option.label}</strong>
            <div class="text-muted small">MP4 Video</div>
          </div>
          <a href="https://www.y2mate.com/youtube/${videoId}" 
             class="btn btn-sm btn-primary" target="_blank">
            <i class="fas fa-external-link-alt me-1"></i> تحميل
          </a>
        </div>
      `;
      
      videoFormats.appendChild(formatItem);
    });

    // Add audio format options
    const audioQualityOptions = [
      { label: 'جودة عالية (320kbps)', format: 'mp3' },
      { label: 'جودة متوسطة (192kbps)', format: 'mp3' },
      { label: 'جودة منخفضة (128kbps)', format: 'mp3' }
    ];

    audioQualityOptions.forEach(option => {
      const formatItem = document.createElement('div');
      formatItem.className = 'format-item';
      
      formatItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${option.label}</strong>
            <div class="text-muted small">MP3 Audio</div>
          </div>
          <a href="https://www.y2mate.com/youtube-mp3/${videoId}" 
             class="btn btn-sm btn-primary" target="_blank">
            <i class="fas fa-external-link-alt me-1"></i> تحميل
          </a>
        </div>
      `;
      
      audioFormats.appendChild(formatItem);
    });

    // Add alternative services
    const alternativeServices = document.createElement('div');
    alternativeServices.className = 'mt-4';
    alternativeServices.innerHTML = `
      <h5>خدمات تحميل بديلة:</h5>
      <div class="d-flex flex-wrap gap-2 mt-2">
        <a href="https://www.y2mate.com/youtube/${videoId}" target="_blank" class="btn btn-outline-primary">
          <i class="fas fa-external-link-alt me-1"></i> Y2mate
        </a>
        <a href="https://www.ssyoutube.com/watch?v=${videoId}" target="_blank" class="btn btn-outline-primary">
          <i class="fas fa-external-link-alt me-1"></i> SaveFrom.net
        </a>
        <a href="https://www.youtubepp.com/watch?v=${videoId}" target="_blank" class="btn btn-outline-primary">
          <i class="fas fa-external-link-alt me-1"></i> YouTubePP
        </a>
      </div>
    `;
    
    videoFormats.appendChild(alternativeServices);
    
    // Clone for audio formats
    audioFormats.appendChild(alternativeServices.cloneNode(true));
  }
});