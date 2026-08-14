"""Delete all products (level 3) from the Payload API. Categories/subcategories are kept.

Usage:
    python scripts/delete-products.py [--dry-run]
"""
import json
import sys
import urllib.request

BASE = 'http://localhost:3000/api'


def login():
    req = urllib.request.Request(
        f'{BASE}/users/login',
        data=json.dumps({'email': 'admin@agricon.com', 'password': 'Agricon@2026Admin'}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST')
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['token']


def api_get(token, path):
    req = urllib.request.Request(
        f'{BASE}/{path}',
        headers={'Authorization': f'JWT {token}'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def api_delete(token, path):
    req = urllib.request.Request(
        f'{BASE}/{path}',
        headers={'Authorization': f'JWT {token}'},
        method='DELETE')
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def main():
    dry_run = '--dry-run' in sys.argv
    token = login()

    # Collect all product ids (paginated)
    ids, page = [], 1
    while True:
        data = api_get(token, f'products?limit=100&page={page}&depth=0')
        ids.extend(doc['id'] for doc in data.get('docs', []))
        if page >= data.get('totalPages', 1):
            break
        page += 1

    print(f'Found {len(ids)} products to delete (dry_run={dry_run})')
    if dry_run:
        return

    deleted = 0
    for pid in ids:
        try:
            api_delete(token, f'products/{pid}')
            deleted += 1
        except urllib.error.HTTPError as e:
            print(f'  FAILED id={pid}: {e.read().decode()[:200]}')
    print(f'Deleted {deleted}/{len(ids)} products')

    remaining = api_get(token, 'products?limit=1&depth=0')
    print(f'Remaining products: {remaining.get("totalDocs", "?")}')


if __name__ == '__main__':
    main()
