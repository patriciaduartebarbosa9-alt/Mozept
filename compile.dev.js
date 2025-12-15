"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var fs = require('fs');

var path = require('path');

var Mustache = require('mustache');

var _require = require('process'),
    exit = _require.exit;

var VERSION = '1.0.1'; // Update as needed

var AUTHOR = 'Arlindo Santos'; // Update as needed
// Load settings

var settings = {};
var siteUrl = "";

try {
  var settingsContent = fs.readFileSync(path.join(__dirname, 'settings.json'), 'utf8');
  var settingsData = JSON.parse(settingsContent);
  siteUrl = settingsData.siteUrl;
  settings = settingsData['mustache.compiler'];
  console.log(settings);
  console.log('✓ Settings loaded successfully');
} catch (error) {
  console.warn('⚠️  Settings file not found, using defaults' + error.message);
  settings = {
    output: '.',
    templates: 'templates/pages',
    layout: 'templates/layouts',
    partials: 'templates/partials',
    data: 'templates/data',
    createDirectories: true,
    validateOutput: true
  };
} // Function to convert relative URLs to absolute URLs


function convertRelativeToAbsolute(obj) {
  if (!siteUrl) return obj; // Remove trailing slash from siteUrl

  var baseUrl = siteUrl.replace(/\/$/, '');

  function processValue(value) {
    if (typeof value === 'string') {
      // Convert relative URLs that start with ./ or / to absolute URLs
      if (value.startsWith('./')) {
        return baseUrl + value.substring(1);
      } else if (value.startsWith('/') && !value.startsWith('//') && !value.includes('://')) {
        return baseUrl + value;
      }
    } else if (Array.isArray(value)) {
      return value.map(processValue);
    } else if (value && _typeof(value) === 'object') {
      return convertRelativeToAbsolute(value);
    }

    return value;
  }

  var result = {};

  for (var _i = 0, _Object$entries = Object.entries(obj); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        key = _Object$entries$_i[0],
        value = _Object$entries$_i[1];

    result[key] = processValue(value);
  }

  return result;
} // Function to convert relative URLs in HTML content to absolute URLs


function convertRelativeUrlsInHtml(htmlContent) {
  if (!siteUrl || !htmlContent) return htmlContent; // Remove trailing slash from siteUrl

  var baseUrl = siteUrl.replace(/\/$/, ''); // Convert relative URLs in href attributes

  htmlContent = htmlContent.replace(/href=["']([^"']*?)["']/g, function (match, url) {
    if (url.startsWith('./')) {
      return "href=\"".concat(baseUrl).concat(url.substring(1), "\"");
    } else if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
      return "href=\"".concat(baseUrl).concat(url, "\"");
    }

    return match;
  }); // Convert relative URLs in src attributes

  htmlContent = htmlContent.replace(/src=["']([^"']*?)["']/g, function (match, url) {
    if (url.startsWith('./')) {
      return "src=\"".concat(baseUrl).concat(url.substring(1), "\"");
    } else if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
      return "src=\"".concat(baseUrl).concat(url, "\"");
    }

    return match;
  }); // Convert relative URLs in action attributes (for forms)

  htmlContent = htmlContent.replace(/action=["']([^"']*?)["']/g, function (match, url) {
    if (url.startsWith('./')) {
      return "action=\"".concat(baseUrl).concat(url.substring(1), "\"");
    } else if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
      return "action=\"".concat(baseUrl).concat(url, "\"");
    }

    return match;
  });
  return htmlContent;
} // Configuration using settings


var templatesDir = path.join(__dirname, settings.templates);
var partialsDir = path.join(__dirname, settings.partials);
var layoutsDir = path.join(__dirname, settings.layouts);
var dataDir = path.join(__dirname, settings.data);
var outputBasePath = __dirname; // Debugging logs to identify undefined paths in settings

console.log('Debug: settings object:', settings);
console.log('Debug: templatesDir:', templatesDir);
console.log('Debug: partialsDir:', partialsDir);
console.log('Debug: layoutsDir:', layoutsDir);
console.log('Debug: outputBasePath:', outputBasePath); // Global variables

var partials = {};
var data = {}; //let templateCache = {};
//et layoutCache = {};
// Enhanced Mustache configuration for all tag types

Mustache.escape = function (text) {
  return text; // Disable HTML escaping
}; // Custom template inheritance handler


