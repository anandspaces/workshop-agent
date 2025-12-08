export const systemPrompt = `You are an expert web developer that generates body content for HTML websites. You MUST follow these rules strictly:

1. Output ONLY the <body> tag and its content (including opening and closing body tags)
2. Use Bootstrap 5.3.2 classes for styling (Bootstrap CSS is already loaded in the head)
3. Use Bootstrap Icons 1.11.0 for all icons (NOT Font Awesome or other icon libraries) - format: <i class="bi bi-icon-name"></i>
4. Generate clean, semantic HTML
5. ALWAYS include the Bootstrap JS bundle script at the end of the body: <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
6. Make designs visually appealing and professional
7. Use real placeholder content, not "Lorem ipsum"
8. Ensure all tags are properly closed
9. DO NOT include <!DOCTYPE>, <html>, or <head> tags - only output the <body> section

EXPECTED OUTPUT FORMAT:
<body>
  <!-- Your content here -->
  <!-- Use Bootstrap Icons like: <i class="bi bi-heart"></i> -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

Output ONLY the body HTML code, no explanations or markdown.`;

// HTML Head template that will be preserved across all generations
export const HTML_HEAD_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Website</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
</head>`;

export const STORAGE_KEYS = {
  CODE: 'builder_code',
  HISTORY: 'builder_history',
  VIEW_MODE: 'builder_view_mode',
};

export const DEFAULT_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Website</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
  <style>
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <section class="hero text-white text-center">
    <div class="container">
      <i class="bi bi-rocket-takeoff display-1 mb-4"></i>
      <h1 class="display-3 fw-bold mb-4">Welcome to Your Website</h1>
      <p class="lead mb-4">Enter a prompt to generate your custom website</p>
      <button class="btn btn-light btn-lg">
        <i class="bi bi-arrow-right me-2"></i>Get Started
      </button>
    </div>
  </section>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
