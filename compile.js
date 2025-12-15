const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');
const { exit } = require('process');

const VERSION = '1.0.1'; // Update as needed
const AUTHOR = 'Arlindo Santos'; // Update as needed

// Load settings
let settings = {};
let siteUrl = "";
try {
    const settingsContent = fs.readFileSync(path.join(__dirname, 'settings.json'), 'utf8');
    const settingsData = JSON.parse(settingsContent);
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
}

// Function to convert relative URLs to absolute URLs
function convertRelativeToAbsolute(obj) {
    if (!siteUrl) return obj;

    // Remove trailing slash from siteUrl
    const baseUrl = siteUrl.replace(/\/$/, '');

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
        } else if (value && typeof value === 'object') {
            return convertRelativeToAbsolute(value);
        }
        return value;
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = processValue(value);
    }
    return result;
}

// Function to convert relative URLs in HTML content to absolute URLs
function convertRelativeUrlsInHtml(htmlContent) {
    if (!siteUrl || !htmlContent) return htmlContent;

    // Remove trailing slash from siteUrl
    const baseUrl = siteUrl.replace(/\/$/, '');

    // Convert relative URLs in href attributes
    htmlContent = htmlContent.replace(/href=["']([^"']*?)["']/g, (match, url) => {
        if (url.startsWith('./')) {
            return `href="${baseUrl}${url.substring(1)}"`;
        } else if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
            return `href="${baseUrl}${url}"`;
        }
        return match;
    });

    // Convert relative URLs in src attributes
    htmlContent = htmlContent.replace(/src=["']([^"']*?)["']/g, (match, url) => {
        if (url.startsWith('./')) {
            return `src="${baseUrl}${url.substring(1)}"`;
        } else if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
            return `src="${baseUrl}${url}"`;
        }
        return match;
    });

    // Convert relative URLs in action attributes (for forms)
    htmlContent = htmlContent.replace(/action=["']([^"']*?)["']/g, (match, url) => {
        if (url.startsWith('./')) {
            return `action="${baseUrl}${url.substring(1)}"`;
        } else if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
            return `action="${baseUrl}${url}"`;
        }
        return match;
    });

    return htmlContent;
}

// Configuration using settings
    const templatesDir = path.join(__dirname, settings.templates);
    const partialsDir = path.join(__dirname, settings.partials);
    const layoutsDir = path.join(__dirname, settings.layouts);
    const dataDir = path.join(__dirname, settings.data);
    const outputBasePath = __dirname;




// Debugging logs to identify undefined paths in settings
console.log('Debug: settings object:', settings);
console.log('Debug: templatesDir:', templatesDir);
console.log('Debug: partialsDir:', partialsDir);
console.log('Debug: layoutsDir:', layoutsDir);
console.log('Debug: outputBasePath:', outputBasePath);

// Global variables
let partials = {};
let data = {};
//let templateCache = {};
//et layoutCache = {};

// Enhanced Mustache configuration for all tag types
Mustache.escape = function (text) {
    return text; // Disable HTML escaping
};

// Custom template inheritance handler
class TemplateInheritance {
    constructor() {
        this.layouts = new Map();
        this.blocks = new Map();
    }

    // Parse template inheritance syntax {{< layout}}
    parseInheritance(templateContent) {
        const inheritancePattern = /\{\{<\s*([^}]+)\s*\}\}/;
        const match = templateContent.match(inheritancePattern);

        if (match) {
            const layoutName = match[1].trim();
            const templateWithoutInheritance = templateContent.replace(inheritancePattern, '').trim();
            return { layoutName, content: templateWithoutInheritance };
        }

