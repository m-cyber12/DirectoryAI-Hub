# Generates {locale}.tags.json with ALL catalog tags localized.
# Brands, numbers, platforms and technical acronyms stay identical (correct).
# Run: python3 scripts/seed-data/gen_tags.py
import json, os, importlib

def load_tags():
    d = json.load(open('/home/user/catalog-en.json', encoding='utf-8'))
    tags = set()
    for t in d['tools']:
        tags.update(t.get('tags', []))
    return sorted(tags)

def build(trans):
    tags = load_tags()
    out = {}
    for t in tags:
        out[t] = {"label": trans.get(t, t)}
    return out

HERE = os.path.dirname(os.path.abspath(__file__))
for loc in ['fa','es','pt','fr','de','zh','ar']:
    mod = importlib.import_module(f'tagmaps.{loc}')
    out = build(mod.MAP)
    with open(os.path.join(HERE, f'{loc}.tags.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    real = sum(1 for t, v in out.items() if v['label'] != t)
    print(f'{loc}: {len(out)} tags, {real} translated, {len(out)-real} kept as-is')
