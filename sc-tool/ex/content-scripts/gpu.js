// Thông tin GPU giả cho NVIDIA GTX 1050
const FAKE_GPU = {
    vendor: "NVIDIA Corporation", // Vendor chính xác cho NVIDIA GPU
    renderer: "NVIDIA GeForce GTX 1050", // Tên renderer chính xác
    version: "WebGL 2.0 (OpenGL ES 3.0 Chromium)", // Phiên bản WebGL phổ biến 
    glsl_version: "WebGL GLSL ES 3.00" // Phiên bản GLSL tương ứng
  };
  
  const script = `
    (function() {
      const UNMASKED_VENDOR_WEBGL = 0x9245;
      const UNMASKED_RENDERER_WEBGL = 0x9246;
      const VERSION = 0x1F02;
      const SHADING_LANGUAGE_VERSION = 0x8B8C;
  
      const FAKE_GPU = {
        vendor: "${FAKE_GPU.vendor}",
        renderer: "${FAKE_GPU.renderer}",
        version: "${FAKE_GPU.version}",
        glsl_version: "${FAKE_GPU.glsl_version}"
      };
  
      // Thông tin CPU giả - định nghĩa nội bộ trong closure để tránh xung đột
      const FAKE_CPU = {
        processor: "Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz",
        cores: 6,
        threads: 12
      };
  
      // Hook WebGL1
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        switch (parameter) {
          case UNMASKED_VENDOR_WEBGL:
            return FAKE_GPU.vendor;
          case UNMASKED_RENDERER_WEBGL:
            return FAKE_GPU.renderer;
          case VERSION:
            return FAKE_GPU.version;
          case SHADING_LANGUAGE_VERSION:
            return FAKE_GPU.glsl_version;
          default:
            return originalGetParameter.call(this, parameter);
        }
      };
  
      // Hook WebGL2 
      if (typeof WebGL2RenderingContext !== 'undefined') {
        const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(parameter) {
          switch (parameter) {
            case UNMASKED_VENDOR_WEBGL:
              return FAKE_GPU.vendor;
            case UNMASKED_RENDERER_WEBGL:
              return FAKE_GPU.renderer;
            case VERSION:
              return FAKE_GPU.version;  
            case SHADING_LANGUAGE_VERSION:
              return FAKE_GPU.glsl_version;
            default:
              return originalGetParameter2.call(this, parameter);
          }
        };
      }
  
      // Override một số thuộc tính phần cứng phổ biến của NVIDIA GTX 1050
      const overrideHardwareValues = {
        MAX_TEXTURE_SIZE: 16384,
        MAX_VIEWPORT_DIMS: [16384, 16384],
        MAX_RENDERBUFFER_SIZE: 16384,
        MAX_VERTEX_ATTRIBS: 16,
        MAX_VERTEX_UNIFORM_VECTORS: 4096,
        MAX_VARYING_VECTORS: 32,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 192,
        MAX_VERTEX_TEXTURE_IMAGE_UNITS: 32,
        MAX_TEXTURE_IMAGE_UNITS: 32,
        MAX_FRAGMENT_UNIFORM_VECTORS: 1024,
        ALIASED_LINE_WIDTH_RANGE: [1, 10],
        ALIASED_POINT_SIZE_RANGE: [1, 2047],
      };
  
      // Hook thêm các thông số phần cứng
      for (const [key, value] of Object.entries(overrideHardwareValues)) {
        const enumValue = WebGLRenderingContext.prototype[key];
        if (enumValue !== undefined) {
          WebGLRenderingContext.prototype.getParameter = (function(original) {
            return function(parameter) {
              if (parameter === enumValue) {
                return value;
              }
              return original.call(this, parameter);
            };
          })(WebGLRenderingContext.prototype.getParameter);
  
          if (typeof WebGL2RenderingContext !== 'undefined') {
            WebGL2RenderingContext.prototype.getParameter = (function(original) {
              return function(parameter) {
                if (parameter === enumValue) {
                  return value;
                }
                return original.call(this, parameter);
              };
            })(WebGL2RenderingContext.prototype.getParameter);
          }
        }
      }
  
      // Giả lập thông tin CPU - cách an toàn hơn
      try {
        // Ghi đè hardwareConcurrency để hiển thị số luồng
        if ('hardwareConcurrency' in navigator) {
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: function() {
              return FAKE_CPU.threads;
            }
          });
        }
  
        // Cách an toàn để thêm thông tin CPU vào một số API mà không làm hỏng toàn bộ script
        // Chỉ thêm vào các API không quan trọng hoặc có thể kiểm tra trước khi thay đổi
        if ('deviceMemory' in navigator) {
          Object.defineProperty(navigator, 'deviceMemory', {
            get: function() {
              return 16; // 16GB RAM
            }
          });
        }
  
        // Thêm thông tin CPU vào JS Debug API nếu được hỗ trợ
        if (window.performance && typeof window.performance.now === 'function') {
          const originalGetEntries = window.performance.getEntries;
          if (typeof originalGetEntries === 'function') {
            window.performance.getEntries = function() {
              const entries = originalGetEntries.apply(this, arguments);
              // Thêm thông tin CPU vào các mục nếu phù hợp
              return entries;
            };
          }
        }
      } catch (e) {
        // Bỏ qua lỗi để đảm bảo script chính vẫn hoạt động
        console.error('CPU spoofing error:', e);
      }
    })();
  `;
  
  // Inject script vào trang
  const injectScript = document.createElement('script');
  injectScript.textContent = script;
  (document.head || document.documentElement).appendChild(injectScript);
  injectScript.remove();