var TemplateInheritance =
/*#__PURE__*/
function () {
  function TemplateInheritance() {
    _classCallCheck(this, TemplateInheritance);

    this.layouts = new Map();
    this.blocks = new Map();
  } // Parse template inheritance syntax {{< layout}}


  _createClass(TemplateInheritance, [{
    key: "parseInheritance",
    value: function parseInheritance(templateContent) {
      var inheritancePattern = /\{\{<\s*([^}]+)\s*\}\}/;
      var match = templateContent.match(inheritancePattern);

      if (match) {
        var layoutName = match[1].trim();
        var templateWithoutInheritance = templateContent.replace(inheritancePattern, '').trim();
        return {
          layoutName: layoutName,
          content: templateWithoutInheritance
        };
      }

      return {
        layoutName: null,
        content: templateContent
      };
    } // Parse block definitions {{$blockName}}content{{/blockName}}

  }, {
    key: "parseBlocks",
    value: function parseBlocks(templateContent) {
      var blockPattern = /\{\{\$([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
      var blocks = {};
      var match;

      while ((match = blockPattern.exec(templateContent)) !== null) {
        var blockName = match[1].trim();
        var blockContent = match[2];
        blocks[blockName] = blockContent;
      }

      return blocks;
    } // Replace block placeholders in layout with actual content, recursively for nested blocks

  }, {
    key: "replaceBlocks",
    value: function replaceBlocks(layoutContent, blocks) {
      var _this = this;

      var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if (depth > 20) {
        console.error('Maximum block replacement depth exceeded');
        return layoutContent;
      }

      var result = layoutContent; // Recursively parse and replace blocks

      var blockPattern = /\{\{\$([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
      result = result.replace(blockPattern, function (match, blockName, defaultContent) {
        var blockContent = blocks[blockName] !== undefined ? blocks[blockName] : defaultContent; // Recursively replace blocks inside blockContent

        if (/\{\{\$[^}]+\}\}/.test(blockContent) && blockContent !== match) {
          blockContent = _this.replaceBlocks(blockContent, blocks, depth + 1);
        }

        return blockContent;
      });
      return result;
    } // Process template with inheritance (supports nested layout inheritance and block override propagation)

  }, {
    key: "processTemplate",
    value: function processTemplate(templateContent, templatePath) {
      var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var inheritedBlocks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      // Prevent infinite recursion
      if (depth > 10) {
        console.error('Maximum layout inheritance depth exceeded');
        return templateContent;
      }

      var _this$parseInheritanc = this.parseInheritance(templateContent),
          layoutName = _this$parseInheritanc.layoutName,
          content = _this$parseInheritanc.content; // Parse blocks from current template


      var currentBlocks = this.parseBlocks(content); // Merge inherited blocks (from child) with current blocks (current overrides child)

      var mergedBlocks = _objectSpread({}, inheritedBlocks, {}, currentBlocks);

      if (!layoutName) {
        // No inheritance, return content as-is
        // If there are blocks, replace them in the content
        return this.replaceBlocks(content, mergedBlocks);
      } // Load layout


      var layoutPath = this.resolveLayoutPath(layoutName, templatePath);

      if (!fs.existsSync(layoutPath)) {
        console.error("Layout not found: ".concat(layoutName, " at ").concat(layoutPath));
        return content;
      }

      var layoutContent = fs.readFileSync(layoutPath, 'utf8');
      console.log("\u2713 Processing layout inheritance: ".concat(layoutName, " (depth: ").concat(depth, ")")); // Check if the layout itself inherits from another layout

      var layoutInheritance = this.parseInheritance(layoutContent);

      if (layoutInheritance.layoutName) {
        // Layout inherits from another layout - process recursively, passing merged blocks up
        layoutContent = this.processTemplate(layoutContent, layoutPath, depth + 1, mergedBlocks);
      } // Replace blocks in layout with merged blocks


      return this.replaceBlocks(layoutContent, mergedBlocks);
    }
  }, {
    key: "resolveLayoutPath",
    value: function resolveLayoutPath(layoutName, templatePath) {
      // Try different layout locations in priority order
      var locations = [// 1. Look in the layouts directory (highest priority)
      path.join(layoutsDir, "".concat(layoutName, ".mustache")), // 2. Look in the same directory as the template
      path.join(path.dirname(templatePath), "".concat(layoutName, ".mustache")), // 3. Look in the templates root directory
      path.join(__dirname, 'templates', "".concat(layoutName, ".mustache")), // 4. Fall back to default layout in layouts directory
      path.join(layoutsDir, 'layout.mustache'), // 5. Final fallback to templates directory
      path.join(__dirname, 'templates', 'layout.mustache')];

      for (var _i2 = 0, _locations = locations; _i2 < _locations.length; _i2++) {
        var location = _locations[_i2];

        if (fs.existsSync(location)) {
          return location;
        }
      } // If nothing found, return the layouts directory default


      return path.join(layoutsDir, 'layout.mustache');
    }
  }]);

  return TemplateInheritance;
}();

var templateInheritance = new TemplateInheritance(); // Enhanced Mustache renderer with full tag support

var EnhancedMustacheRenderer =
/*#__PURE__*/
function () {
  function EnhancedMustacheRenderer() {
    _classCallCheck(this, EnhancedMustacheRenderer);

    this.partials = {};
    this.lambdas = {};
  } // Load partials with full Mustache support


  _createClass(EnhancedMustacheRenderer, [{
    key: "loadPartials",
    value: function loadPartials() {
      var _this2 = this;

      try {
        var partialFiles = fs.readdirSync(partialsDir);
        partialFiles.forEach(function (file) {
          if (file.endsWith('.mustache')) {
            var partialName = path.basename(file, '.mustache');
            var partialPath = path.join(partialsDir, file);
            var partialContent = fs.readFileSync(partialPath, 'utf8'); // Partials don't use template inheritance, load as-is

            _this2.partials[partialName] = partialContent;
            partials[partialName] = partialContent; // Pre-parse for performance

            Mustache.parse(partialContent);
          }
        });
        console.log("\u2713 Loaded ".concat(Object.keys(this.partials).length, " partials"));
      } catch (error) {
        console.error('Error loading partials:', error.message);
      }
    } // Enhanced rendering with all Mustache tag types

  }, {
    key: "render",
    value: function render(template, data) {
      var partialsObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      try {
        // Ensure we have the latest partials
        var allPartials = _objectSpread({}, this.partials, {}, partialsObj); // Pre-parse template for better error detection


        try {
          Mustache.parse(template, ['{{', '}}']);
        } catch (parseError) {
          console.warn("Template parsing warning: ".concat(parseError.message));
        } // Render with full Mustache support including:
        // {{variable}} - Variables
        // {{{variable}}} - Unescaped variables  
        // {{#section}} - Sections
        // {{^section}} - Inverted sections
        // {{/section}} - Section endings
        // {{! comment}} - Comments
        // {{> partial}} - Partials
        // {{=<% %>=}} - Set delimiters


        var result = Mustache.render(template, data, allPartials);
        return result;
      } catch (error) {
        console.error("Error rendering template: ".concat(error.message));
        console.error("Template preview: ".concat(template.substring(0, 200), "..."));
        return '';
      }
    }
  }]);

  return EnhancedMustacheRenderer;
}();

var renderer = new EnhancedMustacheRenderer(); // Load shared global data

function loadGlobalData() {
  try {
    var globalDataPath = path.join(dataDir, '/global.json');
    var globalDataContent = fs.readFileSync(globalDataPath, 'utf8');
    data = JSON.parse(globalDataContent);
    console.log('✓ Global data loaded successfully');
    console.log(data);
  } catch (error) {
    console.error('Error loading global data:', error.message);
    process.exit(1);
  }
} // Load page-specific data


function loadPageData(templateInfo) {
  try {
    var dataPath = templateInfo.template.replace('.mustache', '.json');
    dataPath = path.join(dataDir, dataPath);

    if (fs.existsSync(dataPath)) {
      var pageDataContent = fs.readFileSync(dataPath, 'utf8');
      var pageData = JSON.parse(pageDataContent);

      var mergedData = _objectSpread({}, data, {}, pageData); // Convert relative URLs to absolute URLs


      if (siteUrl) {
        mergedData = convertRelativeToAbsolute(mergedData);
        console.log('✓ Converted relative URLs to absolute URLs');
      } // Add Mustache lambda functions for dynamic content


      mergedData.formatDate = function () {
        return function (text, render) {
          var date = new Date(render(text));
          return date.toLocaleDateString();
        };
      };

      mergedData.uppercase = function () {
        return function (text, render) {
          return render(text).toUpperCase();
        };
      };

      mergedData.lowercase = function () {
        return function (text, render) {
          return render(text).toLowerCase();
        };
      };

      mergedData.ifEquals = function () {
        return function (text, render) {
          var parts = text.split(',');

          if (parts.length === 2) {
            var _parts$map = parts.map(function (p) {
              return render(p.trim());
            }),
                _parts$map2 = _slicedToArray(_parts$map, 2),
                val1 = _parts$map2[0],
                val2 = _parts$map2[1];

            return val1 === val2;
          }

          return false;
        };
      };

      return mergedData;
    } else {
      console.warn("\u26A0\uFE0F  No specific data file found for ".concat(templateInfo.template, ", using global data only"));

      var globalData = _objectSpread({}, data);

      if (siteUrl) {
        globalData = convertRelativeToAbsolute(globalData);
      }

      console.log(globalData);
      return globalData;
    }
  } catch (error) {
    console.error("Error loading page data for ".concat(templateInfo.template, ":"), error.message);
    return _objectSpread({}, data);
  }
} // Load partials


function loadPartials() {
  renderer.loadPartials();
} // Compile and render templates with enhanced inheritance support


function compileTemplate(templateInfo) {
  try {
    var templatePath = path.join(templatesDir, templateInfo.template);
    var templateContent = fs.readFileSync(templatePath, 'utf8');
    console.log("\uD83D\uDD27 Compiling ".concat(templateInfo.name, "...")); // Process template inheritance using the enhanced system

    var processedTemplate = templateInheritance.processTemplate(templateContent, templatePath);
    console.log("Debug: processedTemplate type: ".concat(_typeof(processedTemplate)));
    console.log("Debug: processedTemplate preview: ".concat(processedTemplate ? processedTemplate.toString().substring(0, 100) : 'null', "..."));
    return {
      template: processedTemplate,
      blocks: {}
    };
  } catch (error) {
    console.error("Error compiling template ".concat(templateInfo.template, " (").concat(templateInfo.name, "):"), error.message);
    console.error("Template path: ".concat(path.join(templatesDir, templateInfo.template)));
    return null;
  }
} // Function to render template with enhanced Mustache support


function renderTemplate(compiledTemplate, data) {
  try {
    if (!compiledTemplate || !compiledTemplate.template) {
      console.error('No compiled template provided to render');
      return '';
    } // Debug: check template type


    console.log("Debug: template type: ".concat(_typeof(compiledTemplate.template)));
    console.log("Debug: template preview: ".concat(compiledTemplate.template ? compiledTemplate.template.toString().substring(0, 100) : 'null', "...")); // Merge block data with page data

    var renderData = _objectSpread({}, data, {}, compiledTemplate.blocks); // Use enhanced renderer for full Mustache tag support


    var result = renderer.render(compiledTemplate.template, renderData, partials);
    return result;
  } catch (error) {
    console.error("Error rendering template: ".concat(error.message));
    console.error("Template preview: ".concat(compiledTemplate.template ? compiledTemplate.template.substring(0, 200) : 'No template', "..."));
    return '';
  }
} // Function to scan template files


function scanTemplates() {
  try {
    var scanDirectory = function scanDirectory(dir) {
      var relativePath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var items = fs.readdirSync(dir);
      console.log(dir);
      items.forEach(function (item) {
        var fullPath = path.join(dir, item);
        var relativeItemPath = path.join(relativePath, item);
        var stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, relativeItemPath);
        } else if (item.endsWith('.mustache')) {
          templates.push({
            name: path.basename(item, '.mustache'),
            template: relativeItemPath,
            outputPath: relativeItemPath.replace('.mustache', '.html')
          });
        }
      });
    };

    var templates = [];
    console.log("\uD83D\uDD0D Scanning templates directory: ".concat(templatesDir));
    scanDirectory(templatesDir);
    console.log("\u2713 Found ".concat(templates.length, " templates"));
    return templates;
  } catch (error) {
    console.error('Error scanning templates:', error.message);
    return [];
  }
} // Function to validate output with enhanced checks


function validateOutput(output) {
  try {
    if (!output) {
      return {
        isValid: false,
        errors: ['Output is empty']
      };
    }

    var errors = []; // Check for unrendered Mustache variables (all tag types)

    var patterns = [/\{\{[^}]+\}\}/g, // Standard variables {{var}}
    /\{\{\{[^}]+\}\}\}/g, // Unescaped variables {{{var}}}
    /\{\{#[^}]+\}\}/g, // Section starts {{#section}}
    /\{\{\/[^}]+\}\}/g, // Section ends {{/section}}
    /\{\{\^[^}]+\}\}/g, // Inverted sections {{^section}}
    /\{\{>[^}]+\}\}/g, // Partials {{> partial}}
    /\{\{<[^}]+\}\}/g, // Inheritance {{< layout}}
    /\{\{\$[^}]+\}\}/g // Blocks {{$block}}
    ];
    patterns.forEach(function (pattern, index) {
      var matches = output.match(pattern);

      if (matches) {
        var tagTypes = ['variables', 'unescaped variables', 'section starts', 'section ends', 'inverted sections', 'partials', 'inheritance', 'blocks'];
        errors.push("Unrendered ".concat(tagTypes[index], " found: ").concat(matches.slice(0, 3).join(', ')).concat(matches.length > 3 ? '...' : ''));
      }
    }); // Check for unclosed HTML tags (basic check)

    var openTags = (output.match(/<[^/][^>]*[^/]>/g) || []).length;
    var closeTags = (output.match(/<\/[^>]*>/g) || []).length;
    var selfClosingTags = (output.match(/<[^>]*\/>/g) || []).length;

    if (openTags !== closeTags + selfClosingTags) {
      errors.push('Potentially unclosed HTML tags');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ["Validation error: ".concat(error.message)]
    };
  }
} // Function to ensure output directory exists


