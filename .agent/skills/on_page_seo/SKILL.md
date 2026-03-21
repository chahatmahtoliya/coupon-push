---
name: On-Page SEO
description: Best practices and implementation steps for on-page SEO in the React Vite frontend.
---

# On-Page SEO Skill

This skill defines the standard practices for implementing and maintaining on-page SEO within this React + Vite single-page application.

## 1. Dynamic Meta Tags
As a React SPA, the `title` and `meta` descriptions need to be updated dynamically when routes change.
- Use a custom hook (e.g., `useSEO`) or a dedicated component (like `react-helmet-async` if installed) to update `document.title` and `<meta name="description">` on every page component mount.
- Titles should be concise (50-60 characters) and include primary keywords.
- Meta descriptions should be compelling, summarize the page content, and be between 150-160 characters.

**Example lightweight hook approach:**
```typescript
import { useEffect } from 'react';

export function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);
  }, [title, description]);
}
```

## 2. Semantic HTML & Heading Hierarchy
- **Single H1:** Ensure every page has exactly one `<h1>` tag describing its main topic.
- **Hierarchy:** Do not skip heading levels (e.g., don't jump from `<h2>` to `<h4>`).
- **Landmarks:** Utilize HTML5 semantic elements (`<header>`, `<main>`, `<nav>`, `<article>`, `<section>`, `<footer>`) to help screen readers and search engines parse the document framework.

## 3. Media Accessibility
- **Alt Text:** Every `<img>` element MUST include a descriptive `alt` attribute describing the content of the image.
- **Decorative Images:** If an image is purely decorative, use `alt=""`.
- **Avoid Redundancy:** Do not include words like "image of" or "picture of" in the alt text.

## 4. Internal Linking and Anchor Text
- Use the `<Link>` component from `react-router-dom` instead of standard `<a>` tags for internal routing.
- Ensure the link text (anchor text) is meaningful and describes the destination page. Avoid generic text like "Click Here" or "Read More".

## 5. Performance and Core Web Vitals
- Ensure elements do not shift around during load (Cumulative Layout Shift).
- Lazy load images that are below the fold using `loading="lazy"`.

## Daily Usage Steps
When tasked to "optimize SEO for a page":
1. Open the target page component.
2. Inject the dynamic title and description using the project's SEO hook or library.
3. Review the heading structure and adjust for logical hierarchy.
4. Check all `<img>` tags for meaningful `alt` text.
5. Convert any non-descriptive link text into context-rich anchor text.