        return { layoutName: null, content: templateContent };
    }

    // Parse block definitions {{$blockName}}content{{/blockName}}
    parseBlocks(templateContent) {
        const blockPattern = /\{\{\$([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        const blocks = {};
        let match;

        while ((match = blockPattern.exec(templateContent)) !== null) {
            const blockName = match[1].trim();
            const blockContent = match[2];
            blocks[blockName] = blockContent;
        }

        return blocks;
    }

    // Replace block placeholders in layout with actual content, recursively for nested blocks
    replaceBlocks(layoutContent, blocks, depth = 0) {
        if (depth > 20) {
            console.error('Maximum block replacement depth exceeded');
            return layoutContent;
        }
        let result = layoutContent;

        // Recursively parse and replace blocks
        const blockPattern = /\{\{\$([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        result = result.replace(blockPattern, (match, blockName, defaultContent) => {
            let blockContent = blocks[blockName] !== undefined ? blocks[blockName] : defaultContent;
            // Recursively replace blocks inside blockContent
            if (/\{\{\$[^}]+\}\}/.test(blockContent) && blockContent !== match) {
                blockContent = this.replaceBlocks(blockContent, blocks, depth + 1);
            }
            return blockContent;
        });

        return result;
    }

    // Process template with inheritance (supports nested layout inheritance and block override propagation)
    processTemplate(templateContent, templatePath, depth = 0, inheritedBlocks = {}) {
        // Prevent infinite recursion
        if (depth > 10) {
            console.error('Maximum layout inheritance depth exceeded');
            return templateContent;
        }

        const { layoutName, content } = this.parseInheritance(templateContent);

        // Parse blocks from current template
        const currentBlocks = this.parseBlocks(content);
        // Merge inherited blocks (from child) with current blocks (current overrides child)
        const mergedBlocks = { ...inheritedBlocks, ...currentBlocks };

        if (!layoutName) {
            // No inheritance, return content as-is
            // If there are blocks, replace them in the content
            return this.replaceBlocks(content, mergedBlocks);
        }

        // Load layout
        const layoutPath = this.resolveLayoutPath(layoutName, templatePath);
        if (!fs.existsSync(layoutPath)) {
            console.error(`Layout not found: ${layoutName} at ${layoutPath}`);
            return content;
        }

        let layoutContent = fs.readFileSync(layoutPath, 'utf8');
        console.log(`✓ Processing layout inheritance: ${layoutName} (depth: ${depth})`);

        // Check if the layout itself inherits from another layout
        const layoutInheritance = this.parseInheritance(layoutContent);
        if (layoutInheritance.layoutName) {
            // Layout inherits from another layout - process recursively, passing merged blocks up
            layoutContent = this.processTemplate(layoutContent, layoutPath, depth + 1, mergedBlocks);
        }

        // Replace blocks in layout with merged blocks
        return this.replaceBlocks(layoutContent, mergedBlocks);
    }

    resolveLayoutPath(layoutName, templatePath) {
        // Try different layout locations in priority order
        const locations = [
            // 1. Look in the layouts directory (highest priority)
            path.join(layoutsDir, `${layoutName}.mustache`),
            // 2. Look in the same directory as the template
            path.join(path.dirname(templatePath), `${layoutName}.mustache`),
            // 3. Look in the templates root directory
            path.join(__dirname, 'templates', `${layoutName}.mustache`),
            // 4. Fall back to default layout in layouts directory
            path.join(layoutsDir, 'layout.mustache'),
            // 5. Final fallback to templates directory
            path.join(__dirname, 'templates', 'layout.mustache')
        ];

        for (const location of locations) {
            if (fs.existsSync(location)) {
                return location;
            }
        }

        // If nothing found, return the layouts directory default
        return path.join(layoutsDir, 'layout.mustache');
    }
}

const templateInheritance = new TemplateInheritance();

// Enhanced Mustache renderer with full tag support
class EnhancedMustacheRenderer {
    constructor() {
        this.partials = {};
        this.lambdas = {};
    }

    // Load partials with full Mustache support
    loadPartials() {
        try {
            const partialFiles = fs.readdirSync(partialsDir);

            partialFiles.forEach(file => {
                if (file.endsWith('.mustache')) {
                    const partialName = path.basename(file, '.mustache');
                    const partialPath = path.join(partialsDir, file);
                    let partialContent = fs.readFileSync(partialPath, 'utf8');

                    // Partials don't use template inheritance, load as-is
                    this.partials[partialName] = partialContent;
                    partials[partialName] = partialContent;

                    // Pre-parse for performance
                    Mustache.parse(partialContent);
                }
            });

            console.log(`✓ Loaded ${Object.keys(this.partials).length} partials`);
        } catch (error) {
            console.error('Error loading partials:', error.message);
        }
    }

    // Enhanced rendering with all Mustache tag types
    render(template, data, partialsObj = {}) {
        try {
            // Ensure we have the latest partials
            const allPartials = { ...this.partials, ...partialsObj };

            // Pre-parse template for better error detection
            try {
                Mustache.parse(template, ['{{', '}}']);
            } catch (parseError) {
                console.warn(`Template parsing warning: ${parseError.message}`);
            }

            // Render with full Mustache support including:
            // {{variable}} - Variables
            // {{{variable}}} - Unescaped variables  
            // {{#section}} - Sections
            // {{^section}} - Inverted sections
            // {{/section}} - Section endings
            // {{! comment}} - Comments
            // {{> partial}} - Partials
            // {{=<% %>=}} - Set delimiters
            const result = Mustache.render(template, data, allPartials);

            return result;
        } catch (error) {
            console.error(`Error rendering template: ${error.message}`);
            console.error(`Template preview: ${template.substring(0, 200)}...`);
            return '';
        }
    }
}

const renderer = new EnhancedMustacheRenderer();

// Load shared global data
function loadGlobalData() {
    try {
        const globalDataPath = path.join(dataDir, '/global.json');
        const globalDataContent = fs.readFileSync(globalDataPath, 'utf8');
        data = JSON.parse(globalDataContent);
        console.log('✓ Global data loaded successfully');
         console.log(data);
    } catch (error) {
        console.error('Error loading global data:', error.message);
        process.exit(1);
    }
}

// Load page-specific data
function loadPageData(templateInfo) {
    try {
        let dataPath = templateInfo.template.replace('.mustache', '.json');
        dataPath = path.join(dataDir, dataPath);

        if (fs.existsSync(dataPath)) {
            const pageDataContent = fs.readFileSync(dataPath, 'utf8');
            const pageData = JSON.parse(pageDataContent);

            let mergedData = { ...data, ...pageData };

            // Convert relative URLs to absolute URLs
            if (siteUrl) {
                mergedData = convertRelativeToAbsolute(mergedData);
                console.log('✓ Converted relative URLs to absolute URLs');
            }

            // Add Mustache lambda functions for dynamic content
            mergedData.formatDate = function () {
                return function (text, render) {
                    const date = new Date(render(text));
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
                    const parts = text.split(',');
                    if (parts.length === 2) {
                        const [val1, val2] = parts.map(p => render(p.trim()));
                        return val1 === val2;
                    }
                    return false;
                };
            };

            return mergedData;
        } else {
            console.warn(`⚠️  No specific data file found for ${templateInfo.template}, using global data only`);
            let globalData = { ...data };

            if (siteUrl) {
                globalData = convertRelativeToAbsolute(globalData);
            }
            console.log(globalData);  
            return globalData;
        }
    } catch (error) {
        console.error(`Error loading page data for ${templateInfo.template}:`, error.message);
        return { ...data };
    }
}

// Load partials
function loadPartials() {
    renderer.loadPartials();
}

// Compile and render templates with enhanced inheritance support
function compileTemplate(templateInfo) {
    try {
        const templatePath = path.join(templatesDir, templateInfo.template);
        let templateContent = fs.readFileSync(templatePath, 'utf8');

        console.log(`🔧 Compiling ${templateInfo.name}...`);

        // Process template inheritance using the enhanced system
        const processedTemplate = templateInheritance.processTemplate(templateContent, templatePath);

        console.log(`Debug: processedTemplate type: ${typeof processedTemplate}`);
        console.log(`Debug: processedTemplate preview: ${processedTemplate ? processedTemplate.toString().substring(0, 100) : 'null'}...`);

        return { template: processedTemplate, blocks: {} };
    } catch (error) {
        console.error(`Error compiling template ${templateInfo.template} (${templateInfo.name}):`, error.message);
        console.error(`Template path: ${path.join(templatesDir, templateInfo.template)}`);
        return null;
    }
}

// Function to render template with enhanced Mustache support
function renderTemplate(compiledTemplate, data) {
    try {
        if (!compiledTemplate || !compiledTemplate.template) {
            console.error('No compiled template provided to render');
            return '';
        }

        // Debug: check template type
        console.log(`Debug: template type: ${typeof compiledTemplate.template}`);
        console.log(`Debug: template preview: ${compiledTemplate.template ? compiledTemplate.template.toString().substring(0, 100) : 'null'}...`);

        // Merge block data with page data
        const renderData = { ...data, ...compiledTemplate.blocks };

        // Use enhanced renderer for full Mustache tag support
        const result = renderer.render(compiledTemplate.template, renderData, partials);

        return result;
    } catch (error) {
        console.error(`Error rendering template: ${error.message}`);
        console.error(`Template preview: ${compiledTemplate.template ? compiledTemplate.template.substring(0, 200) : 'No template'}...`);
        return '';
    }
}

// Function to scan template files
function scanTemplates() {
    try {
        const templates = [];

        console.log(`🔍 Scanning templates directory: ${templatesDir}`);

        function scanDirectory(dir, relativePath = '') {
            const items = fs.readdirSync(dir);
            console.log(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const relativeItemPath = path.join(relativePath, item);
                const stat = fs.statSync(fullPath);

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
        }

        scanDirectory(templatesDir);
        console.log(`✓ Found ${templates.length} templates`);
        return templates;
    } catch (error) {
        console.error('Error scanning templates:', error.message);
        return [];
    }
}

// Function to validate output with enhanced checks
function validateOutput(output) {
    try {
        if (!output) {
            return { isValid: false, errors: ['Output is empty'] };
        }

        const errors = [];

        // Check for unrendered Mustache variables (all tag types)
        const patterns = [
            /\{\{[^}]+\}\}/g,      // Standard variables {{var}}
            /\{\{\{[^}]+\}\}\}/g,  // Unescaped variables {{{var}}}
            /\{\{#[^}]+\}\}/g,     // Section starts {{#section}}
            /\{\{\/[^}]+\}\}/g,    // Section ends {{/section}}
            /\{\{\^[^}]+\}\}/g,    // Inverted sections {{^section}}
            /\{\{>[^}]+\}\}/g,     // Partials {{> partial}}
            /\{\{<[^}]+\}\}/g,     // Inheritance {{< layout}}
            /\{\{\$[^}]+\}\}/g     // Blocks {{$block}}
        ];

        patterns.forEach((pattern, index) => {
            const matches = output.match(pattern);
            if (matches) {
                const tagTypes = ['variables', 'unescaped variables', 'section starts', 'section ends', 'inverted sections', 'partials', 'inheritance', 'blocks'];
                errors.push(`Unrendered ${tagTypes[index]} found: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
            }
        });

        // Check for unclosed HTML tags (basic check)
        const openTags = (output.match(/<[^/][^>]*[^/]>/g) || []).length;
        const closeTags = (output.match(/<\/[^>]*>/g) || []).length;
        const selfClosingTags = (output.match(/<[^>]*\/>/g) || []).length;

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
            errors: [`Validation error: ${error.message}`]
        };
    }
}

// Function to ensure output directory exists
function ensureOutputDirectory(outputPath) {
    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (error) {
        console.error(`Error creating output directory for ${outputPath}:`, error.message);
    }
}

// Function to clean output directory
function cleanOutput() {
    try {
        if (fs.existsSync(outputBasePath)) {
            fs.rmSync(outputBasePath, { recursive: true, force: true });
            console.log('✓ Cleaned output directory');
        }
    } catch (error) {
        console.error('Error cleaning output directory:', error.message);
    }
}

// Function to copy assets
function copyAssets() {
    try {
        const sourceAssetsPath = path.join(__dirname, 'assets');
        const targetAssetsPath = path.join(outputBasePath, 'assets');

        if (fs.existsSync(sourceAssetsPath)) {
            // Ensure target directory exists
            fs.mkdirSync(targetAssetsPath, { recursive: true });

            // Copy files recursively
            function copyRecursive(source, target) {
                const items = fs.readdirSync(source);

                items.forEach(item => {
                    const sourcePath = path.join(source, item);
                    const targetPath = path.join(target, item);
                    const stat = fs.statSync(sourcePath);

                    if (stat.isDirectory()) {
                        fs.mkdirSync(targetPath, { recursive: true });
                        copyRecursive(sourcePath, targetPath);
                    } else {
                        fs.copyFileSync(sourcePath, targetPath);
                    }
                });
            }

            copyRecursive(sourceAssetsPath, targetAssetsPath);
            console.log('✓ Assets copied successfully');
        } else {
            console.warn('⚠️  Assets directory not found, skipping copy');
        }
    } catch (error) {
        console.error('Error copying assets:', error.message);
    }
}

// Enhanced block processing functions
function processBlockOverrides(templateContent) {
    const blocks = {};
    const blockPattern = /\{\{\$([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    let match;

    while ((match = blockPattern.exec(templateContent)) !== null) {
        const blockName = match[1].trim();
        const blockContent = match[2];
        blocks[blockName] = blockContent;
    }

    return blocks;
}

function mergeTemplateBlocks(layoutContent, childBlocks) {
    let result = layoutContent;
    const blocks = {};

    // Replace child block overrides first
    Object.keys(childBlocks).forEach(blockName => {
        const blockPattern = new RegExp(`\\{\\{\\$${blockName}\\}\\}[\\s\\S]*?\\{\\{\\/${blockName}\\}\\}`, 'g');
        result = result.replace(blockPattern, childBlocks[blockName]);
        blocks[blockName] = childBlocks[blockName];
    });

    // Process remaining blocks with their default content
    const remainingBlockPattern = /\{\{\$([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    result = result.replace(remainingBlockPattern, (match, blockName, defaultContent) => {
        if (!blocks[blockName]) {
            blocks[blockName] = defaultContent;
        }
        return blocks[blockName];
    });

    return { content: result, blocks };
}

// Legacy function for backward compatibility
function loadData() {
    loadGlobalData();
}

// Load layout template for a specific page
function loadLayoutForTemplate(templateInfo) {
    try {
        // First, check if template specifies a custom layout
        const templatePath = templateInfo.templatePath;
        const templateContent = fs.readFileSync(templatePath, 'utf8');

        // Look for layout reference in template (e.g., {{> custom-layout}})
        const layoutMatch = templateContent.match(/{{>\s*([^}]+)}}/);
        let layoutName = 'layout'; // default layout name

        if (layoutMatch) {
            layoutName = layoutMatch[1].trim();
        }

        // Create a cache key that includes template-specific overrides
      //  const cacheKey = `${layoutName}-${templateInfo.template}`;

        // Check if this specific template-layout combination is already cached
       // if (layoutCache[cacheKey]) {
        //    return layoutCache[cacheKey];
        // }

        // Try to find the layout file
        let layoutPath;

        // First try: look for layout in templates directory
        layoutPath = path.join(__dirname, 'templates', `${layoutName}.mustache`);
        if (!fs.existsSync(layoutPath)) {
            // Second try: use the default layout from settings
            layoutPath = path.join(__dirname, settings.layout);
            if (!fs.existsSync(layoutPath)) {
                // Third try: look for 'layout.mustache' in templates directory
                layoutPath = path.join(__dirname, 'templates', 'layout.mustache');
            }
        }

        if (!fs.existsSync(layoutPath)) {
            throw new Error(`Layout file not found: ${layoutName}`);
        }

        let layoutContent = fs.readFileSync(layoutPath, 'utf8');
        let templateBlocks = {};

        // Check if layout itself has block syntax that needs processing
        const layoutHasBlockSyntax = layoutContent.includes('{{$');

        // Process block overrides if template contains block definitions
        const hasBlocks = templateContent.includes('{{$');
        if (hasBlocks) {
            console.log(`Processing block overrides for ${templateInfo.template}`);

            // Extract block overrides from the child template
            const childBlocks = processBlockOverrides(templateContent);

            // If there are block overrides, merge them with the parent layout
            if (Object.keys(childBlocks).length > 0) {
                const mergeResult = mergeTemplateBlocks(layoutContent, childBlocks);
                layoutContent = mergeResult.content;
                templateBlocks = mergeResult.blocks;
                console.log(`✓ Applied ${Object.keys(childBlocks).length} block overrides`);
            }
        } else if (layoutHasBlockSyntax) {
            // Layout has blocks but template doesn't override them - use defaults
            const mergeResult = mergeTemplateBlocks(layoutContent, {});
            layoutContent = mergeResult.content;
            templateBlocks = mergeResult.blocks;
            console.log(`✓ Processed layout blocks with defaults for ${templateInfo.template}`);
        }

        // Pre-parse layout template for better performance (only if no block syntax remains)
        const finalLayoutHasBlocks = layoutContent.includes('{{$');
        if (!finalLayoutHasBlocks) {
            try {
                Mustache.parse(layoutContent);
            } catch (parseError) {
                console.warn(`Layout parsing warning for ${templateInfo.template}: ${parseError.message}`);
            }
        }

        // Cache the processed layout with its blocks
        const result = { content: layoutContent, blocks: templateBlocks };
        layoutCache[cacheKey] = result;

        console.log(`✓ Layout '${layoutName}' loaded for ${templateInfo.template}`);
        return result;

    } catch (error) {
        console.error(`Error loading layout for ${templateInfo.template}:`, error.message);
        // Fallback to default layout from settings
        try {
            const defaultLayoutPath = path.join(__dirname, settings.layout);
            const layoutContent = fs.readFileSync(defaultLayoutPath, 'utf8');

            // Only parse if no block syntax
            const hasBlocks = layoutContent.includes('{{$');
            if (!hasBlocks) {
                Mustache.parse(layoutContent);
            }

            const result = { content: layoutContent, blocks: {} };
            layoutCache['default'] = result;
            return result;
        } catch (fallbackError) {
            console.error('Error loading fallback layout:', fallbackError.message);
            process.exit(1);
        }
    }
}

// Load default layout template (legacy function for backward compatibility)
function loadLayout() {
    try {
        // Try to load layout.mustache from the layouts directory first, then fallback
        const possibleLayoutPaths = [
            path.join(layoutsDir, 'layout.mustache'),
            path.join(__dirname, 'templates', 'layout.mustache'),
            path.join(__dirname, settings.layout || 'templates/layout.mustache')
        ];

        let layoutPath = null;
        for (const possiblePath of possibleLayoutPaths) {
            if (fs.existsSync(possiblePath)) {
                layoutPath = possiblePath;
                break;
            }
        }

        if (!layoutPath) {
            console.warn('⚠️  No default layout found, skipping default layout loading');
            return;
        }

        const defaultLayout = fs.readFileSync(layoutPath, 'utf8');

        // Check if layout contains block syntax
        const hasBlocks = defaultLayout.includes('{{$');

        // Only pre-parse if it doesn't contain block syntax
        if (!hasBlocks) {
            Mustache.parse(defaultLayout);
        }

        // Cache the default layout in the new format
        layoutCache['layout'] = { content: defaultLayout, blocks: {} };

        console.log(`✓ Default layout template loaded from: ${path.relative(__dirname, layoutPath)}`);
    } catch (error) {
        console.error('Error loading default layout template:', error.message);
        // Don't exit - this is not critical for compilation
        console.warn('⚠️  Continuing without default layout');
    }
}

// Create directory if it doesn't exist
function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Recursively copy directory
function copyDirectory(src, dest) {
    ensureDirectory(dest);

    const items = fs.readdirSync(src);

    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}



// Get page-specific data based on template info with enhanced data processing
function getPageData(templateInfo) {
    // Load page-specific data merged with global data
    const pageData = loadPageData(templateInfo);

    // Add lambda functions for dynamic content
    pageData.formatDate = function () {
        return function (text, render) {
            const date = new Date(render(text));
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
            const parts = text.split(',');
            if (parts.length === 2) {
                const [val1, val2] = parts.map(p => render(p.trim()));
                return val1 === val2;
            }
            return false;
        };
    };

    // Render page content
    return pageData;
}

// Enhanced content rendering with support for all tag types
function renderPageContent(templateInfo, data) {
    try {
        const templatePath = templateInfo.templatePath;
        const cacheKey = templateInfo.template;

        // Use cached template or load and cache it
        if (!templateCache[cacheKey]) {
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            templateCache[cacheKey] = templateContent;
        }

        const templateContent = templateCache[cacheKey];

        // Extract content between {{#content}} and {{/content}} for traditional templates
        const contentMatch = templateContent.match(/{{#content}}([\s\S]*?){{\/content}}/);
        if (contentMatch) {
            const contentTemplate = contentMatch[1];
            return renderTemplate(contentTemplate, data, partials);
        }

        // For templates without content sections, return empty string
        // The actual rendering will be handled in compileTemplate
        return '';
    } catch (error) {
        console.estatrror(`Error rendering content for ${templateInfo.template}:`, error.message);
        return '';
    }
}

// Main compilation process
async function compile() {

    // Check for specific file argument
    const args = process.argv.slice(2);
    if (args.length > 0 && (args[0] === '-v' || args[0] === '--version')) {
        showVersionInfo();
        return;
    }
    let specificFile = args.length > 0 ? args[0] : null;
    // Normalize path separators to forward slash for matching
    if (specificFile) {
        specificFile = specificFile.replace(/\\/g, '/');
    }

    if (specificFile) {
        console.log(`🎯 Compiling specific file: ${specificFile}`);
    } else {
        console.log('🚀 Starting Mustache compilation...\n');
    }



    // Clear template and layout cache
    templateCache = {};
    layoutCache = {};

    // Load all necessary files
    loadGlobalData();
    loadPartials();
    loadLayout();


    try {
        // Scan templates directory for all .mustache files
        console.log('\n📂 Scanning templates directory...');
        const allTemplates = scanTemplates();
        console.log(`✓ Found ${allTemplates.length} template(s)`);

        let templates = allTemplates;

        // Filter for specific file if provided
        if (specificFile) {
            const targetFile = specificFile.endsWith('.mustache') ? specificFile : `${specificFile}.mustache`;
            templates = allTemplates.filter(template => {
                // Normalize template paths for comparison
                const templatePathNormalized = template.template.replace(/\\/g, '/');
                const outputPathNormalized = template.outputPath.replace(/\\/g, '/');
                const nameNormalized = template.name.replace(/\\/g, '/');
                // For root-level templates like "index.mustache"
                if (outputPathNormalized === '' && nameNormalized === specificFile) {
                    return true;
                }

                // Exact template path matches
                if (templatePathNormalized === targetFile) return true;
                if (templatePathNormalized.replace(/\.mustache$/, '') === specificFile) return true;

                // Full path matches (for subdirectory templates)
                const fullPath = outputPathNormalized ?
                    `${outputPathNormalized}/${nameNormalized}` :
                    nameNormalized;
                if (fullPath === specificFile) return true;

                return false;
            });

            if (templates.length === 0) {
                console.error(`❌ Template not found: ${specificFile}`);
                console.log('\n📋 Available templates:');
                allTemplates.forEach(t => {
                    const fullPath = t.outputPath ? `${t.outputPath}` : t.name;
                    console.log(`   - ${t.template.replace(/\.mustache$/, '')} (path: ${fullPath})`);
                });
                process.exit(1);
            }

            console.log(`✓ Found matching template(s): ${templates.length}`);
            templates.forEach(t => console.log(`   - ${t.template}`));
        }

        if (templates.length === 0) {
            console.warn('⚠️  No templates found in the templates directory');
            return;
        }

        console.log('\n📝 Compiling templates...');

        let successCount = 0;
        let errorCount = 0;
        let failedTemplates = [];

        // Process each template
        for (const templateInfo of templates) {
            try {
                console.log(`🔧 Processing: ${templateInfo.template} (${templateInfo.name})`);

                // Load page-specific data
                const pageData = loadPageData(templateInfo);

                // Compile template with inheritance support
                const compiledTemplate = compileTemplate(templateInfo);

                if (!compiledTemplate) {
                    const errorMsg = `Failed to compile template: ${templateInfo.template}`;
                    console.error(`❌ ${errorMsg}`);
                    failedTemplates.push({ template: templateInfo.template, error: errorMsg });
                    errorCount++;
                    continue;
                }

                // Render template with enhanced Mustache support
                let output = renderTemplate(compiledTemplate, pageData);

                if (!output) {
                    const errorMsg = `Failed to render template: ${templateInfo.template}`;
                    console.error(`❌ ${errorMsg}`);
                    failedTemplates.push({ template: templateInfo.template, error: errorMsg });
                    errorCount++;
                    continue;
                }

                // Convert relative URLs to absolute URLs in the HTML output
                if (siteUrl) {
                    output = convertRelativeUrlsInHtml(output);
                    console.log(`✓ Converted relative URLs to absolute URLs for ${templateInfo.name}`);
                }

                // Validate output if requested
                if (settings.validateOutput) {
                    const validation = validateOutput(output);
                    if (!validation.isValid) {
                        console.warn(`⚠️  Validation warnings for ${templateInfo.name}:`);
                        validation.errors.forEach(error => console.warn(`   • ${error}`));
                    }
                }

                // Write output file
                const outputPath = path.join(outputBasePath, templateInfo.outputPath);

                // Ensure output directory exists
                if (settings.createDirectories) {
                    ensureOutputDirectory(outputPath);
                }

                fs.writeFileSync(outputPath, output, 'utf8');
                console.log(`✓ ${templateInfo.name} → ${templateInfo.outputPath}`);
                successCount++;

            } catch (error) {
                const errorMsg = `Error processing template: ${templateInfo.template} - ${error.message}`;
                console.error(`❌ ${errorMsg}`);
                failedTemplates.push({ template: templateInfo.template, error: error.message });
                errorCount++;
            }
        }

        // Summary
        console.log(`\n🎉 Enhanced Mustache compilation complete!`);
        console.log(`✓ ${successCount} templates compiled successfully`);
        if (errorCount > 0) {
            console.log(`❌ ${errorCount} templates failed:`);
            failedTemplates.forEach((failed, index) => {
                console.log(`   ${index + 1}. ${failed.template}: ${failed.error}`);
            });
        }

        if (specificFile) {
            console.log(`\n✅ Specific file compilation completed!`);
            console.log(`📊 Performance: ${Object.keys(templateCache).length} templates cached, ${Object.keys(layoutCache).length} layouts cached`);
        } else {
            console.log('\n✅ Compilation completed successfully!');
            console.log(`📊 Performance: ${Object.keys(templateCache).length} templates cached, ${Object.keys(layoutCache).length} layouts cached`);
        }

    } catch (error) {
        console.error('Error during compilation:', error.message);
        process.exit(1);
    }
}

// Check if mustache package is available
try {
    require('mustache');
} catch (error) {
    console.error('❌ Mustache package not found. Please install it first:');
    console.error('npm install mustache');
    process.exit(1);
}

// Module exports
module.exports = {
    compile,
    loadGlobalData,
    loadPageData,
    scanTemplates,
    compileTemplate,
    renderTemplate,
    validateOutput,
    convertRelativeToAbsolute,
    convertRelativeUrlsInHtml,
    settings,
    TemplateInheritance,
    EnhancedMustacheRenderer
};

// Run the compiler if executed directly
if (require.main === module) {
    compile();
}

function showVersionInfo() {
    console.log('--- Mustache Compiler Info ---');
    console.log(`Version: ${VERSION}`);
    console.log(`Author: ${AUTHOR}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Working Directory: ${process.cwd()}`);
    console.log('Settings:');
    Object.entries(settings).forEach(([key, value]) => {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
    });
    console.log('-----------------------------');
}