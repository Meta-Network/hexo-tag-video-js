'use strict';
/**
 * hexo-tag-video-js
 * Syntax:
 * {% video-js key=value %}
 * Example
 * {% video-js "source=https://d2zihajmogu5jn.cloudfront.net/advanced-fmp4/master.m3u8" %}
 */

const fs = require('hexo-fs');
const path = require('path');
const utils = require('hexo-util');
const uuidv4 = require('uuid/v4');

/**
 * 
 * @param {*} env 
 * @returns 
 */

const getConfig = async (env) => { // videoPlayerResourcesUrl
  /**
   * From meta-space-config.yml
   */
  if (env) { // env is "this"
    const { base_dir, render } = env;
    const metaConfigPath = path.join(base_dir, 'meta-space-config.yml');
    const isExist = await fs.existsSync(metaConfigPath);
    if (isExist) {
      const metaConfig = await render.render({ path: metaConfigPath });
      const { videoPlayerResourcesUrl } = metaConfig;
      if (videoPlayerResourcesUrl) {
        return videoPlayerResourcesUrl;
      }
    }
  }

  /**
   * From _config.yml
   */

  const hexoConfig = hexo.config['hexo-tag-video-js'] || {};
  if (hexoConfig.videoPlayerResourcesUrl) {
    return videoPlayerResourcesUrl;
  }

  /**
   * Use Dafault Hardcode.
   */

  return [
    'https://unpkg.com/video.js@6.7.1/dist/video-js.css',
    'https://unpkg.com/video.js@6.7.1/dist/video.js',
    'https://unpkg.com/@videojs/http-streaming@0.9.0/dist/videojs-http-streaming.js'
  ]
}

/**
 * Configuration
 * 
 * - Load order：
 *  1. meta-space-config.yml (this)
 *  2. _config.yml
 *  3. default hard code.
 * - Import static resources
 *   - 
 */

hexo.extend.filter.register('after_render:html', async (pageElements, data) => {

  const config = await getConfig();

  const importHTMLElement = config.map((url, index) => {

    if (url.search('video-js.css') != -1) {
      return `<link rel="stylesheet" href="${encodeURI(url)}">`;
    }

    if (url.search('video.js') != -1) {
      return `<script src="${encodeURI(url)}"></script>`;
    }

    if (url.search('videojs-http-streaming.js') != -1) {
      return `<script src="${encodeURI(url)}"></script>`;
    }
  });

  return pageElements.replace('</head>', `${importHTMLElement.join('\n')}</head>`);
});


/**
 * {% video-js key=value ... %}
 * "key=value" is args:
 * 
 * source: string; // url of video/stream
 * 
 */
hexo.extend.tag.register('video-js', function (args) {

  const options = {};

  args.forEach(arg => {
    const [key, value] = arg.split('=');
    options[key] = value;
  });

  if (!options.source) return '';

  const videoId = `video-js-id-${uuidv4()}`;
  const varName = videoId.split('-').join('');

  return `< div >
  <video-js id="${videoId}" 
    class="${utils.escapeHTML(options.type) || 'vjs-default-skin vjs-16-9'}" 
    controls 
    preload="${utils.escapeHTML(options.preload) || 'auto'}" 
    width="${utils.escapeHTML(options.width) || '100%'}" 
    height="${utils.escapeHTML(options.width) || '350px'}">
    <source src="${encodeURI(options.source)}" type="${utils.escapeHTML(options.type) || 'application/x-mpegURL'}">
  </video-js>
    
  <script>
    const ${varName} = videojs('${videoId}', {
      html5: {
        hls: {
          overrideNative: true
        }
      }
    });
  </script>
  </div > `;
});
