#!/usr/bin/env python3
"""Import full image galleries from the AGRICON catalog into public/catalog/.

The catalog PDF provides 4-5 photographs per product and 4-8 per case study.
The original import kept only the first image of each set; this script copies
the complete sets so product/case detail pages can show real galleries.

Source:  C:\\Users\\Evan\\WorkBuddy\\2026-08-10-15-00-06\\output\\catalog\\assets
Target:  public/catalog/{products,cases,pages}
"""
import os
import shutil
import sys

CATALOG = r"C:\Users\Evan\WorkBuddy\2026-08-10-15-00-06\output\catalog\assets"
if not os.path.isdir(CATALOG):
    CATALOG = os.path.join(os.path.dirname(__file__), "..", "docs", "catalog", "assets")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public", "catalog")

# slug -> list of source asset names (ordered: first is the primary image)
PRODUCT_SETS = {
    # Poultry Equipment — p25-28
    "layer-cage": ["p25_1", "p25_2", "p25_3", "p25_4", "p25_5"],
    "broiler-cage": ["p25_6", "p25_7", "p25_8", "p25_9", "p25_10"],
    "chick-cage": ["p26_1", "p26_2", "p26_3", "p26_4", "p26_5"],
    "automatic-cage": ["p26_6", "p26_7", "p26_8", "p26_9", "p26_10"],
    "hatcher-equipment": ["p27_1", "p27_2", "p27_3", "p27_4", "p27_5"],
    "floor-rearing-equipment": ["p27_6", "p27_7", "p27_8", "p27_9", "p27_10"],
    "cage-accessories": ["p28_1", "p28_2", "p28_3", "p28_4", "p28_5"],
    "breeding-accessories": ["p28_6", "p28_7", "p28_8", "p28_9", "p28_10"],
    # Livestock Equipment — p31-34
    "farm-fence": ["p31_1", "p31_2", "p31_3", "p31_4", "p31_5"],
    "cattle-panels": ["p31_6", "p31_7", "p31_8", "p31_9", "p31_10"],
    "livestock-scale": ["p32_1", "p32_2", "p32_3", "p32_4", "p32_5"],
    "farrow-pen": ["p32_6", "p32_7", "p32_8", "p32_9", "p32_10"],
    "goat-pen": ["p33_1", "p33_2", "p33_3", "p33_4", "p33_5"],
    "rabbit-cage": ["p33_7", "p33_8", "p33_9", "p33_10"],
    "livestock-accessories": ["p34_1", "p34_2", "p34_3", "p34_4", "p34_5"],
    # Aquaculture — p37-38
    "water-pump": ["p37_1", "p37_2", "p37_3", "p37_4"],
    "aerator": ["p37_5", "p37_6", "p37_7", "p37_8"],
    "fish-pond": ["p37_9", "p37_10", "p37_11", "p37_12"],
    "floating-cage": ["p38_1", "p38_2", "p38_3", "p38_4"],
    "fish-net": ["p38_5", "p38_6", "p38_7", "p38_8"],
    "aquaculture-accessories": ["p38_9", "p38_10", "p38_11", "p38_12"],
    # Agriculture Machinery — p41-44
    "pellet-machine": ["p41_1", "p41_2", "p41_3", "p41_4", "p41_5"],
    "extruder-machine": ["p41_6", "p41_7", "p41_8", "p41_9", "p41_10"],
    "grinding-machine": ["p42_1", "p42_2", "p42_3", "p42_4", "p42_5"],
    "grass-chaff-machine": ["p42_6", "p42_7", "p42_8", "p42_9", "p42_10"],
    "mixing-machine": ["p43_2", "p43_3", "p43_4", "p43_5"],
    "drying-machine": ["p43_6", "p43_7", "p43_8", "p43_9", "p43_10"],
    "rice-mill-machine": ["p44_1", "p44_2", "p44_3", "p44_4", "p44_5"],
    "production-line": ["p44_6", "p44_7", "p44_8", "p44_9", "p44_10"],
    # Breeding House — p47-50
    "metal-structure": ["p47_1", "p47_2", "p47_3", "p47_4", "p47_5"],
    "greenhouse": ["p47_6", "p47_7", "p47_8", "p47_9", "p47_10"],
    "exhaust-fan": ["p48_1", "p48_2", "p48_3", "p48_4", "p48_5"],
    "cooling-pad": ["p48_6", "p48_7", "p48_8", "p48_9", "p48_10"],
    "slatted-floor": ["p49_1", "p49_2", "p49_3", "p49_4", "p49_5"],
    "manure-scraper": ["p49_7", "p49_8", "p49_9", "p49_10"],
    "feed-silo": ["p50_1", "p50_2", "p50_3", "p50_4"],
    "environment-controller": ["p50_5", "p50_6", "p50_7", "p50_8"],
    "disinfection-equipment": ["p50_9", "p50_10", "p50_11", "p50_12"],
    # Slaughter Equipment — p53-54
    "plucker-machine": ["p53_1", "p53_2", "p53_3", "p53_4"],
    "scalding-machine": ["p53_5", "p53_6", "p53_7", "p53_8"],
    "bleeding-cone": ["p53_9", "p53_10", "p53_11", "p53_12"],
    "cutting-machine": ["p54_1", "p54_2", "p54_3", "p54_4"],
    "working-table": ["p54_5", "p54_6", "p54_7", "p54_8"],
    "automatic-processing-machine": ["p54_9", "p54_10", "p54_11", "p54_12"],
    # Farming Tools — p57-58
    "planter": ["p57_1", "p57_2", "p57_3", "p57_4"],
    "weed-cutter": ["p57_5", "p57_6", "p57_7", "p57_8"],
    "sprayer": ["p57_9", "p57_10", "p57_11", "p57_12"],
    "mist-maker": ["p58_1", "p58_2", "p58_3", "p58_4"],
    "irrigation-equipment": ["p58_5", "p58_6", "p58_7", "p58_8"],
    "packing-bag": ["p58_9", "p58_10", "p58_11", "p58_12"],
    # Farming Vehicles — p61-62
    "tractor": ["p61_1", "p61_2", "p61_3", "p61_4", "p61_5"],
    "harvester": ["p61_6", "p61_7", "p61_8", "p61_9", "p61_10"],
    "tricycle": ["p62_1", "p62_2", "p62_3", "p62_4", "p62_5"],
    "walking-tractor": ["p62_6", "p62_7", "p62_8", "p62_9", "p62_10"],
    # Wire Mesh — p65-66
    "welded-wire-mesh": ["p65_1", "p65_2", "p65_3", "p65_4", "p65_5"],
    "cattle-fence": ["p65_6", "p65_7", "p65_8", "p65_9", "p65_10"],
    "chain-link-fence": ["p66_1", "p66_2", "p66_3", "p66_4"],
    "hexagonal-wire-mesh": ["p66_5", "p66_6", "p66_7", "p66_8"],
    "cage-mesh": ["p66_9", "p66_10", "p66_11", "p66_12"],
    # Other Machines — p69-70
    "egg-tray-machine": ["p69_1", "p69_2", "p69_3", "p69_4", "p69_5"],
    "egg-sizing-machine": ["p69_6", "p69_7", "p69_8", "p69_9", "p69_10"],
    "egg-conveyor-machine": ["p70_1", "p70_2", "p70_3", "p70_4"],
    "egg-counting-machine": ["p70_5", "p70_6", "p70_7", "p70_8"],
    "brick-making-machine": ["p70_9", "p70_10", "p70_11", "p70_12"],
}