function ensureOutputDirectory(outputPath) {
  try {
    var dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }
  } catch (error) {
    console.error("Error creating output directory for ".concat(outputPath, ":"), error.message);
  }
} // Function to clean output directory


function cleanOutput() {
  try {
    if (fs.existsSync(outputBasePath)) {
      fs.rmSync(outputBasePath, {
        recursive: true,
        force: true
      });
      console.log('✓ Cleaned output directory');
    }
  } catch (error) {
    console.error('Error cleaning output directory:', error.message);
  }
} // Function to copy assets


function copyAssets() {
  try {
    var sourceAssetsPath = path.join(__dirname, 'assets');
    var targetAssetsPath = path.join(outputBasePath, 'assets');

    if (fs.existsSync(sourceAssetsPath)) {
      // Copy files recursively
      var copyRecursive = function copyRecursive(source, target) {
        var items = fs.readdirSync(source);
        items.forEach(function (item) {
          var sourcePath = path.join(source, item);
          var targetPath = path.join(target, item);
          var stat = fs.statSync(sourcePath);

          if (stat.isDirectory()) {
            fs.mkdirSync(targetPath, {
              recursive: true
            });
            copyRecursive(sourcePath, targetPath);
          } else {
            fs.copyFileSync(sourcePath, targetPath);
          }
        });
      };

      // Ensure target directory exists
      fs.mkdirSync(targetAssetsPath, {
        recursive: true
      });
      copyRecursive(sourceAssetsPath, targetAssetsPath);
      console.log('✓ Assets copied successfully');
    } else {
      console.warn('⚠️  Assets directory not found, skipping copy');
    }
  } catch (error) {
    console.error('Error copying assets:', error.message);
  }
} // Enhanced block processing functions


