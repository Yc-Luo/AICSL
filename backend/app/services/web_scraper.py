"""Web scraping service for content extraction."""

import hashlib
import re
from typing import Optional

from bs4 import BeautifulSoup


class WebScraperService:
    """Service for web scraping and content extraction.
    
    Note: This is a basic implementation using BeautifulSoup.
    For JavaScript-heavy pages, consider using Playwright:
        pip install playwright
        playwright install chromium
    """

    # Dangerous tags to remove for security
    DANGEROUS_TAGS = ["script", "style", "iframe", "object", "embed", "form", "input"]
    
    # Common content selectors in priority order
    CONTENT_SELECTORS = [
        "article",
        "[role='main']",
        "main",
        ".post-content",
        ".article-content", 
        ".entry-content",
        ".content",
        "#content",
        ".post",
        ".entry",
    ]

    @staticmethod
    def hash_url(url: str) -> str:
        """Generate MD5 hash of URL."""
        return hashlib.md5(url.encode()).hexdigest()

    @staticmethod
    async def scrape_content(url: str) -> dict:
        """Scrape and extract content from a webpage.

        Args:
            url: Target URL

        Returns:
            Dict with extracted content and metadata
        """
        import httpx
        
        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=30.0,
                headers={"User-Agent": "Mozilla/5.0 (compatible; AICSL Bot/1.0)"}
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
                html = response.text
                
            # Parse and extract
            soup = BeautifulSoup(html, "html.parser")
            
            # Get title
            title = ""
            if soup.title:
                title = soup.title.get_text(strip=True)
            
            # Extract readable content
            content = WebScraperService.extract_readable_content(html)
            
            # Sanitize HTML
            cleaned_html = WebScraperService.sanitize_html(html)
                
            return {
                "url": url,
                "url_hash": WebScraperService.hash_url(url),
                "title": title,
                "content": content,
                "cleaned_html": cleaned_html,
                "success": True,
            }
        except Exception as e:
            return {
                "url": url,
                "url_hash": WebScraperService.hash_url(url),
                "title": "",
                "content": "",
                "cleaned_html": "",
                "success": False,
                "error": str(e),
            }

    @staticmethod
    def sanitize_html(html: str) -> str:
        """Sanitize HTML by removing dangerous elements and attributes.

        Args:
            html: Raw HTML content

        Returns:
            Sanitized HTML
        """
        soup = BeautifulSoup(html, "html.parser")

        # Remove dangerous tags
        for tag in soup(WebScraperService.DANGEROUS_TAGS):
            tag.decompose()
        
        # Remove event handlers and javascript URLs
        dangerous_attrs = re.compile(r'^on|^javascript:', re.IGNORECASE)
        for tag in soup.find_all(True):
            for attr in list(tag.attrs.keys()):
                if dangerous_attrs.match(attr) or (
                    attr in ['href', 'src'] and 
                    tag.get(attr, '').strip().lower().startswith('javascript:')
                ):
                    del tag[attr]

        return str(soup)

    @staticmethod
    def extract_readable_content(html: str) -> str:
        """Extract readable content using common selectors and heuristics.

        Args:
            html: HTML content

        Returns:
            Extracted text content
        """
        soup = BeautifulSoup(html, "html.parser")
        
        # Remove non-content elements
        for element in soup(['nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript']):
            element.decompose()

        # Try common content selectors
        for selector in WebScraperService.CONTENT_SELECTORS:
            content = soup.select_one(selector)
            if content:
                text = content.get_text(separator='\n', strip=True)
                # Check if content is substantial (at least 100 chars)
                if len(text) > 100:
                    return text

        # Fallback: find largest text block
        paragraphs = soup.find_all('p')
        if paragraphs:
            texts = [p.get_text(strip=True) for p in paragraphs]
            return '\n\n'.join(t for t in texts if len(t) > 20)

        # Last resort: body text
        body = soup.find('body')
        if body:
            return body.get_text(separator='\n', strip=True)
        
        return soup.get_text(separator='\n', strip=True)


web_scraper_service = WebScraperService()