# slug -> list of source assets (ordered: first is the primary image)
CASE_SETS = {
    "kenya-layer-farm": ["p11_1", "p11_2", "p11_3", "p11_4"],
    "tanzania-layer-farm": ["p11_5", "p11_6", "p11_7", "p11_8"],
    "indonesia-goat-pen": ["p12_1", "p12_2", "p12_3", "p12_4"],
    "africa-cattle-fence": ["p12_5", "p12_6", "p12_7", "p12_8"],
    # p13 页面按两列案例交错排版：Ghana 使用奇数图，Nigeria 使用偶数图
    "ghana-feed-mill": ["p13_1", "p13_3", "p13_5", "p13_7"],
    "nigeria-feed-production": ["p13_2", "p13_4", "p13_6", "p13_8"],
    "ecuador-greenhouse": ["p14_1", "p14_2", "p14_3", "p14_4"],
    "tanzania-ventilation": ["p14_5", "p14_6", "p14_7", "p14_8"],
    "philippines-fish-cage": ["p15_1", "p15_2", "p15_3", "p15_4"],
    "fish-farm-equipment": ["p15_5", "p15_6", "p15_7", "p15_8"],
    "se-asia-farm-machines": ["p16_1", "p16_2", "p16_3", "p16_4"],
    "sa-crop-farming": ["p16_5", "p16_6", "p16_7", "p16_8"],
}

# Company / solution / process page images copied for editorial use
PAGE_SETS = {
    "about": ["p8_1", "p8_2", "p8_3", "p8_4", "p8_5", "p9_1", "p9_2", "p9_3", "p9_4", "p9_5", "p9_6", "p9_7", "p9_8", "p9_9", "p9_10"],
    "solutions": ["p17_1", "p19_1", "p19_2", "p19_3", "p19_4", "p20_1", "p20_2", "p20_3", "p20_4", "p20_5", "p20_6", "p20_7", "p21_1", "p21_2", "p21_3", "p21_4", "p22_1", "p22_2", "p22_3", "p22_4", "p22_5", "p23_1"],
    "trade-support": ["p121_1", "p121_2", "p121_3"],
}


def copy_set(sets, out_dir, prefix):
    copied, missing = 0, 0
    os.makedirs(os.path.join(PUB, out_dir), exist_ok=True)
    for slug, assets in sets.items():
        for i, asset in enumerate(assets, start=1):
            src = os.path.join(CATALOG, asset + ".jpg")
            if not os.path.isfile(src):
                missing += 1
                continue
            if i == 1:
                dst = os.path.join(PUB, out_dir, f"{slug}.jpg")
            else:
                dst = os.path.join(PUB, out_dir, f"{slug}-{i}.jpg")
            shutil.copy2(src, dst)
            copied += 1
    return copied, missing


def main():
    if not os.path.isdir(CATALOG):
        print(f"✗ source catalog assets not found: {CATALOG}")
        sys.exit(1)
    for name, sets, out in [
        ("products", PRODUCT_SETS, "products"),
        ("cases", CASE_SETS, "cases"),
        ("pages", PAGE_SETS, "pages"),
    ]:
        copied, missing = copy_set(sets, out, name)
        print(f"[ok] {name}: copied {copied} images ({missing} missing source)")
    print("=== gallery import complete ===")


if __name__ == "__main__":
    main()
