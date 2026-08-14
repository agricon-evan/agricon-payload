"""
Agricon 网站数据填充脚本
数据源：《产品画册 - 副本.pdf》（68页）提取的真实内容
- 10 大产品分类 + 58 子类（来自画册第 3/20-66 页）
- 11 个真实项目案例（来自画册第 6-12 页）
- 6 大解决方案域（来自画册第 18 页）
通过 Payload REST API 写入本地 SQLite 库
"""
import json
import urllib.request
import time

BASE = 'http://localhost:3000/api'

def login():
    req = urllib.request.Request(
        f'{BASE}/users/login',
        data=json.dumps({'email': 'admin@agricon.com', 'password': 'Agricon@2026Admin'}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST')
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['token']

def api(token, path, data):
    req = urllib.request.Request(
        f'{BASE}/{path}',
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': f'JWT {token}'},
        method='POST')
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {'error': body[:200]}

# ══════════════════════════════════════════
# 画册第 3/20-66 页：10 大分类 + 58 子类
# ══════════════════════════════════════════
CATEGORIES = [
    {
        "name": "Poultry Equipment", "slug": "poultry-equipment", "sortOrder": 1,
        "description": "Practical poultry equipment solutions for layer, broiler and chick production.",
        "subs": [
            ("Layer Cage", "layer-cage", "For commercial egg production. Layer cage systems support organized bird housing, feeding, drinking and egg collection."),
            ("Broiler Cage", "broiler-cage", "For meat chicken farming. Provides organized housing, feeding and drinking support for broiler production."),
            ("Chick Cage", "chick-cage", "For young bird rearing. Suitable housing, feeding and drinking support during early growth stage."),
            ("Automatic Cage", "automatic-cage", "For automated poultry operation. Combines cage structures with feeding, drinking, egg collection and manure removal."),
            ("Hatcher Equipment", "hatcher-equipment", "For egg hatching support. Supports incubation and chick production for hatcheries and breeding farms."),
            ("Floor-Rearing Equipment", "floor-rearing-equipment", "For floor rearing systems. Flexible feeding and drinking arrangements for broiler, breeder and free-range projects."),
            ("Cage Accessories", "cage-accessories", "Feeders, drinkers, trays, connectors, clips and replacement parts for poultry cage systems."),
            ("Breeding Accessories", "breeding-accessories", "Poultry feeding, drinking, brooding, handling and cleaning support products."),
        ],
    },
    {
        "name": "Livestock Equipment", "slug": "livestock-equipment", "sortOrder": 2,
        "description": "Practical equipment solutions for cattle, pig, goat and rabbit farming.",
        "subs": [
            ("Farm Fence", "farm-fence", "For farm boundary, livestock control and area protection. Creates safer animal activity zones."),
            ("Cattle Panels", "cattle-panels", "For cattle yards, handling areas and livestock separation. Strong modular structure."),
            ("Livestock Scale", "livestock-scale", "For animal weighing, farm management and trading support."),
            ("Farrow Pen", "farrow-pen", "For sow farrowing, piglet protection and nursery management."),
            ("Goat Pen", "goat-pen", "For goat housing, feeding and daily farm management."),
            ("Rabbit Cage", "rabbit-cage", "For rabbit breeding, feeding and organized cage management."),
            ("Livestock Accessories", "livestock-accessories", "Feeders, drinkers, gates, connectors and handling tools."),
        ],
    },
    {
        "name": "Aquaculture Equipment", "slug": "aquaculture-equipment", "sortOrder": 3,
        "description": "Practical equipment solutions for pond farming, cage farming and fish farm operation.",
        "subs": [
            ("Water Pump", "water-pump", "For water circulation, pond supply and drainage."),
            ("Aerator", "aerator", "For oxygen support and improved water movement in fish ponds."),
            ("Fish Pond", "fish-pond", "For pond farming, fish growing and aquaculture project setup."),
            ("Floating Cage", "floating-cage", "For organized fish farming in lakes, reservoirs or open water."),
            ("Fish Net", "fish-net", "For fish capture, separation, protection and daily farm use."),
            ("Aquaculture Accessories", "aquaculture-accessories", "Fittings, pipes, connectors, floats and feeding tools."),
        ],
    },
    {
        "name": "Agriculture Machinery", "slug": "agriculture-machinery", "sortOrder": 4,
        "description": "Practical machinery for feed preparation and agricultural processing.",
        "subs": [
            ("Pellet Machine", "pellet-machine", "For making animal feed pellets from mixed raw materials."),
            ("Extruder Machine", "extruder-machine", "For producing expanded feed for fish, pets and livestock."),
            ("Grinding Machine", "grinding-machine", "For crushing grains and raw materials before feed processing."),
            ("Grass Chaff Machine", "grass-chaff-machine", "For cutting grass, straw and forage into smaller feeding material."),
            ("Mixing Machine", "mixing-machine", "For mixing feed ingredients evenly before pelletizing or feeding."),
            ("Drying Machine", "drying-machine", "For reducing moisture in feed, grain and agricultural materials."),
            ("Rice Mill Machine", "rice-mill-machine", "For rice husking, milling and basic grain processing."),
            ("Production Line", "production-line", "For complete feed processing from grinding to finished output."),
        ],
    },
    {
        "name": "Breeding House Equipment", "slug": "breeding-house-equipment", "sortOrder": 5,
        "description": "Farm building and environmental support solutions for modern breeding projects.",
        "subs": [
            ("Metal Structure", "metal-structure", "For breeding houses, farm buildings and agricultural infrastructure support."),
            ("Greenhouse", "greenhouse", "For protected farming, crop growing and controlled agricultural production."),
            ("Exhaust Fan", "exhaust-fan", "For air exchange, heat removal and better house ventilation."),
            ("Cooling Pad", "cooling-pad", "For cooling support in poultry houses, greenhouses and breeding buildings."),
            ("Slatted Floor", "slatted-floor", "For cleaner flooring, animal separation and easier daily management."),
            ("Manure Scraper", "manure-scraper", "For manure cleaning, waste removal and improved house hygiene."),
            ("Feed Silo", "feed-silo", "For bulk feed storage, feeding support and farm supply management."),
            ("Environment Controller", "environment-controller", "For temperature, ventilation, cooling and farm environment control."),
            ("Disinfection Equipment", "disinfection-equipment", "For farm sanitation, disease prevention and daily biosecurity support."),
        ],
    },
    {
        "name": "Slaughter Equipment", "slug": "slaughter-equipment", "sortOrder": 6,
        "description": "Practical processing equipment for poultry and livestock slaughtering applications.",
        "subs": [
            ("Plucker Machine", "plucker-machine", "For poultry feather removal after scalding."),
            ("Scalding Machine", "scalding-machine", "For hot water scalding before poultry plucking."),
            ("Bleeding Cone", "bleeding-cone", "For poultry bleeding and organized processing handling."),
            ("Cutting Machine", "cutting-machine", "For meat cutting, portioning and processing support."),
            ("Working Table", "working-table", "For clean handling, sorting and processing operation."),
            ("Automatic Processing Machine", "automatic-processing-machine", "For efficient slaughtering workflow and higher processing capacity."),
        ],
    },
    {
        "name": "Farming Tools", "slug": "farming-tools", "sortOrder": 7,
        "description": "Practical tools and accessories supporting daily farm operation and field work.",
        "subs": [
            ("Planter", "planter", "For seeding, crop planting and field preparation."),
            ("Weed Cutter", "weed-cutter", "For cutting weeds, grass and field vegetation."),
            ("Sprayer", "sprayer", "For crop spraying, pesticide application and field care."),
            ("Mist Maker", "mist-maker", "For fine mist spraying, humidification and crop protection."),
            ("Irrigation Equipment", "irrigation-equipment", "For water supply, field watering and farm irrigation support."),
            ("Packing Bag", "packing-bag", "For packing, storing and transporting agricultural products."),
        ],
    },
    {
        "name": "Farming Vehicles", "slug": "farming-vehicles", "sortOrder": 8,
        "description": "Practical vehicle solutions for field work, harvesting and farm transport.",
        "subs": [
            ("Tractor", "tractor", "For land preparation, field work and farm operation support."),
            ("Harvester", "harvester", "For crop harvesting, collection and seasonal production needs."),
            ("Tricycle", "tricycle", "For short-distance farm transport and daily material handling."),
            ("Walking Tractor", "walking-tractor", "For small farm tillage, transport and flexible field operation."),
        ],
    },
    {
        "name": "Wire Mesh & Fencing", "slug": "wire-mesh-fencing", "sortOrder": 9,
        "description": "Practical wire mesh and fencing solutions for farms, livestock areas and agricultural facilities.",
        "subs": [
            ("Welded Wire Mesh", "welded-wire-mesh", "For farm fencing, protection, cage making and general agricultural use."),
            ("Cattle Fence", "cattle-fence", "For livestock control, grazing areas and farm boundary protection."),
            ("Chain Link Fence", "chain-link-fence", "For farm enclosures, security fencing and open area protection."),
            ("Hexagonal Wire Mesh", "hexagonal-wire-mesh", "For poultry fencing, garden protection and light farm applications."),
            ("Cage Mesh", "cage-mesh", "For poultry cages, rabbit cages and small animal breeding systems."),
        ],
    },
    {
        "name": "Other Machines", "slug": "other-machines", "sortOrder": 10,
        "description": "Special agricultural machines for egg handling, processing and construction support.",
        "subs": [
            ("Egg Tray Machine", "egg-tray-machine", "For producing egg trays used in packing, storage and transport."),
            ("Egg Sizing Machine", "egg-sizing-machine", "For sorting eggs by size, grade or market requirement."),
            ("Egg Conveyor Machine", "egg-conveyor-machine", "For moving eggs efficiently during collection and handling."),
            ("Egg Counting Machine", "egg-counting-machine", "For automatic egg counting and daily production management."),
            ("Brick Making Machine", "brick-making-machine", "For producing bricks used in farm buildings and project support."),
        ],
    },
]

# ══════════════════════════════════════════
# 画册第 6-12 页：11 个真实项目案例
# ══════════════════════════════════════════
CASES = [
    {
        "title": "Kenya Layer Farm Expansion", "slug": "kenya-layer-farm",
        "country": "Kenya", "projectType": "Layer Poultry Farm",
        "equipment": "Layer cages, feeding system, drinking system and poultry accessories.",
        "application": "Expansion of commercial layer farms and increase in egg output.",
        "results": ["Layer cage installation for commercial egg production", "Complete feeding and drinking systems", "Expansion support for growing egg output"],
        "published": True,
    },
    {
        "title": "Tanzania Layer Farm Project", "slug": "tanzania-layer-farm",
        "country": "Tanzania", "projectType": "Layer Poultry Farm",
        "equipment": "Layer cages, feeding and drinking systems, ventilation equipment.",
        "application": "Layer cage installation and poultry house construction guidance.",
        "results": ["Full layer cage systems with ventilation", "Poultry house construction guidance", "Complete farm setup support"],
        "published": True,
    },
    {
        "title": "Indonesia Goat Pen Project", "slug": "indonesia-goat-pen",
        "country": "Indonesia", "projectType": "Goat Farming Project",
        "equipment": "Goat pens, fencing, feeders and livestock farm accessories.",
        "application": "Organized goat housing and daily farm management.",
        "results": ["Organized goat housing system", "Complete fencing and feeding equipment", "Daily farm management support"],
        "published": True,
    },
    {
        "title": "Cattle Fence Supply for Africa", "slug": "africa-cattle-fence",
        "country": "Africa (Regional)", "projectType": "Cattle Farm Support",
        "equipment": "Farm fencing, cattle panels, gates and handling support products.",
        "application": "Livestock area enclosure, animal separation and farm protection.",
        "results": ["Livestock area enclosure systems", "Cattle panels for separation", "Farm boundary protection"],
        "published": True,
    },
    {
        "title": "Ghana Feed Mill Setup", "slug": "ghana-feed-mill",
        "country": "Ghana", "projectType": "Animal Feed Processing Project",
        "equipment": "Grinding machine, feed mixer, pellet machine, cooler and packing support.",
        "application": "Local poultry and livestock feed production for farm operation and market supply.",
        "results": ["Complete feed mill line", "Local feed production for poultry and livestock", "Market supply capability"],
        "published": True,
    },
    {
        "title": "Nigeria Feed Production Support", "slug": "nigeria-feed-production",
        "country": "Nigeria", "projectType": "Small Feed Mill Project",
        "equipment": "Hammer mill, mixer, pelletizing equipment, conveying and basic packing system.",
        "application": "Feed production support for pig, poultry and livestock farming needs.",
        "results": ["Small feed mill with pelletizing", "Support for pig and poultry farming", "Basic packing and conveying system"],
        "published": True,
    },
    {
        "title": "Ecuador Greenhouse Project", "slug": "ecuador-greenhouse",
        "country": "Ecuador", "projectType": "Commercial Greenhouse Project",
        "equipment": "Greenhouse structure, covering system, ventilation, irrigation and climate support.",
        "application": "Protected crop production with improved growing environment and farm operation efficiency.",
        "results": ["Protected crop production", "Complete climate and irrigation control", "Improved growing environment"],
        "published": True,
    },
    {
        "title": "Tanzania Poultry House Ventilation", "slug": "tanzania-ventilation",
        "country": "Tanzania", "projectType": "Poultry House Ventilation Support",
        "equipment": "Exhaust fans, air inlets, cooling pads and ventilation control accessories.",
        "application": "Improved airflow, heat reduction and daily environment control for poultry farming.",
        "results": ["Improved house airflow", "Heat reduction with cooling pads", "Daily environment control"],
        "published": True,
    },
    {
        "title": "Philippines Fish Cage Farm Support", "slug": "philippines-fish-cage",
        "country": "Philippines", "projectType": "Fish Cage Farming Project",
        "equipment": "Floating cage, fish net, walkway support, mooring parts and farm accessories.",
        "application": "Organized fish farming support for lake, river and coastal aquaculture operations.",
        "results": ["Floating cage farming system", "Complete mooring and walkway support", "Lake and river aquaculture"],
        "published": True,
    },
    {
        "title": "Fish Farm Equipment Package", "slug": "fish-farm-equipment",
        "country": "Southeast Asia", "projectType": "Aquaculture Equipment Package",
        "equipment": "Water pump, aerator, fish net, floating cage and basic support products.",
        "application": "Flexible equipment package for small and medium fish farming operations.",
        "results": ["Water circulation and oxygen support", "Flexible cage and net equipment", "Small and medium fish farm supply"],
        "published": True,
    },
    {
        "title": "Southeast Asia Small Farm Machine Package", "slug": "se-asia-farm-machines",
        "country": "Southeast Asia", "projectType": "Small Farm Machinery Supply",
        "equipment": "Walking tractor, water pump, sprayer, generator and compact farm machines.",
        "application": "Practical machinery package for small farms, dealers and rural supply businesses.",
        "results": ["Compact machinery package", "Support for small farms and dealers", "Rural supply capability"],
        "published": True,
    },
    {
        "title": "South America Crop Farming Support", "slug": "sa-crop-farming",
        "country": "South America", "projectType": "Crop Farming Equipment Support",
        "equipment": "Planters, sprayers, irrigation tools, harvest support machines and farm accessories.",
        "application": "Supporting planting, spraying, irrigation, harvesting and seasonal farm operation needs.",
        "results": ["Planting and spraying equipment", "Irrigation and harvesting support", "Seasonal farm operation coverage"],
        "published": True,
    },
]

# ══════════════════════════════════════════
# 画册第 18 页：6 大解决方案域
# ══════════════════════════════════════════
SOLUTIONS = [
    {
        "name": "Poultry Farming Solutions", "slug": "poultry-farming",
        "description": "Layer, broiler and chick farming equipment — cages, feeding, drinking and hatching systems for commercial poultry production.",
        "products": [],
    },
    {
        "name": "Livestock Farming Solutions", "slug": "livestock-farming",
        "description": "Equipment for cattle, pig, goat and rabbit farms — fencing, pens, feeders, scales and handling systems.",
        "products": [],
    },
    {
        "name": "Aquaculture Solutions", "slug": "aquaculture",
        "description": "Pumps, aerators, fish cages and fish nets for pond farming, cage farming and open-water operations.",
        "products": [],
    },
    {
        "name": "Feed Processing Lines", "slug": "feed-processing",
        "description": "Grinding, mixing, pelletizing, extrusion and complete feed production lines for farms and feed producers.",
        "products": [],
    },
    {
        "name": "Breeding House & Infrastructure", "slug": "breeding-house",
        "description": "Farm housing, ventilation, cooling, environmental control and biosecurity systems for modern breeding projects.",
        "products": [],
    },
    {
        "name": "Farm Machinery & Tools", "slug": "farm-machinery",
        "description": "Tractors, harvesters, planters, sprayers and processing machines for field work and farm operation.",
        "products": [],
    },
]

# ══════════════════════════════════════════
# 执行
# ══════════════════════════════════════════
def main():
    token = login()
    print('✓ 登录成功')

    # 清理测试分类
    api(token, 'categories/1', {})  # 测试用
    try:
        req = urllib.request.Request(f'{BASE}/categories/1',
            headers={'Authorization': f'JWT {token}'}, method='DELETE')
        urllib.request.urlopen(req)
        print('✓ 清理测试分类')
    except Exception:
        pass

    # 1. 创建分类 + 子分类
    cat_ids = {}
    for cat in CATEGORIES:
        subs = cat.pop('subs')
        r = api(token, 'categories', cat)
        if 'error' in r:
            print(f"✗ 分类 {cat['name']}: {r['error'][:80]}")
            continue
        cid = r['doc']['id']
        cat_ids[cat['slug']] = cid
        print(f"✓ 分类: {cat['name']} (id={cid})")
        for sub_name, sub_slug, sub_desc in subs:
            r2 = api(token, 'subcategories', {
                'name': sub_name, 'slug': sub_slug,
                'description': sub_desc, 'category': cid, 'sortOrder': 1,
            })
            if 'error' in r2:
                print(f"  ✗ 子类 {sub_name}: {r2['error'][:80]}")
            else:
                print(f"  ✓ 子类: {sub_name}")

    # 2. 创建案例
    for cs in CASES:
        r = api(token, 'caseStudies', cs)
        if 'error' in r:
            print(f"✗ 案例 {cs['title']}: {r['error'][:80]}")
        else:
            print(f"✓ 案例: {cs['title']}")

    # 3. 创建解决方案
    for sol in SOLUTIONS:
        r = api(token, 'solutions', sol)
        if 'error' in r:
            print(f"✗ 方案 {sol['name']}: {r['error'][:80]}")
        else:
            print(f"✓ 方案: {sol['name']}")

    print('\n=== 数据填充完成 ===')

if __name__ == '__main__':
    main()
