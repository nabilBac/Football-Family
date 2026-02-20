#!/usr/bin/env node
/**
 * 🔧 PATCHER - Event Dashboard Stepper + Accordions
 * 
 * USAGE:
 *   node apply-patch.js <chemin-vers-event.dashboard.page.js>
 * 
 * EXEMPLE:
 *   node apply-patch.js ./src/main/resources/static/app/js/pages/admin/event.dashboard.page.js
 * 
 * Ce script modifie ton fichier pour remplacer :
 *   - render() → stepper + accordions (dark theme)
 *   - initTabs() → initAccordions() + initStepper() + updateCTABanner()
 *   - init() → appel aux nouvelles fonctions
 * 
 * ⚠️ Un backup (.backup) est créé automatiquement
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════
// 1. Lire le fichier original
// ═══════════════════════════════════════
const filePath = process.argv[2];
if (!filePath) {
    console.error('❌ Usage: node apply-patch.js <chemin-vers-event.dashboard.page.js>');
    process.exit(1);
}

const absPath = path.resolve(filePath);
if (!fs.existsSync(absPath)) {
    console.error(`❌ Fichier non trouvé: ${absPath}`);
    process.exit(1);
}

// Backup
const backupPath = absPath + '.backup-' + Date.now();
fs.copyFileSync(absPath, backupPath);
console.log(`✅ Backup créé: ${backupPath}`);

let content = fs.readFileSync(absPath, 'utf-8');
const originalLength = content.length;
console.log(`📄 Fichier lu: ${content.split('\n').length} lignes`);

// ═══════════════════════════════════════
// 2. Lire les fichiers de patch
// ═══════════════════════════════════════
const patchDir = __dirname;
const newRender = fs.readFileSync(path.join(patchDir, 'patch-render.js'), 'utf-8');
const newFunctions = fs.readFileSync(path.join(patchDir, 'patch-functions.js'), 'utf-8');

// ═══════════════════════════════════════
// 3. Helper : trouver la fin d'une méthode
// ═══════════════════════════════════════
function findMethodEnd(source, startIndex) {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let inTemplate = false;
    let templateDepth = 0;
    let found = false;
    
    for (let i = startIndex; i < source.length; i++) {
        const ch = source[i];
        const prev = i > 0 ? source[i-1] : '';
        
        // Handle string literals
        if (!inString && !inTemplate && (ch === '"' || ch === "'" || ch === '`')) {
            if (ch === '`') {
                inTemplate = true;
                templateDepth++;
            } else {
                inString = true;
                stringChar = ch;
            }
            continue;
        }
        
        if (inString && ch === stringChar && prev !== '\\') {
            inString = false;
            continue;
        }
        
        if (inTemplate && ch === '`' && prev !== '\\') {
            templateDepth--;
            if (templateDepth <= 0) {
                inTemplate = false;
                templateDepth = 0;
            }
            continue;
        }
        
        if (inString || inTemplate) continue;
        
        if (ch === '{') {
            depth++;
            found = true;
        } else if (ch === '}') {
            depth--;
            if (found && depth === 0) {
                return i;
            }
        }
    }
    return -1;
}

// ═══════════════════════════════════════
// 4. PATCH 1 : Remplacer render()
// ═══════════════════════════════════════
console.log('\n🔧 PATCH 1: Remplacement de render()...');

// Chercher "async render()" ou "render()"
const renderPatterns = [
    /async\s+render\s*\(\s*\)\s*\{/,
    /render\s*\(\s*\)\s*\{/
];

let renderStart = -1;
let renderMatchLen = 0;
for (const pat of renderPatterns) {
    const m = content.match(pat);
    if (m) {
        renderStart = content.indexOf(m[0]);
        renderMatchLen = m[0].length;
        break;
    }
}

if (renderStart === -1) {
    console.error('❌ Méthode render() non trouvée !');
    process.exit(1);
}

const renderEnd = findMethodEnd(content, renderStart);
if (renderEnd === -1) {
    console.error('❌ Impossible de trouver la fin de render()');
    process.exit(1);
}

// Trouver la virgule après le } de fermeture
let renderEndWithComma = renderEnd + 1;
const afterRender = content.substring(renderEnd + 1, renderEnd + 5).trim();
if (afterRender.startsWith(',')) {
    renderEndWithComma = renderEnd + content.substring(renderEnd + 1).indexOf(',') + 2;
}

const oldRender = content.substring(renderStart, renderEndWithComma);
console.log(`   Trouvé render() : lignes ~${content.substring(0, renderStart).split('\n').length} à ~${content.substring(0, renderEndWithComma).split('\n').length}`);
console.log(`   Taille ancienne : ${oldRender.split('\n').length} lignes`);

content = content.substring(0, renderStart) + newRender + content.substring(renderEndWithComma);
console.log('   ✅ render() remplacé');

// ═══════════════════════════════════════
// 5. PATCH 2 : Remplacer initTabs() par initAccordions()+initStepper()
// ═══════════════════════════════════════
console.log('\n🔧 PATCH 2: Remplacement de initTabs()...');

const tabsPatterns = [
    /initTabs\s*\(\s*\)\s*\{/,
    /initTabs\s*\(\s*eventId\s*\)\s*\{/,
    /initTabs\s*\([^)]*\)\s*\{/
];

let tabsStart = -1;
for (const pat of tabsPatterns) {
    const m = content.match(pat);
    if (m) {
        tabsStart = content.indexOf(m[0]);
        break;
    }
}

if (tabsStart !== -1) {
    const tabsEnd = findMethodEnd(content, tabsStart);
    if (tabsEnd !== -1) {
        let tabsEndWithComma = tabsEnd + 1;
        const afterTabs = content.substring(tabsEnd + 1, tabsEnd + 5).trim();
        if (afterTabs.startsWith(',')) {
            tabsEndWithComma = tabsEnd + content.substring(tabsEnd + 1).indexOf(',') + 2;
        }
        content = content.substring(0, tabsStart) + newFunctions + content.substring(tabsEndWithComma);
        console.log('   ✅ initTabs() remplacé par initAccordions() + initStepper() + updateCTABanner()');
    } else {
        console.warn('   ⚠️ Fin de initTabs() non trouvée, ajout des nouvelles fonctions après render()');
    }
} else {
    console.log('   ℹ️ initTabs() non trouvé, insertion des nouvelles fonctions...');
    // Insérer après render()
    const newRenderEnd = content.indexOf(newRender) + newRender.length;
    content = content.substring(0, newRenderEnd) + '\n\n' + newFunctions + '\n\n' + content.substring(newRenderEnd);
    console.log('   ✅ Nouvelles fonctions insérées après render()');
}

// ═══════════════════════════════════════
// 6. PATCH 3 : Mettre à jour init() pour appeler initAccordions/initStepper
// ═══════════════════════════════════════
console.log('\n🔧 PATCH 3: Mise à jour de init()...');

// Remplacer les appels à initTabs
const tabsCallPatterns = [
    /this\.initTabs\s*\(\s*\)/g,
    /this\.initTabs\s*\(\s*eventId\s*\)/g,
    /this\.initTabs\s*\([^)]*\)/g
];

let replaced = false;
for (const pat of tabsCallPatterns) {
    if (pat.test(content)) {
        content = content.replace(pat, 'this.initAccordions();\n            this.initStepper()');
        replaced = true;
        break;
    }
}

if (replaced) {
    console.log('   ✅ Appels à initTabs() remplacés par initAccordions() + initStepper()');
} else {
    console.log('   ℹ️ Aucun appel à initTabs() trouvé dans init()');
}

// Ajouter l'appel updateCTABanner() après les chargements si pas déjà présent
if (!content.includes('this.updateCTABanner()')) {
    // Chercher après les Promise.allSettled dans init()
    const bannerInsertPoint = content.indexOf('results.forEach((result, index)');
    if (bannerInsertPoint !== -1) {
        content = content.substring(0, bannerInsertPoint) + 
            'this.updateCTABanner();\n\n            ' + 
            content.substring(bannerInsertPoint);
        console.log('   ✅ updateCTABanner() ajouté dans init()');
    }
}

// ═══════════════════════════════════════
// 7. PATCH 4 : Ajouter classe CSS au body
// ═══════════════════════════════════════

// S'assurer que le tab-btn et tab-content ne causent pas de problèmes
// On ajoute un fallback CSS pour masquer les anciens éléments
if (!content.includes('.tab-btn { display: none')) {
    const styleEndTag = '</style>';
    const lastStyleEnd = content.lastIndexOf(styleEndTag);
    if (lastStyleEnd !== -1) {
        const hideTabs = `\n/* Hide old tabs if any remain */\n.tab-btn, .tab-content-old { display: none !important; }\n`;
        content = content.substring(0, lastStyleEnd) + hideTabs + content.substring(lastStyleEnd);
    }
}

// ═══════════════════════════════════════
// 8. Écrire le fichier modifié
// ═══════════════════════════════════════
fs.writeFileSync(absPath, content, 'utf-8');

const newLength = content.length;
const newLines = content.split('\n').length;

console.log('\n═══════════════════════════════════');
console.log('✅ PATCH APPLIQUÉ AVEC SUCCÈS !');
console.log('═══════════════════════════════════');
console.log(`📄 Fichier modifié: ${absPath}`);
console.log(`📊 ${newLines} lignes (${newLength > originalLength ? '+' : ''}${newLength - originalLength} caractères)`);
console.log(`💾 Backup: ${backupPath}`);
console.log('\n🚀 Redémarre ton serveur et teste !');
console.log('💡 Si ça ne marche pas: cp "' + backupPath + '" "' + absPath + '"');
