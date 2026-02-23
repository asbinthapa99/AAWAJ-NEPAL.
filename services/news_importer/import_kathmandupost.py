import html
import os
import re
import sys
import xml.etree.ElementTree as ET
from typing import List, Dict

import requests

RSS_URL = os.getenv("KTM_POST_RSS_URL", "https://kathmandupost.com/rss")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
NEWS_BOT_USER_ID = os.getenv("NEWS_BOT_USER_ID")
MAX_ITEMS = int(os.getenv("NEWS_MAX_ITEMS", "30"))


TAG_RE = re.compile(r"<[^>]+>")


def clean_text(value: str) -> str:
    if not value:
        return ""
    text = TAG_RE.sub(" ", value)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_rss(url: str) -> str:
    response = requests.get(url, timeout=20)
    response.raise_for_status()
    return response.text


def parse_items(xml_text: str) -> List[Dict[str, str]]:
    root = ET.fromstring(xml_text)
    items = []

    for item in root.findall(".//item"):
        title = clean_text(item.findtext("title", default=""))
        link = clean_text(item.findtext("link", default=""))
        description = clean_text(item.findtext("description", default=""))
        pub_date = clean_text(item.findtext("pubDate", default=""))

        if not title or not link:
            continue

        items.append({
            "title": title,
            "link": link,
            "description": description,
            "pub_date": pub_date,
        })

    return items


def supabase_headers() -> Dict[str, str]:
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not set")
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def fetch_existing_links(limit: int = 500) -> set:
    url = f"{SUPABASE_URL}/rest/v1/news"
    params = {
        "select": "link",
        "link": "not.is.null",
        "order": "created_at.desc",
        "limit": str(limit),
    }
    response = requests.get(url, headers=supabase_headers(), params=params, timeout=20)
    response.raise_for_status()
    data = response.json()
    return {row.get("link") for row in data if row.get("link")}


def insert_news(items: List[Dict[str, str]]) -> int:
    if not items:
        return 0

    payload = []
    for item in items:
        body = item.get("description") or item.get("title")
        body = body[:800] if body else ""
        payload.append({
            "author_id": NEWS_BOT_USER_ID,
            "title": item.get("title"),
            "body": body,
            "link": item.get("link"),
        })

    url = f"{SUPABASE_URL}/rest/v1/news"
    response = requests.post(url, headers=supabase_headers(), json=payload, timeout=30)
    response.raise_for_status()
    return len(payload)


def main() -> int:
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not set")
    if not NEWS_BOT_USER_ID:
        raise RuntimeError("NEWS_BOT_USER_ID is not set")

    xml_text = fetch_rss(RSS_URL)
    items = parse_items(xml_text)[:MAX_ITEMS]

    existing_links = fetch_existing_links()
    new_items = [item for item in items if item.get("link") not in existing_links]

    inserted = insert_news(new_items)
    print(f"Inserted {inserted} items.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"Import failed: {exc}")
        sys.exit(1)
