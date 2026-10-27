import fs from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';
import { findAll, getOuterHTML, textContent } from 'domutils';
import postcss from 'postcss';
import { blogRoot, blogPath, htmlFiles } from './blog-pages.mjs';

const root = path.resolve(import.meta.dirname, '..');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const elements = html => findAll(node => Boolean(node.name), parseDocument(html).children);
const hasClass = (node, name) => (node.attribs?.class || '').split(/\s+/).includes(name);

// Reuse the actual homepage render of Header.tsx / Footer.tsx. postbuild
// refreshes this after Next renders them, so there is no second HTML template.
export async function syncBlogShell({ allowMissingHomepage = false } = {}) {
  let homepageHtml;
  try {
    homepageHtml = await fs.readFile(path.join(root, 'out/index.html'), 'utf8');
  } catch (error) {
    if (allowMissingHomepage && error.code === 'ENOENT') {
      console.log('No homepage export yet; postbuild will synchronize the blog shell after the first export.');
      return;
    }
    throw error;
  }
  const homepage = elements(homepageHtml);
  const header = homepage.find(node => node.name === 'header' && hasClass(node, 'cp-header'));
  const footer = homepage.find(node => node.name === 'footer' && hasClass(node, 'cp-footer'));
  const drawer = homepage.find(node => node.attribs.id === 'mobile-navigation-dialog');
  const overlay = homepage.find(node => hasClass(node, 'mobile-menu-overlay'));
  if (![header, footer, drawer, overlay].every(Boolean)) throw new Error('Export the homepage before preparing the blog shell.');

  // React populates this after hydration; static blogs use the same catalog.
  const snapshot = JSON.parse(await fs.readFile(path.join(root, 'src/data/deployed-snapshot.json'), 'utf8'));
  const categoryPath = category => category.slug === 'power-banks' ? '/Power-Bank-Deals/' : snapshot.categories[category.slug]?.coupons?.length ? `/category/${category.slug}/` : '/categories/';
  const sorted = snapshot.categoriesPage.initialCategories.filter(category => categoryPath(category) !== '/categories/').sort((a, b) => (b.coupon_count || 0) - (a.coupon_count || 0));
  const populated = sorted.filter(category => category.coupon_count > 0);
  const menu = (populated.length ? populated : sorted).slice(0, 8).map(category => `<a class="dropdown-item-v2" href="${escape(categoryPath(category))}"><i class="${escape(category.icon || 'fas fa-tag')}" aria-hidden="true"></i> ${escape(category.name)}</a>`).join('');
  const headerHtml = [header, overlay, drawer].map(node => getOuterHTML(node)).join('').replace(/(<div class="dropdown-menu-v2">)[\s\S]*?<\/div>/, `$1${menu}</div>`);
  const footerHtml = getOuterHTML(footer);

  // Scope the site's original CSS: its resets/tokens cannot restyle article text.
  const css = postcss.parse(await fs.readFile(path.join(root, 'src/styles/style.css'), 'utf8'));
  css.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    const selectors = postcss.list.comma(rule.selector).filter(selector => !['body', 'html'].includes(selector));
    if (!selectors.length) { rule.remove(); return; }
    rule.selector = selectors.map(selector => {
      const scoped = selector.replace(/:root|\bhtml\b|\bbody\b|\.app\b/g, '.cp-site-chrome');
      return scoped.startsWith('.cp-site-chrome') ? scoped : `.cp-site-chrome ${scoped}`;
    }).join(',');
  });
  await fs.writeFile(path.join(blogRoot, 'assets/site-shell.css'), `/* Generated from src/styles/style.css by sync-blog-shell.mjs. */\n.cp-site-chrome{display:block;font-family:"Satoshi",sans-serif;font-size:16px;line-height:1.6;color:#111827;font-weight:400;text-align:left}.cp-site-chrome img{padding:0;border-radius:0;background:none}\n${css.toString()}\n.cp-site-chrome a,.cp-site-chrome a:hover,.cp-site-chrome a:focus-visible{text-decoration:none}.cp-site-chrome :focus-visible{outline:2px solid #e85a2a;outline-offset:3px}.cp-site-chrome .nav-dropdown:focus-within .dropdown-menu-v2{opacity:1;visibility:visible;transform:translateY(0)}.cp-site-chrome [hidden]{display:none!important}.calculator-embed .cp-site-chrome,.emi-embed .cp-site-chrome{display:none}\n`);
  await fs.copyFile(path.join(root, 'public/assets/home-ui/logo-transparent.png'), path.join(blogRoot, 'assets/images/site-logo.png'));

  const pages = await Promise.all((await htmlFiles()).map(async file => {
    const html = await fs.readFile(file, 'utf8');
    const nodes = elements(html);
    const schema = nodes.filter(node => node.name === 'script' && node.attribs.type === 'application/ld+json').flatMap(node => {
      const value = JSON.parse(textContent(node));
      return Array.isArray(value) ? value : value['@graph'] || [value];
    });
    const article = schema.find(item => [item['@type']].flat().some(type => ['Article', 'BlogPosting', 'NewsArticle'].includes(type)));
    return { file, html, path: blogPath(file), title: textContent(nodes.find(node => node.name === 'h1')).trim(), article, noindex: nodes.some(node => node.name === 'meta' && node.attribs.name === 'robots' && /noindex/.test(node.attribs.content)) };
  }));
  const articles = pages.filter(page => page.article && !page.noindex).sort((a, b) => String(a.article.datePublished || '').localeCompare(String(b.article.datePublished || '')) || a.path.localeCompare(b.path));
  for (const page of pages) {
    const assets = path.relative(path.dirname(page.file), path.join(blogRoot, 'assets')).replaceAll('\\', '/');
    const shell = html => html.replaceAll('/assets/home-ui/logo-transparent.png', `${assets}/images/site-logo.png`);
    let html = page.html.replace(/<!-- site-header:start -->[\s\S]*?<!-- site-header:end -->|<header class="site-header">[\s\S]*?<\/header>/, `<!-- site-header:start --><div class="cp-site-chrome">${shell(headerHtml)}</div><!-- site-header:end -->`);
    html = html.replace(/<!-- site-footer:start -->[\s\S]*?<!-- site-footer:end -->|<footer class="site-footer">[\s\S]*?<\/footer>/, `<!-- site-footer:start --><div class="cp-site-chrome">${shell(footerHtml)}</div><!-- site-footer:end -->`);
    html = html.replace(/<!-- site-assets:start -->[\s\S]*?<!-- site-assets:end -->\s*/g, '');
    html = html.replace('</head>', `<!-- site-assets:start --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"><link rel="stylesheet" href="${assets}/site-shell.css"><link rel="stylesheet" href="${assets}/article-navigation.css"><script src="${assets}/site-shell.js" defer></script><!-- site-assets:end -->\n</head>`);
    html = html.replace(/<!-- article-navigation:start -->[\s\S]*?<!-- article-navigation:end -->\s*/g, '');
    const index = articles.indexOf(page);
    if (index !== -1) {
      const link = (target, direction) => {
        const label = direction === 'prev' ? 'Previous article' : 'Next article';
        const icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="${direction === 'prev' ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'}"/></svg>`;
        return target ? `<a class="article-pagination-link article-pagination-${direction}" rel="${direction}" href="${escape(target.path)}"><span class="article-pagination-label">${direction === 'prev' ? icon : ''}${label}${direction === 'next' ? icon : ''}</span><span class="article-pagination-title">${escape(target.title)}</span></a>` : `<span class="article-pagination-link is-disabled" aria-disabled="true"><span class="article-pagination-label">${label}</span><span class="article-pagination-title">${direction === 'prev' ? 'You’re at the first article' : 'You’re at the latest article'}</span></span>`;
      };
      html = html.replace('</main>', `<!-- article-navigation:start --><nav class="article-pagination container" aria-label="Article navigation">${link(articles[index - 1], 'prev')}${link(articles[index + 1], 'next')}</nav><!-- article-navigation:end -->\n</main>`);
    }
    if (html !== page.html) await fs.writeFile(page.file, html);
  }
  console.log(`Synced homepage header/footer on ${pages.length} blog pages; previous/next navigation on ${articles.length} articles.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  await syncBlogShell();
  if (process.argv.includes('--export')) {
    for (const destination of ['public/blog', 'out/blog']) await fs.cp(blogRoot, path.join(root, destination), { recursive: true });
  }
}