function processBlockOverrides(templateContent) {
  var blocks = {};
  var blockPattern = /\{\{\$([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  var match;

  while ((match = blockPattern.exec(templateContent)) !== null) {
    var blockName = match[1].trim();
    var blockContent = match[2];
    blocks[blockName] = blockContent;
  }

  return blocks;
}

function mergeTemplateBlocks(layoutContent, childBlocks) {
  var result = layoutContent;
  var blocks = {}; // Replace child block overrides first

  Object.keys(childBlocks).forEach(function (blockName) {
    var blockPattern = new RegExp("\\{\\{\\$".concat(blockName, "\\}\\}[\\s\\S]*?\\{\\{\\/").concat(blockName, "\\}\\}"), 'g');
    result = result.replace(blockPattern, childBlocks[blockName]);
    blocks[blockName] = childBlocks[blockName];
  }); // Process remaining blocks with their default content

  var remainingBlockPattern = /\{\{\$([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(remainingBlockPattern, function (match, blockName, defaultContent) {
    if (!blocks[blockName]) {
      blocks[blockName] = defaultContent;
    }

    return blocks[blockName];
  });
  return {
    content: result,
    blocks: blocks
  };
} // Legacy function for backward compatibility


function loadData() {
  loadGlobalData();
} // Load layout template for a specific page


function loadLayoutForTemplate(templateInfo) {
  try {
    // First, check if template specifies a custom layout
    var templatePath = templateInfo.templatePath;
    var templateContent = fs.readFileSync(templatePath, 'utf8'); // Look for layout reference in template (e.g., {{> custom-layout}})

    var layoutMatch = templateContent.match(/{{>\s*([^}]+)}}/);
    var layoutName = 'layout'; // default layout name

    if (layoutMatch) {
      layoutName = layoutMatch[1].trim();
    } // Create a cache key that includes template-specific overrides
    //  const cacheKey = `${layoutName}-${templateInfo.template}`;
    // Check if this specific template-layout combination is already cached
    // if (layoutCache[cacheKey]) {
    //    return layoutCache[cacheKey];
    // }
    // Try to find the layout file


    var layoutPath; // First try: look for layout in templates directory

    layoutPath = path.join(__dirname, 'templates', "".concat(layoutName, ".mustache"));

    if (!fs.existsSync(layoutPath)) {
      // Second try: use the default layout from settings
      layoutPath = path.join(__dirname, settings.layout);

      if (!fs.existsSync(layoutPath)) {
        // Third try: look for 'layout.mustache' in templates directory
        layoutPath = path.join(__dirname, 'templates', 'layout.mustache');
      }
    }

    if (!fs.existsSync(layoutPath)) {
      throw new Error("Layout file not found: ".concat(layoutName));
    }

    var layoutContent = fs.readFileSync(layoutPath, 'utf8');
    var templateBlocks = {}; // Check if layout itself has block syntax that needs processing

    var layoutHasBlockSyntax = layoutContent.includes('{{$'); // Process block overrides if template contains block definitions

    var hasBlocks = templateContent.includes('{{$');

    if (hasBlocks) {
      console.log("Processing block overrides for ".concat(templateInfo.template)); // Extract block overrides from the child template

      var childBlocks = processBlockOverrides(templateContent); // If there are block overrides, merge them with the parent layout

      if (Object.keys(childBlocks).length > 0) {
        var mergeResult = mergeTemplateBlocks(layoutContent, childBlocks);
        layoutContent = mergeResult.content;
        templateBlocks = mergeResult.blocks;
        console.log("\u2713 Applied ".concat(Object.keys(childBlocks).length, " block overrides"));
      }
    } else if (layoutHasBlockSyntax) {
      // Layout has blocks but template doesn't override them - use defaults
      var _mergeResult = mergeTemplateBlocks(layoutContent, {});

      layoutContent = _mergeResult.content;
      templateBlocks = _mergeResult.blocks;
      console.log("\u2713 Processed layout blocks with defaults for ".concat(templateInfo.template));
    } // Pre-parse layout template for better performance (only if no block syntax remains)


    var finalLayoutHasBlocks = layoutContent.includes('{{$');

    if (!finalLayoutHasBlocks) {
      try {
        Mustache.parse(layoutContent);
      } catch (parseError) {
        console.warn("Layout parsing warning for ".concat(templateInfo.template, ": ").concat(parseError.message));
      }
    } // Cache the processed layout with its blocks


    var result = {
      content: layoutContent,
      blocks: templateBlocks
    };
    layoutCache[cacheKey] = result;
    console.log("\u2713 Layout '".concat(layoutName, "' loaded for ").concat(templateInfo.template));
    return result;
  } catch (error) {
    console.error("Error loading layout for ".concat(templateInfo.template, ":"), error.message); // Fallback to default layout from settings

    try {
      var defaultLayoutPath = path.join(__dirname, settings.layout);

      var _layoutContent = fs.readFileSync(defaultLayoutPath, 'utf8'); // Only parse if no block syntax


      var _hasBlocks = _layoutContent.includes('{{$');

      if (!_hasBlocks) {
        Mustache.parse(_layoutContent);
      }

      var _result = {
        content: _layoutContent,
        blocks: {}
      };
      layoutCache['default'] = _result;
      return _result;
    } catch (fallbackError) {
      console.error('Error loading fallback layout:', fallbackError.message);
      process.exit(1);
    }
  }
} // Load default layout template (legacy function for backward compatibility)


function loadLayout() {
  try {
    // Try to load layout.mustache from the layouts directory first, then fallback
    var possibleLayoutPaths = [path.join(layoutsDir, 'layout.mustache'), path.join(__dirname, 'templates', 'layout.mustache'), path.join(__dirname, settings.layout || 'templates/layout.mustache')];
    var layoutPath = null;

    for (var _i3 = 0, _possibleLayoutPaths = possibleLayoutPaths; _i3 < _possibleLayoutPaths.length; _i3++) {
      var possiblePath = _possibleLayoutPaths[_i3];

      if (fs.existsSync(possiblePath)) {
        layoutPath = possiblePath;
        break;
      }
    }

    if (!layoutPath) {
      console.warn('⚠️  No default layout found, skipping default layout loading');
      return;
    }

    var defaultLayout = fs.readFileSync(layoutPath, 'utf8'); // Check if layout contains block syntax

    var hasBlocks = defaultLayout.includes('{{$'); // Only pre-parse if it doesn't contain block syntax

    if (!hasBlocks) {
      Mustache.parse(defaultLayout);
    } // Cache the default layout in the new format


    layoutCache['layout'] = {
      content: defaultLayout,
      blocks: {}
    };
    console.log("\u2713 Default layout template loaded from: ".concat(path.relative(__dirname, layoutPath)));
  } catch (error) {
    console.error('Error loading default layout template:', error.message); // Don't exit - this is not critical for compilation

    console.warn('⚠️  Continuing without default layout');
  }
} // Create directory if it doesn't exist


function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {
      recursive: true
    });
  }
} // Recursively copy directory


function copyDirectory(src, dest) {
  ensureDirectory(dest);
  var items = fs.readdirSync(src);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;
      var srcPath = path.join(src, item);
      var destPath = path.join(dest, item);
      var stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
} // Get page-specific data based on template info with enhanced data processing


function getPageData(templateInfo) {
  // Load page-specific data merged with global data
  var pageData = loadPageData(templateInfo); // Add lambda functions for dynamic content

  pageData.formatDate = function () {
    return function (text, render) {
      var date = new Date(render(text));
      return date.toLocaleDateString();
    };
  };

  pageData.uppercase = function () {
    return function (text, render) {
      return render(text).toUpperCase();
    };
  };

  pageData.lowercase = function () {
    return function (text, render) {
      return render(text).toLowerCase();
    };
  };

  pageData.ifEquals = function () {
    return function (text, render) {
      var parts = text.split(',');

      if (parts.length === 2) {
        var _parts$map3 = parts.map(function (p) {
          return render(p.trim());
        }),
            _parts$map4 = _slicedToArray(_parts$map3, 2),
            val1 = _parts$map4[0],
            val2 = _parts$map4[1];

        return val1 === val2;
      }

      return false;
    };
  }; // Render page content


  return pageData;
} // Enhanced content rendering with support for all tag types


function renderPageContent(templateInfo, data) {
  try {
    var templatePath = templateInfo.templatePath;
    var _cacheKey = templateInfo.template; // Use cached template or load and cache it

    if (!templateCache[_cacheKey]) {
      var _templateContent = fs.readFileSync(templatePath, 'utf8');

      templateCache[_cacheKey] = _templateContent;
    }

    var templateContent = templateCache[_cacheKey]; // Extract content between {{#content}} and {{/content}} for traditional templates

    var contentMatch = templateContent.match(/{{#content}}([\s\S]*?){{\/content}}/);

    if (contentMatch) {
      var contentTemplate = contentMatch[1];
      return renderTemplate(contentTemplate, data, partials);
    } // For templates without content sections, return empty string
    // The actual rendering will be handled in compileTemplate


    return '';
  } catch (error) {
    console.estatrror("Error rendering content for ".concat(templateInfo.template, ":"), error.message);
    return '';
  }
} // Main compilation process


function compile() {
  var args, specificFile, allTemplates, templates, targetFile, successCount, errorCount, failedTemplates, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, templateInfo, pageData, compiledTemplate, errorMsg, output, _errorMsg, validation, outputPath, _errorMsg2;

  return regeneratorRuntime.async(function compile$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // Check for specific file argument
          args = process.argv.slice(2);

          if (!(args.length > 0 && (args[0] === '-v' || args[0] === '--version'))) {
            _context.next = 4;
            break;
          }

          showVersionInfo();
          return _context.abrupt("return");

        case 4:
          specificFile = args.length > 0 ? args[0] : null; // Normalize path separators to forward slash for matching

          if (specificFile) {
            specificFile = specificFile.replace(/\\/g, '/');
          }

          if (specificFile) {
            console.log("\uD83C\uDFAF Compiling specific file: ".concat(specificFile));
          } else {
            console.log('🚀 Starting Mustache compilation...\n');
          } // Clear template and layout cache


          templateCache = {};
          layoutCache = {}; // Load all necessary files

          loadGlobalData();
          loadPartials();
          loadLayout();
          _context.prev = 12;
          // Scan templates directory for all .mustache files
          console.log('\n📂 Scanning templates directory...');
          allTemplates = scanTemplates();
          console.log("\u2713 Found ".concat(allTemplates.length, " template(s)"));
          templates = allTemplates; // Filter for specific file if provided

          if (specificFile) {
            targetFile = specificFile.endsWith('.mustache') ? specificFile : "".concat(specificFile, ".mustache");
            templates = allTemplates.filter(function (template) {
              // Normalize template paths for comparison
              var templatePathNormalized = template.template.replace(/\\/g, '/');
              var outputPathNormalized = template.outputPath.replace(/\\/g, '/');
              var nameNormalized = template.name.replace(/\\/g, '/'); // For root-level templates like "index.mustache"

              if (outputPathNormalized === '' && nameNormalized === specificFile) {
                return true;
              } // Exact template path matches


              if (templatePathNormalized === targetFile) return true;
              if (templatePathNormalized.replace(/\.mustache$/, '') === specificFile) return true; // Full path matches (for subdirectory templates)

              var fullPath = outputPathNormalized ? "".concat(outputPathNormalized, "/").concat(nameNormalized) : nameNormalized;
              if (fullPath === specificFile) return true;
              return false;
            });

            if (templates.length === 0) {
              console.error("\u274C Template not found: ".concat(specificFile));
              console.log('\n📋 Available templates:');
              allTemplates.forEach(function (t) {
                var fullPath = t.outputPath ? "".concat(t.outputPath) : t.name;
                console.log("   - ".concat(t.template.replace(/\.mustache$/, ''), " (path: ").concat(fullPath, ")"));
              });
              process.exit(1);
            }

            console.log("\u2713 Found matching template(s): ".concat(templates.length));
            templates.forEach(function (t) {
              return console.log("   - ".concat(t.template));
            });
          }

          if (!(templates.length === 0)) {
            _context.next = 21;
            break;
          }

          console.warn('⚠️  No templates found in the templates directory');
          return _context.abrupt("return");

        case 21:
          console.log('\n📝 Compiling templates...');
          successCount = 0;
          errorCount = 0;
          failedTemplates = []; // Process each template

          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 28;
          _iterator2 = templates[Symbol.iterator]();

        case 30:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context.next = 67;
            break;
          }

          templateInfo = _step2.value;
          _context.prev = 32;
          console.log("\uD83D\uDD27 Processing: ".concat(templateInfo.template, " (").concat(templateInfo.name, ")")); // Load page-specific data

          pageData = loadPageData(templateInfo); // Compile template with inheritance support

          compiledTemplate = compileTemplate(templateInfo);

          if (compiledTemplate) {
            _context.next = 42;
            break;
          }

          errorMsg = "Failed to compile template: ".concat(templateInfo.template);
          console.error("\u274C ".concat(errorMsg));
          failedTemplates.push({
            template: templateInfo.template,
            error: errorMsg
          });
          errorCount++;
          return _context.abrupt("continue", 64);

        case 42:
          // Render template with enhanced Mustache support
          output = renderTemplate(compiledTemplate, pageData);

          if (output) {
            _context.next = 49;
            break;
          }

          _errorMsg = "Failed to render template: ".concat(templateInfo.template);
          console.error("\u274C ".concat(_errorMsg));
          failedTemplates.push({
            template: templateInfo.template,
            error: _errorMsg
          });
          errorCount++;
          return _context.abrupt("continue", 64);

        case 49:
          // Convert relative URLs to absolute URLs in the HTML output
          if (siteUrl) {
            output = convertRelativeUrlsInHtml(output);
            console.log("\u2713 Converted relative URLs to absolute URLs for ".concat(templateInfo.name));
          } // Validate output if requested


          if (settings.validateOutput) {
            validation = validateOutput(output);

            if (!validation.isValid) {
              console.warn("\u26A0\uFE0F  Validation warnings for ".concat(templateInfo.name, ":"));
              validation.errors.forEach(function (error) {
                return console.warn("   \u2022 ".concat(error));
              });
            }
          } // Write output file


          outputPath = path.join(outputBasePath, templateInfo.outputPath); // Ensure output directory exists

          if (settings.createDirectories) {
            ensureOutputDirectory(outputPath);
          }

          fs.writeFileSync(outputPath, output, 'utf8');
          console.log("\u2713 ".concat(templateInfo.name, " \u2192 ").concat(templateInfo.outputPath));
          successCount++;
          _context.next = 64;
          break;

        case 58:
          _context.prev = 58;
          _context.t0 = _context["catch"](32);
          _errorMsg2 = "Error processing template: ".concat(templateInfo.template, " - ").concat(_context.t0.message);
          console.error("\u274C ".concat(_errorMsg2));
          failedTemplates.push({
            template: templateInfo.template,
            error: _context.t0.message
          });
          errorCount++;

        case 64:
          _iteratorNormalCompletion2 = true;
          _context.next = 30;
          break;

        case 67:
          _context.next = 73;
          break;

        case 69:
          _context.prev = 69;
          _context.t1 = _context["catch"](28);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t1;

        case 73:
          _context.prev = 73;
          _context.prev = 74;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 76:
          _context.prev = 76;

          if (!_didIteratorError2) {
            _context.next = 79;
            break;
          }

          throw _iteratorError2;

        case 79:
          return _context.finish(76);

        case 80:
          return _context.finish(73);

        case 81:
          // Summary
          console.log("\n\uD83C\uDF89 Enhanced Mustache compilation complete!");
          console.log("\u2713 ".concat(successCount, " templates compiled successfully"));

          if (errorCount > 0) {
            console.log("\u274C ".concat(errorCount, " templates failed:"));
            failedTemplates.forEach(function (failed, index) {
              console.log("   ".concat(index + 1, ". ").concat(failed.template, ": ").concat(failed.error));
            });
          }

          if (specificFile) {
            console.log("\n\u2705 Specific file compilation completed!");
            console.log("\uD83D\uDCCA Performance: ".concat(Object.keys(templateCache).length, " templates cached, ").concat(Object.keys(layoutCache).length, " layouts cached"));
          } else {
            console.log('\n✅ Compilation completed successfully!');
            console.log("\uD83D\uDCCA Performance: ".concat(Object.keys(templateCache).length, " templates cached, ").concat(Object.keys(layoutCache).length, " layouts cached"));
          }

          _context.next = 91;
          break;

        case 87:
          _context.prev = 87;
          _context.t2 = _context["catch"](12);
          console.error('Error during compilation:', _context.t2.message);
          process.exit(1);

        case 91:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[12, 87], [28, 69, 73, 81], [32, 58], [74,, 76, 80]]);
} // Check if mustache package is available


try {
  require('mustache');
} catch (error) {
  console.error('❌ Mustache package not found. Please install it first:');
  console.error('npm install mustache');
  process.exit(1);
} // Module exports


module.exports = {
  compile: compile,
  loadGlobalData: loadGlobalData,
  loadPageData: loadPageData,
  scanTemplates: scanTemplates,
  compileTemplate: compileTemplate,
  renderTemplate: renderTemplate,
  validateOutput: validateOutput,
  convertRelativeToAbsolute: convertRelativeToAbsolute,
  convertRelativeUrlsInHtml: convertRelativeUrlsInHtml,
  settings: settings,
  TemplateInheritance: TemplateInheritance,
  EnhancedMustacheRenderer: EnhancedMustacheRenderer
}; // Run the compiler if executed directly

if (require.main === module) {
  compile();
}

function showVersionInfo() {
  console.log('--- Mustache Compiler Info ---');
  console.log("Version: ".concat(VERSION));
  console.log("Author: ".concat(AUTHOR));
  console.log("Node.js: ".concat(process.version));
  console.log("Platform: ".concat(process.platform));
  console.log("Working Directory: ".concat(process.cwd()));
  console.log('Settings:');
  Object.entries(settings).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    console.log("  ".concat(key, ": ").concat(JSON.stringify(value)));
  });
  console.log('-----------------------------');
}